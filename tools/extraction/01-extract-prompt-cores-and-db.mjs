// One-off extraction script for Faz 0.
// Pulls string-literal / object-literal constants out of the n8n workflow's
// embedded jsCode by scanning source spans (never by eval/Function), then
// JSON.parse()s those spans. No hand-retyping of the ~85k-char prompt core.

import fs from "node:fs";
import path from "node:path";

const ROOT = "c:/Users/akife/Desktop/MENARAR";
const workflow = JSON.parse(
  fs.readFileSync(path.join(ROOT, "sources/menar_mays_matematik_v22_6_workflow.json"), "utf8")
);

function findNode(name) {
  const n = workflow.nodes.find((x) => x.name === name);
  if (!n) throw new Error("node not found: " + name);
  return n.parameters.jsCode;
}

// Scans forward from `startIdx` (which must point at an opening double-quote)
// respecting backslash escapes, and returns the index just past the matching
// closing quote. Pure JS double-quoted string literal scanner.
function scanQuotedString(src, startIdx) {
  if (src[startIdx] !== '"') throw new Error("expected \" at " + startIdx);
  let i = startIdx + 1;
  while (i < src.length) {
    if (src[i] === "\\") { i += 2; continue; }
    if (src[i] === '"') return i + 1;
    i++;
  }
  throw new Error("unterminated string starting at " + startIdx);
}

function extractConstString(src, constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*"`);
  const m = re.exec(src);
  if (!m) throw new Error("const not found: " + constName);
  const quoteStart = m.index + m[0].length - 1; // index of the opening "
  const quoteEnd = scanQuotedString(src, quoteStart); // index just past closing "
  const literal = src.slice(quoteStart, quoteEnd); // includes surrounding quotes
  return JSON.parse(literal); // JS double-quoted string escapes == JSON string escapes here
}

// Scans a `{ ... }` object literal starting at the first `{` after `marker`,
// respecting nested braces and quoted strings, and returns the raw span text.
function extractConstObjectSpan(src, constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*`);
  const m = re.exec(src);
  if (!m) throw new Error("const not found: " + constName);
  let i = m.index + m[0].length;
  while (src[i] !== "{") i++;
  const objStart = i;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"') { i = scanQuotedString(src, i) - 1; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(objStart, i);
}

// --- 1. Prompt cores from node 04 ---
const node04 = findNode("04 - MASTER PROMPT Derleyici");
const MASTER_CORE = extractConstString(node04, "MASTER_CORE");
const V20_ZERO_TRUST = extractConstString(node04, "V20_ZERO_TRUST");
const V202_CONTEXT = extractConstString(node04, "V202_CONTEXT");
const V21_MASTER = extractConstString(node04, "V21_MASTER");

const promptsDir = path.join(ROOT, "packages/core/prompts");
fs.mkdirSync(promptsDir, { recursive: true });
fs.writeFileSync(path.join(promptsDir, "master-core-v15.1.txt"), MASTER_CORE, "utf8");
fs.writeFileSync(path.join(promptsDir, "zero-trust-v20.txt"), V20_ZERO_TRUST, "utf8");
fs.writeFileSync(path.join(promptsDir, "context-diversity-v20.2.txt"), V202_CONTEXT, "utf8");
fs.writeFileSync(path.join(promptsDir, "production-locks-v21.txt"), V21_MASTER, "utf8");

console.log("MASTER_CORE      chars:", MASTER_CORE.length);
console.log("V20_ZERO_TRUST   chars:", V20_ZERO_TRUST.length);
console.log("V202_CONTEXT     chars:", V202_CONTEXT.length);
console.log("V21_MASTER       chars:", V21_MASTER.length);

// --- 2. Curriculum DB from node 02 ---
const node02 = findNode("02 - TYMM Kazanım Kilidi + Girdi Doğrulama");
const dbSpan = extractConstObjectSpan(node02, "DB");
const DB = JSON.parse(dbSpan);

fs.writeFileSync(path.join(ROOT, ".scratch/db-raw.json"), JSON.stringify(DB, null, 2), "utf8");

console.log("\nDB top-level keys (sınıf/sınav):", Object.keys(DB));
for (const [k, themes] of Object.entries(DB)) {
  const items = themes.reduce((s, t) => s + t.items.length, 0);
  console.log(`  ${k}: ${themes.length} tema, ${items} kazanım (raw, with dup across arrays)`);
}
