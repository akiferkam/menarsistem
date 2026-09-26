import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CurriculumSchema, type Curriculum } from "./schema.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export type CurriculumSubject =
  | "matematik"
  | "geometri"
  | "fizik"
  | "kimya"
  | "biyoloji"
  | "tde"
  | "cografya"
  | "tarih"
  | "felsefe"
  | "dkab";

// Eskiden tek bir modül-seviyesi `cached` değişkeni vardı — bu, ikinci bir
// ders (geometri) eklendiğinde YANLIŞ müfredatı döndürecekti (ilk çağrının
// sonucu, sonraki farklı subject çağrılarında da geri verilirdi). Artık
// ders başına ayrı önbellek.
const cache = new Map<CurriculumSubject, Curriculum>();

export function loadCurriculum(subject: CurriculumSubject = "matematik"): Curriculum {
  const hit = cache.get(subject);
  if (hit) return hit;
  const raw = readFileSync(join(HERE, `${subject}.json`), "utf8");
  const parsed = CurriculumSchema.parse(JSON.parse(raw));
  cache.set(subject, parsed);
  return parsed;
}
