import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

function read(name: string): string {
  return readFileSync(join(HERE, name), "utf8");
}

/**
 * Node 04'ün orijinalinde MASTER_CORE/V20_ZERO_TRUST/V202_CONTEXT/V21_MASTER
 * sabitleri hesaplanıp hiç kullanılmadan atılıyordu (V22.3 notu: "90k+
 * karakterlik legacy çekirdeği göndermek yerine..."). PROMPT_MODE=full bu
 * dört bloğu aynı sırayla geri getirir; birebir metin, hiç değiştirilmedi.
 */
export function loadLegacyCore(): string {
  return [
    read("master-core-v15.1.txt"),
    read("zero-trust-v20.txt"),
    read("context-diversity-v20.2.txt"),
    read("production-locks-v21.txt"),
  ].join("");
}

/** node "10 - AŞAMA 1"a, GeneratorOutputSchema'nın `dogrulama_manifesti` alanını doldurma talimatını ekler (brief Bölüm 5). */
export function loadCoreV25Manifest(): string {
  return read("core-v25-manifest.txt");
}
