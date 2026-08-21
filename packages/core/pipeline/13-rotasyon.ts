import type { GeneratorOutput } from "./03-generator-schema.js";
import type { GorunmezKunye, PreflightResult, ResolvedJob, RotationEntry, RotationLedger } from "./types.js";

/**
 * node "30 - Rotasyon Defteri + Görünmez Künye"nin portu. MASTER_CORE'un
 * "kalıcı son-30 rotasyon" kuralının gerçek uygulaması budur — ama kalıcı
 * DEPOLAMA (dosya/DB) `packages/core` içinde değil, çağıran katmanda olur
 * (Section 3: "packages/core hiçbir zaman HTTP, Fastify veya DB bilmez").
 * Burada yalnız saf hesaplama: bir kayıt üretmek ve deftere eklemek.
 */
export function buildRotationEntry(resolved: ResolvedJob, aday: GeneratorOutput, yayinPuani: number): RotationEntry {
  return {
    timestamp: new Date().toISOString(),
    kod: resolved.input.kod,
    mikro: resolved.micro,
    mode: resolved.input.mode,
    iq: resolved.input.iq,
    baglamAilesi: aday.baglam_ailesi_kodu || aday.baglam_ailesi_ad || "",
    cozumDna: aday.cozum_dna_kodu || "",
    gorselAilesi: aday.baglam_katmani?.gorsel_ailesi || "",
    puan: yayinPuani,
  };
}

/** Kaynaktaki `store.rotation.push(...)` + 400 kayıt sınırının karşılığı — burada üç ayrı liste, sınırları types.ts'teki RotationLedger yorumuyla aynı (100/200/15). */
export function appendToLedger(ledger: RotationLedger, entry: RotationEntry): RotationLedger {
  const son100BaglamAilesi = entry.baglamAilesi ? [...ledger.son100BaglamAilesi, entry.baglamAilesi].slice(-100) : ledger.son100BaglamAilesi;
  const aileDna = entry.baglamAilesi && entry.cozumDna ? `${entry.baglamAilesi}::${entry.cozumDna}` : "";
  const son200AileDna = aileDna ? [...ledger.son200AileDna, aileDna].slice(-200) : ledger.son200AileDna;
  const son15GorselAilesi = entry.gorselAilesi ? [...ledger.son15GorselAilesi, entry.gorselAilesi].slice(-15) : ledger.son15GorselAilesi;
  return { son100BaglamAilesi, son200AileDna, son15GorselAilesi };
}

/** node 30'un `gorunmez_kunye` (InDesign otomasyonu ve soru bankası takibi için) portu. */
export function buildGorunmezKunye(resolved: ResolvedJob, aday: GeneratorOutput, onDenetim: PreflightResult, yayinPuani: number): GorunmezKunye {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const soruId = "MENAR-" + resolved.input.kod.replace(/\./g, "") + "-" + stamp;
  return {
    soruId,
    kazanimKodu: resolved.input.kod,
    sinifVeyaSinav: resolved.input.sinifVeyaSinav,
    altKonu: resolved.micro,
    iqKodu: resolved.input.iq,
    iqGercek: onDenetim.soruPuanlari.map((p) => p.ulasilanSeviye),
    baglamAilesi: aday.baglam_ailesi_kodu || "",
    puan: yayinPuani,
    uretimTarihi: new Date().toISOString().slice(0, 10),
  };
}
