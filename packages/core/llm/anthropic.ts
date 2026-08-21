import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
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
import { schemaToJsonSchema } from "./json-schema.js";
import { toAnthropicSafeSchema } from "./anthropic-safe-schema.js";

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly usage: UsageStats = emptyUsageStats();

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? "") {
    this.client = new Anthropic({ apiKey });
  }

  getUsage(): UsageStats {
    return { ...this.usage };
  }

  async generateStructured<T>(opts: StructuredCallOptions<T>): Promise<T> {
    const jsonSchema = toAnthropicSafeSchema(schemaToJsonSchema(opts.schema));
    const content: ContentBlockParam[] = [
      ...(opts.images ?? []).map(
        (img): ContentBlockParam => ({
          type: "image",
          source: { type: "base64", media_type: img.mimeType, data: img.data },
        })
      ),
      { type: "text", text: opts.userPrompt },
    ];

    const res = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxOutputTokens ?? 8000,
      temperature: opts.temperature,
      system: opts.systemPrompt,
      output_config: { format: { type: "json_schema", schema: jsonSchema } },
      messages: [{ role: "user", content }],
    });

    if (res.usage) {
      this.usage.textInputTokens += res.usage.input_tokens;
      this.usage.textOutputTokens += res.usage.output_tokens;
    }
    const textBlock = res.content.find((b) => b.type === "text");
    if (!textBlock) {
      throw new Error(`Anthropic yanıtında metin bloğu yok (stop_reason: ${res.stop_reason})`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (err) {
      throw new Error(`Anthropic çıktısı JSON değil: ${(err as Error).message}\nHam: ${textBlock.text.slice(0, 500)}`);
    }
    return opts.schema.parse(parsed) as T;
  }

  async generateImage(_opts: ImageGenerateOptions): Promise<ImageGenerateResult> {
    throw new NotSupportedError(this.name, "generateImage");
  }

  async editImage(_opts: ImageEditOptions): Promise<ImageGenerateResult> {
    throw new NotSupportedError(this.name, "editImage");
  }
}
