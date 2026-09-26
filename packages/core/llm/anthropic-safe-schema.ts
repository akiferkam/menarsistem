/**
 * Anthropic'in yapılandırılmış çıktı JSON Schema'sı dizi uzunluk
 * kısıtlarını neredeyse hiç desteklemiyor: `minItems` yalnız 0 veya 1
 * olabilir, `maxItems` ise tamamen yasak ("property 'maxItems' is not
 * supported" — ilk denemede yalnız minItems hatası görüldü, o giderilince
 * maxItems hatası ayrı bir 400 olarak çıktı, ikisi de burada gideriliyor).
 * `z.array(...).length(5)` gibi tam uzunluklu diziler
 * (`06-solver-schema.ts`'in `secenek_denetimi`si) `minItems:5,maxItems:5`
 * üretir — canlı modda ilk kez UNSUPPORTED/çift-LLM yoluna düşen bir soru
 * bunu yakaladı (Solver A/B daha önce hiç gerçek bir çağrıyla test
 * edilmemişti). Kaldırılan kısıtların yerine geçen gerçek uzunluk denetimi
 * zod'un kendi `.parse()`ı üzerinden yanıt alındıktan sonra hâlâ çalışır —
 * model tam 5 öğe döndürmezse `callStructured`in mevcut retry döngüsü
 * devreye girer, sessizce geçmez.
 *
 * Aynı gerekçeyle `integer`/`number` tipli alanlardaki `minimum`/`maximum`
 * (ve `exclusiveMinimum`/`exclusiveMaximum`) de kaldırılıyor — 2026-08-23'te
 * görsel denetimini (bkz. 19-gorsel-denetim.ts) Anthropic'e geçirirken
 * `z.number().int().min(0)` gibi bir alan ("sayilan_adet") "For 'integer'
 * type, properties maximum, minimum are not supported" hatasıyla 400
 * döndürdü. Aynı ilke: kısıt kaldırılınca Zod'un kendi `.parse()`ı hâlâ
 * gerçek doğrulamayı yapıyor, model sınır dışı bir sayı döndürürse retry
 * devreye girer.
 */
export function toAnthropicSafeSchema(schema: Record<string, unknown>): Record<string, unknown>;
export function toAnthropicSafeSchema(schema: unknown): unknown;
export function toAnthropicSafeSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toAnthropicSafeSchema);
  if (schema === null || typeof schema !== "object") return schema;

  const node: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    node[key] = toAnthropicSafeSchema(value);
  }

  if (node.type === "array") {
    if (typeof node.minItems === "number" && node.minItems > 1) delete node.minItems;
    delete node.maxItems;
  }
  if (node.type === "integer" || node.type === "number") {
    delete node.minimum;
    delete node.maximum;
    delete node.exclusiveMinimum;
    delete node.exclusiveMaximum;
  }

  return node;
}
