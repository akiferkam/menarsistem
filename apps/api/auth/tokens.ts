import { createHash, randomBytes } from "node:crypto";

/** Öğretmen bearer token'ı — ham hâli yalnız oluşturma anında bir kez döner, DB'de hiç saklanmaz. */
export function generateBearerToken(): string {
  return randomBytes(32).toString("base64url");
}

/** DB'de saklanan/karşılaştırılan tek şey bu hash — ham token sızarsa bile DB tek başına yetmez. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}
