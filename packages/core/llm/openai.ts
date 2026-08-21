import OpenAI, { toFile } from "openai";
import type { ResponseInput, ResponseInputContent } from "openai/resources/responses/responses.mjs";
import type {
  ImageEditOptions,
  ImageGenerateOptions,
  ImageGenerateResult,
  LlmProvider,
  StructuredCallOptions,
  UsageStats,
} from "./provider.js";
import { emptyUsageStats } from "./provider.js";
import { schemaToJsonSchema } from "./json-schema.js";
import { toOpenAiStrictSchema } from "./openai-strict-schema.js";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly usage: UsageStats = emptyUsageStats();

  constructor(apiKey: string = process.env.OPENAI_API_KEY ?? "") {
    this.client = new OpenAI({ apiKey });
  }

  getUsage(): UsageStats {
    return { ...this.usage };
  }

  async generateStructured<T>(opts: StructuredCallOptions<T>): Promise<T> {
    const jsonSchema = toOpenAiStrictSchema(schemaToJsonSchema(opts.schema));
    const content: ResponseInputContent[] = [
      ...(opts.images ?? []).map(
        (img): ResponseInputContent => ({
          type: "input_image",
          image_url: `data:${img.mimeType};base64,${img.data}`,
          detail: "high",
        })
      ),
      { type: "input_text", text: opts.userPrompt },
    ];
    const input: ResponseInput = [{ role: "user", content }];
    const format = { type: "json_schema" as const, name: opts.schemaName, schema: jsonSchema, strict: true };

    const reasoning = opts.reasoningEffort ? { effort: opts.reasoningEffort } : undefined;

    let res;
    try {
      res = await this.client.responses.create({
        model: opts.model,
        instructions: opts.systemPrompt,
        input,
        max_output_tokens: opts.maxOutputTokens,
        temperature: opts.temperature,
        reasoning,
        text: { format },
      });
    } catch (err) {
      // node 10M'in kaynaktaki temperature:0.2 ayarı (bkz. sources/*_workflow.json
      // node 10M) burada korunur — ama bazı yeni modeller (ör. gpt-5.6-sol,
      // reasoning ağırlıklı) bu parametreyi tamamen reddediyor. Statik bir model
      // adı listesi tutmak yerine, tam bu hatayı yakalayıp temperature'sız tek
      // seferlik bir yeniden deneme yapılır — sabit değer sessizce atılmaz.
      const desteklenmiyor =
        opts.temperature !== undefined &&
        err instanceof Error &&
        /temperature/i.test(err.message) &&
        /not supported/i.test(err.message);
      if (!desteklenmiyor) throw err;
      res = await this.client.responses.create({
        model: opts.model,
        instructions: opts.systemPrompt,
        input,
        max_output_tokens: opts.maxOutputTokens,
        reasoning,
        text: { format },
      });
    }

    if (res.error) {
      throw new Error(`OpenAI Responses hatası: ${res.error.message}`);
    }
    if (res.usage) {
      this.usage.textInputTokens += res.usage.input_tokens;
      this.usage.textOutputTokens += res.usage.output_tokens;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.output_text);
    } catch (err) {
      throw new Error(
        `OpenAI çıktısı JSON değil: ${(err as Error).message}\nHam: ${res.output_text.slice(0, 500)}`
      );
    }
    return opts.schema.parse(parsed) as T;
  }

  async generateImage(opts: ImageGenerateOptions): Promise<ImageGenerateResult> {
    const res = await this.client.images.generate({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      quality: opts.quality ?? "high",
      output_format: "png",
      background: "opaque",
      moderation: "auto",
      n: 1,
    });

    const first = res.data?.[0];
    if (!first?.b64_json) {
      throw new Error("OpenAI görsel yanıtında b64_json alanı yok");
    }
    if (res.usage) {
      this.usage.imageInputTokens += res.usage.input_tokens;
      this.usage.imageOutputTokens += res.usage.output_tokens;
    }
    this.usage.imageCount += 1;
    return { mimeType: "image/png", data: first.b64_json };
  }

  async editImage(opts: ImageEditOptions): Promise<ImageGenerateResult> {
    const image = await toFile(Buffer.from(opts.baseImage, "base64"), "onceki-gorsel.png", {
      type: opts.baseImageMimeType,
    });
    const res = await this.client.images.edit({
      model: opts.model,
      image,
      prompt: opts.prompt,
      size: opts.size,
      quality: opts.quality ?? "high",
      output_format: "png",
      background: "opaque",
      n: 1,
    });

    const first = res.data?.[0];
    if (!first?.b64_json) {
      throw new Error("OpenAI görsel düzenleme yanıtında b64_json alanı yok");
    }
    if (res.usage) {
      this.usage.imageInputTokens += res.usage.input_tokens;
      this.usage.imageOutputTokens += res.usage.output_tokens;
    }
    this.usage.imageCount += 1;
    return { mimeType: "image/png", data: first.b64_json };
  }
}
