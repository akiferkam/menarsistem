import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadPromptMode,
  reviseJob,
  runPipeline,
  summarizeCost,
  validateJob,
  type GeneratorOutput,
  type JobInput,
  type KanitTablosu,
} from "@menar/core";
import { buildTenantProviderDeps } from "../lib/provider-deps.js";
import type { Repository } from "../db/repository.js";
import type { IsKaydi } from "../db/types.js";

export interface WorkerConfig {
  repo: Repository;
  encryptionSecret: string;
  outputDir: string;
  globalConcurrency: number;
  perYayineviConcurrency: number;
  pollIntervalMs: number;
}

/**
 * Redis/BullMQ olmadan (Faz 4'e ertelendi) dayanıklı bir kuyruk: durum
 * SQLite'da kalıcı (process çökerse `recoverStuckRunning` ile kurtarılır),
 * iki eş-zamanlılık sınırı (`globalConcurrency`, `perYayineviConcurrency`)
 * hem sunucuyu hem tek bir yayınevinin BYOK anahtarının rate-limit'ini korur
 * — Section 13 #2'nin "20+ eş zamanlı öğretmen" bulgusuna karşı asgari
 * dayanıklılık. Tek-process varsayımıyla yazıldı (Faz 3 kapsamı); çoklu
 * worker process'i Faz 4'ün BullMQ geçişinde gelir.
 */
export function startQueueWorker(cfg: WorkerConfig): { stop: () => void } {
  const recovered = cfg.repo.is.recoverStuckRunning();
  if (recovered > 0) {
    console.log(`Kuyruk: ${recovered} önceki çalıştırmadan RUNNING kalmış iş QUEUED'a alındı.`);
  }

  let stopped = false;
  let ticking = false;

  function tick(): void {
    if (stopped || ticking) return;
    ticking = true;
    try {
      const runningTotal = cfg.repo.is.countRunning();
      let slotsLeft = cfg.globalConcurrency - runningTotal;
      if (slotsLeft <= 0) return;

      const runningByYayinevi = cfg.repo.is.countRunningByYayinevi();
      const candidates = cfg.repo.is.listQueued(cfg.globalConcurrency * 2);
      for (const job of candidates) {
        if (slotsLeft <= 0) break;
        const running = runningByYayinevi.get(job.yayineviId) ?? 0;
        if (running >= cfg.perYayineviConcurrency) continue;
        if (!cfg.repo.is.markRunning(job.id)) continue; // başka bir tur zaten aldı
        slotsLeft -= 1;
        runningByYayinevi.set(job.yayineviId, running + 1);
        void processJob(job).catch((err) => {
          console.error(`İş ${job.id} kuyruk seviyesinde beklenmeyen hatayla çöktü:`, err);
        });
      }
    } finally {
      ticking = false;
    }
  }

  async function processJob(job: IsKaydi): Promise<void> {
    try {
      const input = JSON.parse(job.inputJson) as JobInput;
      const deps = buildTenantProviderDeps(job.yayineviId, cfg.repo, cfg.encryptionSecret);
      const ledger = cfg.repo.yayinevi.getLedger(job.yayineviId);

      let sonuc;
      if (job.revizeKaynakIsId) {
        // "Soruyu Düzelt" — kaynak işin kayıtlı adayı + kanıt tablosunun
        // redNedenleri (+ öğretmenin kendi notu varsa) reviseJob()'a gider.
        // Sıfırdan generateAday() ÇAĞRILMAZ, bu yüzden tam yeniden üretimden
        // ucuzdur (bkz. routes/jobs.ts POST /jobs/:id/revise yorumu).
        const kaynakSonuc = cfg.repo.sonuc.getByIsId(job.revizeKaynakIsId);
        if (!kaynakSonuc) throw new Error(`Revize kaynağı iş ${job.revizeKaynakIsId} için kayıtlı sonuç yok`);
        const validated = validateJob(input);
        if (!validated.valid) throw new Error(`Revize kaynağının girdisi artık geçersiz: ${validated.errors.join("; ")}`);
        const oncekiAday = JSON.parse(kaynakSonuc.adayJson) as GeneratorOutput;
        const kaynakKanit = JSON.parse(kaynakSonuc.kanitTablosuJson) as KanitTablosu;
        const redNedenleri = [...kaynakKanit.redNedenleri];
        if (job.revizeNotu) redNedenleri.push(`ÖĞRETMEN NOTU: ${job.revizeNotu}`);
        sonuc = await reviseJob(validated.resolved, oncekiAday, redNedenleri, ledger, { ...deps, promptMode: loadPromptMode() });
      } else {
        sonuc = await runPipeline(input, { ...deps, promptMode: loadPromptMode(), ledger });
      }

      // Section 13 #1 maliyet hedefi: her sonuçta (başarı/durdurulmuş fark
      // etmeksizin) gerçek harcama kalıcı olarak yazılır (bkz. usage_log).
      //
      // "gorsel.uretim" aşaması eskiden HER ZAMAN `deps.gorsel.uretim`
      // (gpt-image-1) olarak sabit loglanıyordu — ama `gorselKalitesi=YUKSEK`
      // işlerinde gerçek çağrı `deps.gorsel.uretimYuksekKalite`ye (fal.ai)
      // gidiyor olabiliyor (bkz. 20-baglam-gorseli.ts). `provider.getUsage()`
      // sağlayıcı NESNESİ bazlı biriktiği için, yanlış nesneden okumak
      // fal.ai'nin gerçek görsel sayısını/maliyetini sessizce kaybediyordu
      // (canlı bir görsel-hata teşhisi sırasında fark edildi). `baglamGorseli.
      // gorselSaglayici` hangi nesnenin gerçekten çağrıldığını taşır.
      const gorselUretimDeps =
        sonuc.durum === "TAMAMLANDI" && sonuc.baglamGorseli.gorselSaglayici === "YUKSEK" && deps.gorsel.uretimYuksekKalite
          ? deps.gorsel.uretimYuksekKalite
          : deps.gorsel.uretim;
      const stages = summarizeCost([
        { stage: "generator", provider: deps.generator.provider, model: deps.generator.model },
        { stage: "solverA", provider: deps.solverA.provider, model: deps.solverA.model },
        { stage: "solverB", provider: deps.solverB.provider, model: deps.solverB.model },
        { stage: "board", provider: deps.board.provider, model: deps.board.model },
        { stage: "gorsel.prompt", provider: deps.gorsel.prompt.provider, model: deps.gorsel.prompt.model },
        { stage: "gorsel.uretim", provider: gorselUretimDeps.provider, model: gorselUretimDeps.model },
        { stage: "gorsel.denetim", provider: deps.gorsel.denetim.provider, model: deps.gorsel.denetim.model },
      ]);
      cfg.repo.usage.insertMany(job.id, stages);

      if (sonuc.durum === "GIRDI_HATASI") {
        cfg.repo.is.setStatus(job.id, "FAILED", {
          hataMesaji: sonuc.errors.join("; "),
          finishedAt: new Date().toISOString(),
        });
        return;
      }
      if (sonuc.durum === "URETIM_DURDURULDU") {
        // Eskiden yalnız başlık + genel öneri saklanıyordu ("En sık RED veren
        // denetimin koşulunu... gözden geçirin" gibi belirsiz bir cümle) —
        // öğretmen NEDEN durduğunu hiç göremiyordu, sistem gerçek redNedenleri'ni
        // biliyor ama atıyordu. Artık tam liste de saklanıyor.
        const detay = sonuc.rapor.redNedenleri.length
          ? "\n\nRED nedenleri:\n- " + sonuc.rapor.redNedenleri.join("\n- ")
          : "";
        cfg.repo.is.setStatus(job.id, "FAILED", {
          hataMesaji: `${sonuc.rapor.baslik} — ${sonuc.rapor.onerilenTekDegisiklik}${detay}`,
          finishedAt: new Date().toISOString(),
        });
        return;
      }

      cfg.repo.yayinevi.saveLedger(job.yayineviId, sonuc.ledger);

      const jobDir = join(cfg.outputDir, job.yayineviId, job.id);
      mkdirSync(jobDir, { recursive: true });
      const zipPath = join(jobDir, sonuc.paket.zipFilename);
      writeFileSync(zipPath, sonuc.zipBuffer);

      // Section 15/kullanıcı isteği: birleşik soru+görsel PNG (bkz. run.ts'in
      // "00_Onizleme.png" girdisi) zip içinde zaten var — burada ayrıca düz
      // dosya olarak da yazılır ki apps/web-legacy zip'i açmadan gösterebilsin.
      const onizleme = sonuc.paket.files.find((f) => f.name === "00_Onizleme.png");
      if (onizleme) {
        writeFileSync(join(jobDir, "onizleme.png"), Buffer.from(onizleme.content, "base64"));
      }

      cfg.repo.sonuc.create({
        isId: job.id,
        adayJson: JSON.stringify(sonuc.aday),
        kanitTablosuJson: JSON.stringify(sonuc.kanitTablosu),
        finalKilidi: sonuc.kanitTablosu.finalKilidi,
        zipPath,
      });

      // FINAL KİLİDİ "UYARILI_AÇIK" = Section 13 #4'ün onay akışı: üreten
      // öğretmen POST /jobs/:id/approve ile onaylamadan iş "bitmiş" sayılmaz.
      const finalStatus = sonuc.kanitTablosu.finalKilidi === "UYARILI_AÇIK" ? "NEEDS_REVIEW" : "DONE";
      cfg.repo.is.setStatus(job.id, finalStatus, { finishedAt: new Date().toISOString() });
    } catch (err) {
      cfg.repo.is.setStatus(job.id, "FAILED", {
        hataMesaji: err instanceof Error ? err.message : String(err),
        finishedAt: new Date().toISOString(),
      });
    }
  }

  const interval = setInterval(tick, cfg.pollIntervalMs);
  return {
    stop() {
      stopped = true;
      clearInterval(interval);
    },
  };
}
