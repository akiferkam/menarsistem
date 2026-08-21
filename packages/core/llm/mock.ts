import {
  emptyUsageStats,
  type ImageEditOptions,
  type ImageGenerateOptions,
  type ImageGenerateResult,
  type LlmProvider,
  type StructuredCallOptions,
  type UsageStats,
} from "./provider.js";

/**
 * Section 11: "LLM çağrıları testte mock'lanacak; deterministik denetimler
 * gerçek çalışacak." Bu provider gerçek API'ye hiç dokunmaz — pipeline
 * kablolamasını canlı anahtar olmadan smoke-test edebilmek için, ve
 * verify/* modüllerinin sahte olmayan sonuçlar üzerinde çalıştığını
 * göstermek için kullanılır.
 */
export class MockProvider implements LlmProvider {
  readonly name = "mock";
  private readonly queue: unknown[];
  private readonly calls: { schemaName: string; userPrompt: string }[] = [];

  /** responses: her generateStructured çağrısında sırayla dönecek nesneler. */
  constructor(private readonly responses: unknown[]) {
    this.queue = [...responses];
  }

  get callLog() {
    return this.calls;
  }

  /** Gerçek API'ye hiç dokunmaz — maliyet her zaman sıfır. */
  getUsage(): UsageStats {
    return emptyUsageStats();
  }

  async generateStructured<T>(opts: StructuredCallOptions<T>): Promise<T> {
    this.calls.push({ schemaName: opts.schemaName, userPrompt: opts.userPrompt });
    const next = this.queue.shift();
    if (next === undefined) {
      throw new Error(
        `MockProvider: ${opts.schemaName} için kuyrukta yanıt kalmadı (${this.responses.length} tanesi tüketildi)`
      );
    }
    return opts.schema.parse(next) as T;
  }

  async generateImage(_opts: ImageGenerateOptions): Promise<ImageGenerateResult> {
    // 8x8 gürültülü PNG (268 bayt) — testlerde "bir görsel üretildi mi" akışını
    // doğrular; `17-gorsel-uret.ts`in gerçek minimum-uzunluk denetiminden
    // (node 53'ün 100 bayt eşiği) geçebilecek kadar büyük tutulur.
    const noisePng =
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAA00lEQVR4AQHIADf/ADDCSPYK7hQDBMjsmM2PEwKj/KMrUNM2twCh0FrL4FiAo526FEpQ9ouIAeTmv0Hrs6AAJmRmj5e5Gb0HK5EtBwvlYYnP5du+5zJYAIBXET0oAjporZSqDlx+Rm5KcxocNaCUvgB6Yc11NnPHI3qu/UW0X1gofowAyYphDJsA9nvWE70DTGUqmkVetkly8XoAEl43r3hJADgxJpZu0os7RySqn+OPhnb+NsThO+HT+ABO3wZ4V7w6Ivbl2skqrZFCjyY+hDi1m0Cz11sRIMfDdAAAAABJRU5ErkJggg==";
    return { mimeType: "image/png", data: noisePng };
  }

  async editImage(_opts: ImageEditOptions): Promise<ImageGenerateResult> {
    const noisePng =
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAA00lEQVR4AQHIADf/ADDCSPYK7hQDBMjsmM2PEwKj/KMrUNM2twCh0FrL4FiAo526FEpQ9ouIAeTmv0Hrs6AAJmRmj5e5Gb0HK5EtBwvlYYnP5du+5zJYAIBXET0oAjporZSqDlx+Rm5KcxocNaCUvgB6Yc11NnPHI3qu/UW0X1gofowAyYphDJsA9nvWE70DTGUqmkVetkly8XoAEl43r3hJADgxJpZu0os7RySqn+OPhnb+NsThO+HT+ABO3wZ4V7w6Ivbl2skqrZFCjyY+hDi1m0Cz11sRIMfDdAAAAABJRU5ErkJggg==";
    return { mimeType: "image/png", data: noisePng };
  }
}
