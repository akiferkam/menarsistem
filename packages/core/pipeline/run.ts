import { validateJob } from "./01-validate.js";
import { generateAday, type GenerateDeps } from "./04-generate.js";
import { runPreflight } from "./05-preflight.js";
import { runOtopsi, type OtopsiDeps } from "./08-otopsi.js";
import { runBoard, type BoardDeps } from "./10-run-board.js";
import { buildKanitTablosu } from "./11-kanit-tablosu.js";
import { reviseAday, buildUretimDurduruldu } from "./12-revize.js";
import { buildRotationEntry, appendToLedger, buildGorunmezKunye } from "./13-rotasyon.js";
import { buildVeriKatmani } from "./14-veri-katmani.js";
import { runBaglamGorseli, type BaglamGorseliDeps } from "./20-baglam-gorseli.js";
import { buildDizgi } from "./21-dizgi.js";
import { buildInddPaket } from "./22-indd-paket.js";
import { buildZipBuffer } from "./23-zip.js";
import { renderPagePreviewHtml } from "../render/page-preview.js";
import { renderPagePreviewPng } from "../render/html-to-png.js";
import type { PromptMode } from "./02-build-prompt.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type {
  BaglamGorseliSonuc,
  GorunmezKunye,
  InddPaket,
  JobInput,
  KanitTablosu,
  OtopsiResult,
  PreflightResult,
  ResolvedJob,
  RotationLedger,
  UretimDurduruldu,
  VeriKatmaniSonuc,
} from "./types.js";

export * from "./types.js";
export * from "./01-validate.js";
export * from "./02-build-prompt.js";
export * from "./03-generator-schema.js";
export * from "./04-generate.js";
export * from "./05-preflight.js";
export * from "./06-solver-schema.js";
export * from "./07-run-solvers.js";
export * from "./08-otopsi.js";
export * from "./09-board-schema.js";
export * from "./10-run-board.js";
export * from "./11-kanit-tablosu.js";
export * from "./12-revize.js";
export * from "./13-rotasyon.js";
export * from "./14-veri-katmani.js";
export * from "./15-gorsel-prompt-schema.js";
export * from "./16-gorsel-prompt.js";
export * from "./17-gorsel-uret.js";
export * from "./18-gorsel-denetim-schema.js";
export * from "./19-gorsel-denetim.js";
export * from "./20-baglam-gorseli.js";
export * from "./21-dizgi.js";
export * from "./22-indd-paket.js";
export * from "./23-zip.js";
export * from "../render/page-preview.js";
export * from "../render/html-to-png.js";
export * from "../render/toplu-pdf.js";
export * from "../llm/index.js";
export * from "../curriculum/schema.js";
export { loadCurriculum, type CurriculumSubject } from "../curriculum/load.js";
export { runSolverV25 } from "../verify/solver-v25.js";

const BOS_LEDGER: RotationLedger = { son100BaglamAilesi: [], son200AileDna: [], son15GorselAilesi: [] };
/** node 27: `revizyon_turu < 3` — en fazla iki yeniden üretim (bkz. node 26 yorumu). */
const MAKS_REVIZYON_TURU = 2;

export interface PipelineDeps {
  generator: GenerateDeps;
  solverA: OtopsiDeps["solverA"];
  solverB: OtopsiDeps["solverB"];
  board: BoardDeps;
  gorsel: BaglamGorseliDeps;
  promptMode?: PromptMode;
  ledger?: RotationLedger;
}

export type PipelineSonuc =
  | { durum: "GIRDI_HATASI"; errors: string[] }
  | { durum: "URETIM_DURDURULDU"; rapor: UretimDurduruldu }
  | {
      durum: "TAMAMLANDI";
      masterPrompt: string;
      aday: GeneratorOutput;
      onDenetim: PreflightResult;
      otopsi: OtopsiResult;
      kanitTablosu: KanitTablosu;
      gorunmezKunye: GorunmezKunye;
      veriKatmani: VeriKatmaniSonuc;
      baglamGorseli: BaglamGorseliSonuc;
      paket: InddPaket;
      zipBuffer: Buffer;
      ledger: RotationLedger;
      revizyonSayisi: number;
    };

type TurSonucu =
  | { basarili: true; onDenetim: PreflightResult; otopsi: OtopsiResult; kanitTablosu: KanitTablosu }
  | { basarili: false; onDenetim: PreflightResult; otopsi?: OtopsiResult; kanitTablosu?: KanitTablosu; redNedenleri: string[] };

async function tekTurCalistir(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  ledger: RotationLedger,
  deps: PipelineDeps,
  preflightOpts?: { atlaBaglamRotasyonu?: boolean }
): Promise<TurSonucu> {
  const onDenetim = runPreflight(resolved, aday, ledger, preflightOpts);
  if (onDenetim.status === "RED") {
    return { basarili: false, onDenetim, redNedenleri: onDenetim.kritik };
  }

  const otopsi = await runOtopsi(resolved, aday, { solverA: deps.solverA, solverB: deps.solverB });
  const kurul = await runBoard(resolved, aday, onDenetim, otopsi, deps.board);
  const kanitTablosu = buildKanitTablosu(resolved, aday, onDenetim, otopsi, kurul);

  if (kanitTablosu.finalKilidi === "KAPALI") {
    return { basarili: false, onDenetim, otopsi, kanitTablosu, redNedenleri: kanitTablosu.kritikRedNedenleri };
  }
  return { basarili: true, onDenetim, otopsi, kanitTablosu };
}

/**
 * `runPipeline`in başarı dalının (node 30→41→50-59→70-72) `tekTurCalistir`
 * PASS verdikten sonraki ortak kuyruğu — hem asıl akış hem `reviseJob` bunu
 * paylaşır, iki yerde aynı 40 satırı tekrar etmemek için ayrıldı.
 */
async function tamamla(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  sonuc: Extract<TurSonucu, { basarili: true }>,
  ledger: RotationLedger,
  deps: PipelineDeps,
  revizyonSayisi: number,
  masterPrompt: string
): Promise<PipelineSonuc> {
  const yayinPuani = sonuc.kanitTablosu.yayinPuani;
  const entry = buildRotationEntry(resolved, aday, yayinPuani);
  const gorunmezKunye = buildGorunmezKunye(resolved, aday, sonuc.onDenetim, yayinPuani);
  const veriKatmaniHam = buildVeriKatmani(resolved.input, aday);
  const baglamGorseli = await runBaglamGorseli(veriKatmaniHam.gorselGerekli, aday, resolved.input, ledger, deps.gorsel);

  // aday.veri_katmani.yalnizca_gorsel_yedegi=true olan tablo, görsel gerçek
  // değerlerle başarılı olduysa (indeksModunaGecildi=false) tamamen GEREKSİZ
  // bir tekrardır — aynı veri hem görselde hem tabloda görünürdü (kullanıcının
  // ilettiği görsel kalite kılavuzu: "aynı veri farklı yerlerde tekrar
  // edilmemeli"). Yalnız görsel gerçekten NESNE_INDEKSI'ye düştüyse (öğrenci
  // sıra numaralarının karşılığını görmek için tabloya muhtaç) bu tablo
  // nihai sayfaya dahil edilir.
  // KONUŞMA (veri_katmani.tur=KONUSMA, 2026-09-14/16) de AYNI deseni kullanıyor —
  // deterministik "KONUŞMA" SVG'si yalnız AI illüstrasyonu BAŞARISIZ olursa
  // (indeksModunaGecildi burada anlamsız/false kalır) görünmesi gereken bir
  // yedek; AI başarılı olduysa aynı diyalog İKİ KEZ görünmesin diye filtrelenir.
  const yedekGereksiz =
    aday.veri_katmani?.yalnizca_gorsel_yedegi === true && baglamGorseli.kullanildi && !baglamGorseli.indeksModunaGecildi;
  const veriKatmani = yedekGereksiz
    ? { ...veriKatmaniHam, assets: veriKatmaniHam.assets.filter((a) => a.tur !== "TABLO" && a.tur !== "KONUŞMA") }
    : veriKatmaniHam;

  // Güvenlik ağı: görsel üretimi paketleme aşamasında (burada) çalışır —
  // preflight/otopsi/kurul PASS kararından SONRA. gorselKarari=ISLEVSEL_
  // GORSEL_ZORUNLU iken 3 denemede de RED alıp görselsiz kalınırsa (bkz.
  // 20-baglam-gorseli.ts MAKS_GORSEL_DENEME), bu revizyon döngüsüne hiç
  // yansımıyordu — kanitTablosu zaten "PASS" olarak sabitlenmişti, sonuç
  // sessizce görselsiz DONE/AÇIK olarak paketlenip öğretmene "her şey
  // yolunda" gibi sunuluyordu (canlı modda gerçekten yaşandı, bkz. proje
  // hafızası). Burada kanitTablosu bu bilgiyle güncellenir: FINAL KİLİDİ
  // asla sessizce AÇIK kalamaz, öğretmen bunu görmeden soru "bitti"
  // sayılmaz.
  // Eskiden yalnız sabit "3 denemede de RED aldı" metni kalıyordu — hangi
  // denemede TAM OLARAK ne yanlış gittiği kayıptı, teşhis imkansızdı
  // (kullanıcı geri bildirimi: "görseller oluşmuyor... bunu çözmen lazım").
  // Artık her denemenin gerçek nedenleri de eklenir.
  const gorselBasarisizlikDetayi =
    (baglamGorseli.denemeGecmisi ?? [])
      .map((d) => `[${d.deneme}. deneme, ${d.status}] ${d.nedenler.join("; ") || "(neden belirtilmedi)"}`)
      .join(" || ") + (baglamGorseli.gorselPrompt ? ` || GÖNDERİLEN PROMPT: ${baglamGorseli.gorselPrompt}` : "");
  // BUG (2026-08-17'de canlı modda bulundu, iki turda düzeltildi): bu güvenlik
  // ağı önce yalnız `!baglamGorseli.kullanildi`ya bakıyordu ("AI fotoğraf
  // katmanı kullanılmadı mı?") — Geometri (GEOMETRI SVG) gibi tamamen
  // deterministik veri_katmani türleri eklendikten sonra bu YANLIŞ alarm
  // veriyordu (bkz. proje hafızası, onaltıncı tur). İlk fix `assets.length===0`
  // kontrolüne geçti ama bu SEFER TABLO'yu (salt sayısal veri listesi, bir
  // RESİM/DİYAGRAM DEĞİL) da "görsel var" sayıyordu — kullanıcı "görsel
  // zorunlu seçiyorsam tablo değil GERÇEK görsel istiyorum" diye düzeltti
  // (onyedinci tur). Artık yalnız GERÇEK görsel/diyagram türleri (GEOMETRİ/
  // GRAFİK/ŞEMA — TABLO HARİÇ) "görsel var" sayılıyor; preflight'taki
  // GERÇEK GÖRSEL EKSİK kapısıyla (05-preflight.ts) aynı ayrımı kullanıyor.
  const gercekGorselAssetVarMi = veriKatmani.assets.some((a) => a.tur !== "TABLO");
  const gercektenGorselsiz = !baglamGorseli.kullanildi && !gercekGorselAssetVarMi;
  // BUG (2026-08-17'de canlı modda bulundu, üçüncü tur): önceki iki fix
  // "gerçekten görselsiz mi" sorusunu doğru cevaplıyordu AMA bunun yan
  // etkisi olarak, baglam_katmani.gerekli=true iken fotoğraf 3 denemede de
  // RED alsa BİLE (fal.ai/gpt-image-1 gerçekten çağrılıp para harcanmış
  // olsa bile) — eğer veri_katmani'nde GERÇEK bir yedek diyagram (ör. CIZGI
  // grafik) varsa `gercektenGorselsiz=false` oluyor, HİÇBİR yerde fotoğrafın
  // neden başarısız olduğu görünmüyordu (kullanıcı "yine görsel yok" dedi —
  // sayfada teknik olarak bir görsel vardı ama İSTEDİĞİ fotoğraf değildi, ve
  // bu 3 başarısız denemenin nedeni artık hiçbir kanıt tablosunda yazmıyordu).
  // Artık fotoğraf GERÇEKTEN denenip başarısız olduğunda (aday.baglam_katmani.
  // gerekli=true ama kullanildi=false), yedek bir görsel olsa BİLE bu her
  // zaman bir UYARI olarak ekleniyor — yalnız HİÇ yedek yoksa (gercektenGorselsiz)
  // sert RED/UYARILI_AÇIK devreye giriyor.
  const fotoDenendiAmaBasarisiz = Boolean(aday.baglam_katmani?.gerekli) && !baglamGorseli.kullanildi;
  let kanitTablosu = sonuc.kanitTablosu;
  if (resolved.input.gorselKarari === "ISLEVSEL_GORSEL_ZORUNLU" && gercektenGorselsiz) {
    kanitTablosu = {
      ...kanitTablosu,
      satirlar: { ...kanitTablosu.satirlar, "GÖRSEL / PNG": "RED — zorunlu görsel üretilemedi (3 deneme)" },
      finalKilidi: "UYARILI_AÇIK" as const,
      redNedenleri: [
        ...kanitTablosu.redNedenleri,
        `ZORUNLU GÖRSEL ÜRETİLEMEDİ: 3 denemede de görsel denetimi RED aldı, soru görselsiz kaldı. Detay: ${gorselBasarisizlikDetayi}`,
      ],
      yayinUyarilari: [
        ...kanitTablosu.yayinUyarilari,
        `ZORUNLU GÖRSEL ÜRETİLEMEDİ: 3 denemede de görsel denetimi RED aldı, soru görselsiz kaldı. Detay: ${gorselBasarisizlikDetayi}`,
      ],
    };
  } else if (fotoDenendiAmaBasarisiz) {
    kanitTablosu = {
      ...kanitTablosu,
      yayinUyarilari: [
        ...kanitTablosu.yayinUyarilari,
        `BAĞLAM FOTOĞRAFI ÜRETİLEMEDİ (yedek diyagram/tablo kullanıldı): 3 denemede de görsel denetimi RED ` +
          `aldı. Detay: ${gorselBasarisizlikDetayi}`,
      ],
    };
  }

  const dizgi = buildDizgi(resolved, aday, veriKatmani.assets, baglamGorseli.contextImageFilename);
  const paketCekirdek = buildInddPaket(
    resolved,
    aday,
    sonuc.onDenetim,
    sonuc.otopsi,
    kanitTablosu,
    gorunmezKunye,
    dizgi,
    veriKatmani.assets,
    baglamGorseli
  );
  const onizlemeHtml = renderPagePreviewHtml(dizgi, veriKatmani.assets, baglamGorseli, resolved.input.sayfaSablonu);
  const onizlemePng = await renderPagePreviewPng(onizlemeHtml);
  const paket: typeof paketCekirdek = {
    ...paketCekirdek,
    files: [
      ...paketCekirdek.files,
      { name: "00_Onizleme.png", content: onizlemePng.toString("base64"), mimeType: "image/png", encoding: "base64" },
    ],
    paketIcerigi: [...paketCekirdek.paketIcerigi, "00_Onizleme.png"],
  };
  const zipBuffer = await buildZipBuffer(paket);
  return {
    durum: "TAMAMLANDI",
    masterPrompt,
    aday,
    onDenetim: sonuc.onDenetim,
    otopsi: sonuc.otopsi,
    kanitTablosu,
    gorunmezKunye,
    veriKatmani,
    paket,
    zipBuffer,
    baglamGorseli,
    ledger: appendToLedger(ledger, entry),
    revizyonSayisi,
  };
}

/**
 * node 01→02→04→05→(12)→20-22→23-25→26-29→30→40-59→70-73'ün uçtan uca
 * zinciri. node 12/25'in PASS/RED dallanmaları `tekTurCalistir`in
 * başarı/başarısızlık dönüşüne katlanmış. Başarısızlıkta node 26'nın
 * revizyon promptu ile en fazla iki kez yeniden üretilir (node 27); üçüncü
 * kritik hatada node 28'in "üretim durduruldu" raporu döner. Başarıda
 * node 30 (rotasyon) sonrası node 41 (SVG veri katmanı) her zaman çalışır;
 * node 40'ın koşulu true ise node 50-59'un bağlam görseli zinciri devreye
 * girer (bkz. `20-baglam-gorseli.ts`). Rotasyon ledger'ının node 50'ye
 * giden hâli kaynakta bu turun kaydı eklenmeden ÖNCEKİ hâldir (node 30
 * yalnız ayrı bir `store.rotation` günlüğüne yazar, `rotasyon` nesnesini
 * değiştirmez) — bu yüzden burada `ledger` (append'lenmemiş) kullanılır,
 * `appendToLedger` sonucu değil. Ardından node 70 (dizgi) → 71 (gerçek
 * ICML/RTF/manifest paketi) → 72 (ZIP, bellek içi buffer — gerçek diske
 * yazma çağıran katmanda) çalışır; node 73 (teslim ekranı) n8n'e özgü bir
 * form UI'ı olduğundan burada karşılığı yok, `apps/cli` doğrudan `paket`i
 * yazdırır.
 */
export async function runPipeline(input: JobInput, deps: PipelineDeps): Promise<PipelineSonuc> {
  const validated = validateJob(input);
  if (!validated.valid) return { durum: "GIRDI_HATASI", errors: validated.errors };
  const resolved = validated.resolved;

  const ledger = deps.ledger ?? BOS_LEDGER;
  const { masterPrompt, output: ilkAday } = await generateAday(resolved, ledger, deps.generator, deps.promptMode);

  let aday = ilkAday;
  for (let tur = 0; ; tur++) {
    const sonuc = await tekTurCalistir(resolved, aday, ledger, deps);

    if (sonuc.basarili) {
      return tamamla(resolved, aday, sonuc, ledger, deps, tur, masterPrompt);
    }

    if (tur >= MAKS_REVIZYON_TURU) {
      const rapor = buildUretimDurduruldu(
        sonuc.redNedenleri,
        sonuc.kanitTablosu?.yayinPuani ?? 0,
        undefined,
        sonuc.kanitTablosu?.kanitTablosuMetni ?? "",
        tur
      );
      return { durum: "URETIM_DURDURULDU", rapor };
    }

    aday = await reviseAday(resolved, aday, sonuc.redNedenleri, deps.generator);
  }
}

/**
 * Öğretmen tarafındaki "Soruyu Düzelt" isteğinin portu — `runPipeline`in iç
 * otomatik revizyon döngüsünden (en fazla 2 tur, hep aynı çağrı içinde) farklı
 * olarak burada TEK bir düzeltme turu çalıştırılır: mevcut kayıtlı aday +
 * (sistemin bulduğu nedenler ve/veya öğretmenin kendi notu) `reviseAday()`'e
 * gider, ardından yalnız BİR kez yeniden doğrulanır (node 26+10, tekrarı yok).
 * Amaç öngörülebilir maliyet — öğretmen her tıklamada tam olarak ne kadar
 * harcandığını bilsin, sessizce çok turlu bir döngüye girilmesin. Başarısızsa
 * `runPipeline`in "üç kontrollü revizyon" raporuyla aynı `URETIM_DURDURULDU`
 * şeklini kullanır — API katmanı bu durumu zaten FAILED'e eşliyor,
 * öğretmen isterse yeniden dener veya sıfırdan yeni iş açar.
 */
export async function reviseJob(
  resolved: ResolvedJob,
  previousAday: GeneratorOutput,
  redNedenleri: string[],
  ledger: RotationLedger,
  deps: PipelineDeps
): Promise<PipelineSonuc> {
  const aday = await reviseAday(resolved, previousAday, redNedenleri, deps.generator);
  // atlaBaglamRotasyonu: bu aynı sorunun onarımı, sıfırdan üretim değil —
  // bağlam ailesinin (kasıtlı olarak) korunmuş olması bir rotasyon ihlali
  // sayılmamalı (bkz. 05-preflight.ts'in aynı isimli parametresinin yorumu).
  const sonuc = await tekTurCalistir(resolved, aday, ledger, deps, { atlaBaglamRotasyonu: true });

  if (sonuc.basarili) {
    return tamamla(resolved, aday, sonuc, ledger, deps, 1, "");
  }

  const rapor = buildUretimDurduruldu(
    sonuc.redNedenleri,
    sonuc.kanitTablosu?.yayinPuani ?? 0,
    undefined,
    sonuc.kanitTablosu?.kanitTablosuMetni ?? "",
    1
  );
  return { durum: "URETIM_DURDURULDU", rapor };
}
