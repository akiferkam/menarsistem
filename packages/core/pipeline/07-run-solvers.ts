import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { SolverOutputSchema, type SolverOutput } from "./06-solver-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { ResolvedJob } from "./types.js";

const SOLVER_A_SYSTEM =
  "Sen bağımsız SOLVER A'sın. Üretim sırasında kurulan çözüm açıklamasına GÜVENME. Soruyu sıfırdan " +
  "çöz, bütün koşulların kesişimini, birim dönüşümlerini ve sınır durumları yeniden hesapla. A–E " +
  "seçeneklerinin her birini ayrı ayrı denetle ve DOĞRU/YANLIŞ/BELİRSİZ kararı ver. Yalnız şemaya " +
  "uygun JSON döndür.";

const SOLVER_B_SYSTEM =
  "Sen bağımsız SOLVER B'sin. SOLVER A'nın ara sonuçlarını KOPYALAMA. Farklı temsil, ters kontrol, " +
  "örnekleme, cebirsel doğrulama veya kavramsal çapraz kontrol kullan. Aynı sonuca bağımsız " +
  "ulaşamıyorsan ilgili seçenek kararını BELİRSİZ bırak. Yalnız şemaya uygun JSON döndür.";

export interface SolverDeps {
  provider: LlmProvider;
  model: string;
}

/** node "20 - /OTOPSİ/ SOLVER A"nın portu. */
export async function runSolverA(resolved: ResolvedJob, aday: GeneratorOutput, deps: SolverDeps): Promise<SolverOutput> {
  const userPrompt =
    "/OTOPSİ/ SOLVER A\n\n" +
    `KAZANIM: ${resolved.input.kod} — ${resolved.outcome.outcome}\n` +
    `MİKRO: ${resolved.micro}\n\n` +
    "ADAY SORU (JSON):\n" +
    JSON.stringify(aday);

  return callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: SOLVER_A_SYSTEM,
    userPrompt,
    schema: SolverOutputSchema,
    schemaName: "SolverOutputA",
  });
}

/** node "21 - /OTOPSİ/ SOLVER B"nin portu — Solver A'nın ara sonuçlarını görmez. */
export async function runSolverB(aday: GeneratorOutput, deps: SolverDeps): Promise<SolverOutput> {
  const userPrompt =
    "/OTOPSİ/ SOLVER B (bağımsız yol)\n\n" +
    "ADAY SORU (JSON):\n" +
    JSON.stringify(aday) +
    "\n\nSOLVER A'nın ara sonuçlarını görmüyorsun; farklı bir doğrulama yolu kullan.";

  return callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: SOLVER_B_SYSTEM,
    userPrompt,
    schema: SolverOutputSchema,
    schemaName: "SolverOutputB",
  });
}
