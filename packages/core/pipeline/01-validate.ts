import { loadCurriculum, type CurriculumSubject } from "../curriculum/load.js";
import { resolveOutcome, resolveMicro } from "../curriculum/schema.js";
import type { Ders, JobInput, ValidationResult } from "./types.js";

const DERS_TO_CURRICULUM_SUBJECT: Record<Ders, CurriculumSubject> = {
  MATEMATIK: "matematik",
  GEOMETRI: "geometri",
  FIZIK: "fizik",
  KIMYA: "kimya",
  BIYOLOJI: "biyoloji",
  TDE: "tde",
  COGRAFYA: "cografya",
  TARIH: "tarih",
  FELSEFE: "felsefe",
  DKAB: "dkab",
};

/**
 * node "01 - Girdi Geçerli mi" + "02 - TYMM Kazanım Kilidi + Girdi Doğrulama"'nın
 * portu. Kazanım veritabanında kod veya mikro eksikse soru uydurulmaz —
 * "MÜFREDAT VERİSİ EKSİK — FINAL KAPALI" davranışı burada errors[] olarak
 * döner, çağıran (CLI/API) kullanıcıya bu mesajı gösterir.
 */
export function validateJob(input: JobInput): ValidationResult {
  const curriculum = loadCurriculum(DERS_TO_CURRICULUM_SUBJECT[input.ders ?? "MATEMATIK"]);
  const errors: string[] = [];

  if (!input.kod?.trim()) errors.push("Kod / Kazanım alanı boş bırakılamaz.");
  if (!input.sinifVeyaSinav?.trim()) errors.push("Sınıf / Sınav alanı boş bırakılamaz.");
  if (!Number.isFinite(input.soruSayisi) || input.soruSayisi < 1) {
    errors.push("Soru Sayısı en az 1 olmalıdır.");
  }
  if (errors.length) return { valid: false, errors };

  const outcome = resolveOutcome(curriculum, input.sinifVeyaSinav, input.kod);
  if (!outcome) {
    errors.push(
      `Kazanım kodu bu sınıfta bulunamadı: ${input.kod} (${input.sinifVeyaSinav})`
    );
    return { valid: false, errors };
  }

  let micro: string;
  try {
    micro = resolveMicro(outcome, input.mikro);
  } catch (err) {
    errors.push((err as Error).message);
    return { valid: false, errors };
  }

  const soruSayisi = Math.min(Math.max(1, Math.trunc(input.soruSayisi)), 5); // MASTER_CORE: 5'erli gruplar

  return {
    valid: true,
    resolved: {
      input: { ...input, soruSayisi },
      outcome,
      micro,
    },
  };
}
