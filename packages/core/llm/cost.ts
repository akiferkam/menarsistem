import type { LlmProvider, UsageStats } from "./provider.js";

/**
 * $/1M token fiyatları. Kullanıcının Faz 3 maliyet hedefi ("soru paketi
 * başına maks. ~$1, kalite düşmeden") tahmini değil ölçülen gerçek token
 * kullanımına dayanmalı — bu tablo o dönüşümü yapar. Section 9'un "model
 * adları .env'ten gelsin" ilkesiyle çelişmez: pricing bir model YAPILANDIRMASI
 * değil, dışarıdaki bir gerçek (sağlayıcının kendi fiyat listesi). Kaynak:
 * platform.openai.com/docs/pricing + Anthropic resmi Sonnet 5 duyurusu,
 * 2026-08-07 itibariyle doğrulandı — zamanla değişir, tek güncelleme noktası
 * burasıdır. PRICING'de olmayan bir model sessizce 0 sayılmaz, `usd: null`
 * döner ("bilinmiyor" açıkça işaretlenir).
 */
export interface ModelPricing {
  /** $ / 1M metin girdi token'ı */
  input: number;
  /** $ / 1M metin çıktı token'ı */
  output: number;
  /** yalnız görsel modelleri: $ / 1M görsel girdi token'ı (yoksa `input` kullanılır) */
  imageInput?: number;
  /** yalnız görsel modelleri: $ / 1M görsel çıktı token'ı (yoksa `output` kullanılır) */
  imageOutput?: number;
}

export const PRICING: Record<string, ModelPricing> = {
  "gpt-5.6-sol": { input: 5, output: 30 },
  "gpt-5.1": { input: 1.25, output: 10 },
  "gpt-image-1": { input: 5, output: 40, imageInput: 10 },
  // Anthropic'in 2026-08-31'e kadarki tanıtım fiyatı; sonrasında $3/$15 olacak.
  "claude-sonnet-5": { input: 2, output: 10 },
};

export interface StageCost {
  stage: string;
  model: string;
  usage: UsageStats;
  /** null = PRICING'de kayıtlı model yok, tutar hesaplanamadı (0 değil). */
  usd: number | null;
}

export function estimateStageCost(model: string, usage: UsageStats): number | null {
  const p = PRICING[model];
  if (!p) return null;
  const textCost = (usage.textInputTokens / 1e6) * p.input + (usage.textOutputTokens / 1e6) * p.output;
  const imageCost =
    (usage.imageInputTokens / 1e6) * (p.imageInput ?? p.input) +
    (usage.imageOutputTokens / 1e6) * (p.imageOutput ?? p.output);
  return textCost + imageCost;
}

export function summarizeCost(
  stages: { stage: string; provider: LlmProvider; model: string }[]
): StageCost[] {
  return stages.map(({ stage, provider, model }) => {
    const usage = provider.getUsage();
    return { stage, model, usage, usd: estimateStageCost(model, usage) };
  });
}

/** CLI'de yazdırılabilir bir maliyet raporu — bilinmeyen modelleri de açıkça listeler. */
export function formatCostReport(stages: StageCost[]): string {
  const lines: string[] = [];
  let total = 0;
  let hasUnknown = false;
  for (const s of stages) {
    const totalTokens =
      s.usage.textInputTokens + s.usage.textOutputTokens + s.usage.imageInputTokens + s.usage.imageOutputTokens;
    if (totalTokens === 0 && s.usage.imageCount === 0) continue; // hiç çağrılmadı (ör. UNSUPPORTED olmayan solver)
    const usdText = s.usd === null ? "fiyat bilinmiyor" : `$${s.usd.toFixed(4)}`;
    if (s.usd === null) hasUnknown = true;
    else total += s.usd;
    const parts = [`${s.usage.textInputTokens + s.usage.textOutputTokens} metin token`];
    if (s.usage.imageCount > 0) parts.push(`${s.usage.imageCount} görsel`);
    lines.push(`  ${s.stage} (${s.model}): ${parts.join(", ")} — ${usdText}`);
  }
  lines.push(`  TOPLAM: $${total.toFixed(4)}${hasUnknown ? " (+ fiyatı bilinmeyen modeller var, yukarı bakın)" : ""}`);
  return lines.join("\n");
}
