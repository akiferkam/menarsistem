import type { InddDizgi } from "../pipeline/21-dizgi.js";
import type { BaglamGorseliSonuc, SvgAsset } from "../pipeline/types.js";

/**
 * Bu dosya bir n8n node'unun portu değil — kaynakta (ne workflow'da ne
 * V25 HTML'de) otomatik bir sayfa önizlemesi yok. İlk sürüm InDesign
 * hassasiyetinde el yapımı bir SVG matematik dizgisi deniyordu, sonra
 * kullanıcı isteğiyle salt tarayıcı-metin-akışlı, düz siyah-beyaz bir
 * sürüme indirgendi ("ilk aşamada indesign formatlarına gerek yok").
 * Bu üçüncü sürüm kullanıcının kendi örnek soru PDF'lerinden (`example/`)
 * çıkarılan görsel dilin (sans-serif gövde, renkli rozet/başlık şeritleri,
 * renkli tablo başlıkları) izini sürer — ama font/renk paleti icat
 * edilmedi: `14-veri-katmani.ts`'in SVG veri katmanında zaten kullanılan
 * Swis721 BT + INK/LINE/SOFT/ACC paleti buraya da taşındı, ki gömülü SVG
 * tablo/grafikler sayfanın geri kalanıyla görsel olarak tek bir sistem
 * gibi dursun. `<KESIR>`/`<KOK>`/`<US>`/`<ALT>` etiketleri hâlâ okunabilir
 * düz metne (Unicode üst/alt simge) çevriliyor; `22-indd-paket.ts`teki
 * gerçek InDesign paketi bundan etkilenmez, etiketler orada değişmeden
 * kalır.
 */

const FONT = "Swis721 BT, Arial, sans-serif";
const INK = "#111111";
const LINE = "#123E6B";
const SOFT = "#E8EDF3";
const ACC = "#B45309";

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ",
};
const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", o: "ₒ", x: "ₓ", h: "ₕ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", p: "ₚ", s: "ₛ", t: "ₜ",
};

function toScript(s: string, map: Record<string, string>, fallbackWrap: "^" | "_"): string {
  const mapped = [...s].map((c) => map[c.toLowerCase()]);
  if (mapped.every((c): c is string => c !== undefined)) return mapped.join("");
  return `${fallbackWrap}${s}`;
}

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** node 70'in `<KESIR>`/`<KOK>`/`<US>`/`<ALT>` etiketlerini basit, okunabilir düz metne çevirir. */
export function simplifyMathTags(s: string): string {
  return s
    .replace(/<KESIR>([^<]*)<\/KESIR>/g, (_, g: string) => {
      const [pay = "", payda = ""] = g.split(";");
      return `${pay}/${payda}`;
    })
    .replace(/<KOK\s+derece="3">([^<]*)<\/KOK>/g, (_, g: string) => `∛${g}`)
    .replace(/<KOK>([^<]*)<\/KOK>/g, (_, g: string) => `√${g}`)
    .replace(/<US>([^<]*)<\/US>/g, (_, g: string) => {
      const [taban = "", us = ""] = g.split(";");
      return taban + toScript(us, SUPERSCRIPT, "^");
    })
    .replace(/<ALT>([^<]*)<\/ALT>/g, (_, g: string) => {
      const [taban = "", indis = ""] = g.split(";");
      return taban + toScript(indis, SUBSCRIPT, "_");
    });
}

/**
 * Generator `<US>` etiket DSL'ini değil, ham "x^(n+2)" / "x^k" karet gösterimini
 * kullanıyor (bkz. 02-build-prompt.ts "Üs için: ... diğerlerinde ^ kullan") —
 * `simplifyMathTags` bunu hiç görmüyordu, önizleme PNG'sinde literal "^" kalıyordu.
 * Unicode üst simge KARAKTERLERİ yerine gerçek `<sup>` etiketi kullanılır: cebirsel
 * üsler (n+2, 2n−1, k gibi harf/işaret içeren ifadeler) Unicode üst simge blokunda
 * karşılığı olmayabiliyor, ayrıca fontların üst simge kapsamı tutarsız olduğu için
 * Unicode karakterler gövde metninden FARKLI bir fonta düşüp göze batıyordu
 * (kullanıcı: "font problemleri oluyor"). `<sup>` aynı fontu kullanır, hiçbir
 * karakter kümesiyle sınırlı değildir. Bu fonksiyon `esc()`ten SONRA çağrılmalı —
 * regex yalnız escape'ten etkilenmeyen karakterleri (harf/rakam/+/-/−/parantez)
 * eşleştirir, HTML enjeksiyonu riski yoktur.
 */
function expandCaretUs(escapedHtml: string): string {
  return escapedHtml.replace(/\^(\(([^()]+)\)|([A-Za-z0-9+\-−]+))/g, (_, __, parenIci?: string, ciplak?: string) => {
    const ic = parenIci ?? ciplak ?? "";
    return `<sup>${ic}</sup>`;
  });
}

/** Bir dizgi satırının nihai gösterime hazır hâli: etiket DSL'i → escape → karet üsler. */
function disp(text: string): string {
  return expandCaretUs(esc(simplifyMathTags(text)));
}

interface EmbeddedVisual {
  kind: "photo" | "asset";
  html: string;
}

function embedRow(text: string, svgAssets: SvgAsset[], baglamGorseli: BaglamGorseliSonuc): EmbeddedVisual | null {
  const svgMatch = svgAssets.find((a) => text.includes(`YERLEŞTİR: ${a.name}`));
  if (svgMatch) return { kind: "asset", html: `<div class="asset">${svgMatch.svg}</div>` };

  if (
    baglamGorseli.kullanildi &&
    baglamGorseli.contextImageFilename &&
    baglamGorseli.imageBase64 &&
    text.includes(`YERLEŞTİR: ${baglamGorseli.contextImageFilename}`)
  ) {
    return {
      kind: "photo",
      html: `<div class="photo-card"><img class="context-image" src="data:image/png;base64,${baglamGorseli.imageBase64}" alt="Bağlam görseli"></div>`,
    };
  }
  return null;
}

const PAGE_CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:${SOFT};font-family:${FONT};padding:28px 0}
  sup{font-family:inherit;font-size:.68em;line-height:0;vertical-align:.55em}
  .page{background:#fff;margin:0 auto;box-shadow:0 1px 3px rgba(18,62,107,.18);font-size:11.5pt;line-height:1.55;color:${INK};overflow:hidden}
  .header{background:${LINE};color:#fff;padding:10px 12mm;font-weight:700;font-size:11.5pt;letter-spacing:.01em}
  .body{padding:12mm}
  .body p{margin:0 0 10px}
  .soru{display:flex;gap:10px;align-items:flex-start;margin:14px 0 10px}
  .badge{
    flex:none;width:24px;height:24px;border-radius:50%;background:${LINE};color:#fff;
    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;
  }
  .soru-text{padding-top:2px;font-weight:600}
  .photo-card{margin:12px 0;border:1px solid ${SOFT};border-radius:4px;overflow:hidden}
  .photo-card img{display:block;width:100%;height:auto}
  .asset{margin:12px 0}
  .asset svg{width:100%;height:auto;display:block}
  /* Bağlam fotoğrafı + veri tablosu aynı soruya aitse tek bir "sahne + etiket
     plakası" bütünü gibi görünsün (kullanıcı isteği: AI'a yazı çizdirmeden
     görsel bütünlük) — tek çerçeve/gölge, tablo fotoğrafın altına doğrudan
     bitişik "etiket plakası" gibi eklenir. */
  .visual-combo{margin:12px 0;border:1px solid ${LINE};border-radius:4px;overflow:hidden;box-shadow:0 2px 10px rgba(18,62,107,.1)}
  .visual-combo .photo-card{margin:0;border:0;border-radius:0}
  .visual-combo .asset{margin:0;padding:10px 12px 12px;background:#fff;border-top:2px solid ${LINE}}
  .options{display:flex;flex-direction:column;gap:8px;margin:10px 0 4px}
  .option{display:flex;gap:10px;align-items:flex-start}
  .option .badge{background:${SOFT};color:${LINE};font-size:10.5px}
  .options-grid{display:flex;flex-direction:column;gap:8px;margin:10px 0 4px}
  .options-row{display:flex;gap:26px;flex-wrap:wrap}
  .option-inline{white-space:nowrap}
  .option-inline b{color:${LINE};margin-right:2px}
  .not{
    margin-top:14px;padding:8px 10px;background:${SOFT};border-left:3px solid ${ACC};
    color:${ACC};font-weight:700;font-size:9.5pt;border-radius:0 3px 3px 0;
  }
`;

/**
 * `pipeline/21-dizgi.ts`'in `ogrenciRows`u + SVG veri katmanı + bağlam
 * PNG'sinden tek bir HTML önizleme sayfası üretir: yalnızca soru metni ve
 * fotoğrafı okunabilir biçimde birleştirir, InDesign stil eşlemesi veya
 * el yapımı dizgi denemez.
 */
export function renderPagePreviewHtml(dizgi: InddDizgi, svgAssets: SvgAsset[], baglamGorseli: BaglamGorseliSonuc): string {
  const widthMm = dizgi.dizgi.genislik === "85_MM" ? 85 : 185;
  // `ogretmenRows[0]` her zaman "kod — mikro — iq" kunye satırıdır (bkz.
  // 21-dizgi.ts) — öğrenci akışında bu satır yok, ama başlık şeridi için
  // aynı veriyi buradan alıyoruz, ayrıca parametre eklemeye gerek kalmadan.
  const headerText = dizgi.ogretmenRows[0]?.[1] ?? "";

  let body = "";
  let optionBuf: { letter: string; text: string; html: string }[] = [];
  let visualBuf: EmbeddedVisual[] = [];

  // ÖSYM/dershane kitapçık geleneği: 5 seçenek de kısa/sayısal olduğunda
  // (bkz. example/matematik referans PDF'leri) dikey 5 satır yerine "3
  // üstte, 2 altta" iki satırlık kompakt grup kullanılır — dikey yerden
  // tasarruf sağlar. Uzun/cümle şıklarda (ör. fonksiyon dönüşüm açıklaması)
  // bu düzen okunmaz hâle getirir, o yüzden TÜM şıklar kısaysa devreye girer.
  const KISA_SECENEK_ESIGI = 14;
  const flushOptions = () => {
    if (!optionBuf.length) return;
    const kisaMi = optionBuf.length === 5 && optionBuf.every((o) => o.text.length <= KISA_SECENEK_ESIGI);
    if (kisaMi) {
      const satir = (opts: typeof optionBuf) =>
        `<div class="options-row">${opts.map((o) => `<span class="option-inline"><b>${o.letter})</b> ${o.html}</span>`).join("")}</div>`;
      body += `<div class="options-grid">${satir(optionBuf.slice(0, 3))}${satir(optionBuf.slice(3))}</div>`;
    } else {
      body += `<div class="options">${optionBuf
        .map((o) => `<div class="option"><span class="badge">${o.letter}</span><span>${o.html}</span></div>`)
        .join("")}</div>`;
    }
    optionBuf = [];
  };

  // Ardışık gelen görseller (fotoğraf + tablo/SVG) birbirine bitişik yer
  // alıyorsa (aynı soruyla ilgili oldukları anlamına gelir) tek bir
  // "visual-combo" çerçevesinde birleştirilir — bkz. yukarıdaki CSS yorumu.
  // Tek başına gelen bir fotoğraf veya asset eskisiyle birebir aynı görünür.
  const flushVisuals = () => {
    if (!visualBuf.length) return;
    const cesitler = new Set(visualBuf.map((v) => v.kind));
    if (visualBuf.length > 1 && cesitler.has("photo") && cesitler.has("asset")) {
      // 21-dizgi.ts SVG asset'leri bağlam fotoğrafından ÖNCE push eder (kaynak
      // sırası); görsel bütünlük için burada fotoğraf her zaman üstte, etiket
      // plakası (tablo/SVG) altta olacak şekilde yeniden sıralanır — dizgi
      // nesnesinin kendisi (IDML/öğretmen paketi vb. için) değişmez, yalnız
      // bu önizleme sayfasındaki görsel yerleşim etkilenir.
      const sirali = [...visualBuf].sort((a, b) => (a.kind === "photo" ? -1 : b.kind === "photo" ? 1 : 0));
      body += `<div class="visual-combo">${sirali.map((v) => v.html).join("")}</div>`;
    } else {
      body += visualBuf.map((v) => v.html).join("");
    }
    visualBuf = [];
  };

  dizgi.ogrenciRows.forEach(([style, text]) => {
    const embedded = embedRow(text, svgAssets, baglamGorseli);
    if (embedded) {
      flushOptions();
      visualBuf.push(embedded);
      return;
    }
    flushVisuals();

    if (style === dizgi.stiller.secenek) {
      const m = text.match(/^([A-E])\)\s*(.*)$/);
      const letter = m ? (m[1] ?? "") : "";
      const rest = m ? (m[2] ?? "") : text;
      optionBuf.push({ letter, text: rest, html: disp(rest) });
      return;
    }
    flushOptions();

    if (style === dizgi.stiller.kok) {
      const m = text.match(/^(\d+)\.\s*(.*)$/);
      const num = m ? m[1] : "";
      const rest = m ? (m[2] ?? "") : text;
      body += `<div class="soru"><span class="badge">${num}</span><span class="soru-text">${disp(rest)}</span></div>`;
      return;
    }

    if (style === dizgi.stiller.kunye) {
      body += `<p class="not">${disp(text)}</p>`;
      return;
    }

    body += `<p>${disp(text)}</p>`;
  });
  flushOptions();
  flushVisuals();

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>MENAR MAYS — Soru Önizleme</title>
<style>${PAGE_CSS}</style>
</head>
<body>
  <div class="page" style="width:${widthMm}mm">
    <div class="header">${esc(headerText)}</div>
    <div class="body">
${body}
    </div>
  </div>
</body>
</html>
`;
}
