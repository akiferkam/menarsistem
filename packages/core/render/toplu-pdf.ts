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
    const pdf = await page.pdf({
      format: "a4",
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
