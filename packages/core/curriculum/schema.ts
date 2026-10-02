import { z } from "zod";

/**
 * A single official kazanım (learning outcome), deduplicated across exam
 * tracks. TYT reuses the 9th/10th grade codes verbatim and AYT reuses the
 * 11th grade codes verbatim (verified in .scratch/build-curriculum.mjs against
 * the source workflow — TYT/AYT are pure concatenations, not independent
 * data), so we store the outcome once and record which tracks reference it.
 */
export const OutcomeSchema = z.object({
  // MAT./GEO. = Matematik/Geometri (bkz. proje hafızası — 2026-08-17'de
  // matematik müfredatındaki geometri temaları ayrı bir "ders" olarak
  // çıkarıldı, kodları GEO. ile yeniden numaralandı; kalan matematik kodları/
  // tema numaraları KASITLI olarak değiştirilmedi — bazı sınıflarda tema
  // numaraları artık ardışık değil, stabil kod kimlikleri kozmetik
  // ardışıklıktan önceliklidir).
  // FIZ./KIM./BIY./TDE. = Fizik/Kimya/Biyoloji/Türk Dili ve Edebiyatı (aynı
  // gün eklendi, kaynak: curriculum/maarif_modeli_9_12_fizik_kimya_biyoloji_
  // tde_tyt_ayt.md — MEB Türkiye Yüzyılı Maarif Modeli 9-12. sınıf özet
  // başvuru dosyası). Bu dört ders 12. sınıfı da kapsıyor (Matematik/Geometri
  // TYT+AYT'yi 9-11 ile karşılıyordu, kapsamıyordu) — bu yüzden grade/
  // exam_tracks "12"/"12. Sınıf" ile genişletildi. Kaynak dosyanın kendisi
  // TDE için (ve bazı 12. sınıf ünitelerinde diğer derslerde de) tek tek
  // kazanım KODU vermiyor, yalnız düz cümlelik "öğrenme çıktısı özeti" bulunduruyor
  // — bu durumlarda kod parse script'i tarafından SUBJ.sınıf.ünite.sıra
  // olarak sentezlendi (resmî bir MEB kodu DEĞİL, dahili tutarlı bir kimlik).
  code: z.string().regex(/^(MAT|GEO|FIZ|KIM|BIY|TDE|COĞ|TAR|FEL|DKAB)\.\d{1,2}\.\d+\.\d+$/),
  grade: z.enum(["9", "10", "11", "12"]),
  exam_tracks: z
    .array(z.enum(["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf", "TYT", "AYT"]))
    .min(1),
  theme: z.string().min(1),
  theme_order: z.number().int().positive(),
  content_frame: z.string().min(1),
  // Matematik/Geometri kaynağı her zaman tam cümle kazanımlar veriyordu (min
  // 10 buna göre ayarlanmıştı) — Fizik/Kimya/Biyoloji/TDE kaynağı (bkz.
  // curriculum/maarif_modeli_...md) bazı ünitelerde ("Öğrenme çıktısı
  // kapsamı" başlıklı) tam cümle yerine kısa konu adları listeliyor (ör.
  // "Girişim", 7 karakter) — bunlar geçerli, kaynaktan birebir gelen terimler,
  // yapay olarak uzatılmadı; asgari 3'e düşürüldü.
  outcome: z.string().min(3),
  // Mikro alt başlıklar. GENEL_KARMA is always the terminal entry — a soru
  // whose "Alt Konu / Mikro" field is left blank falls back to it.
  micro: z.array(z.string().min(1)).min(2),
  // Resmî DÖP'ten (Ders Öğretim Programı) süzülmüş, üretici için somut
  // bağlam/ölçme rehberi — şimdilik yalnız Tarih/Felsefe'de dolu.
  dop_notu: z.string().nullish(),
  // Ünite ve Kazanımlar docx'indeki kazanımın kendi a)/b)/c)... alt
  // maddeleri — resmî, kazanıma özel süreç bileşenleri (bkz.
  // curriculum/tymm-skill.ts processComponents() — o, bu resmî liste
  // YOKKEN kullanılan genel anahtar-kelime tahminidir). Tarih/Coğrafya/
  // DKAB/Felsefe'de dolu; Matematik ve diğerlerinde kaynak dosyada bu
  // madde yapısı olmadığı için boş kalır ve heuristik tahmine düşülür.
  surec_bilesenleri: z.array(z.string().min(1)).nullish(),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

export const CurriculumSchema = z.object({
  subject: z.enum([
    "Matematik",
    "Geometri",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Türk Dili ve Edebiyatı",
    "Coğrafya",
    "Tarih",
    "Felsefe",
    "Din Kültürü ve Ahlak Bilgisi",
  ]),
  source: z.object({
    workflow_file: z.string(),
    extracted_node: z.string(),
    extracted_at: z.string(),
  }),
  outcome_count: z.number().int().positive(),
  outcomes: z.array(OutcomeSchema),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;

/**
 * Resolves the sınıf → tema → kod → mikro chain the way the original
 * workflow's node "02" does: given a sınıf/sınav value and a kazanım kodu,
 * find the matching outcome, or return null so the caller can raise
 * "MÜFREDAT VERİSİ EKSİK — FINAL KAPALI" instead of guessing.
 */
export function resolveOutcome(
  curriculum: Curriculum,
  sinifVeyaSinav: string,
  kod: string
): Outcome | null {
  const hit = curriculum.outcomes.find(
    (o) => o.code === kod && (o.exam_tracks as string[]).includes(sinifVeyaSinav)
  );
  return hit ?? null;
}

/** Validates a mikro alt başlık against an outcome's own list, case-insensitively for tr-TR. */
export function resolveMicro(outcome: Outcome, mikro: string | undefined): string {
  const value = (mikro ?? "").trim();
  if (!value) return "GENEL_KARMA";
  const hit = outcome.micro.find(
    (m) => m.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR")
  );
  if (!hit) {
    throw new Error(
      `Mikro başlık bu kazanıma ait değil. Geçerli liste: ${outcome.micro.join(" | ")}`
    );
  }
  return hit;
}
