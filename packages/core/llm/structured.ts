import { ZodError } from "zod";
import type { LlmProvider, StructuredCallOptions } from "./provider.js";
import { StructuredOutputError } from "./provider.js";

/**
 * provider.generateStructured() tek denemede zod hatası veya JSON parse
 * hatasıyla başarısız olabilir; burada üstüne 2 kez daha deneriz (toplam 3),
 * her denemede modele önceki hatayı gösteririz. Section 9: "şema dışı
 * çıktıda 2 kez retry, sonra aşamayı DOĞRULANAMADI ile kapat" — burada
 * "kapatma" kararı çağıran pipeline aşamasına bırakılır; biz yalnız
 * StructuredOutputError fırlatırız, sessizce geçmeyiz.
 */
export async function callStructured<T>(
  provider: LlmProvider,
  opts: StructuredCallOptions<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  let lastRaw = "";
  let userPrompt = opts.userPrompt;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await provider.generateStructured({ ...opts, userPrompt });
    } catch (err) {
      lastError = err;
      if (err instanceof RawOutputCapturedError) {
        lastRaw = err.raw;
      }
      const message = describeError(err);
      userPrompt =
        opts.userPrompt +
        `\n\n--- ÖNCEKİ DENEME (${attempt + 1}) BAŞARISIZ ---\n` +
        `Şema: ${opts.schemaName}\nHata: ${message}\n` +
        `Bu hatayı düzelt ve YALNIZ şemaya uyan tam JSON döndür.`;
    }
  }

  throw new StructuredOutputError(
    opts.schemaName,
    maxRetries + 1,
    lastRaw,
    describeError(lastError)
  );
}

function describeError(err: unknown): string {
  if (err instanceof ZodError) return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Provider implementasyonları, ham (doğrulanmamış) model çıktısını
 * StructuredOutputError/ZodError fırlatırken kaybetmemek için bu hatayı
 * kullanabilir — callStructured onu retry mesajına dahil eder.
 */
export class RawOutputCapturedError extends Error {
  constructor(public readonly raw: string, cause: unknown) {
    super(describeError(cause));
    this.name = "RawOutputCapturedError";
  }
}
