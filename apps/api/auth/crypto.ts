import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Section 13 #3 (BYOK): her yayınevi kendi OpenAI/Anthropic anahtarını
 * getiriyor — bu anahtarlar `publisher_api_key.sifreli_anahtar`da düz metin
 * DEĞİL, AES-256-GCM ile şifreli tutulur. Anahtar türetimi: env'deki
 * `API_KEY_ENCRYPTION_SECRET` (herhangi bir uzunlukta) sha256 ile tam 32
 * bayta indirgenir — AES-256 sabit anahtar uzunluğu gerektirir.
 */
function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(plain: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptApiKey(encrypted: string, secret: string): string {
  const [ivB64, tagB64, dataB64] = encrypted.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Şifreli API anahtarı biçimi geçersiz (iv.tag.data bekleniyor)");
  }
  const key = deriveKey(secret);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return plain.toString("utf8");
}
