import type { GeneratorOutput } from "./03-generator-schema.js";
import type { CiktiGenisligi, CiktiMotoru, ResolvedJob, SvgAsset } from "./types.js";

const ICML_CIKTILAR: CiktiMotoru[] = ["INDD_RAW_PRO", "INDD_PAKET", "IDML_PAKET"];

/**
 * node "70 - /İNDD -RAW- PRO/ Dizgi"nin portu — MATEMATİK DİZGİ KATMANI +
 * YAYIN METNİ. `<KESIR>pay;payda</KESIR>` · `<KOK>x</KOK>` · `<US>taban;us</US>`
 * · `<ALT>taban;indis</ALT>` etiketleri burada üretilir; gerçek matematik
 * dizgisine dönüşümleri (node 71'in yerleşim notunda da belirtildiği gibi)
 * MENAR Builder/GREP betiğiyle sonradan, elle yapılır — bu aşama yalnız
 * etiketlemeyi üretir.
 */
function dizgi(s: unknown): string {
  let t = String(s ?? "");
  // "2∛4" (katsayı 2, kök içi 4) eskiden `(\d+)∛` ile eşleşip katsayıyı kök
  // İÇİNE alıyordu — kök içi rakam etiketsiz dışarıda kalıp "∛24" gibi
  // anlamsız, birleşmiş bir metne dönüşüyordu (canlı modda görüldü). Katsayı
  // isteğe bağlı bir grup olarak DIŞARIDA, kök içeriği `<KOK>` etiketinin
  // İÇİNDE olacak şekilde tek geçişte doğru eşlenir.
  t = t
    .replace(/(\d+)?\s*√\s*\(([^)]+)\)/g, (_, kat: string | undefined, ic: string) => `${kat ?? ""}<KOK>${ic}</KOK>`)
    .replace(
      /(\d+)?\s*√\s*(\d+(?:[.,]\d+)?|[a-zA-Z])/g,
      (_, kat: string | undefined, ic: string) => `${kat ?? ""}<KOK>${ic}</KOK>`
    );
  t = t
    .replace(
      /(\d+)?\s*∛\s*\(([^)]+)\)/g,
      (_, kat: string | undefined, ic: string) => `${kat ?? ""}<KOK derece="3">${ic}</KOK>`
    )
    .replace(
      /(\d+)?\s*∛\s*(\d+(?:[.,]\d+)?|[a-zA-Z])/g,
      (_, kat: string | undefined, ic: string) => `${kat ?? ""}<KOK derece="3">${ic}</KOK>`
    );
  t = t.replace(/\(([^()\/]{1,24})\)\s*\/\s*\(([^()\/]{1,24})\)/g, "<KESIR>$1;$2</KESIR>");
  t = t.replace(/(?<![\/\d])(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)(?!\/)/g, "<KESIR>$1;$2</KESIR>");
  t = t.replace(/([a-zA-Z0-9\)])\^\{?(-?\d+|[a-zA-Z])\}?/g, "<US>$1;$2</US>");
  t = t.replace(/([a-zA-Z0-9])²/g, "<US>$1;2</US>").replace(/([a-zA-Z0-9])³/g, "<US>$1;3</US>");
  t = t.replace(/([a-zA-Z])_\{?(\w+)\}?/g, "<ALT>$1;$2</ALT>");
  t = t.replace(/(\d)\.(\d)/g, "$1,$2"); // Türkçe ondalık
  return t;
}

/**
 * Model bazen `secenekler[]` metninin içine kendi harf önekini de yazıyor
 * ("A) g(x)=...") — biz zaten her yerde kendi `A)`/`B)`/... önekimizi
 * eklediğimiz için varsa çifte önek oluşuyor (canlı modda görüldü, bkz.
 * proje hafızası). Öneki modelin yazdığı metinden temizler.
 */
export function stripLetterPrefix(s: string): string {
  return s.replace(/^[A-E]\)\s*/, "");
}

function ascii(s: unknown, uygula: boolean): string {
  if (!uygula) return String(s);
  return String(s)
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/Ç/g, "C")
    .replace(/Ğ/g, "G")
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ş/g, "S")
    .replace(/Ü/g, "U");
}

/**
 * node "01_KOD_VE_CEVAP", "M001-soru (P)" vb. — gerçek `.indd` şablonunda
 * (`soru kalıplari_ysyf.indd`) 2026-08-06'da doğrudan ikili taramayla
 * doğrulandı (brief Section 7: "bu isimler eski bir paketten geldi, gerçek
 * .indd ile yeniden doğrulanmalı"). Şablon ayrıca kesir/kök/üs/alt-simge
 * için ayrı karakter stilleri de içeriyor (`01_kesir_ust_n`, `KAREKOK-2`,
 * `INDIS (ALT/UST)` vb.) — ama kaynak node 70/71 bunları hiç kullanmıyor;
 * `<KESIR>`/`<KOK>`/`<US>`/`<ALT>` etiketleri kasıtlı olarak düz metin
 * kalıyor ve node 71'in kendi yerleşim notunun 4. adımında ayrı bir
 * "MENAR Builder / GREP betiği" ile elle gerçek dizgiye çevrilmesi
 * bekleniyor — bu port da aynı sınırı korur, ek stil eşlemesi icat etmez.
 */
const STIL = {
  kunye: "01_KOD_VE_CEVAP",
  lead: "M001-soru (P)",
  blok: "M011-Soru_cizim_ortalama",
  onerme: "M008-soru I.II.III.",
  kok: "M003-soru (B)",
  secenek: "M007-soru tamblok",
} as const;

export interface InddDizgi {
  stilGrubu: string;
  stiller: typeof STIL;
  dizgi: { govdePt: number; baslikPt: number; font: string; genislik: CiktiGenisligi; ascii: boolean };
  ogrenciRows: [string, string][];
  ogretmenRows: [string, string][];
  ogrenciRaw: string;
  ogretmenRaw: string;
}

const raw = (rows: [string, string][]): string => rows.map(([s, t]) => `<${s}>\t${t}`).join("\n");

export function buildDizgi(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  svgAssets: SvgAsset[],
  contextImageFilename: string | null
): InddDizgi {
  const input = resolved.input;
  const asciiIste = /ASCII/i.test(String(input.ekIstek ?? "")) && ICML_CIKTILAR.includes(input.cikti);
  const P = (s: unknown) => ascii(dizgi(s), asciiIste);

  const st = aday.stimulus ?? {};
  const sorular = aday.sorular;
  const harf = ["A", "B", "C", "D", "E"];

  const ogrenci: [string, string][] = [];
  (st.paragraphs ?? []).forEach((p) => ogrenci.push([STIL.lead, P(p)]));
  svgAssets.forEach((a) => ogrenci.push([STIL.blok, `[YERLEŞTİR: ${a.name} — ${a.tur} katmanı]`]));
  if (contextImageFilename) ogrenci.push([STIL.blok, `[YERLEŞTİR: ${contextImageFilename} — bağlam katmanı]`]);
  (st.notes ?? []).forEach((n) => ogrenci.push([STIL.onerme, P(n)]));
  sorular.forEach((q, n) => {
    ogrenci.push([STIL.kok, `${n + 1}. ${P(q.kok)}`]);
    q.secenekler.forEach((o, k) => ogrenci.push([STIL.secenek, `${harf[k]}) ${P(stripLetterPrefix(o))}`]));
    if (q.ogrenme_becerisi) ogrenci.push([STIL.kunye, `Öğrenme Becerisi: ${P(q.ogrenme_becerisi)}`]);
  });
  if (input.cevapGorunurlugu === "ACIK" && input.ciktiModu === "OGRETMEN") {
    ogrenci.push([STIL.kunye, "Cevap: " + sorular.map((q) => q.dogru_secenek).join(" ")]);
  }

  // Kullanıcı isteği (2026-10-01): "Bir Ben Bir Sen" çiftinde hangi sayfanın
  // BEN (örnek, öğretmen çözer) hangisinin SEN (öğrenci çözer) olduğunu
  // üretim/takip tarafında ayırt etmek zor oluyordu — ama bu ETİKET yalnız
  // ÖĞRETMEN künye satırına eklenir (bkz. yukarıdaki `ogrenci` dizisi — orada
  // hiç kod/mikro/iq/rol satırı YOK), öğrenciye hiçbir zaman görünmez ve
  // sorunun İÇERİĞİNE (senaryo/metin) karışmaz — kullanıcının daha önce
  // reddettiği "soru içinde BEN/SEN yazması" ile KARIŞTIRILMAMALI.
  const btbsRolEtiketi = input.mode === "BTBS" ? ` — BİR ${input.btbsRol === "SEN" ? "SEN" : "BEN"}` : "";
  const ogretmen: [string, string][] = [
    [STIL.kunye, `${input.kod} — ${resolved.micro} — ${input.iq}${btbsRolEtiketi}`],
  ];
  (st.paragraphs ?? []).forEach((p) => ogretmen.push([STIL.lead, P(p)]));
  sorular.forEach((q, n) => {
    ogretmen.push([STIL.kok, `${n + 1}. ${P(q.kok)}`]);
    q.secenekler.forEach((o, k) => ogretmen.push([STIL.secenek, `${harf[k]}) ${P(stripLetterPrefix(o))}`]));
    ogretmen.push([STIL.kunye, `Cevap: ${q.dogru_secenek} — ${P(q.dogru_cevap)}`]);
    (q.cozum_adimlari ?? []).forEach((s) => ogretmen.push([STIL.lead, P(s)]));
    (q.celdirici_hata_yollari ?? []).forEach((m, k) => ogretmen.push([STIL.onerme, `${harf[k]}: ${P(m)}`]));
  });

  // 90_MM/180_MM: "Helvetica 9 punto" tipo tercihiyle eklenen ikinci genişlik
  // çifti — 85_MM/185_MM'in Arial 8,5 pt'si DEĞİŞMEDİ, yalnız yeni genişlikler
  // kendi tipo çiftini taşır (bkz. types.ts genislikSinifi yorumu).
  const yeniGenislik = input.genislik === "90_MM" || input.genislik === "180_MM";
  const govdePt = yeniGenislik ? 9 : 8.5;
  const font = yeniGenislik ? "Helvetica" : "Arial";

  return {
    stilGrubu: "SORU_STİLLERİ",
    stiller: STIL,
    dizgi: { govdePt, baslikPt: 10, font, genislik: input.genislik, ascii: asciiIste },
    ogrenciRows: ogrenci,
    ogretmenRows: ogretmen,
    ogrenciRaw: raw(ogrenci),
    ogretmenRaw: raw(ogretmen),
  };
}
