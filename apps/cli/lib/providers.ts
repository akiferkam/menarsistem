import { createProvider, loadStageModels, MockProvider, type PipelineDeps } from "@menar/core";
import { MOCK_ADAY_RESPONSE, MOCK_BOARD_RESPONSE, MOCK_GORSEL_DENETIM_RESPONSE, MOCK_GORSEL_PROMPT_RESPONSE } from "./mock-fixture.js";

/**
 * Section 9: "sağlayıcı soyutlaması zorunlu, model adları .env'ten gelsin."
 * `LLM_PROVIDER_MODE=mock` API anahtarı olmadan kablolamayı doğrulamak için
 * (bkz. mock-fixture.ts); `live` gerçek Anthropic/OpenAI çağrısı yapar.
 * node 52 (görsel üretimi) kaynakta yalnız OpenAI (`gpt-image-1`); provider
 * arayüzünde de yalnız `OpenAiProvider.generateImage` uygular, bu yüzden
 * `gorsel.uretim` her zaman openai'a bağlanır.
 */
export function buildProviderDeps(mode: "live" | "mock"): Pick<PipelineDeps, "generator" | "solverA" | "solverB" | "board" | "gorsel"> {
  if (mode === "mock") {
    return {
      generator: { provider: new MockProvider([MOCK_ADAY_RESPONSE]), model: "mock-generator" },
      solverA: { provider: new MockProvider([]), model: "mock-solver-a" },
      solverB: { provider: new MockProvider([]), model: "mock-solver-b" },
      board: { provider: new MockProvider([MOCK_BOARD_RESPONSE]), model: "mock-board" },
      gorsel: {
        prompt: { provider: new MockProvider([MOCK_GORSEL_PROMPT_RESPONSE]), model: "mock-gorsel-prompt" },
        uretim: { provider: new MockProvider([]), model: "mock-gorsel-uretim" },
        denetim: { provider: new MockProvider([MOCK_GORSEL_DENETIM_RESPONSE]), model: "mock-gorsel-denetim" },
      },
    };
  }

  const models = loadStageModels();
  return {
    generator: { provider: createProvider("openai"), model: models.generator },
    solverA: { provider: createProvider("anthropic"), model: models.solverA },
    solverB: { provider: createProvider("openai"), model: models.solverB },
    board: { provider: createProvider("openai"), model: models.board },
    gorsel: {
      prompt: { provider: createProvider("openai"), model: models.contextImagePrompt },
      uretim: { provider: createProvider("openai"), model: models.image },
      denetim: { provider: createProvider("openai"), model: models.visionCheck },
    },
  };
}
