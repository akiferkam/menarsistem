import type { GeneratorOutput } from "./03-generator-schema.js";
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
type GeoKenar = { uclar: KenarUc; stil?: "DUZ" | "KESIKLI" | null };
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

function aciYayi(V: { x: number; y: number }, P1: { x: number; y: number }, P2: { x: number; y: number }, r: number) {
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
  const labelX = V.x + (r + 13) * Math.cos(midA);
  const labelY = V.y + (r + 13) * Math.sin(midA);
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

function buildGeometriSvg(
  geo: GeoNokta[],
  olcekliCizim: boolean,
  W: number,
  kenarlar?: GeoKenar[] | null,
  esitGruplar?: KenarUc[][] | null,
  acilar?: GeoAci[] | null
): SvgAsset {
  const H = 240;
  const pad = 30;
  const xs = geo.map((p) => Number(p.x));
  const ys = geo.map((p) => Number(p.y));
  const sx = (W - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1);
  const sy = (H - 2 * pad) / (Math.max(...ys) - Math.min(...ys) || 1);
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

  kenarListesi.forEach((k) => {
    const p1 = byAd.get(k.uclar.nokta1);
    const p2 = byAd.get(k.uclar.nokta2);
    if (!p1 || !p2) return;
    const dash = k.stil === "KESIKLI" ? ' stroke-dasharray="4,3"' : "";
    s += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" style="stroke:${LINE};stroke-width:1.6"${dash}/>`;
  });

  (esitGruplar ?? []).forEach((grup, gi) => {
    grup.forEach(({ nokta1, nokta2 }) => {
      const p1 = byAd.get(nokta1);
      const p2 = byAd.get(nokta2);
      if (p1 && p2) s += esitIsaretleri(p1, p2, gi + 1);
    });
  });

  (acilar ?? []).forEach((ac) => {
    const V = byAd.get(ac.kose);
    const P1 = byAd.get(ac.kenar1);
    const P2 = byAd.get(ac.kenar2);
    if (!V || !P1 || !P2) return;
    if (ac.dik_aci) {
      s += dikAciKaresi(V, P1, P2, 8);
      return;
    }
    const yay = aciYayi(V, P1, P2, 16);
    s += `<path d="M ${yay.sx} ${yay.sy} A 16 16 0 ${yay.largeArc} ${yay.sweep} ${yay.ex} ${yay.ey}" fill="none" style="stroke:${ACC};stroke-width:1"/>`;
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
export function buildVeriKatmani(input: JobInput, aday: GeneratorOutput): VeriKatmaniSonuc {
  const man = aday.gorsel_veri_manifesti;
  const vk = aday.veri_katmani ?? {};
  const W = input.genislik === "85_MM" ? 241 : 524;
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
        man.geometrik_acilar as GeoAci[] | null | undefined
      )
    );
  }

  const sema = man.nesne_semasi;
  if (vk.gerekli && vk.tur === "NESNE_SEMASI" && sema && sema.toplam_sayi >= 2) {
    assets.push(buildNesneSemasiSvg(sema, W));
  }

  const gorselGerekli = Boolean(aday.baglam_katmani?.gerekli) && input.gorselKarari !== "GORSEL_YOK";
  return { assets, gorselGerekli };
}
