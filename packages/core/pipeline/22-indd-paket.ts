import { makeSkill, processComponents } from "../curriculum/tymm-skill.js";
import { stripLetterPrefix } from "./21-dizgi.js";
import type { InddDizgi } from "./21-dizgi.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type {
  BaglamGorseliSonuc,
  GorunmezKunye,
  InddPaket,
  InddPaketDosyasi,
  KanitTablosu,
  OtopsiResult,
  PreflightResult,
  ResolvedJob,
  SvgAsset,
} from "./types.js";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** node 71'in `icml()`si — ICML, InDesign'a File > Place ile doğrudan açılan gerçek biçimdir (fake `.docx` değil, brief Section 7). */
function icml(rows: [string, string][], title: string, dizgi: InddDizgi): string {
  const styles = [...new Set(rows.map((r) => r[0]))];
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  x += '<?aid style="50" type="snippet" readerVersion="6.0" featureSet="513" product="15.0(105)"?>\n';
  x += `<Document DOMVersion="15.0" Self="menar_${Date.now()}">\n`;
  x +=
    '<RootCharacterStyleGroup Self="u_rcsg"><CharacterStyle Self="CharacterStyle/$ID/[No character style]" Name="$ID/[No character style]"/></RootCharacterStyleGroup>\n';
  x += '<RootParagraphStyleGroup Self="u_rpsg">\n';
  x += `<ParagraphStyleGroup Self="psg_menar" Name="${dizgi.stilGrubu}">\n`;
  styles.forEach((s) => {
    const pt = s === "01_KOD_VE_CEVAP" ? 10 : 8.5;
    x += `<ParagraphStyle Self="ParagraphStyle/${dizgi.stilGrubu}%3a${esc(s)}" Name="${esc(s)}" PointSize="${pt}" AppliedFont="Arial" SpaceBefore="0" SpaceAfter="2" Leading="${pt + 2.5}"/>\n`;
  });
  x += "</ParagraphStyleGroup>\n</RootParagraphStyleGroup>\n";
  x += `<Story Self="story_menar" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="${esc(title)}">\n`;
  rows.forEach(([s, t]) => {
    x +=
      `<ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/${dizgi.stilGrubu}%3a${esc(s)}">` +
      `<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">` +
      `<Content>${esc(t)}</Content><Br/></CharacterStyleRange></ParagraphStyleRange>\n`;
  });
  x += "</Story>\n</Document>";
  return x;
}

function rtf(rows: [string, string][]): string {
  const enc = (s: string) =>
    s
      .split("")
      .map((ch) => {
        const cc = ch.charCodeAt(0);
        if (cc > 127) return `\\u${cc}?`;
        if (ch === "\\") return "\\\\";
        if (ch === "{") return "\\{";
        if (ch === "}") return "\\}";
        return ch;
      })
      .join("");
  let r = "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs17\n";
  rows.forEach(([s, t]) => {
    const fs = s === "01_KOD_VE_CEVAP" ? 20 : 17;
    r += `{\\fs${fs} ${enc(t)}\\par}\n`;
  });
  return r + "}";
}

const HARF = ["A", "B", "C", "D", "E"];

/**
 * node "71 - INDD Paketini Kur"nun portu (V21 İNDD_GERÇEK_PAKET_KİLİDİ).
 * "A–E SEÇENEK OTOPSİSİ" bölümü kaynaktaki `o.secenekler[].{harf,deger,
 * hata_yolu,karar}` yapısını birebir üretemiyor — bizim `OtopsiResult`
 * (bkz. `08-otopsi.ts` mimari kararı) yalnız soru başına TEK bir
 * `cevapKontrolu` taşıyor, harf başına ayrı bir doğrulanmış karar yok. Bu
 * yüzden burada iki farklı şey açıkça etiketlenerek ayrı sunulur: modelin
 * kendi beyan ettiği `celdirici_hata_yollari` (doğrulanmamış, "model
 * beyanı" diye işaretli) ve gerçekten hesaplanmış tek `cevapKontrolu`
 * (soru bazlı). Section 15: "fiilen yapılmayan denetime PASS yazmak
 * yasaktır" — harf başına sahte bir "karar" icat etmek yerine bu ayrım
 * yapıldı.
 */
export function buildInddPaket(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  onDenetim: PreflightResult,
  otopsi: OtopsiResult,
  kanitTablosu: KanitTablosu,
  gorunmezKunye: GorunmezKunye,
  dizgi: InddDizgi,
  svgAssets: SvgAsset[],
  baglamGorseli: BaglamGorseliSonuc
): InddPaket {
  const input = resolved.input;

  const tymm2026 = {
    ogrenim_becerisi: makeSkill(resolved.outcome.outcome),
    surec_bilesenleri: processComponents(resolved.outcome.outcome),
  };

  const varliklar = [...svgAssets.map((a) => a.name), baglamGorseli.contextImageFilename].filter(
    (v): v is string => Boolean(v)
  );

  const manifest = {
    menar_builder: "MENAR_BUILDER_V1",
    soru_id: gorunmezKunye.soruId,
    kunye: gorunmezKunye,
    girdi: input,
    tymm2026,
    gorsel_veri_manifesti: aday.gorsel_veri_manifesti,
    baglam_katmani: aday.baglam_katmani,
    veri_katmani: aday.veri_katmani,
    dizgi: dizgi.dizgi,
    stiller: dizgi.stiller,
    sablon: "soru_kaliplari_ysyf.indd",
    varliklar,
    sorular: aday.sorular.map((q, n) => ({
      kok: q.kok,
      secenekler: q.secenekler,
      dogru_secenek: q.dogru_secenek,
      ogrenme_becerisi: q.ogrenme_becerisi,
      iq: onDenetim.soruPuanlari[n],
    })),
  };

  const cevap = aday.sorular
    .map(
      (q, n) =>
        `${n + 1}. ${q.dogru_secenek} — ${q.dogru_cevap}\n   Çözüm: ${(q.cozum_adimlari ?? []).join(" → ")}`
    )
    .join("\n\n");

  const denetim = [
    "MENAR MAYS V22.2 — ZORUNLU KANIT TABLOSU",
    "=".repeat(52),
    kanitTablosu.kanitTablosuMetni,
    "",
    "DENETİM SATIRI:",
    kanitTablosu.denetimSatiri,
    "",
    "AŞAMA 1 (METİN) DENETİMİ: " +
      (onDenetim.status === "PASS" && otopsi.status === "PASS" ? "PASS" : "RED") +
      " — solver A/B uyuştu, A–E otopsisi ve manifest çaprazı yapıldı",
    baglamGorseli.asama2Satiri,
    "",
    "A–E SEÇENEK OTOPSİSİ (celdirici hata yolu: model beyanı, doğrulanmış tek karar soru bazlıdır):",
    ...aday.sorular.flatMap((q, n) => {
      const o = otopsi.sorular[n];
      const kontrol = o?.cevapKontrolu;
      const kontrolMetni =
        kontrol?.status === "PASS"
          ? `PASS — ${kontrol.evidence}`
          : kontrol?.status === "RED"
            ? `RED — ${kontrol.reasons.join("; ")}`
            : kontrol?.status === "DOGRULANAMADI"
              ? `DOĞRULANAMADI — ${kontrol.why}`
              : "?";
      return [
        `SORU ${n + 1}`,
        ...q.secenekler.map(
          (s, k) =>
            `  ${HARF[k]}) ${stripLetterPrefix(s)}  | celdirici hata yolu (model beyanı): ${q.celdirici_hata_yollari?.[k] ?? ""}`
        ),
        `  Otopsi yöntemi: ${o?.yontem ?? "?"} | sonuç: ${kontrolMetni}`,
      ];
    }),
    "",
    "UYARILAR: " + ((onDenetim.uyari ?? []).join(" | ") || "yok"),
  ].join("\n");

  // ÖSYM/dershane kitapçık geleneği (bkz. example/matematik referans PDF'leri):
  // 5 seçenek de kısa/sayısal olduğunda dikey 5 satır yerine "3 üstte, 2 altta"
  // kompakt grup kullanılır. Gerçek InDesign yerleşimi elle yapıldığından (bu
  // dosyanın geri kalanındaki <US>/<KOK> etiketleme mantığıyla aynı sınır) bu
  // yalnız bir NOT — 00_Onizleme.png'de (page-preview.ts) otomatik uygulanıyor.
  const kisaSecenekliSorular = aday.sorular
    .map((q, n) => ({ no: n + 1, kisaMi: q.secenekler.length === 5 && q.secenekler.every((s) => stripLetterPrefix(s).length <= 14) }))
    .filter((x) => x.kisaMi)
    .map((x) => x.no);

  const yerlesim = [
    "MENAR — İNDD YERLEŞİM NOTU",
    "=".repeat(40),
    "Şablon: soru_kaliplari_ysyf.indd (yayın kalıbı)",
    "Stil grubu: " + dizgi.stilGrubu,
    `Gövde/seçenek: Arial ${dizgi.dizgi.govdePt} pt · Başlık: ${dizgi.dizgi.baslikPt} pt`,
    "Çıktı genişliği: " + dizgi.dizgi.genislik + (dizgi.dizgi.genislik === "85_MM" ? " (tek kolon)" : " (tam blok)"),
    "ASCII dönüşümü: " + (dizgi.dizgi.ascii ? "UYGULANDI" : "UYGULANMADI — Türkçe karakterler korunur"),
    "",
    "ADIMLAR:",
    "1. Şablonu aç, soru çerçevesini seç.",
    "2. File > Place ile 03_OGRENCI.icml dosyasını yerleştir (stiller otomatik eşleşir).",
    "3. [YERLEŞTİR: ...] satırlarının olduğu yerlere SVG/PNG varlıklarını konumlandır.",
    "4. <KESIR>pay;payda</KESIR>, <KOK>x</KOK>, <US>taban;us</US>, <ALT>taban;indis</ALT> etiketlerini",
    "   MENAR Builder / GREP betiğiyle gerçek matematik dizgisine dönüştür.",
    "5. Taşma varsa punto küçültme; 85 mm'de yüksekliği artır veya 185 mm'ye geç.",
    ...(kisaSecenekliSorular.length
      ? [
          "6. SEÇENEK DÜZENİ: Soru " +
            kisaSecenekliSorular.join(", ") +
            " için seçenekler kısa/sayısal — 5 satır yerine \"3 üstte (A B C), 2 altta (D E)\" tek satırlık " +
            "kompakt grup düzenine geç (bkz. örnek soru bankası PDF'leri, 00_Onizleme.png'de otomatik uygulandı).",
        ]
      : []),
    "",
    "VARLIKLAR:",
    ...varliklar.map((v) => " - " + v),
  ].join("\n");

  const files: InddPaketDosyasi[] = [
    { name: "01_OGRENCI_RAW.txt", content: dizgi.ogrenciRaw, mimeType: "text/plain", encoding: "utf8" },
    { name: "02_OGRETMEN_RAW.txt", content: dizgi.ogretmenRaw, mimeType: "text/plain", encoding: "utf8" },
    { name: "03_OGRENCI.icml", content: icml(dizgi.ogrenciRows, "MENAR Öğrenci", dizgi), mimeType: "application/xml", encoding: "utf8" },
    { name: "04_OGRETMEN.icml", content: icml(dizgi.ogretmenRows, "MENAR Öğretmen", dizgi), mimeType: "application/xml", encoding: "utf8" },
    { name: "05_SORU.rtf", content: rtf(dizgi.ogrenciRows), mimeType: "application/rtf", encoding: "utf8" },
    { name: "10_Veri_Manifesti.json", content: JSON.stringify(manifest, null, 2), mimeType: "application/json", encoding: "utf8" },
    { name: "11_Cevap_Anahtari.txt", content: cevap, mimeType: "text/plain", encoding: "utf8" },
    { name: "12_Denetim_Kanit_Tablosu.txt", content: denetim, mimeType: "text/plain", encoding: "utf8" },
    { name: "13_INDD_Yerlesim_Notu.txt", content: yerlesim, mimeType: "text/plain", encoding: "utf8" },
    {
      name: "14_MENAR_BUILDER_V1.json",
      content: JSON.stringify(
        { schema: "MENAR_BUILDER_V1", template: input.genislik === "85_MM" ? "QUESTION_85MM" : "QUESTION_185MM", ...manifest },
        null,
        2
      ),
      mimeType: "application/json",
      encoding: "utf8",
    },
    ...svgAssets.map((a): InddPaketDosyasi => ({ name: a.name, content: a.svg, mimeType: "image/svg+xml", encoding: "utf8" })),
  ];

  if (baglamGorseli.kullanildi && baglamGorseli.contextImageFilename && baglamGorseli.imageBase64) {
    files.push({
      name: baglamGorseli.contextImageFilename,
      content: baglamGorseli.imageBase64,
      mimeType: "image/png",
      encoding: "base64",
    });
  }

  const zipFilename = `MENAR_${input.kod.replace(/\./g, "_")}_${input.iq}_${input.genislik}_${gorunmezKunye.soruId || "paket"}.zip`;
  const paketIcerigi = [...files.map((f) => f.name)];

  return { files, zipFilename, paketIcerigi };
}
