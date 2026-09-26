import type { Ders } from "../pipeline/types.js";

const DERSLER: Ders[] = ["MATEMATIK", "GEOMETRI", "FIZIK", "KIMYA", "BIYOLOJI", "TDE"];

/** `${prefix}_${DERS}` biçimindeki env değişkenlerinden yalnız GERÇEKTEN tanımlı olanları toplar. */
function derseGoreEnv(env: NodeJS.ProcessEnv, prefix: string): Partial<Record<Ders, string>> {
  const out: Partial<Record<Ders, string>> = {};
  for (const ders of DERSLER) {
    const deger = env[`${prefix}_${ders}`];
    if (deger) out[ders] = deger;
  }
  return out;
}

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
  /**
   * Ders bazlı YUKSEK-kalite model override'ı — "en iyi görsel modelini
   * ders bazında denemek" isteği için. Bir ders burada tanımlı değilse
   * `imageHighQuality`/`imageHighQualityEdit`e (genel varsayılan) düşülür.
   * Tüm değerler `FalProvider`'ın aynı fal.ai anahtarıyla çağırdığı
   * (yalnız model id'si farklı) endpoint'lerdir — fal.ai Flux dışında
   * Ideogram/Recraft/Imagen/Seedream gibi modelleri de barındırdığından
   * yeni bir sağlayıcı eklemeden yalnız model id'sini değiştirerek denenebilir.
   */
  imageHighQualityByDers: Partial<Record<Ders, string>>;
  imageHighQualityEditByDers: Partial<Record<Ders, string>>;
  /**
   * AŞAMA 2 görsel-manifest denetimi (bkz. 19-gorsel-denetim.ts) — kullanıcı
   * isteğiyle 2026-08-23'te OpenAI'dan Anthropic/Claude Opus'a geçirildi.
   * Gerekçe: canlı testte (FIZ.9.1.1, job 16a89a8f) gpt-5.1 tabanlı denetim,
   * rafta GERÇEKTE 2 yeşil+2 kırmızı+1 siyah dosya varken "her renkten
   * yalnız birer tane, sayım uyuşuyor" diye yanlışlıkla PASS verdi — bu,
   * "renk/miktar kodlaması" güvenlik ağının (bkz. proje hafızası
   * menar-mays-gorsel-mimari) dayandığı deterministik karşılaştırmayı (bkz.
   * 19-gorsel-denetim.ts sayilan_nesneler) anlamsız kılıyordu, çünkü kontrol
   * yalnız "modelin RAPORLADIĞI sayı beklenenle tutuyor mu" bakabiliyor —
   * modelin kendisi yanlış sayarsa yakalayamıyor. Sağlayıcı (openai→anthropic)
   * `apps/api/lib/provider-deps.ts` ve `apps/cli/lib/providers.ts`'te de
   * (solverA'nın hep anthropic olması gibi) sabit — yalnız MODEL adı burada,
   * env'ten değişebilir.
   */
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
    imageHighQualityByDers: derseGoreEnv(env, "MODEL_IMAGE_HQ"),
    imageHighQualityEditByDers: derseGoreEnv(env, "MODEL_IMAGE_HQ_EDIT"),
    visionCheck: env.MODEL_VISION_CHECK ?? "claude-opus-5",
  };
}

export type PromptMode = "full" | "compact";

export function loadPromptMode(env: NodeJS.ProcessEnv = process.env): PromptMode {
  return env.PROMPT_MODE === "full" ? "full" : "compact";
}
