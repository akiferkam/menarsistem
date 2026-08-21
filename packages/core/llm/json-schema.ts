import { toJSONSchema, type ZodType } from "zod";

/**
 * zod v4'ün kendi native toJSONSchema()'sı — ayrı bir zod-to-json-schema
 * paketine gerek yok (o paket hâlâ zod/v3 tipine göre yazılmış, v4 ile tip
 * uyumu belirsiz). reused:"inline" ile $ref/$defs üretimini kapatıyoruz;
 * hem OpenAI'ın strict json_schema modu hem Anthropic'in output_config'i
 * $ref çözümlemesinde tutarsız davranabiliyor — inline daha güvenli.
 */
export function schemaToJsonSchema(schema: ZodType): Record<string, unknown> {
  return toJSONSchema(schema, {
    target: "draft-2020-12",
    reused: "inline",
    unrepresentable: "any",
  }) as Record<string, unknown>;
}
