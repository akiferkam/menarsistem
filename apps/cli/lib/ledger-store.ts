import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { RotationLedger } from "@menar/core";

const BOS_LEDGER: RotationLedger = { son100BaglamAilesi: [], son200AileDna: [], son15GorselAilesi: [] };

/**
 * `packages/core` hiçbir zaman dosya/DB bilmez (Section 3); bu CLI-yerel
 * JSON dosyası, node 30'un kalıcı rotasyon defterinin Faz 1 CLI'daki
 * yer tutucusudur. Section 8'in yayınevi bazlı, DB-destekli gerçek rotasyon
 * defterine Faz 3+'ta geçilecek — bu dosya tek kullanıcılı/tek yayınevili
 * CLI kullanımı için yeterli.
 */
export function readLedger(path: string): RotationLedger {
  if (!existsSync(path)) return BOS_LEDGER;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RotationLedger;
  } catch {
    return BOS_LEDGER;
  }
}

export function writeLedger(path: string, ledger: RotationLedger): void {
  writeFileSync(path, JSON.stringify(ledger, null, 2), "utf8");
}
