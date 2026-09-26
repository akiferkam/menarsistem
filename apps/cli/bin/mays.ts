#!/usr/bin/env node
import { config as loadDotenv } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { formatCostReport, loadPromptMode, runPipeline, stripLetterPrefix, summarizeCost, type JobInput } from "@menar/core";
import { buildProviderDeps } from "../lib/providers.js";
import { readLedger, writeLedger } from "../lib/ledger-store.js";

// `pnpm --filter @menar/cli run start` cwd'yi apps/cli'a taşır (bkz.
// parseArgs yorumu) — cwd'ye bağlı hiçbir varsayılan yol bu yüzden
// güvenilir değil (.env, çıktı ZIP'i, rotasyon defteri). Repo kökü burada
// betiğin kendi konumuna göre (bin/../../..) sabitlenir.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
loadDotenv({ path: join(REPO_ROOT, ".env") });

function parseArgs(argv: string[]): { command?: string; configPath?: string } {
  // Kök package.json'daki "mays" script'i "pnpm ... run start --" olarak
  // tanımlı; pnpm bu ayırıcı "--"ı ilettiği argv'nin başına ekleyebiliyor.
  const temiz = argv.filter((a) => a !== "--");
  const command = temiz[0];
  const flagIdx = temiz.indexOf("--config");
  const configPath = flagIdx >= 0 ? temiz[flagIdx + 1] : undefined;
  return { command, configPath };
}

/** Faz 3 maliyet hedefi ("soru paketi başına maks. ~$1") için her çalıştırmada gerçek ölçülen token maliyetini yazdırır. */
function printCostReport(deps: ReturnType<typeof buildProviderDeps>): void {
  const stages = summarizeCost([
    { stage: "generator", provider: deps.generator.provider, model: deps.generator.model },
    { stage: "solverA", provider: deps.solverA.provider, model: deps.solverA.model },
    { stage: "solverB", provider: deps.solverB.provider, model: deps.solverB.model },
    { stage: "board", provider: deps.board.provider, model: deps.board.model },
    { stage: "gorsel.prompt", provider: deps.gorsel.prompt.provider, model: deps.gorsel.prompt.model },
    { stage: "gorsel.uretim", provider: deps.gorsel.uretim.provider, model: deps.gorsel.uretim.model },
    { stage: "gorsel.denetim", provider: deps.gorsel.denetim.provider, model: deps.gorsel.denetim.model },
  ]);
  console.log("\nMALİYET (ölçülen, tahmini değil):");
  console.log(formatCostReport(stages));
}

async function main(): Promise<void> {
  const { command, configPath } = parseArgs(process.argv.slice(2));

  if (command !== "generate" || !configPath) {
    console.error("Kullanım: mays generate --config <dosya.json>");
    process.exitCode = 1;
    return;
  }

  const input = JSON.parse(readFileSync(configPath, "utf8")) as JobInput;
  const providerMode = process.env.LLM_PROVIDER_MODE === "mock" ? "mock" : "live";
  const ledgerPath = process.env.MAYS_LEDGER_PATH ?? join(REPO_ROOT, ".mays-rotation.json");
  const providerDeps = buildProviderDeps(providerMode, input.gorselModeli);
  let sonuc: Awaited<ReturnType<typeof runPipeline>>;
  try {
    sonuc = await runPipeline(input, {
      ...providerDeps,
      promptMode: loadPromptMode(),
      ledger: readLedger(ledgerPath),
    });
  } catch (err) {
    // Beklenmeyen bir hatada bile (ör. API kredisi bitmesi) o ana kadar
    // yapılan çağrılar gerçek para harcamıştır — maliyeti göstermeden
    // sessizce çıkmak yanıltıcı olur.
    printCostReport(providerDeps);
    throw err;
  }

  if (sonuc.durum === "GIRDI_HATASI") {
    console.error("GİRDİ HATASI:");
    sonuc.errors.forEach((e) => console.error("  - " + e));
    process.exitCode = 1;
    return;
  }

  if (sonuc.durum === "URETIM_DURDURULDU") {
    console.error(sonuc.rapor.baslik);
    console.error("Sürekli RED veren: " + sonuc.rapor.surekliRedVeren);
    console.error("En yakın puan: " + sonuc.rapor.enYakinPuan);
    console.error("Önerilen tek değişiklik: " + sonuc.rapor.onerilenTekDegisiklik);
    console.error("RED nedenleri:");
    sonuc.rapor.redNedenleri.forEach((r) => console.error("  - " + r));
    printCostReport(providerDeps);
    process.exitCode = 1;
    return;
  }

  if (sonuc.revizyonSayisi > 0) {
    console.log(`(${sonuc.revizyonSayisi} revizyon turu sonrası kabul edildi)`);
  }

  console.log("\nÜretilen soru(lar):");
  sonuc.aday.sorular.forEach((soru, i) => {
    const harfler = ["A", "B", "C", "D", "E"];
    console.log(`\nSORU ${i + 1}: ${soru.kok}`);
    soru.secenekler.forEach((secenek, k) => console.log(`  ${harfler[k]}) ${stripLetterPrefix(secenek)}`));
    console.log(`  Doğru şık: ${soru.dogru_secenek}  (yöntem: ${sonuc.otopsi.sorular[i]?.yontem ?? "?"})`);
  });

  console.log("\nKANIT TABLOSU:");
  console.log(sonuc.kanitTablosu.kanitTablosuMetni);
  console.log("\n" + sonuc.kanitTablosu.denetimSatiri);
  console.log("\nGörünmez künye: " + sonuc.gorunmezKunye.soruId);

  if (sonuc.veriKatmani.assets.length) {
    console.log("\nSVG veri katmanı: " + sonuc.veriKatmani.assets.map((a) => a.name).join(", "));
  }
  console.log(
    sonuc.baglamGorseli.kullanildi
      ? `Bağlam görseli: ${sonuc.baglamGorseli.contextImageFilename} (${sonuc.baglamGorseli.deneme}. denemede PASS)`
      : "Bağlam görseli: kullanılmadı"
  );
  console.log(sonuc.baglamGorseli.asama2Satiri);

  if (sonuc.kanitTablosu.finalKilidi === "UYARILI_AÇIK") {
    console.log("\nFINAL KİLİDİ: UYARILI_AÇIK — editoryal uyarılar var, insan onayı önerilir:");
    sonuc.kanitTablosu.yayinUyarilari.forEach((u) => console.log("  - " + u));
  } else {
    console.log("\nFINAL KİLİDİ: " + sonuc.kanitTablosu.finalKilidi);
  }

  const outputDir = process.env.MAYS_OUTPUT_DIR ?? join(REPO_ROOT, "output");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const zipPath = join(outputDir, sonuc.paket.zipFilename);
  writeFileSync(zipPath, sonuc.zipBuffer);

  // node "73 - Form: Teslim"in tamamlanma ekranının portu.
  console.log("\n" + "=".repeat(52));
  console.log("MENAR MAYS V22.2 — YAYIN PAKETİ HAZIR");
  console.log(sonuc.kanitTablosu.denetimSatiri);
  console.log("\nAŞAMA 2: " + sonuc.baglamGorseli.asama2Satiri);
  console.log("\nPaket: " + zipPath);
  console.log("İçerik:");
  sonuc.paket.paketIcerigi.forEach((x) => console.log("  • " + x));

  printCostReport(providerDeps);

  writeLedger(ledgerPath, sonuc.ledger);
}

main().catch((err) => {
  console.error("BEKLENMEYEN HATA:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
