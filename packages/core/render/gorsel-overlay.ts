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
  /**
   * Kullanıcı geri bildirimi (2026-09-28, "ekran yamuk, yazı düz"): ekran/
   * etiket yüzeyi kamera açısıyla eğik durduğunda bindirilen kart hep
   * yatay/düz basılıyor, yapıştırılmış gibi duruyordu. Bu, 19-gorsel-
   * denetim.ts'in GERÇEK görselde gördüğü eğim tahmini (derece, saat yönü
   * pozitif) — `etiketHtml` bindirdiği kartı bu kadar döndürür. Yoksa/0 ise
   * kart düz basılır (eski davranış).
   */
  aci_derece?: number | null;
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

// Kullanıcı geri bildirimi (2026-09-28, üç tur): (1) CIHAZ_EKRANI'nin SABİT
// koyu-yeşil/terminal görünümü altındaki fotoğrafın GERÇEKTE ne renk
// çizildiğinden bağımsız hep aynı kutuyu basıyordu — yapıştırılmış gibi
// duruyordu; (2) düz siyah/beyaz metne çevrilince bu kez "renkli başka
// şeyler ekleyerek daha doğal" istendi — tek renkli bir rozet eklendi; (3)
// kullanıcı asıl kastının bu da olmadığını netleştirdi: "bilgisayar ya ekran,
// bilgisayarın doğal görünümü falan olsa" — yani tek bir değer rozeti değil,
// KÜÇÜK BİR UYGULAMA PENCERESİ/EKRAN GÖRÜNTÜSÜ hissi. Çözüm YİNE AI'ya
// değer ÇİZDİRMEK değil (bu modülün var olma nedeni olan güvenilirlik
// sorununu geri getirir) — deterministik bindirmeye gerçek bir işletim
// sistemi/uygulama penceresinin küçük bir "chrome"unu (başlık çubuğu +
// üç nokta) eklemek: değer artık boş bir dikdörtgene yapıştırılmış bir
// etiket değil, ekranda AÇIK duran küçük bir uygulama/widget penceresinin
// İÇİNDEKİ okuma gibi görünüyor. Fotoğrafın o bölgede GERÇEKTEN ne kadar
// açık/koyu çizildiğine göre (bkz. `parlaklikOlc`) pencere açık/koyu temaya
// uyarlanır — hem doğal (fotoğrafa göre) hem renkli (başlık çubuğu noktaları)
// kalır.
const VURGU_PALETI = ["#2f6fed", "#0f9b8e", "#7c5cfc", "#d9480f"];

/** "Katılan: 64" gibi "etiket: değer" biçimindeki metni küçük üst-başlık +
 * büyük okuma olarak ikiye ayırır — pencere içinde gerçek bir widget gibi
 * görünmesini sağlar. Ayrılamıyorsa (ör. yalnız "12,5 N") tek büyük satır
 * olarak kalır. */
function baslikDegerAyir(metin: string): { baslik: string | null; deger: string } {
  const idx = metin.indexOf(":");
  if (idx > 0 && idx < metin.length - 1) {
    return { baslik: metin.slice(0, idx).trim(), deger: metin.slice(idx + 1).trim() };
  }
  return { baslik: null, deger: metin };
}

function etiketHtml(stil: OverlayStili, konum: OverlayKonum, metin: string, index: number, koyuZeminUzerinde: boolean): string {
  // Denetçinin gördüğü açı (varsa) kartı ekranın kendi eğimine oturtur —
  // `translate` ÖNCE, `rotate` SONRA: aksi halde döndürme merkezi kartın
  // kendi merkezi değil, sayfanın (0,0) noktası olur ve kart konumdan kayar.
  const aci = konum.aci_derece ?? 0;
  const donusum = aci ? `translate(-50%,-50%) rotate(${aci}deg)` : "translate(-50%,-50%)";
  const ortak = `position:absolute; transform:${donusum}; left:${konum.x_yuzde}%; top:${konum.y_yuzde}%;`;
  // TEKNIK_ETIKET: gerçekten basılı bir ölçü etiketi/sticker hissi verdiği
  // için sabit beyaz-zemin/koyu-metin korunuyor — o zaten çoğu ekipmanda
  // fiziksel olarak beyaz bir etikettir, bir uygulama penceresi OLMAMALI.
  if (stil !== "CIHAZ_EKRANI") {
    // `05-preflight.ts` CIHAZ_EKRANI/TEKNIK_ETIKET değerlerini uzunluk
    // sınırıyla RED'liyor — ama bu ikinci bir güvenlik ağı: bir değer
    // beklenenden uzun kalırsa fotoğrafın kenarından TAŞMASIN diye
    // max-width + normal kaydırma burada korunuyor.
    return (
      `<div style="${ortak} white-space:normal; text-align:center; max-width:42%; background:#ffffff; ` +
      "color:#1a1a1a; font-family:Arial,sans-serif; font-weight:600; font-size:18px; padding:3px 9px; " +
      `border-radius:2px; border:1px solid #999; box-shadow:0 1px 2px rgba(0,0,0,0.25);">${escapeHtml(metin)}</div>`
    );
  }

  const renk = VURGU_PALETI[index % VURGU_PALETI.length];
  const { baslik, deger } = baslikDegerAyir(metin);
  const pencereZemin = koyuZeminUzerinde ? "#26282c" : "#ffffff";
  const baslikCubugu = koyuZeminUzerinde ? "#1a1c1f" : "#f0f1f3";
  const metinRengi = koyuZeminUzerinde ? "#f2f2f0" : "#1c1c1e";
  const baslikMetinRengi = koyuZeminUzerinde ? "#9a9ca0" : "#8a8d92";
  const noktalar = [renk, koyuZeminUzerinde ? "#4b4d51" : "#d8dadd", koyuZeminUzerinde ? "#4b4d51" : "#d8dadd"]
    .map((c) => `<span style="width:6px;height:6px;border-radius:50%;background:${c};display:inline-block;"></span>`)
    .join("");
  // NOT: `bindirOverlayMetni`in #stage konteyneri, fotoğraf altındaki
  // görüntülerin piksel-kesin dizilmesi için `line-height:0` taşıyor — bu
  // değer buraya (tüm alt öğelere) miras kaldığında başlık/değer satırları
  // sıfır yükseklikte üst üste binip okunaksız hâle geliyordu (canlı testte
  // görüldü). Her metin satırına AÇIKÇA normal bir line-height verilmesi bu
  // mirası keser.
  return (
    `<div style="${ortak} font-family:'Segoe UI',Helvetica,Arial,sans-serif; min-width:96px; max-width:46%; ` +
    `background:${pencereZemin}; border-radius:8px; overflow:hidden; box-shadow:0 6px 16px rgba(0,0,0,0.3); ` +
    `line-height:normal;">` +
    `<div style="background:${baslikCubugu}; padding:5px 8px; display:flex; align-items:center; gap:4px; ` +
    `line-height:normal;">${noktalar}</div>` +
    `<div style="padding:7px 12px 9px; text-align:center; white-space:normal;">` +
    (baslik
      ? `<div style="font-size:9px; line-height:1.3; font-weight:600; letter-spacing:0.4px; ` +
        `text-transform:uppercase; color:${baslikMetinRengi}; margin-bottom:1px;">${escapeHtml(baslik)}</div>`
      : "") +
    `<div style="font-size:20px; line-height:1.25; font-weight:700; color:${metinRengi};">${escapeHtml(deger)}</div>` +
    "</div></div>"
  );
}

/**
 * Bir görselde, verilen yüzde-konumlarının etrafındaki küçük bir bölgenin
 * ortalama parlaklığını (0-255) ölçer. `page.evaluate()`e doğrudan
 * geçirilir — puppeteer fonksiyonu kendi kaynağından page context'inde
 * yeniden değerlendirir, bu yüzden DOM/canvas API'lerini burada serbestçe
 * kullanabiliriz (bu kod Node'da değil, headless Chrome sayfasında çalışır).
 */
function parlaklikOlc(konumlar: OverlayKonum[]): number[] {
  const img = document.getElementById("photo") as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return konumlar.map((k) => {
    const boyut = Math.max(12, Math.round(img.naturalWidth * 0.05));
    const cx = Math.round((img.naturalWidth * k.x_yuzde) / 100);
    const cy = Math.round((img.naturalHeight * k.y_yuzde) / 100);
    const x0 = Math.max(0, cx - Math.round(boyut / 2));
    const y0 = Math.max(0, cy - Math.round(boyut / 2));
    const w = Math.min(boyut, canvas.width - x0);
    const h = Math.min(boyut, canvas.height - y0);
    if (w <= 0 || h <= 0) return 255;
    const data = ctx.getImageData(x0, y0, w, h).data;
    let toplam = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      toplam += 0.2126 * (data[i] ?? 255) + 0.7152 * (data[i + 1] ?? 255) + 0.0722 * (data[i + 2] ?? 255);
      n++;
    }
    return n ? toplam / n : 255;
  });
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
  const cizgiKatmani = cizgiSvg(cizgiler);
  const cizgiEtiketleri = cizgiler.map(cizgiEtiketHtml).join("\n");
  const html =
    "<!doctype html><html><head><meta charset=\"utf-8\"><style>" +
    "html,body{margin:0;padding:0;}" +
    "#stage{position:relative;display:inline-block;line-height:0;}" +
    "#stage img{display:block;}" +
    "</style></head><body>" +
    `<div id="stage"><img id="photo" src="data:image/png;base64,${gorsel.data}">${cizgiKatmani}${cizgiEtiketleri}</div>` +
    "</body></html>";

  const executablePath = resolveChromeExecutable();
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    // Etiketleri eklemeden ÖNCE, her konumun ALTINDA fotoğrafın gerçekte ne
    // çizdiğini ölç — CIHAZ_EKRANI metni buna göre açık/koyu varyanta
    // uyarlanır (bkz. `etiketHtml` başındaki not), sabit bir tema yerine.
    const parlakliklar = konumlar.length ? await page.evaluate(parlaklikOlc, konumlar) : [];
    const etiketler = konumlar
      .map((k, i) => etiketHtml(stil, k, degerler[i] ?? "", i, (parlakliklar[i] ?? 255) < 128))
      .join("\n");
    if (etiketler) {
      await page.evaluate((html) => {
        document.getElementById("stage")?.insertAdjacentHTML("beforeend", html);
      }, etiketler);
    }
    const stage = await page.$("#stage");
    if (!stage) throw new Error("gorsel-overlay: #stage bulunamadı — HTML üretimi bozuk");
    const shot = await stage.screenshot({ type: "png" });
    const buf = Buffer.from(shot);
    return { mimeType: "image/png", data: buf.toString("base64"), byteLength: buf.byteLength };
  } finally {
    await browser.close();
  }
}
