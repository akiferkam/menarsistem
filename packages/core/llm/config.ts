/**
 * Section 9: "Model adları .env ve config'ten gelsin, koda gömülmesin."
 * Her aşama kendi modelini burada, tek yerden okur.
 */
export interface StageModels {
  generator: string;
  solverA: string;
  solverB: string;
  board: string;
  contextImagePrompt: string;
  image: string;
  /**
   * gpt-image-1'de üretim ve düzeltme aynı model id'sini kullanır (varsayılan
   * `image` ile aynı) — ama fal.ai/Flux'ta text-to-image ve image-to-image
   * FARKLI endpoint id'leridir (ör. "fal-ai/flux/dev" vs
   * "fal-ai/flux/dev/image-to-image"), bu yüzden ayrı bir alan gerekiyor.
   */
  imageEdit: string;
  /**
   * `JobInput.gorselKalitesi=YUKSEK` seçildiğinde (ve metin/rakam
   * göstermeyen adaylarda, bkz. proje hafızası `menar-mays-gorsel-mimari`)
   * kullanılan üst-kalite fal.ai/Flux çifti — canlı karşılaştırmada
   * flux/dev'den belirgin daha keskin/gerçekçi (flux-pro/v1.1-ultra) ve
   * hedefli düzeltmede gerçekten çalışan (flux-pro/kontext, img2img'in
   * aksine "sahneye X ekle" türü talimatları da uyguluyor).
   */
  imageHighQuality: string;
  imageHighQualityEdit: string;
  visionCheck: string;
}

export function loadStageModels(env: NodeJS.ProcessEnv = process.env): StageModels {
  const image = env.MODEL_IMAGE ?? "gpt-image-1";
  return {
    generator: env.MODEL_GENERATOR ?? "gpt-5.1",
    solverA: env.MODEL_SOLVER_A ?? "claude-sonnet-5",
    solverB: env.MODEL_SOLVER_B ?? "gpt-5.1",
    board: env.MODEL_BOARD ?? "gpt-5.1",
    contextImagePrompt: env.MODEL_CONTEXT_IMAGE_PROMPT ?? "gpt-5.1",
    image,
    imageEdit: env.MODEL_IMAGE_EDIT ?? image,
    imageHighQuality: env.MODEL_IMAGE_HQ ?? "fal-ai/flux-pro/v1.1-ultra",
    imageHighQualityEdit: env.MODEL_IMAGE_HQ_EDIT ?? "fal-ai/flux-pro/kontext",
    visionCheck: env.MODEL_VISION_CHECK ?? "gpt-5.1",
  };
}

export type PromptMode = "full" | "compact";

export function loadPromptMode(env: NodeJS.ProcessEnv = process.env): PromptMode {
  return env.PROMPT_MODE === "full" ? "full" : "compact";
}
