import type { LlmProvider } from "./provider.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAiProvider } from "./openai.js";
import { FalProvider } from "./fal.js";

export * from "./provider.js";
export * from "./config.js";
export * from "./structured.js";
export * from "./openai-strict-schema.js";
export * from "./anthropic-safe-schema.js";
export * from "./cost.js";
export { AnthropicProvider } from "./anthropic.js";
export { OpenAiProvider } from "./openai.js";
export { FalProvider } from "./fal.js";
export { MockProvider } from "./mock.js";

export type ProviderName = "anthropic" | "openai" | "fal";

/**
 * `apiKey` verilmezse sağlayıcı kendi ortam değişkenine düşer (CLI/tek
 * anahtar akışı, bkz. `apps/cli`). `apps/api` çok-kiracılı akışta her
 * yayınevinin kendi BYOK anahtarını (Section 13 #3) burada açıkça geçirir.
 * "fal" yalnız `generateImage`/`editImage` destekler (bkz. `fal.ts`
 * yorumu) — yalnız `gorsel.uretim` deps'inde kullanılmalı.
 */
export function createProvider(name: ProviderName, apiKey?: string): LlmProvider {
  switch (name) {
    case "anthropic":
      return apiKey ? new AnthropicProvider(apiKey) : new AnthropicProvider();
    case "openai":
      return apiKey ? new OpenAiProvider(apiKey) : new OpenAiProvider();
    case "fal":
      return apiKey ? new FalProvider(apiKey) : new FalProvider();
  }
}
