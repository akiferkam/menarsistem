// Faz 0 validation: actually runs checks against the extracted artifacts
// rather than asserting they're fine. Exits non-zero on any failure.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = "c:/Users/akife/Desktop/MENARAR";
const fails = [];
const oks = [];
const check = (label, cond) => (cond ? oks : fails).push(label);

// --- 1. Curriculum chain integrity ---
const curriculum = JSON.parse(
  fs.readFileSync(path.join(ROOT, "packages/core/curriculum/matematik.json"), "utf8")
);
check("curriculum.outcome_count === 56", curriculum.outcome_count === 56);
check("curriculum.outcomes.length === 56", curriculum.outcomes.length === 56);

const codeSet = new Set(curriculum.outcomes.map((o) => o.code));
check("no duplicate kazanım kodu", codeSet.size === curriculum.outcomes.length);

const CODE_RE = /^MAT\.\d{1,2}\.\d+\.\d+$/;
const badCodes = curriculum.outcomes.filter((o) => !CODE_RE.test(o.code));
check("all codes match MAT.<grade>.<theme>.<item>", badCodes.length === 0);

const noMicro = curriculum.outcomes.filter((o) => !o.micro.includes("GENEL_KARMA"));
check("every outcome's mikro list ends with GENEL_KARMA fallback", noMicro.length === 0);

const gradeCounts = { "9": 0, "10": 0, "11": 0 };
for (const o of curriculum.outcomes) gradeCounts[o.grade]++;
check("grade 9 has 20 outcomes", gradeCounts["9"] === 20);
check("grade 10 has 21 outcomes", gradeCounts["10"] === 21);
check("grade 11 has 15 outcomes", gradeCounts["11"] === 15);

// exam-track resolution: every grade-9/10 code must be reachable via TYT,
// every grade-11 code reachable via AYT (this is what node "02"'s
// resolveOutcome-equivalent depends on)
function resolvable(sinif, code) {
  return curriculum.outcomes.some((o) => o.code === code && o.exam_tracks.includes(sinif));
}
let unresolvable = 0;
for (const o of curriculum.outcomes) {
  const track = o.grade === "11" ? "AYT" : "TYT";
  if (!resolvable(track, o.code)) unresolvable++;
  if (!resolvable(`${o.grade}. Sınıf`, o.code)) unresolvable++;
}
check("every outcome resolves under its native sınıf AND its exam track", unresolvable === 0);

// --- 2. Prompt files present, non-empty, and size-consistent with README table ---
const promptsDir = path.join(ROOT, "packages/core/prompts");
const expectedFiles = {
  "master-core-v15.1.txt": 46878,
  "zero-trust-v20.txt": 8637,
  "context-diversity-v20.2.txt": 5793,
  "production-locks-v21.txt": 22060,
  "core-v25-manifest.txt": null, // static but not size-quoted by the brief
  "reasoning-engine-v2.template.txt": null,
  "btg-word-lock-v20.template.txt": null,
};
for (const [file, expectedChars] of Object.entries(expectedFiles)) {
  const p = path.join(promptsDir, file);
  const exists = fs.existsSync(p);
  check(`${file} exists`, exists);
  if (!exists) continue;
  const text = fs.readFileSync(p, "utf8");
  check(`${file} non-empty`, text.trim().length > 0);
  if (expectedChars) {
    check(`${file} char count matches brief's estimate (${expectedChars})`, text.length === expectedChars);
  }
}

// --- 3. Template placeholder sanity ---
const reasoningTpl = fs.readFileSync(path.join(promptsDir, "reasoning-engine-v2.template.txt"), "utf8");
check("reasoning template still has ${MARKER}", reasoningTpl.includes("${MARKER}"));
check("reasoning template still has ${primary(", reasoningTpl.includes("${primary("));

const btgTpl = fs.readFileSync(path.join(promptsDir, "btg-word-lock-v20.template.txt"), "utf8");
check("btg lock reads as one grammatical sentence (repair check)", btgTpl.includes("BTG olduğunda aktiftir."));
check("btg lock still has ${min}/${max}", btgTpl.includes("${min}") && btgTpl.includes("${max}"));

const lookup = JSON.parse(
  fs.readFileSync(path.join(promptsDir, "reasoning-engine-v2.lookup.json"), "utf8")
);
check("lookup has 11 primary entries", Object.keys(lookup.dicts.primary).length === 11);
check("lookup has 6 secondary entries", Object.keys(lookup.dicts.secondary).length === 6);
check("lookup has 3 removal entries", Object.keys(lookup.dicts.removal).length === 3);
check("lookup has 4 twin entries", Object.keys(lookup.dicts.twin).length === 4);

// --- 4. .indd asset integrity ---
const origIndd = path.join(ROOT, "soru kalıplari_ysyf.indd/soru kalıplari_ysyf.indd");
const copiedIndd = path.join(ROOT, "assets/indesign/soru_kaliplari_ysyf.indd");
function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
check(
  ".indd copy is byte-identical to the original extracted zip contents",
  fs.existsSync(origIndd) && fs.existsSync(copiedIndd) && sha256(origIndd) === sha256(copiedIndd)
);
check("__MACOSX cruft removed", !fs.existsSync(path.join(ROOT, "soru kalıplari_ysyf.indd/__MACOSX")));

// --- Report ---
console.log(`PASS: ${oks.length}`);
console.log(`FAIL: ${fails.length}`);
if (fails.length) {
  console.log("\nFailed checks:");
  fails.forEach((f) => console.log("  ✗", f));
  process.exit(1);
} else {
  console.log("\nAll Faz 0 checks passed.");
}
