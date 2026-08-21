import type { ZodType } from "zod";

/** Bir sağlayıcıya (Anthropic/OpenAI/Mock) gönderilecek görüntü girdisi — AŞAMA 2 görsel-manifest denetimi için. */
export interface ImageInput {
  mimeType: "image/png" | "image/jpeg";
  /** base64, data: öneki olmadan */
  data: string;
}

export interface StructuredCallOptions<T> {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  /** Şemanın JSON Schema adı — sağlayıcı tarafında araç/response-format adı olarak kullanılır. */
  schemaName: string;
  images?: ImageInput[];
  maxOutputTokens?: number;
  temperature?: number;
  /** Yalnız reasoning modelleri (ör. gpt-5.x) destekler; diğer sağlayıcılar yok sayar. */
  reasoningEffort?: "low" | "medium" | "high";
}

export interface ImageGenerateOptions {
  model: string;
  prompt: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "low" | "medium" | "high";
  /** Yalnız seed destekleyen sağlayıcılarda (fal.ai) anlamlıdır; gpt-image-1 yok sayar. */
  seed?: number;
}

export interface ImageGenerateResult {
  mimeType: "image/png";
  /** base64, data: öneki olmadan */
  data: string;
  /** Yalnız seed destekleyen sağlayıcılar (ör. fal.ai/Flux) doldurur; gpt-image-1 seed sunmuyor. */
  seed?: number;
}

/**
 * "Regenerate everything" yerine "yalnız hatalı alanı düzelt" (kullanıcı
 * mimarisi, madde 18) — RED alan bir denemeden sonra sıfırdan yeni bir
 * sahne üretmek yerine ÖNCEKİ görseli girdi olarak verip yalnız somut
 * hatayı düzeltmesini istemek, kompozisyon/kamera/aydınlatmayı korur.
 * gpt-image-1 seed parametresi sunmuyor (yerel bir diffusion checkpoint
 * değil) — bu, o eksikliğin yerine geçen tek gerçekçi mekanizma: OpenAI'nin
 * `images.edit` uç noktası önceki görseli temel alır.
 */
export interface ImageEditOptions {
  model: string;
  /** Düzeltilecek önceki görsel, base64 (data: öneki olmadan). */
  baseImage: string;
  baseImageMimeType: "image/png";
  /** Yalnız neyin değişmesi gerektiğini anlatan kısa, hedefli talimat. */
  prompt: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "low" | "medium" | "high";
  /** Önceki üretimin seed'i (varsa) — seed destekleyen sağlayıcılarda kompozisyon sürekliliği için yeniden kullanılır. */
  seed?: number;
}

/**
 * Bir provider örneğinin kuruluşundan bu yana yaptığı tüm çağrıların token
 * toplamı — Faz 3 maliyet hedefi ("soru paketi başına ~$1") için gerçek
 * kullanım verisine ihtiyaç duyulunca eklendi (bkz. proje hafızası). Tahmine
 * dayalı değil: her sağlayıcı kendi API yanıtındaki `usage` alanından okur.
 */
export interface UsageStats {
  textInputTokens: number;
  textOutputTokens: number;
  /** Yalnız generateImage (gpt-image-1): metin+görsel giriş token'ları. */
  imageInputTokens: number;
  imageOutputTokens: number;
  imageCount: number;
}

export function emptyUsageStats(): UsageStats {
  return { textInputTokens: 0, textOutputTokens: 0, imageInputTokens: 0, imageOutputTokens: 0, imageCount: 0 };
}

/**
 * Tek arayüz, iki bağımsız sağlayıcı: Solver A ve Solver B'nin FARKLI
 * sağlayıcılarda çalışması Section 9'un zorunlu koşulu — aynı modelin iki kez
 * çağrılması bağımsız doğrulama sayılmaz.
 */
export interface LlmProvider {
  readonly name: string;
  /** Ham metin/görsel girdiden zod şemasına uyan yapılandırılmış çıktı üretir. */
  generateStructured<T>(opts: StructuredCallOptions<T>): Promise<T>;
  /** Yalnız OpenAI (gpt-image-1) uygular; diğer sağlayıcılar NotSupportedError fırlatır. */
  generateImage(opts: ImageGenerateOptions): Promise<ImageGenerateResult>;
  /** Yalnız OpenAI (gpt-image-1) uygular; diğer sağlayıcılar NotSupportedError fırlatır. */
  editImage(opts: ImageEditOptions): Promise<ImageGenerateResult>;
  /** Bu örneğin kuruluşundan bu yana biriken token kullanımı. */
  getUsage(): UsageStats;
}

export class NotSupportedError extends Error {
  constructor(provider: string, capability: string) {
    super(`${provider} bu yeteneği desteklemiyor: ${capability}`);
    this.name = "NotSupportedError";
  }
}

/** Yapılandırılmış çıktı şema doğrulamasını 2 deneme sonunda da geçemediğinde fırlatılır. */
export class StructuredOutputError extends Error {
  constructor(
    public readonly schemaName: string,
    public readonly attempts: number,
    public readonly lastRawOutput: string,
    public readonly zodErrors: string
  ) {
    super(
      `${schemaName} şeması ${attempts} denemede doğrulanamadı. Zod hataları: ${zodErrors}`
    );
    this.name = "StructuredOutputError";
  }
}
