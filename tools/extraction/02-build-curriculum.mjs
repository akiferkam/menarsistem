// Faz 0 step 2: turn the raw DB (5 arrays, 112 items with TYT/AYT duplication)
// into a deduplicated curriculum keyed by the 56 unique kazanım kodu, with
// exam-track membership recorded instead of re-storing the same outcome text
// three times.

import fs from "node:fs";
import path from "node:path";

const ROOT = "c:/Users/akife/Desktop/MENARAR";
const DB = JSON.parse(fs.readFileSync(path.join(ROOT, ".scratch/db-raw.json"), "utf8"));

// --- Step 1: verify TYT == 9.Sınıf themes ++ 10.Sınıf themes, AYT == 11.Sınıf themes ---
function themeCodes(themes) {
  return themes.map((t) => t.items.map((i) => i.code));
}
function flat(themes) {
  return themes.flatMap((t) => t.items.map((i) => i.code));
}

const g9 = DB["9. Sınıf"], g10 = DB["10. Sınıf"], g11 = DB["11. Sınıf"];
const tyt = DB["TYT"], ayt = DB["AYT"];

const expectTyt = [...flat(g9), ...flat(g10)];
const actualTyt = flat(tyt);
const tytMatches = JSON.stringify(expectTyt) === JSON.stringify(actualTyt);

const expectAyt = flat(g11);
const actualAyt = flat(ayt);
const aytMatches = JSON.stringify(expectAyt) === JSON.stringify(actualAyt);

console.log("TYT == 9.Sınıf ++ 10.Sınıf (code-for-code, in order):", tytMatches);
console.log("AYT == 11.Sınıf (code-for-code, in order):", aytMatches);
if (!tytMatches || !aytMatches) {
  console.error("STOP: TYT/AYT are not a pure concatenation — dedup assumption is wrong, do not proceed blindly.");
  process.exit(1);
}

// --- Step 2: build canonical outcome records from the three base grades only ---
const gradeMap = { "9. Sınıf": "9", "10. Sınıf": "10", "11. Sınıf": "11" };
const examTrackForGrade = { "9": ["9. Sınıf", "TYT"], "10": ["10. Sınıf", "TYT"], "11": ["11. Sınıf", "AYT"] };

const outcomes = [];
const seen = new Set();
let themeOrder = 0;

for (const gradeKey of ["9. Sınıf", "10. Sınıf", "11. Sınıf"]) {
  const grade = gradeMap[gradeKey];
  for (const theme of DB[gradeKey]) {
    themeOrder++;
    for (const item of theme.items) {
      if (seen.has(item.code)) {
        throw new Error("Duplicate kazanım kodu across grades — unexpected: " + item.code);
      }
      seen.add(item.code);
      outcomes.push({
        code: item.code,
        grade,
        exam_tracks: examTrackForGrade[grade],
        theme: theme.theme,
        theme_order: themeOrder,
        content_frame: theme.content_frame,
        outcome: item.outcome,
        micro: item.micro,
      });
    }
  }
}

console.log("\nTotal unique kazanım:", outcomes.length, "(expected 56)");

// --- Step 3: sanity checks ---
const problems = [];
for (const o of outcomes) {
  if (!o.micro.includes("GENEL_KARMA")) problems.push(`${o.code}: mikro listesinde GENEL_KARMA yok`);
  if (o.micro.length < 2) problems.push(`${o.code}: mikro listesi çok kısa (${o.micro.length})`);
  if (!o.outcome || o.outcome.length < 10) problems.push(`${o.code}: outcome metni şüpheli kısa`);
  if (!/^MAT\.\d{1,2}\.\d+\.\d+$/.test(o.code)) problems.push(`${o.code}: kod formatı beklenenden farklı`);
}
console.log("Sanity problems:", problems.length);
problems.forEach((p) => console.log("  -", p));

// --- Step 4: write curriculum/matematik.json ---
const outDir = path.join(ROOT, "packages/core/curriculum");
fs.mkdirSync(outDir, { recursive: true });

const curriculum = {
  subject: "Matematik",
  source: {
    workflow_file: "sources/menar_mays_matematik_v22_6_workflow.json",
    extracted_node: "02 - TYMM Kazanım Kilidi + Girdi Doğrulama",
    extracted_at: new Date().toISOString().slice(0, 10),
  },
  outcome_count: outcomes.length,
  outcomes,
};
fs.writeFileSync(path.join(outDir, "matematik.json"), JSON.stringify(curriculum, null, 2), "utf8");
console.log("\nWrote packages/core/curriculum/matematik.json");

// --- Step 5: quick per-grade/theme breakdown for the report ---
const byGrade = {};
for (const o of outcomes) {
  byGrade[o.grade] ??= {};
  byGrade[o.grade][o.theme] ??= 0;
  byGrade[o.grade][o.theme]++;
}
fs.writeFileSync(
  path.join(ROOT, ".scratch/curriculum-breakdown.json"),
  JSON.stringify(byGrade, null, 2),
  "utf8"
);
