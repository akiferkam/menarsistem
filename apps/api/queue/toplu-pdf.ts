import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  renderTopluPdf,
  type GeneratorOutput,
  type JobInput,
  type TopluCevapSatiri,
  type TopluPdfSayfa,
} from "@menar/core";
import type { Repository } from "../db/repository.js";

/**
 * Bir toplu üretimin (batch) job'larından PDF birleştirir — iki çağıran var:
 * `queue/worker.ts` (bir job terminal duruma her ulaştığında) ve
 * `routes/jobs.ts`'in `/approve` uç noktası (bir NEEDS_REVIEW job'u batch
 * zaten TAMAMLANDI olduktan SONRA onaylanırsa, PDF'i o soruyu da içerecek
 * şekilde yeniden derlemek için). Her iki çağıran da bu TEK fonksiyona
 * yönlendirilir ki mantık iki yerde ayrışmasın.
 */
const assemblingBatches = new Set<string>();

/**
 * Batch'in TÜM job'ları artık QUEUED/RUNNING değilse (ilk kez tamamlandıysa
 * VEYA daha önce tamamlanmış bir batch'te bir soru sonradan onaylandıysa)
 * PDF'i (yeniden) derler. Hâlâ bekleyen/çalışan bir kardeş varsa no-op —
 * böylece erken bir onay, henüz bitmemiş bir batch'i PDF'e kilitlemez.
 */
export async function maybeAssembleTopluUretim(topluUretimId: string, repo: Repository, outputDir: string): Promise<void> {
  if (assemblingBatches.has(topluUretimId)) return;

  const jobs = repo.topluUretim.listJobsFor(topluUretimId);
  const hepsiBitti = jobs.length > 0 && jobs.every((j) => j.status !== "QUEUED" && j.status !== "RUNNING");
  if (!hepsiBitti) return;

  assemblingBatches.add(topluUretimId);
  try {
    // NEEDS_REVIEW/FAILED job'lar PDF'e girmez — öğretmen bunları /jobs
    // üzerinden (bu modülü tetikleyen /approve dahil) ayrı halleder.
    const sayfalar: TopluPdfSayfa[] = [];
    const cevapAnahtari: TopluCevapSatiri[] = [];
    let sira = 1;
    for (const job of jobs) {
      if (job.status !== "DONE" && job.status !== "APPROVED") continue;
      const sonuc = repo.sonuc.getByIsId(job.id);
      if (!sonuc) continue;
      const pngPath = join(outputDir, job.yayineviId, job.id, "onizleme.png");
      if (!existsSync(pngPath)) continue;

      sayfalar.push({ pngBase64: readFileSync(pngPath).toString("base64") });
      const input = JSON.parse(job.inputJson) as JobInput;
      const aday = JSON.parse(sonuc.adayJson) as GeneratorOutput;
      for (const soru of aday.sorular) {
        cevapAnahtari.push({ sira: sira++, kod: input.kod, dogruSecenek: soru.dogru_secenek });
      }
    }

    const pdfBuffer = await renderTopluPdf(sayfalar, cevapAnahtari);
    const topluDir = join(outputDir, "_toplu");
    mkdirSync(topluDir, { recursive: true });
    const pdfPath = join(topluDir, `${topluUretimId}.pdf`);
    writeFileSync(pdfPath, pdfBuffer);
    repo.topluUretim.setDone(topluUretimId, pdfPath);
  } finally {
    assemblingBatches.delete(topluUretimId);
  }
}
