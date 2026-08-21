import { createFalClient, type FalClient } from "@fal-ai/client";
import {
  NotSupportedError,
  emptyUsageStats,
  type ImageEditOptions,
  type ImageGenerateOptions,
  type ImageGenerateResult,
  type LlmProvider,
  type StructuredCallOptions,
  type UsageStats,
} from "./provider.js";

/**
 * gpt-image-1 (OpenAI, hosted) seed/ControlNet/LoRA sunmuyor — bu, kullanıcı
 * mimarisinin "kompozisyonu kilitle, yalnız hatalı alanı düzelt" ilkesini
 * (bkz. proje hafızası `menar-mays-gorsel-mimari`) gerçek seed sürekliliğiyle
 * uygulayamıyorduk, yalnız `images.edit`in kaba yaklaşımıyla. fal.ai
 * (Flux modelleri) seed + image-to-image destekliyor — bu provider yalnız
 * `deps.uretim` (bkz. `pipeline/20-baglam-gorseli.ts`) için kullanılır;
 * fal.ai yapılandırılmış JSON/vision-QA çıktısı sağlamadığından
 * `generateStructured` desteklenmez (görsel denetimi hâlâ OpenAI/Anthropic'te
 * kalır).
 */
export class FalProvider implements LlmProvider {
  readonly name = "fal";
  private readonly client: FalClient;
  private readonly usage: UsageStats = emptyUsageStats();

  constructor(apiKey: string = process.env.FAL_API_KEY ?? "") {
    this.client = createFalClient({ credentials: apiKey });
  }

  getUsage(): UsageStats {
    return { ...this.usage };
  }

  async generateStructured<T>(_opts: StructuredCallOptions<T>): Promise<T> {
    throw new NotSupportedError(this.name, "generateStructured");
  }

  async generateImage(opts: ImageGenerateOptions): Promise<ImageGenerateResult> {
    const result = await this.client.subscribe(opts.model, {
      input: {
        prompt: opts.prompt,
        image_size: falImageSize(opts.size),
        num_images: 1,
        output_format: "png",
        ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
      },
    });
    return this.toImageResult(result.data);
  }

  async editImage(opts: ImageEditOptions): Promise<ImageGenerateResult> {
    const blob = new Blob([Buffer.from(opts.baseImage, "base64")], { type: opts.baseImageMimeType });
    const imageUrl = await this.client.storage.upload(blob);

    const result = await this.client.subscribe(opts.model, {
      input: {
        image_url: imageUrl,
        prompt: opts.prompt,
        // 0.5-0.6 aralığı: kompozisyon/ışığı büyük ölçüde korur, ama RED
        // nedenini gerçekten değiştirebilecek kadar da düzenleme uygular —
        // çok düşükse hata düzelmez, çok yüksekse "regenerate everything"e
        // geri döner (bkz. kullanıcı mimarisi madde 18).
        strength: 0.55,
        image_size: falImageSize(opts.size),
        num_images: 1,
        output_format: "png",
        ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
      },
    });
    return this.toImageResult(result.data);
  }

  private async toImageResult(data: unknown): Promise<ImageGenerateResult> {
    const d = data as { images?: { url?: string }[]; seed?: number };
    const url = d.images?.[0]?.url;
    if (!url) throw new Error("fal.ai yanıtında görsel URL'i yok");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`fal.ai görsel indirilemedi: HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());

    this.usage.imageCount += 1;
    return { mimeType: "image/png", data: bytes.toString("base64"), seed: d.seed };
  }
}

/** fal.ai `image_size` alanı {width,height} kabul ediyor — bizim "WxH" string formatımızdan çevirir. */
function falImageSize(size: "1024x1024" | "1536x1024" | "1024x1536"): { width: number; height: number } {
  const [width, height] = size.split("x").map(Number);
  return { width: width!, height: height! };
}
