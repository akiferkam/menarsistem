/**
 * OpenAI'nin `strict: true` yapılandırılmış çıktı modu, standart JSON
 * Schema'dan daha katı bir kural dayatır: her `object` düğümünde
 * `properties`teki HER anahtar `required` içinde olmalıdır — zod'un
 * `.optional()` alanları (bizim şemamızda `stimulus`, `ikinci_konu` vb.)
 * standart JSON Schema'da yalnızca `required`den düşer, bu OpenAI'de
 * `400 Invalid schema` hatası verir ("'required' is required to be
 * supplied and to be an array including every key in properties").
 * Çözüm: OpenAI'nin kendi dokümante ettiği desen — eski opsiyonel alanları
 * da `required`e ekle, ama tipine `null`ı da ekleyerek "opsiyonel" anlamını
 * koru. Yalnız burada, yalnız OpenAI'ye giden şemaya uygulanır — Anthropic
 * standart JSON Schema kullanır, dokunulmaz (bkz. `anthropic.ts`).
 */
export function toOpenAiStrictSchema(schema: Record<string, unknown>): Record<string, unknown>;
export function toOpenAiStrictSchema(schema: unknown): unknown;
export function toOpenAiStrictSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toOpenAiStrictSchema);
  if (schema === null || typeof schema !== "object") return schema;

  const node: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    node[key] = toOpenAiStrictSchema(value);
  }

  if (node.type === "object" && node.properties && typeof node.properties === "object") {
    const properties = node.properties as Record<string, unknown>;
    const originallyRequired = new Set(Array.isArray(node.required) ? (node.required as string[]) : []);
    for (const key of Object.keys(properties)) {
      if (!originallyRequired.has(key)) {
        properties[key] = makeNullable(properties[key]);
      }
    }
    node.required = Object.keys(properties);
  }

  return node;
}

function makeNullable(propSchema: unknown): unknown {
  if (propSchema === null || typeof propSchema !== "object") return propSchema;
  const s = propSchema as Record<string, unknown>;

  if (Array.isArray(s.anyOf)) {
    const alreadyNullable = (s.anyOf as unknown[]).some(
      (m) => typeof m === "object" && m !== null && (m as Record<string, unknown>).type === "null"
    );
    return alreadyNullable ? s : { ...s, anyOf: [...(s.anyOf as unknown[]), { type: "null" }] };
  }

  if (typeof s.type === "string") {
    return s.type === "null" ? s : { ...s, type: [s.type, "null"] };
  }

  if (Array.isArray(s.type)) {
    const types = s.type as string[];
    return types.includes("null") ? s : { ...s, type: [...types, "null"] };
  }

  // $ref veya tipi olmayan başka bir yapı — anyOf ile sar.
  return { anyOf: [s, { type: "null" }] };
}
