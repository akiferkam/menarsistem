// Faz 0 step 4: pull the three HTML-embedded template literals out of the
// source by scanning backtick spans (never eval), then repair the known
// splice corruption in the BTG word-lock block by joining its verified
// prefix/suffix around the injected V25 builder markup.

import fs from "node:fs";
import path from "node:path";

const ROOT = "c:/Users/akife/Desktop/MENARAR";
const html = fs.readFileSync(
  path.join(ROOT, "sources/menar_mays_matematik_v25_core_builder.html"),
  "utf8"
);

// Scans a backtick template literal starting at `startIdx` (must point at the
// opening `), respecting \` and \\ escapes and ${ ... } nesting (so a `}`
// inside an interpolation doesn't look like a stray backtick boundary issue —
// though for our purposes we only need to find the matching closing `, and
// none of these three literals contain a literal backtick inside ${...}).
function scanTemplateLiteral(src, startIdx) {
  if (src[startIdx] !== "`") throw new Error("expected ` at " + startIdx);
  let i = startIdx + 1;
  let braceDepth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") { i += 2; continue; }
    if (braceDepth === 0 && c === "`") return i + 1;
    if (c === "$" && src[i + 1] === "{") { braceDepth++; i += 2; continue; }
    if (braceDepth > 0 && c === "{") { braceDepth++; i++; continue; }
    if (braceDepth > 0 && c === "}") { braceDepth--; i++; continue; }
    i++;
  }
  throw new Error("unterminated template literal starting at " + startIdx);
}

function extractTemplateAfter(marker) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("marker not found: " + marker);
  let i = start + marker.length;
  while (html[i] !== "`") i++;
  const end = scanTemplateLiteral(html, i);
  // raw span WITHOUT the surrounding backticks, escapes left as-is (\n stays \n)
  return html.slice(i + 1, end - 1);
}

const outDir = path.join(ROOT, "packages/core/prompts");
fs.mkdirSync(outDir, { recursive: true });

// --- 1. core-v25-manifest (static, no ${}) ---
const coreV25Raw = extractTemplateAfter(
  "if(!el||!el.value||el.value.includes('/MENAR_CORE_V25_ZORUNLU_MANIFEST/'))return;el.value=el.value.trimEnd()+"
);
// Un-escape the JS-source \n into real newlines (this literal has no other escapes).
const coreV25Text = coreV25Raw.replace(/\\n/g, "\n");
fs.writeFileSync(path.join(outDir, "core-v25-manifest.txt"), coreV25Text, "utf8");
console.log("core-v25-manifest.txt      chars:", coreV25Text.length);

// --- 2. reasoning-engine-v2 (template literal, ${} left verbatim as placeholders) ---
const reasoningRaw = extractTemplateAfter("function block(){");
// keep as-is: this one is a *real* multi-line backtick literal (actual newlines
// in the source, not \n escapes), so no unescaping needed — just verify it
// starts where we expect.
if (!reasoningRaw.startsWith("${MARKER}")) {
  throw new Error("reasoning-engine-v2 extraction landed on the wrong literal");
}
fs.writeFileSync(path.join(outDir, "reasoning-engine-v2.template.txt"), reasoningRaw, "utf8");
console.log("reasoning-engine-v2.template.txt  chars:", reasoningRaw.length);

// --- 3. btg-word-lock-v20 (corrupted mid-file by a splice; reconstruct prefix+suffix) ---
const PREFIX_ANCHOR = 'return `\\n\\n${MARKER}\\n- Bu kilit yalnız ÜRETİM HATTI=BTG oldu';
const SUFFIX_ANCHOR_START = "ğunda aktiftir.";
const SUFFIX_END_MARKER = "BTG_METİN_UZUNLUĞU=[PASS / RED]\\n`;";

const prefixIdx = html.indexOf(PREFIX_ANCHOR);
if (prefixIdx === -1) throw new Error("btg-lock prefix anchor not found");
const prefixText = "\\n\\n${MARKER}\\n- Bu kilit yalnız ÜRETİM HATTI=BTG oldu";

const suffixIdx = html.indexOf(SUFFIX_ANCHOR_START);
if (suffixIdx === -1) throw new Error("btg-lock suffix anchor not found");
const suffixEndIdx = html.indexOf(SUFFIX_END_MARKER, suffixIdx);
if (suffixEndIdx === -1) throw new Error("btg-lock suffix end marker not found");
const suffixText = html.slice(suffixIdx, suffixEndIdx + SUFFIX_END_MARKER.length - 2); // drop trailing `;

const reconstructed = (prefixText + suffixText).replace(/\\n/g, "\n");
fs.writeFileSync(path.join(outDir, "btg-word-lock-v20.template.txt"), reconstructed, "utf8");
console.log("btg-word-lock-v20.template.txt  chars:", reconstructed.length);
console.log("\n--- reconstructed btg-word-lock preview (first 200 chars) ---");
console.log(reconstructed.slice(0, 200));
