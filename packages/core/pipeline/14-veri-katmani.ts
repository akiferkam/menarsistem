import type { BaglamSahnesiElemani, GeneratorOutput } from "./03-generator-schema.js";
import { genislikSinifi } from "./types.js";
import type { JobInput, SvgAsset, VeriKatmaniSonuc } from "./types.js";

/**
 * node "41 - VERİ KATMANI: Tablo/Grafik SVG"nin portu — deterministik,
 * manifestten türetilir. Section 15: "numeric/label/axis verisi asla
 * üretici görsel modeline yazılmaz" — bu SVG katmanı tam olarak o kuralın
 * uygulanma yeri; sayısal veri burada koddan çizilir, bağlam görseli (node
 * 50-59) hiçbir zaman bu verileri görmez.
 */
const FONT = "Swis721 BT, Arial, sans-serif";
const INK = "#111111";
const LINE = "#123E6B";
const SOFT = "#E8EDF3";
const ACC = "#B45309";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "+": "⁺",
};

/**
 * Üretici bazen üs için düz "^" gösterimi kullanıyor (bkz. 02-build-prompt.ts'in
 * "diğerlerinde ^ kullan" kuralı — soru kökü/seçenekler için), ama bu kural
 * tablo/grafik hücrelerine uygulanmıyor ve model tutarsız davranıp bazen ^,
 * bazen gerçek Unicode üst simge yazıyor (canlı modda görüldü: "10^-5" ile
 * "10⁻⁸" aynı sayfada). Bu, "10^-5" gibi kalıpları "10⁻⁵"e çevirip tabloyu
 * tutarlı hâle getirir; zaten Unicode üst simge olan metinlere dokunmaz.
 */
const formatUs = (s: string): string =>
  s.replace(/\^(-?\d+)/g, (_, exp: string) =>
    [...exp].map((c) => SUPERSCRIPT[c] ?? c).join("")
  );

/** Türkçe ondalık virgül: "3.5" -> "3,5"; üslü gösterim: "10^-5" -> "10⁻⁵". */
const tr = (v: unknown): string => formatUs(String(v ?? "").replace(/(\d)\.(\d)/g, "$1,$2"));

/**
 * SVG kendi kendine metin sarmıyor (HTML değil) — tablo hücreleri tek
 * `<text>` olarak sabit sütun genişliğine yazılırsa uzun bir "İşlem kuralı"
 * gibi cümle sütun sınırını, hatta SVG'nin kendi viewBox'ını aşıp kesilerek
 * kayboluyordu (canlı testte görüldü). Bu yaklaşık Helvetica/Arial genişlik
 * tablosuyla (1000 birim/em, standart AFM değerleri) satır kırma yapıyor —
 * piksel-mükemmel olması gerekmiyor, yalnız taşmayı güvenilir biçimde
 * önlemesi yeterli.
 */
const GLYPH_WIDTHS: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191, "(": 333, ")": 333,
  "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556, "8": 556, "9": 556,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556,
  M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "[": 278, "\\": 278, "]": 278, "^": 469, _: 556, "`": 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222,
  m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  "{": 334, "|": 260, "}": 334, "~": 584,
  ç: 500, Ç: 722, ğ: 556, Ğ: 778, ı: 278, İ: 278, ö: 556, Ö: 778, ş: 500, Ş: 667, ü: 556, Ü: 722,
  "⁰": 556, "¹": 556, "²": 556, "³": 556, "⁴": 556, "⁵": 556, "⁶": 556, "⁷": 556, "⁸": 556, "⁹": 556, "⁻": 333, "⁺": 584,
};
const GLYPH_WIDTH_VARSAYILAN = 556;

function textWidthPx(s: string, fontSize: number): number {
  let units = 0;
  for (const c of s) units += GLYPH_WIDTHS[c] ?? GLYPH_WIDTH_VARSAYILAN;
  return (units / 1000) * fontSize;
}

/**
 * Gerçek font metrikleri (Swis721 BT vs render motorunun kullandığı yedek
 * font) tahmin tablosuyla birebir örtüşmeyebilir — satır kırma kararında
 * %6 pay bırakılır, ki küçük bir metrik farkı sağ kenardan taşmaya yol
 * açmasın (canlı testte görülen "sağdan taşma" şikâyeti bundan kaynaklandı).
 */
const WRAP_GUVENLIK_PAYI = 1.06;

function wrapText(s: string, maxWidth: number, fontSize: number): string[] {
  const fits = (t: string) => textWidthPx(t, fontSize) * WRAP_GUVENLIK_PAYI <= maxWidth;
  const words = String(s ?? "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!fits(word)) {
      // Tek kelime tek satırdan uzun (nadir) — harf harf böl.
      if (current) {
        lines.push(current);
        current = "";
      }
      let chunk = "";
      for (const ch of word) {
        const test = chunk + ch;
        if (chunk && !fits(test)) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = test;
        }
      }
      current = chunk;
      continue;
    }
    const test = current ? `${current} ${word}` : word;
    if (fits(test)) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Sütunlar eskiden eşit genişlikteydi (`W / cols`) — kısa bir "Büyüklük"
 * sütunu ile uzun bir cümlelik "İşlem kuralı" sütunu yan yana geldiğinde bu,
 * kısa sütunda boşluk bırakırken uzun sütunu gereksiz yere sıkıştırıp sağdan
 * taşmaya zorluyordu. Bunun yerine her sütuna, o sütunun gerçek içeriğinin
 * (başlık + tüm hücreler) tek satırlık genişliği kadar "doğal" pay verilir;
 * toplam sığıyorsa boşluk orana göre dağıtılır, sığmıyorsa sütunlar yine
 * orana göre küçültülüp (uzun sütun yine daha çok pay alarak) satır
 * kırmaya bırakılır.
 */
function computeColWidths(hs: string[], rows: string[][], cols: number, availableWidth: number, fontSize: number): number[] {
  const CELL_PAD = 14;
  const MIN_COL = 44;
  const natural = Array.from({ length: cols }, (_, ci) => {
    const headerW = textWidthPx(String(hs[ci] ?? ""), fontSize) + CELL_PAD;
    const cellW = Math.max(0, ...rows.map((row) => textWidthPx(tr(row[ci] ?? ""), fontSize) + CELL_PAD));
    return Math.max(MIN_COL, headerW, cellW);
  });
  const sumNatural = natural.reduce((a, b) => a + b, 0);
  if (sumNatural <= availableWidth) {
    const leftover = availableWidth - sumNatural;
    return natural.map((w) => w + leftover * (w / sumNatural));
  }
  return natural.map((w) => (w / sumNatural) * availableWidth);
}

function buildTabloSvg(tab: NonNullable<GeneratorOutput["gorsel_veri_manifesti"]["tablo"]>, W: number): SvgAsset {
  const hs = tab.headers ?? [];
  const rows = tab.rows ?? [];
  const cols = hs.length || (rows[0] ?? []).length;
  const fontSize = 10.5;
  const lineHeight = 13;
  const rowHeightFor = (lineCount: number) => Math.max(26, 8 + lineHeight * lineCount + 6);

  const colWidths = computeColWidths(hs, rows, cols, W - 2, fontSize);
  const colX = colWidths.reduce<number[]>((acc, w) => [...acc, (acc.at(-1) ?? 1) + w], [1]);
  const maxTextWidthFor = (ci: number) => Math.max((colWidths[ci] ?? 60) - 12, 20);

  const headerLines = hs.map((h, ci) => wrapText(String(h ?? ""), maxTextWidthFor(ci), fontSize));
  const headerHeight = rowHeightFor(Math.max(1, ...headerLines.map((l) => l.length)));

  const rowsWrapped = rows.map((row) => row.map((cell, ci) => wrapText(tr(cell), maxTextWidthFor(ci), fontSize)));
  const rowHeights = rowsWrapped.map((cellsLines) => rowHeightFor(Math.max(1, ...cellsLines.map((l) => l.length))));

  // "Servis kartı" fikrini destekleyen küçük etiket rozeti: düz kalın başlık
  // yerine kısa bir vurgu çubuğu + izleklenmiş büyük harf — basılı bir
  // föyün üstüne yapıştırılmış etiket hissi verir, düz "kurumsal panel"
  // görünümünden kaçınır (kullanıcı isteği: "AI tarafından oluşturulmuş
  // izlenimi olmasın").
  // Uzun bir caption (canlı modda görüldü, ör. "Denemelerde Birikimli Net
  // Görüntü Sayısı") tek satırlık `<text>` olarak SVG viewBox genişliğini
  // aşıp kelimenin ortasından kesiliyordu — SVG kendi kendine metin sarmaz,
  // tablo hücrelerinde zaten kullanılan `wrapText` burada da gerekiyor.
  const captionLines = tab.caption ? wrapText(tab.caption.toLocaleUpperCase("tr-TR"), W - 10 - 4, 10.5) : [];
  const captionH = captionLines.length ? 9 + captionLines.length * 13 : 0;
  const top = 2 + captionH;
  const tableWidth = colX.at(-1)! - 1;
  const tableHeight = headerHeight + rowHeights.reduce((a, b) => a + b, 0);
  const H = top + tableHeight + (tab.footnotes ?? []).length * 16 + 10;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;
  if (captionLines.length) {
    s += `<rect x="1" y="4" width="3" height="${captionLines.length * 13 - 1}" fill="${ACC}"/>`;
    captionLines.forEach((line, i) => {
      s += `<text x="10" y="${14 + i * 13}" style="font-family:${FONT};font-size:10.5px;font-weight:bold;fill:${LINE};letter-spacing:.06em">${esc(line)}</text>`;
    });
  }

  // Booktabs tarzı: dikey çizgi yok, yalnız kalın üst/alt çizgi + ince satır
  // ayırıcıları — düz renkli başlık bloğu ve tam ızgara, sıradan bir
  // "dashboard tablosu" izlenimi veriyordu; basılı sınav föylerinde
  // (bkz. example/ klasöründeki MEB örnekleri) bu ızgara hiç kullanılmıyor.
  s += `<line x1="1" y1="${top}" x2="${1 + tableWidth}" y2="${top}" style="stroke:${LINE};stroke-width:1.4"/>`;
  hs.forEach((h, ci) => {
    (headerLines[ci] ?? [""]).forEach((line, li) => {
      s += `<text x="${(colX[ci] ?? 1) + 6}" y="${top + 17 + lineHeight * li}" style="font-family:${FONT};font-size:${fontSize}px;font-weight:bold;fill:${LINE}">${esc(line)}</text>`;
    });
  });
  let rowTop = top + headerHeight;
  s += `<line x1="1" y1="${rowTop}" x2="${1 + tableWidth}" y2="${rowTop}" style="stroke:${LINE};stroke-width:1"/>`;

  rowsWrapped.forEach((cellsLines, ri) => {
    const rowHeight = rowHeights[ri] ?? 27;
    cellsLines.forEach((lines, ci) => {
      lines.forEach((line, li) => {
        s += `<text x="${(colX[ci] ?? 1) + 6}" y="${rowTop + 17 + lineHeight * li}" style="font-family:${FONT};font-size:${fontSize}px;fill:${INK}">${esc(line)}</text>`;
      });
    });
    rowTop += rowHeight;
    if (ri < rowsWrapped.length - 1) {
      s += `<line x1="1" y1="${rowTop}" x2="${1 + tableWidth}" y2="${rowTop}" style="stroke:${SOFT};stroke-width:1"/>`;
    }
  });
  s += `<line x1="1" y1="${rowTop}" x2="${1 + tableWidth}" y2="${rowTop}" style="stroke:${LINE};stroke-width:1.4"/>`;

  (tab.footnotes ?? []).forEach((fn, k) => {
    s += `<text x="1" y="${top + tableHeight + 14 + k * 16}" style="font-family:${FONT};font-size:9px;fill:#4B5563">${esc(tr(fn))}</text>`;
  });
  s += "</svg>";
  return { name: "06_Veri_Tablosu.svg", svg: s, tur: "TABLO" };
}

/**
 * "41.25 / 13.75" gibi ham (ymax-ymin)/4 bölmesinden gelen çirkin, elle asla
 * seçilmeyecek ondalık eksen değerleri — kullanıcı geri bildirimi: "çok ai
 * gözüküyor" (canlı testte görüldü: 55/41,25/27,5/13,75/0). Gerçek bir
 * ders kitabı grafiği HER ZAMAN yuvarlak/insan-seçimi eksen değerleri
 * kullanır (0/15/30/45/60 gibi). Standart "nice number" algoritması
 * (Paul Heckbert) — 1/2/5×10^n kademelerinden en yakın adımı seçer.
 */
function niceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * Math.pow(10, exponent);
}

function niceTicks(min: number, max: number, targetCount = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step = niceStep((max - min) / targetCount);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 1e6; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

function buildGrafikSvg(seri: NonNullable<GeneratorOutput["gorsel_veri_manifesti"]["grafik_serisi"]>, W: number): SvgAsset {
  const PAD_L = 48;
  const PAD_R = 16;
  // TABLO'nun caption'ında olduğu gibi (bkz. yukarıdaki wrapText fix) uzun
  // bir başlık ("Denemelerde Birikimli Net Görüntü Sayısı" gibi) tek satırlık
  // `<text>` olarak SVG viewBox genişliğini aşıp kelimenin ortasından
  // kesiliyordu (canlı modda görüldü, dar 85mm sayfa genişliğinde) — sarma
  // eklendi.
  const titleLines = seri.baslik ? wrapText(String(seri.baslik).toLocaleUpperCase("tr-TR"), W - PAD_L - 9 - 4, 10) : [];
  const capH = titleLines.length ? 9 + titleLines.length * 12 : 6;
  const H = 254 + capH;
  const pad = { l: PAD_L, r: PAD_R, t: capH + 10, b: 38 };
  const noktalar = seri.noktalar ?? [];
  const xs = noktalar.map((p) => Number(p.x));
  const ys = noktalar.map((p) => Number(p.y));
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ticks = niceTicks(Math.min(0, ...ys), Math.max(...ys), 4);
  const ymin = ticks[0]!;
  const ymax = ticks.at(-1)!;
  const py = (v: number) => H - pad.b - (H - pad.t - pad.b) * ((v - ymin) / (ymax - ymin || 1));
  const eksenTuru = String(seri.tur ?? "CIZGI").toUpperCase();
  // SUTUN kategoriktir (ay/oturum adı gibi) — CIZGI'nin sürekli sayısal
  // eksenini (px) paylaşırsa ilk/son çubuk tam eksen çizgisinin ÜSTÜNE
  // biner (canlı testte görüldü: dikey eksen çizgisi ilk çubuğun içinden
  // fışkırıyormuş gibi göründü) — gerçek bir çubuk grafikte her zaman eksen
  // ve kenarlarda boşluk (band padding) olur. SUTUN artık kendi bant
  // ölçeğini kullanıyor; CIZGI'nin sürekli px()'i dokunulmadan kalıyor.
  const band = (W - pad.l - pad.r) / noktalar.length;
  const bandX = (i: number) => pad.l + band * (i + 0.5);
  const px = (v: number) => pad.l + (W - pad.l - pad.r) * ((v - xmin) / (xmax - xmin || 1));

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;
  // TABLO'nun "servis kartı" rozetiyle (ACC vurgu çubuğu + izleklenmiş büyük
  // harf) TUTARLI başlık — eskiden GRAFİK'in düz küçük başlığı TABLO'nunkiyle
  // görsel olarak uyuşmuyordu, iki farklı üsluptaki katman aynı sayfada
  // "otomatik üretilmiş, elle bütünleştirilmemiş" hissi veriyordu.
  if (titleLines.length) {
    s += `<rect x="${pad.l}" y="3" width="3" height="${titleLines.length * 12 - 1}" fill="${ACC}"/>`;
    titleLines.forEach((line, i) => {
      s += `<text x="${pad.l + 9}" y="${14 + i * 12}" style="font-family:${FONT};font-size:10px;font-weight:bold;fill:${LINE};letter-spacing:.05em">${esc(line)}</text>`;
    });
  }
  // Yuvarlak eksen değerleri + kesikli, çok soft ızgara çizgileri (düz
  // "0.5px solid" yerine) — basılı bir referans çizelgesi hissi.
  ticks.forEach((v) => {
    const y = py(v);
    s += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" style="stroke:${SOFT};stroke-width:0.75" stroke-dasharray="1.5,2"/>`;
    s += `<text x="${pad.l - 7}" y="${y + 3}" text-anchor="end" style="font-family:${FONT};font-size:7.5px;fill:#5B6B7D">${tr(v)}</text>`;
  });
  s += `<line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" style="stroke:${INK};stroke-width:1.1"/>`;
  s += `<line x1="${pad.l}" y1="${pad.t - 4}" x2="${pad.l}" y2="${H - pad.b}" style="stroke:${INK};stroke-width:1.1"/>`;
  if (eksenTuru === "SUTUN") {
    const bw = band * 0.56;
    noktalar.forEach((p, i) => {
      const y = Number(p.y);
      const cx = bandX(i);
      const barH = py(ymin) - py(y);
      const rTop = Math.min(3, barH);
      s += `<path d="M ${cx - bw / 2} ${py(ymin)} V ${py(y) + rTop} Q ${cx - bw / 2} ${py(y)} ${cx - bw / 2 + rTop} ${py(y)} H ${cx + bw / 2 - rTop} Q ${cx + bw / 2} ${py(y)} ${cx + bw / 2} ${py(y) + rTop} V ${py(ymin)} Z" fill="${LINE}"/>`;
    });
  } else {
    s += `<polyline points="${noktalar.map((p) => `${px(Number(p.x))},${py(Number(p.y))}`).join(" ")}" fill="none" style="stroke:${LINE};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/>`;
    // Dolu nokta yerine beyaz-dolgulu, renkli çerçeveli "halka" işaretçi —
    // basılı çizelgelerde (ör. TÜİK/MEB kaynak grafikleri) yaygın, düz dolu
    // dairelerden daha az "varsayılan kütüphane grafiği" hissi verir.
    noktalar.forEach((p) => {
      s += `<circle cx="${px(Number(p.x))}" cy="${py(Number(p.y))}" r="3" fill="#FFFFFF" style="stroke:${ACC};stroke-width:1.8"/>`;
    });
  }
  // CIZGI (çizgi grafik) x ekseni her zaman GERÇEK SAYISAL konumdur (x-t,
  // deney sayısı vb.) — üretici bazen noktalar[].etiket'i yanlışlıkla o
  // noktanın Y OKUMASIYLA dolduruyor (canlı modda görüldü: x-ekseni "20,
  // 50, 100..." olması gerekirken "0,35, 0,44, 0,46..." — yani Y değerleri —
  // gösterdi). CIZGI'de etiket'e hiç güvenilmez, x DOĞRUDAN gösterilir.
  // SUTUN (sütun grafik) kategorik olabilir (ör. ay adları) — orada etiket
  // meşru bir kullanım, x yalnız konum/sıra olabilir.
  noktalar.forEach((p, i) => {
    const x = eksenTuru === "SUTUN" ? bandX(i) : px(Number(p.x));
    const eksenMetni = eksenTuru === "SUTUN" ? (p.etiket ?? p.x) : p.x;
    s += `<text x="${x}" y="${H - pad.b + 14}" text-anchor="middle" style="font-family:${FONT};font-size:7.5px;fill:#5B6B7D">${esc(tr(eksenMetni))}</text>`;
  });
  if (seri.x_baslik) {
    s += `<text x="${(W + pad.l) / 2}" y="${H - 4}" text-anchor="middle" style="font-family:${FONT};font-size:8px;fill:${INK}">${esc(seri.x_baslik)}</text>`;
  }
  if (seri.y_baslik) {
    s += `<text x="12" y="${H / 2}" transform="rotate(-90 12 ${H / 2})" text-anchor="middle" style="font-family:${FONT};font-size:8px;fill:${INK}">${esc(seri.y_baslik)}</text>`;
  }
  s += "</svg>";
  return { name: "07_Grafik.svg", svg: s, tur: "GRAFİK" };
}

type GeoNokta = { ad?: string | null; x?: number | null; y?: number | null };
type KenarUc = { nokta1: string; nokta2: string };
type GeoKenar = {
  uclar: KenarUc;
  stil?: "DUZ" | "KESIKLI" | null;
  ok?: "YOK" | "NOKTA1" | "NOKTA2" | "IKI_UC" | null;
  etiket?: string | null;
};
type GeoAci = { kose: string; kenar1: string; kenar2: string; deger?: string | null; dik_aci?: boolean | null };

/**
 * Eski sürüm yalnız noktaları sırayla birleştirip TEK kapalı çokgen
 * çiziyordu — Öklid yüksekliği (CD), kenarortay gibi iç yardımcı doğruları
 * temsil edemiyordu. Artık `geometrik_kenarlar` doluysa TAM OLARAK o kenar
 * listesi çizilir (poligon varsayımı yok); boşsa geriye dönük uyumluluk için
 * eski "sırayla kapalı çokgen" davranışına düşer.
 */
function birimVektor(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * Kenarın ucuna, o uca doğru işaret eden bir ok başı (dolu üçgen) çizer —
 * SVG <marker> yerine bu dosyanın geri kalanıyla tutarlı biçimde elle
 * hesaplanmış bir şekil (bkz. dikAciKaresi/esitIsaretleri) kullanılıyor,
 * çünkü <marker>'ın downstream render zincirinde (InDesign/ICML) güvenilir
 * desteklendiği doğrulanmadı. `yon` ucu İŞARET EDEN birim vektördür.
 */
function okUcuUcgeni(uc: { x: number; y: number }, yon: { x: number; y: number }, boyut = 7): string {
  const geri = { x: -yon.x, y: -yon.y };
  const perp = { x: -geri.y, y: geri.x };
  const taban = { x: uc.x + geri.x * boyut, y: uc.y + geri.y * boyut };
  const yarim = boyut * 0.45;
  const k1 = { x: taban.x + perp.x * yarim, y: taban.y + perp.y * yarim };
  const k2 = { x: taban.x - perp.x * yarim, y: taban.y - perp.y * yarim };
  return `<polygon points="${uc.x},${uc.y} ${k1.x},${k1.y} ${k2.x},${k2.y}" fill="${INK}"/>`;
}

function aciYayi(
  V: { x: number; y: number },
  P1: { x: number; y: number },
  P2: { x: number; y: number },
  r: number,
  labelOffset = 13
) {
  const a1 = Math.atan2(P1.y - V.y, P1.x - V.x);
  const a2 = Math.atan2(P2.y - V.y, P2.x - V.x);
  let diff = a2 - a1;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  const sweep = diff > 0 ? 1 : 0;
  const sx = V.x + r * Math.cos(a1);
  const sy = V.y + r * Math.sin(a1);
  const endA = a1 + diff;
  const ex = V.x + r * Math.cos(endA);
  const ey = V.y + r * Math.sin(endA);
  const midA = a1 + diff / 2;
  const labelX = V.x + (r + labelOffset) * Math.cos(midA);
  const labelY = V.y + (r + labelOffset) * Math.sin(midA);
  const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
  return { sx, sy, ex, ey, sweep, largeArc, labelX, labelY };
}

function esitIsaretleri(P1: { x: number; y: number }, P2: { x: number; y: number }, sayi: number): string {
  const mx = (P1.x + P2.x) / 2;
  const my = (P1.y + P2.y) / 2;
  const dx = P2.x - P1.x;
  const dy = P2.y - P1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const tickLen = 5;
  const gap = 3.2;
  const n = Math.min(Math.max(1, sayi), 3);
  const offsets = n === 1 ? [0] : n === 2 ? [-gap / 2, gap / 2] : [-gap, 0, gap];
  return offsets
    .map((o) => {
      const cx = mx + ux * o;
      const cy = my + uy * o;
      return `<line x1="${cx - px * tickLen}" y1="${cy - py * tickLen}" x2="${cx + px * tickLen}" y2="${cy + py * tickLen}" style="stroke:${LINE};stroke-width:1.2"/>`;
    })
    .join("");
}

function dikAciKaresi(V: { x: number; y: number }, P1: { x: number; y: number }, P2: { x: number; y: number }, size: number): string {
  const u1 = birimVektor(V, P1);
  const u2 = birimVektor(V, P2);
  const c1 = { x: V.x + u1.x * size, y: V.y + u1.y * size };
  const c2 = { x: c1.x + u2.x * size, y: c1.y + u2.y * size };
  const c3 = { x: V.x + u2.x * size, y: V.y + u2.y * size };
  return `<polyline points="${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}" fill="none" style="stroke:${LINE};stroke-width:1"/>`;
}

type Nokta2D = { x: number; y: number };

/**
 * GEOMETRİ dersinde gerçek-yaşam bağlamlı sahneler (merdiven-duvar,
 * direk-gölge, rampa, bina, köprü, çatı, halat, saat, tekerlek, ağaç) için
 * "sahne derisi" primitifleri — bkz. 03-generator-schema.ts
 * BaglamSahnesiElemaniSchema yorumu. Her fonksiyon yalnız zaten hesaplanmış
 * PX/PY piksel koordinatlarını süsler; hiçbiri yeni sayısal veri (açı/uzunluk)
 * ÜRETMEZ — o veri geometrik_acilar/geometrik_kenarlar'dan gelip şeklin
 * üzerine ayrıca çizilir. AI görsel modeline hiç gitmediği için açı/sayı
 * hatası yapısal olarak imkansızdır.
 */
function duvarSkin(p1: Nokta2D, p2: Nokta2D): string {
  const u = birimVektor(p1, p2);
  const n = { x: -u.y, y: u.x };
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  let s = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${INK};stroke-width:3"/>`;
  for (let d = 5; d < len; d += 10) {
    const cx = p1.x + u.x * d;
    const cy = p1.y + u.y * d;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + n.x * 6}" y2="${cy + n.y * 6}" style="stroke:${SOFT};stroke-width:1.4"/>`;
  }
  return s;
}

function zeminSkin(p1: Nokta2D, p2: Nokta2D): string {
  const u = birimVektor(p1, p2);
  // Tarama çizgileri her zaman zeminin/rampanın ALT tarafına düşmeli — RAMPA
  // bu fonksiyonu eğik kenarlar için de yeniden kullandığından (kullanıcı
  // isteği: aynı "zemin dokusu" hem düz zeminde hem rampada), normal vektör
  // segmentin YÖNÜNE göre değişir; n.y<0 ise (yukarı bakıyorsa) ters çevrilir
  // ki tarama "aşağı/zemin tarafı" tutarlılığı yatay VE eğik kenarda korunsun.
  let n = { x: -u.y, y: u.x };
  if (n.y < 0) n = { x: -n.x, y: -n.y };
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  let s = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${INK};stroke-width:2.2"/>`;
  for (let d = 0; d < len; d += 8) {
    const cx = p1.x + u.x * d;
    const cy = p1.y + u.y * d;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + n.x * 7}" y2="${cy + n.y * 7}" style="stroke:${SOFT};stroke-width:1.2"/>`;
  }
  return s;
}

function merdivenSkin(p1: Nokta2D, p2: Nokta2D): string {
  const u = birimVektor(p1, p2);
  const n = { x: -u.y, y: u.x };
  const off = 4;
  const r1a = { x: p1.x + n.x * off, y: p1.y + n.y * off };
  const r1b = { x: p2.x + n.x * off, y: p2.y + n.y * off };
  const r2a = { x: p1.x - n.x * off, y: p1.y - n.y * off };
  const r2b = { x: p2.x - n.x * off, y: p2.y - n.y * off };
  let s = `<line x1="${r1a.x}" y1="${r1a.y}" x2="${r1b.x}" y2="${r1b.y}" style="stroke:${LINE};stroke-width:1.6"/>`;
  s += `<line x1="${r2a.x}" y1="${r2a.y}" x2="${r2b.x}" y2="${r2b.y}" style="stroke:${LINE};stroke-width:1.6"/>`;
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  for (let d = 6; d < len; d += 12) {
    const cx = p1.x + u.x * d;
    const cy = p1.y + u.y * d;
    const a = { x: cx + n.x * off, y: cy + n.y * off };
    const b = { x: cx - n.x * off, y: cy - n.y * off };
    s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="stroke:${LINE};stroke-width:1.1"/>`;
  }
  return s;
}

function golgeSkin(p1: Nokta2D, p2: Nokta2D): string {
  return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${SOFT};stroke-width:5;stroke-dasharray:1,3;stroke-linecap:round"/>`;
}

function kopruSkin(p1: Nokta2D, p2: Nokta2D): string {
  let s = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${INK};stroke-width:2.4"/>`;
  s += `<line x1="${p1.x}" y1="${p1.y}" x2="${p1.x}" y2="${p1.y + 14}" style="stroke:${INK};stroke-width:1.6"/>`;
  s += `<line x1="${p2.x}" y1="${p2.y}" x2="${p2.x}" y2="${p2.y + 14}" style="stroke:${INK};stroke-width:1.6"/>`;
  return s;
}

function halatSkin(p1: Nokta2D, p2: Nokta2D): string {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2 + 10;
  return `<path d="M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}" fill="none" style="stroke:${INK};stroke-width:1.6"/>`;
}

function direkKenarSkin(p1: Nokta2D, p2: Nokta2D): string {
  const top = p1.y < p2.y ? p1 : p2;
  const bottom = p1.y < p2.y ? p2 : p1;
  return (
    `<line x1="${bottom.x}" y1="${bottom.y}" x2="${top.x}" y2="${top.y}" style="stroke:${INK};stroke-width:2.4"/>` +
    `<circle cx="${top.x}" cy="${top.y}" r="2.6" fill="${INK}"/>`
  );
}

function direkNoktaSkin(p: Nokta2D, yukseklik = 70): string {
  const topY = p.y - yukseklik;
  return (
    `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${topY}" style="stroke:${INK};stroke-width:2.4"/>` +
    `<circle cx="${p.x}" cy="${topY}" r="2.6" fill="${INK}"/>`
  );
}

function binaNoktaSkin(p: Nokta2D, genislik = 34, yukseklik = 54): string {
  const x = p.x - genislik / 2;
  const y = p.y - yukseklik;
  let s = `<rect x="${x}" y="${y}" width="${genislik}" height="${yukseklik}" fill="#FFFFFF" style="stroke:${INK};stroke-width:1.6"/>`;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      s += `<rect x="${x + 6 + c * 14}" y="${y + 8 + r * 20}" width="8" height="8" fill="none" style="stroke:${LINE};stroke-width:1"/>`;
    }
  }
  return s;
}

function catiNoktaSkin(p: Nokta2D, genislik = 40, yukseklik = 22): string {
  const lx = p.x - genislik / 2;
  const rx = p.x + genislik / 2;
  const apexY = p.y - yukseklik;
  return `<polyline points="${lx},${p.y} ${p.x},${apexY} ${rx},${p.y}" fill="none" style="stroke:${INK};stroke-width:1.8"/>`;
}

/**
 * Kenar-tabanlı çatı derisi — canlı üretimde görüldü (2026-08-25, job
 * MENAR-GEO1011): model "çatı kolu AC/AB" gibi bir çatı YAMACINI kenar
 * olarak modelledi (nokta değil) — nokta-tabanlı catiNoktaSkin bunu
 * eşleştiremiyordu, öğe sessizce atlanıyordu. Kiremit çentikleri her zaman
 * çatının DIŞ/üst yüzeyine (zeminden uzağa) düşsün diye normal yukarı
 * (n.y<0) olacak şekilde çevrilir — zeminSkin'in tam tersi yönde.
 */
function catiKenarSkin(p1: Nokta2D, p2: Nokta2D): string {
  const u = birimVektor(p1, p2);
  let n = { x: -u.y, y: u.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  let s = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${INK};stroke-width:2.4"/>`;
  for (let d = 4; d < len; d += 9) {
    const cx = p1.x + u.x * d;
    const cy = p1.y + u.y * d;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + n.x * 6}" y2="${cy + n.y * 6}" style="stroke:${LINE};stroke-width:1.1"/>`;
  }
  return s;
}

function tekerlekNoktaSkin(p: Nokta2D, r = 16): string {
  let s = `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#FFFFFF" style="stroke:${INK};stroke-width:1.8"/>`;
  for (const derece of [0, 60, 120]) {
    const rad = (derece * Math.PI) / 180;
    const dx = r * Math.cos(rad);
    const dy = r * Math.sin(rad);
    s += `<line x1="${p.x - dx}" y1="${p.y - dy}" x2="${p.x + dx}" y2="${p.y + dy}" style="stroke:${LINE};stroke-width:1"/>`;
  }
  return s;
}

function agacNoktaSkin(p: Nokta2D, yukseklik = 40): string {
  const topY = p.y - yukseklik;
  return (
    `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${topY + 14}" style="stroke:#6B4A2B;stroke-width:2.4"/>` +
    `<circle cx="${p.x}" cy="${topY}" r="14" fill="${SOFT}" style="stroke:${LINE};stroke-width:1.2"/>`
  );
}

/**
 * İlk taslakta bacaklar (kalça→zemin) gövdeye (baş altı→kalça) göre çok
 * kısaydı (6px'e karşı 20px) — küçük ölçekte "insan" değil bir "balon-çubuk"
 * gibi okunuyordu (lokal render testinde görüldü). Tuvalet levhası tarzı bir
 * piktogram oranı: kalça göbekten aşağı yaklaşık %38'te, kollar omuzdan
 * hafif aşağı-yana açılı, bacaklar kalçadan zemine kadar TAM uzunlukta.
 */
function kisiSiluetiNoktaSkin(p: Nokta2D, yukseklik = 32): string {
  const headR = 4;
  const headCY = p.y - yukseklik + headR;
  const shoulderY = headCY + headR + 2;
  const hipY = p.y - yukseklik * 0.38;
  return (
    `<circle cx="${p.x}" cy="${headCY}" r="${headR}" fill="${INK}"/>` +
    `<line x1="${p.x}" y1="${shoulderY}" x2="${p.x}" y2="${hipY}" style="stroke:${INK};stroke-width:2"/>` +
    `<line x1="${p.x}" y1="${shoulderY}" x2="${p.x - 6}" y2="${shoulderY + 8}" style="stroke:${INK};stroke-width:1.8"/>` +
    `<line x1="${p.x}" y1="${shoulderY}" x2="${p.x + 6}" y2="${shoulderY + 8}" style="stroke:${INK};stroke-width:1.8"/>` +
    `<line x1="${p.x}" y1="${hipY}" x2="${p.x - 5}" y2="${p.y}" style="stroke:${INK};stroke-width:2"/>` +
    `<line x1="${p.x}" y1="${hipY}" x2="${p.x + 5}" y2="${p.y}" style="stroke:${INK};stroke-width:2"/>`
  );
}

function saatKadraniNoktaSkin(p: Nokta2D, r = 20): string {
  let s = `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#FFFFFF" style="stroke:${INK};stroke-width:1.8"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const x1 = p.x + (r - 3) * Math.sin(a);
    const y1 = p.y - (r - 3) * Math.cos(a);
    const x2 = p.x + r * Math.sin(a);
    const y2 = p.y - r * Math.cos(a);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${LINE};stroke-width:1"/>`;
  }
  return s;
}

const KENAR_SKIN_CIZICI: Partial<Record<BaglamSahnesiElemani["tur"], (p1: Nokta2D, p2: Nokta2D) => string>> = {
  DUVAR: duvarSkin,
  ZEMIN: zeminSkin,
  RAMPA: zeminSkin,
  MERDIVEN: merdivenSkin,
  GOLGE: golgeSkin,
  CATI: catiKenarSkin,
  KOPRU: kopruSkin,
  HALAT: halatSkin,
  DIREK: direkKenarSkin,
};

const NOKTA_SKIN_CIZICI: Partial<Record<BaglamSahnesiElemani["tur"], (p: Nokta2D) => string>> = {
  DIREK: direkNoktaSkin,
  BINA: binaNoktaSkin,
  CATI: catiNoktaSkin,
  TEKERLEK: tekerlekNoktaSkin,
  AGAC: agacNoktaSkin,
  KISI_SILUETI: kisiSiluetiNoktaSkin,
  SAAT_KADRANI: saatKadraniNoktaSkin,
};

function kenarAnahtari(nokta1: string, nokta2: string): string {
  return [nokta1, nokta2].sort().join("|");
}

function buildGeometriSvg(
  geo: GeoNokta[],
  olcekliCizim: boolean,
  W: number,
  kenarlar?: GeoKenar[] | null,
  esitGruplar?: KenarUc[][] | null,
  acilar?: GeoAci[] | null,
  baglamElemanlari?: BaglamSahnesiElemani[] | null
): SvgAsset {
  const pad = 30;
  const xs = geo.map((p) => Number(p.x));
  const ys = geo.map((p) => Number(p.y));
  const yRange = Math.max(...ys) - Math.min(...ys);
  // Şekil neredeyse TEK BOYUTLU ise (ör. tüm noktalar aynı y'de — yatay bir
  // kuvvet/vektör diyagramı, bkz. VEKTÖR/KUVVET OKU kuralı) sabit 240px'lik
  // kanvas kullanmak kanvasın büyük kısmını boş bırakır (canlı testte
  // görüldü, job MENAR-FIZ924-20260905125513: 240px'lik alanın yalnız alt
  // ~30px'i doluydu). Bu durumda daha kompakt bir kanvas kullan.
  const H = yRange === 0 ? 90 : 240;
  const sx = (W - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1);
  const sy = (H - 2 * pad) / (yRange || 1);
  const sc = Math.min(sx, sy);
  const PX = (v: number) => pad + (v - Math.min(...xs)) * sc;
  const PY = (v: number) => H - pad - (v - Math.min(...ys)) * sc;

  const byAd = new Map<string, { x: number; y: number }>();
  geo.forEach((p) => {
    if (p.ad) byAd.set(p.ad, { x: PX(Number(p.x)), y: PY(Number(p.y)) });
  });

  const kenarListesi: GeoKenar[] =
    kenarlar && kenarlar.length
      ? kenarlar
      : geo.map((p, i) => ({
          uclar: { nokta1: String(geo[i]?.ad ?? ""), nokta2: String(geo[(i + 1) % geo.length]?.ad ?? "") },
        }));

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;

  // Kenar-tabanlı sahne derisi: ilgili kenarın düz çizgisinin YERİNE geçer
  // (aynı segmenti iki kez, biri düz biri "giydirilmiş" çizmemek için).
  const kenarSkinleri = new Map<string, string>();
  (baglamElemanlari ?? []).forEach((el) => {
    if (!el.kenar) return;
    const cizici = KENAR_SKIN_CIZICI[el.tur];
    const p1 = byAd.get(el.kenar.nokta1);
    const p2 = byAd.get(el.kenar.nokta2);
    if (!cizici || !p1 || !p2) return;
    kenarSkinleri.set(kenarAnahtari(el.kenar.nokta1, el.kenar.nokta2), cizici(p1, p2));
  });

  kenarListesi.forEach((k) => {
    const p1 = byAd.get(k.uclar.nokta1);
    const p2 = byAd.get(k.uclar.nokta2);
    if (!p1 || !p2) return;
    const skin = kenarSkinleri.get(kenarAnahtari(k.uclar.nokta1, k.uclar.nokta2));
    if (skin) {
      s += skin;
      return;
    }
    const dash = k.stil === "KESIKLI" ? ' stroke-dasharray="4,3"' : "";
    s += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${LINE};stroke-width:1.6"${dash}/>`;
    if (k.ok === "NOKTA2" || k.ok === "IKI_UC") s += okUcuUcgeni(p2, birimVektor(p1, p2));
    if (k.ok === "NOKTA1" || k.ok === "IKI_UC") s += okUcuUcgeni(p1, birimVektor(p2, p1));
    if (k.etiket) {
      const orta = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const yon = birimVektor(p1, p2);
      const perp = { x: -yon.y, y: yon.x };
      const lx = orta.x + perp.x * 11;
      const ly = orta.y + perp.y * 11;
      s += `<text x="${lx}" y="${ly}" text-anchor="middle" style="font-family:${FONT};font-size:8px;fill:${INK}">${esc(tr(k.etiket))}</text>`;
    }
  });

  // Kenar listesinde YER ALMAYAN sahne derisi öğeleri (ör. ana çokgene
  // bağlı olmayan ayrı bir GOLGE segmenti) ayrıca çizilir.
  (baglamElemanlari ?? []).forEach((el) => {
    if (!el.kenar) return;
    const anahtar = kenarAnahtari(el.kenar.nokta1, el.kenar.nokta2);
    const zatenCizildi = kenarListesi.some((k) => kenarAnahtari(k.uclar.nokta1, k.uclar.nokta2) === anahtar);
    if (zatenCizildi) return;
    const cizici = KENAR_SKIN_CIZICI[el.tur];
    const p1 = byAd.get(el.kenar.nokta1);
    const p2 = byAd.get(el.kenar.nokta2);
    if (cizici && p1 && p2) s += cizici(p1, p2);
  });

  // Nokta-tabanlı sahne derisi öğeleri (BINA/CATI/TEKERLEK/AGAC/
  // KISI_SILUETI/SAAT_KADRANI, veya tek noktadan yükselen DIREK) — noktaların
  // kendi işaret/etiketinden ÖNCE çizilir ki nokta adı üstte okunur kalsın.
  (baglamElemanlari ?? []).forEach((el) => {
    if (!el.nokta || el.kenar) return;
    const cizici = NOKTA_SKIN_CIZICI[el.tur];
    const p = byAd.get(el.nokta);
    if (cizici && p) s += cizici(p);
  });

  (esitGruplar ?? []).forEach((grup, gi) => {
    grup.forEach(({ nokta1, nokta2 }) => {
      const p1 = byAd.get(nokta1);
      const p2 = byAd.get(nokta2);
      if (p1 && p2) s += esitIsaretleri(p1, p2, gi + 1);
    });
  });

  // Aynı köşede birden fazla açı paylaşılabiliyor (iç içe açılar — canlı
  // modda görüldü, job MENAR-GEO1011-20260825193126: C köşesinde hem ACB
  // hem ACD açısı aynı sabit 16px yayda çakışıp iki etiket üst üste bindi,
  // okunaksız çıktı). Aynı köşedeki her sonraki açı için yayı büyüt ki
  // iç içe açılar farklı yarıçapta, birbirinden ayrı okunur kalsın.
  const aciSayaci = new Map<string, number>();
  (acilar ?? []).forEach((ac) => {
    const V = byAd.get(ac.kose);
    const P1 = byAd.get(ac.kenar1);
    const P2 = byAd.get(ac.kenar2);
    if (!V || !P1 || !P2) return;
    if (ac.dik_aci) {
      s += dikAciKaresi(V, P1, P2, 8);
      return;
    }
    const siraNo = aciSayaci.get(ac.kose) ?? 0;
    aciSayaci.set(ac.kose, siraNo + 1);
    const r = 16 + siraNo * 10;
    // Etiket mesafesi yay yarıçapından çok daha agresif artar — nested açı
    // açıklıkları birbirine yakınsa (bkz. yukarıdaki not) yalnız yayı büyütmek
    // yetmiyor, uzun metinli etiketler (ör. "tan α = 3/4") hâlâ çakışıyordu.
    const labelOffset = 13 + siraNo * 30;
    const yay = aciYayi(V, P1, P2, r, labelOffset);
    s += `<path d="M ${yay.sx} ${yay.sy} A ${r} ${r} 0 ${yay.largeArc} ${yay.sweep} ${yay.ex} ${yay.ey}" fill="none" style="stroke:${ACC};stroke-width:1"/>`;
    if (ac.deger) {
      s += `<text x="${yay.labelX}" y="${yay.labelY}" text-anchor="middle" style="font-family:${FONT};font-size:8px;fill:${ACC}">${esc(tr(ac.deger))}</text>`;
    }
  });

  geo.forEach((p) => {
    const px = PX(Number(p.x));
    const py = PY(Number(p.y));
    s += `<circle cx="${px}" cy="${py}" r="2.2" fill="${INK}"/>`;
    s += `<text x="${px + 5}" y="${py - 5}" style="font-family:${FONT};font-size:8.5px;fill:${INK}">${esc(p.ad ?? "")}</text>`;
  });

  if (!olcekliCizim) {
    s += `<text x="${W - 4}" y="${H - 4}" text-anchor="end" style="font-family:${FONT};font-size:6.5px;fill:#4B5563">Şekil temsili olup ölçekli çizilmemiştir.</text>`;
  }
  s += "</svg>";
  return { name: "08_Teknik_Cizim.svg", svg: s, tur: "GEOMETRİ" };
}

type NesneSemasi = {
  toplam_sayi: number;
  indeks_etiketleri?: string[] | null;
  isaretli_indeksler?: number[] | null;
  isaret_aciklamasi?: string | null;
};

/**
 * `gorsel_veri_gosterimi=NESNE_INDEKSI`'nin (AI fotoğrafına indeks
 * yazdırma) deterministik yerine geçeni — bkz. 03-generator-schema.ts
 * NesneSemasiSchema yorumu. N kutuyu tek sırada (taşarsa satır kırarak)
 * numaralarıyla çizer; isaretli_indeksler'de listelenenler ayrı renkte
 * (ACC dolgu) vurgulanır. Kod tarafında üretildiği için set bütünlüğü
 * (eksik/tekrar numara) YAPISAL OLARAK imkansız — AI görsel modelinin asla
 * güvenilir çözemediği bir görevi tamamen ortadan kaldırır.
 */
function buildNesneSemasiSvg(sema: NesneSemasi, W: number): SvgAsset {
  const n = Math.max(2, Math.min(12, Math.round(sema.toplam_sayi)));
  const etiketler = sema.indeks_etiketleri?.length === n ? sema.indeks_etiketleri : Array.from({ length: n }, (_, i) => String(i + 1));
  const isaretli = new Set(sema.isaretli_indeksler ?? []);
  const box = 34;
  const gap = 10;
  const perRow = Math.max(1, Math.min(n, Math.floor((W - 20) / (box + gap))));
  const rows = Math.ceil(n / perRow);
  const rowWidth = perRow * box + (perRow - 1) * gap;
  const startX = Math.max(10, (W - rowWidth) / 2);
  const captionH = sema.isaret_aciklamasi ? 18 : 0;
  const top = 6 + captionH;
  const H = top + rows * box + (rows - 1) * gap + 10;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;
  if (sema.isaret_aciklamasi) {
    s += `<rect x="1" y="4" width="3" height="12" fill="${ACC}"/>`;
    s += `<text x="10" y="14" style="font-family:${FONT};font-size:9.5px;fill:${LINE};letter-spacing:.04em">${esc(sema.isaret_aciklamasi)}</text>`;
  }
  for (let i = 0; i < n; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = startX + col * (box + gap);
    const y = top + row * (box + gap);
    const marked = isaretli.has(i + 1);
    s += `<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="3" fill="${marked ? ACC : "#FFFFFF"}" style="stroke:${LINE};stroke-width:1.4"/>`;
    s += `<text x="${x + box / 2}" y="${y + box / 2 + 4}" text-anchor="middle" style="font-family:${FONT};font-size:13px;font-weight:bold;fill:${marked ? "#FFFFFF" : INK}">${esc(etiketler[i] ?? String(i + 1))}</text>`;
  }
  s += "</svg>";
  return { name: "10_Nesne_Semasi.svg", svg: s, tur: "ŞEMA" };
}

/** node "40 - Bağlam Görseli Gerekli mi" + "41 - VERİ KATMANI: Tablo/Grafik SVG"nin portu. */
type KonusmaBaloncugu = { konusmaci: string; metin: string; yon?: "SOL" | "SAG" | null };

/**
 * Bağlam temelli sorularda (özellikle TDE, ileride Tarih/Coğrafya/Din/
 * Felsefe) iki+ kişi arasındaki konuşmayı göstermek için (kullanıcı isteği,
 * 2026-09-14/16) — AI illüstrasyonu (bkz. 16-gorsel-prompt.ts) BAŞARISIZ
 * olursa devreye giren TEK, sabit deterministik yedek: kuyruklu klasik
 * çizgi roman balonu, ad kuyruğun altında. Diyalog metni koddan çizilir
 * (SVG kendi kendine metin sarmadığı için `wrapText`/`textWidthPx`
 * kullanılır) — AI'dan hiç geçmez, TABLO/GRAFİK'teki AYNI güven modeli.
 * Kullanıcı önceki turda 3 farklı stil istemişti ("hepsini ekleyebiliriz"),
 * sonra "stilin hepsi aynı olsun" diyerek TEK stile indirgedi — SOHBET_
 * UYGULAMASI/SADE_ETIKET dalları bu yüzden KALDIRILDI (ölü kod bırakılmadı).
 */
function buildKonusmaSvg(baloncuklar: KonusmaBaloncugu[], W: number): SvgAsset {
  const FONT_SIZE = 11;
  const LINE_H = 14;
  const PAD_X = 14;
  const PAD_Y = 10;
  const GAP = 14;
  const TAIL_H = 10;
  const NAME_H = 14;
  const MAX_BUBBLE_W = Math.round(W * 0.68);

  const gecici = baloncuklar.map((b, i) => {
    const sol = b.yon ? b.yon === "SOL" : i % 2 === 0;
    const lines = wrapText(b.metin, MAX_BUBBLE_W - PAD_X * 2, FONT_SIZE);
    const naturalW = Math.max(...lines.map((l) => textWidthPx(l, FONT_SIZE)), textWidthPx(b.konusmaci, FONT_SIZE));
    const boxW = Math.min(MAX_BUBBLE_W, naturalW + PAD_X * 2);
    const boxH = PAD_Y * 2 + lines.length * LINE_H;
    return { ad: b.konusmaci, lines, sol, boxW, boxH };
  });

  const tops: number[] = [];
  let y = 8;
  for (const g of gecici) {
    tops.push(y);
    y += g.boxH + TAIL_H + NAME_H + GAP;
  }
  const H = y - GAP + 8;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>`;

  gecici.forEach((g, i) => {
    const top = tops[i]!;
    const x = g.sol ? 4 : W - g.boxW - 4;
    const renk = g.sol ? LINE : ACC;

    // Kuyruk ÖNCE (arkada), balon gövdesi ÜSTÜNE binerek kuyruk-gövde
    // ekini gizler; ad, kuyruğun altında ayrı bir satırda.
    const boxTop = top;
    const tailBaseY = boxTop + g.boxH - 1;
    const tailX = g.sol ? x + g.boxW * 0.28 : x + g.boxW * 0.72;
    s += `<polygon points="${tailX - 6},${tailBaseY} ${tailX + 6},${tailBaseY} ${tailX + (g.sol ? -2 : 2)},${tailBaseY + TAIL_H}" fill="#FFFFFF" style="stroke:${renk};stroke-width:1.6"/>`;
    s += `<rect x="${x}" y="${boxTop}" width="${g.boxW}" height="${g.boxH}" rx="${Math.min(18, g.boxH / 2.2)}" fill="#FFFFFF" style="stroke:${renk};stroke-width:1.6"/>`;
    g.lines.forEach((line, li) => {
      s += `<text x="${x + g.boxW / 2}" y="${boxTop + PAD_Y + LINE_H * li + 10}" text-anchor="middle" style="font-family:${FONT};font-size:${FONT_SIZE}px;fill:${INK}">${esc(line)}</text>`;
    });
    s += `<text x="${g.sol ? x : x + g.boxW}" y="${tailBaseY + TAIL_H + 12}" text-anchor="${g.sol ? "start" : "end"}" style="font-family:${FONT};font-size:9.5px;font-weight:bold;fill:${renk};letter-spacing:.03em">${esc(g.ad.toLocaleUpperCase("tr-TR"))}</text>`;
  });

  s += "</svg>";
  return { name: "11_Konusma_Baloncuklari.svg", svg: s, tur: "KONUŞMA" };
}

export function buildVeriKatmani(input: JobInput, aday: GeneratorOutput): VeriKatmaniSonuc {
  const man = aday.gorsel_veri_manifesti;
  const vk = aday.veri_katmani ?? {};
  const W = genislikSinifi(input.genislik) === "DAR" ? 241 : 524;
  const assets: SvgAsset[] = [];

  const tab = man.tablo;
  if (vk.gerekli && (vk.tur === "TABLO" || (tab?.headers ?? []).length)) {
    assets.push(buildTabloSvg(tab ?? {}, W));
  }

  const seri = man.grafik_serisi;
  if (vk.gerekli && seri && Array.isArray(seri.noktalar) && seri.noktalar.length) {
    assets.push(buildGrafikSvg(seri, W));
  }

  const geo = man.geometrik_noktalar;
  if (vk.gerekli && Array.isArray(geo) && geo.length >= 3) {
    // Eskiden veri_katmani_etiketleri de köşede ayrı bir metin listesi olarak
    // basılıyordu — nokta adları ve açı değerleri artık geometrik_acilar/
    // geometrik_noktalar sayesinde ZATEN şeklin ÜZERİNDE çiziliyor, bu ayrı
    // liste tamamen aynı bilgiyi tekrarlayan, görsel olarak kopuk/etiketsiz
    // bir "ikinci bölüm" izlenimi veriyordu (canlı modda görüldü, kullanıcı
    // "iki ayrı bölüme mi ayrılmış" diye sordu). Kaldırıldı.
    assets.push(
      buildGeometriSvg(
        geo,
        Boolean(man.olcekli_cizim),
        W,
        man.geometrik_kenarlar as GeoKenar[] | null | undefined,
        man.geometrik_esit_kenar_gruplari as KenarUc[][] | null | undefined,
        man.geometrik_acilar as GeoAci[] | null | undefined,
        man.baglam_sahnesi_elemanlari as BaglamSahnesiElemani[] | null | undefined
      )
    );
  }

  const sema = man.nesne_semasi;
  if (vk.gerekli && vk.tur === "NESNE_SEMASI" && sema && sema.toplam_sayi >= 2) {
    assets.push(buildNesneSemasiSvg(sema, W));
  }

  const konusma = man.konusma_baloncuklari;
  if (vk.gerekli && vk.tur === "KONUSMA" && Array.isArray(konusma) && konusma.length >= 2) {
    // Bu SVG yalnız AI illüstrasyonu (bkz. 16-gorsel-prompt.ts, her zaman
    // önce denenir) BAŞARISIZ olursa görünen tek, sabit YEDEKtir (bkz.
    // types.ts, run.ts'in yalnizca_gorsel_yedegi filtrelemesi).
    assets.push(buildKonusmaSvg(konusma, W));
  }

  const gorselGerekli = Boolean(aday.baglam_katmani?.gerekli) && input.gorselKarari !== "GORSEL_YOK";
  return { assets, gorselGerekli };
}
