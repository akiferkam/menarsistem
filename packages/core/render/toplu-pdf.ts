import puppeteer from "puppeteer-core";
import { resolveChromeExecutable } from "./html-to-png.js";

/**
 * Faz 5 "Soru Bankası": `page-preview.ts`/`html-to-png.ts` her iş için zaten
 * bir `onizleme.png` üretiyor — bu modül pipeline'a hiç dokunmadan o
 * PNG'leri sırayla PDF sayfalarına gömer ve sona bir cevap anahtarı sayfası
 * ekler. Yeniden HTML render/dizgi yok, tek iş: N görüntüyü + bir tabloyu
 * puppeteer'ın kendi `page.pdf()`'iyle tek bir PDF'e birleştirmek.
 */

export interface TopluPdfSayfa {
  /** data URI öneki OLMADAN ham base64 PNG (worker.ts'in diskten okuduğu onizleme.png). */
  pngBase64: string;
}

export interface TopluCevapSatiri {
  sira: number;
  kod: string;
  dogruSecenek: string;
}

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * PNG IHDR'den piksel genişlik/yükseklik okur (imza 8 bayt + uzunluk/"IHDR"
 * 8 bayt sonrası 16. bayttan itibaren 4+4 bayt big-endian uint32) — onizleme.png
 * `.page{overflow:hidden}` ile İÇERİK kadar büyüyor (bkz. page-preview.ts),
 * yani A4'ten UZUN görüntüler olağan. Sabit A4 sayfa boyutuyla birleştirince
 * (page-break-inside:avoid bir sayfaya SIĞMAYAN bloğu bir sonrakine iter ama
 * orada da sığmaz) ilk sayfa boş kalıp görüntü ikinci sayfaya taşarak kesiliyordu
 * (canlı modda görüldü: FEL.10.1.1 BEN — 2 paragraf + 5 uzun şık). Düzeltme:
 * sayfa yüksekliğini sabit A4 yerine en uzun görüntüye göre hesapla.
 */
function pngHeightMm(base64: string, widthMm: number): number {
  const buf = Buffer.from(base64, "base64");
  const widthPx = buf.readUInt32BE(16);
  const heightPx = buf.readUInt32BE(20);
  if (!widthPx || !heightPx) return 0;
  return (heightPx / widthPx) * widthMm;
}

const TOPLU_PDF_CSS = `
  *{box-sizing:border-box}
  body{margin:0;font-family:"Swis721 BT",Arial,sans-serif;color:#111111}
  /* Her soru kendi PNG'sinin doğal yüksekliğinde — zorunlu sayfa sonu YOK,
     Chrome'un kendi print-akışı birden çok kısa soruyu aynı fiziksel sayfaya
     doldurur; yalnız TEK bir sorunun ortasından bölünmesi engellenir. */
  .q-page{padding:6mm 0;display:flex;justify-content:center;page-break-inside:avoid}
  .q-page img{width:185mm;display:block}
  .divider{width:80%;margin:0 auto;border:0;border-top:1.5px dashed #94a3b8}
  .a-page{padding:16mm;page-break-before:always}
  .a-page h1{font-size:14pt;color:#123E6B;margin:0 0 14px}
  .a-page table{width:100%;border-collapse:collapse;font-size:10.5pt}
  .a-page th,.a-page td{border:1px solid #d5dce5;padding:6px 10px;text-align:left}
  .a-page th{background:#E8EDF3;color:#123E6B}
`;

/** N soru sayfasını (PNG) + bir cevap anahtarı sayfasını tek bir çok sayfalı PDF'e birleştirir. */
export async function renderTopluPdf(sayfalar: TopluPdfSayfa[], cevapAnahtari: TopluCevapSatiri[]): Promise<Buffer> {
  const soruSayfalari = sayfalar
    .map((s) => `<div class="q-page"><img src="data:image/png;base64,${s.pngBase64}"></div>`)
    .join('\n<hr class="divider">\n');

  const cevapSatirlari = cevapAnahtari
    .map((c) => `<tr><td>${c.sira}</td><td>${esc(c.kod)}</td><td>${esc(c.dogruSecenek)}</td></tr>`)
    .join("\n");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>MENAR MAYS — Soru Bankası</title>
<style>${TOPLU_PDF_CSS}</style>
</head>
<body>
${soruSayfalari}
<div class="a-page">
  <h1>Cevap Anahtarı</h1>
  <table>
    <thead><tr><th>Sıra</th><th>Kazanım Kodu</th><th>Doğru Şık</th></tr></thead>
    <tbody>
${cevapSatirlari}
    </tbody>
  </table>
</div>
</body>
</html>
`;

  const executablePath = resolveChromeExecutable();
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    // .q-page'in kendi dikey padding'i (6mm×2) + print margin'leri (6mm+12mm) +
    // küçük bir tampon — en uzun görüntü bile "page-break-inside:avoid" ile tek
    // sayfaya sığsın diye A4'ün (297mm) üzerine çıkabilen bir sayfa yüksekliği.
    const enUzunGorselMm = Math.max(0, ...sayfalar.map((s) => pngHeightMm(s.pngBase64, 185)));
    const sayfaYuksekligiMm = Math.max(297, enUzunGorselMm + 12 + 18 + 5);

    const pdf = await page.pdf({
      width: "210mm",
      height: `${sayfaYuksekligiMm}mm`,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#637083">Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: "6mm", bottom: "12mm", left: "0mm", right: "0mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
