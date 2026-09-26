import puppeteer from "puppeteer-core";
import { resolveChromeExecutable } from "./html-to-png.js";

/**
 * AI görsel modelleri (gpt-image-1, fal.ai/Flux) metin/rakam çizmekte KALICI
 * olarak güvenilmez (bkz. proje hafızası menar-mays-gorsel-mimari). Bu modül
 * o riski TAMAMEN ortadan kaldırır: AI'dan yalnız bir bölgeyi BOŞ/NÖTR
 * bırakması istenir (bkz. 16-gorsel-prompt.ts), gerçek metin/rakam üretim
 * SONRASI, gerçek bir tarayıcı font motoruyla (14-veri-katmani.ts'in SVG
 * etiketlerindeki AYNI güvenilirlikte) bindirilir — `html-to-png.ts`'in
 * kanıtlanmış puppeteer-core deseni yeniden kullanılıyor.
 */

export interface OverlayKonum {
  x_yuzde: number;
  y_yuzde: number;
}

/**
 * Ölçüm/kılavuz çizgisi — cetvel üzerindeki bir noktayı işaretlemek gibi
 * durumlarda kullanılır. Canlı testte (2026-09-14, ham gpt-image-2.5-sunburst
 * denemesi, bkz. proje hafızası) AI'nın KENDİSİNİN çizdiği bir kılavuz çizgi
 * istenen sayısal noktaya piksel-kesin denk gelmedi (metin doğruydu ama çizgi
 * ~1-1,5 cm kaymıştı) — bu yüzden çizgi de metin gibi üretim SONRASI, gerçek
 * bir SVG çizim motoruyla bindirilir, AI'dan hiç geçmez.
 */
export interface OverlayCizgi {
  x1_yuzde: number;
  y1_yuzde: number;
  x2_yuzde: number;
  y2_yuzde: number;
  renk?: string | null;
  etiket?: string | null;
  /** KUVVET_OKU için — hangi ucun ok başı taşıyacağı (14-veri-katmani.ts'in okUcuUcgeni ile AYNI sözleşme). */
  ok?: "YOK" | "UC1" | "UC2" | "IKI_UC" | null;
}

export type OverlayStili = "CIHAZ_EKRANI" | "TEKNIK_ETIKET" | "OLCUM_CIZGISI" | "KUVVET_OKU";

export interface OverlayGorselSonucu {
  mimeType: "image/png";
  /** base64, data: öneki olmadan. */
  data: string;
  byteLength: number;
}

function etiketHtml(stil: OverlayStili, konum: OverlayKonum, metin: string): string {
  const ortak =
    "position:absolute; transform:translate(-50%,-50%); white-space:nowrap; " +
    `left:${konum.x_yuzde}%; top:${konum.y_yuzde}%;`;
  // CIHAZ_EKRANI: koyu bir dijital gösterge camı üzerinde açık renk rakam —
  // TEKNIK_ETIKET: beyaz, basılı bir ölçü etiketi üzerinde koyu metin.
  const stilCss =
    stil === "CIHAZ_EKRANI"
      ? "background:#12261f; color:#8ef0b8; font-family:'Courier New',monospace; font-weight:700; " +
        "font-size:22px; padding:6px 12px; border-radius:2px; box-shadow:inset 0 0 4px rgba(0,0,0,0.6); " +
        "letter-spacing:0.5px;"
      : "background:#ffffff; color:#1a1a1a; font-family:Arial,sans-serif; font-weight:600; font-size:18px; " +
        "padding:3px 9px; border-radius:2px; border:1px solid #999; box-shadow:0 1px 2px rgba(0,0,0,0.25);";
  return `<div style="${ortak} ${stilCss}">${escapeHtml(metin)}</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` ile SVG koordinat
 * uzayı `left:%`/`top:%` CSS'iyle BİREBİR aynı yüzde sistemine oturur (x/y
 * bağımsız ölçeklenir) — `overlay_cizgileri`'nin x1_yuzde/y1_yuzde/x2_yuzde/
 * y2_yuzde alanları ek bir dönüşüm gerekmeden doğrudan kullanılabilir.
 * `vector-effect="non-scaling-stroke"` çizgi kalınlığının bu bağımsız
 * ölçeklenmeden (dikdörtgen fotoğraflarda x/y farklı oranda büyür) ETKİLENMEMESİNİ
 * sağlar. NOT: buraya `<text>` KONULMAZ — `viewBox 0 0 100 100` altında font
 * boyutu da x/y ile birlikte (ve BAĞIMSIZ/asimetrik) ölçeklenir, harfler
 * gerçek px yerine dev/bozuk görünür; çizgi etiketleri bunun yerine aşağıdaki
 * `etiketHtml` ile gerçek px fontlu ayrı bir div olarak eklenir.
 */
/**
 * Bir ok ucu üçgeni — `14-veri-katmani.ts`'in `okUcuUcgeni()` ile AYNI mantık
 * (geri-uçtan boyut kadar çekilip dik yönde yarı-boyut kadar açılan iki
 * nokta + uç noktası). Burada viewBox 0-100 BİRİMLERİNDE hesaplanır — bu,
 * çizginin kendisinin de tabi olduğu aynı (dikdörtgen fotoğraflarda x/y
 * farklı oranda büyüyen) hafif çarpıklığa aynı şekilde tabi olur, ama bir
 * ok başı olarak görsel okunabilirliği bunu etkilemeyecek kadar küçük kalır.
 */
function okUcuNoktalari(ucX: number, ucY: number, yonX: number, yonY: number, boyut = 3): string {
  const uzunluk = Math.hypot(yonX, yonY) || 1;
  const ux = yonX / uzunluk;
  const uy = yonY / uzunluk;
  const px = -uy;
  const py = ux;
  const geriX = ucX - ux * boyut;
  const geriY = ucY - uy * boyut;
  const solX = geriX + px * (boyut * 0.55);
  const solY = geriY + py * (boyut * 0.55);
  const sagX = geriX - px * (boyut * 0.55);
  const sagY = geriY - py * (boyut * 0.55);
  return `${ucX},${ucY} ${solX},${solY} ${sagX},${sagY}`;
}

function cizgiSvg(cizgiler: OverlayCizgi[]): string {
  if (!cizgiler.length) return "";
  const parcalar = cizgiler.map((c) => {
    const renk = escapeHtml(c.renk ?? "#d62828");
    const dx = c.x2_yuzde - c.x1_yuzde;
    const dy = c.y2_yuzde - c.y1_yuzde;
    let s = `<line x1="${c.x1_yuzde}" y1="${c.y1_yuzde}" x2="${c.x2_yuzde}" y2="${c.y2_yuzde}" ` +
      `stroke="${renk}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
    if (c.ok === "UC2" || c.ok === "IKI_UC") {
      s += `<polygon points="${okUcuNoktalari(c.x2_yuzde, c.y2_yuzde, dx, dy)}" fill="${renk}"/>`;
    }
    if (c.ok === "UC1" || c.ok === "IKI_UC") {
      s += `<polygon points="${okUcuNoktalari(c.x1_yuzde, c.y1_yuzde, -dx, -dy)}" fill="${renk}"/>`;
    }
    return s;
  });
  return (
    `<svg viewBox="0 0 100 100" preserveAspectRatio="none" ` +
    `style="position:absolute;left:0;top:0;width:100%;height:100%;">${parcalar.join("")}</svg>`
  );
}

/** Bir çizginin orta noktasına, gerçek px fontlu (SVG'nin ölçek bozukluğundan bağımsız) bir etiket div'i. */
function cizgiEtiketHtml(c: OverlayCizgi): string {
  if (!c.etiket) return "";
  const ortaX = (c.x1_yuzde + c.x2_yuzde) / 2;
  const ortaY = (c.y1_yuzde + c.y2_yuzde) / 2;
  const renk = escapeHtml(c.renk ?? "#d62828");
  return (
    `<div style="position:absolute; transform:translate(-50%,-50%); white-space:nowrap; ` +
    `left:${ortaX}%; top:${ortaY}%; color:${renk}; font-family:Arial,sans-serif; font-weight:700; ` +
    `font-size:15px; text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;">${escapeHtml(c.etiket)}</div>`
  );
}

/**
 * Bağlam fotoğrafının üzerine, önceden AI'ya BOŞ BIRAKTIRILAN konumlara
 * (bkz. `overlay_konumlari`, `03-generator-schema.ts`) gerçek değerleri
 * bindirir. `konumlar` ve `degerler` aynı sırada, aynı uzunlukta olmalı —
 * çağıran taraf (20-baglam-gorseli.ts) bunu zaten preflight'ta doğrulanmış
 * veriden üretir.
 */
export async function bindirOverlayMetni(
  gorsel: { mimeType: "image/png"; data: string },
  stil: OverlayStili,
  konumlar: OverlayKonum[],
  degerler: string[],
  cizgiler: OverlayCizgi[] = []
): Promise<OverlayGorselSonucu> {
  const etiketler = konumlar.map((k, i) => etiketHtml(stil, k, degerler[i] ?? "")).join("\n");
  const cizgiKatmani = cizgiSvg(cizgiler);
  const cizgiEtiketleri = cizgiler.map(cizgiEtiketHtml).join("\n");
  const html =
    "<!doctype html><html><head><meta charset=\"utf-8\"><style>" +
    "html,body{margin:0;padding:0;}" +
    "#stage{position:relative;display:inline-block;line-height:0;}" +
    "#stage img{display:block;}" +
    "</style></head><body>" +
    `<div id="stage"><img id="photo" src="data:image/png;base64,${gorsel.data}">${cizgiKatmani}${etiketler}${cizgiEtiketleri}</div>` +
    "</body></html>";

  const executablePath = resolveChromeExecutable();
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    const stage = await page.$("#stage");
    if (!stage) throw new Error("gorsel-overlay: #stage bulunamadı — HTML üretimi bozuk");
    const shot = await stage.screenshot({ type: "png" });
    const buf = Buffer.from(shot);
    return { mimeType: "image/png", data: buf.toString("base64"), byteLength: buf.byteLength };
  } finally {
    await browser.close();
  }
}
