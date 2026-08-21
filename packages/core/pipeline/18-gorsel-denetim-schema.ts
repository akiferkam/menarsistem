import { z } from "zod";

/**
 * Serbest metin `nedenler` tek başına RED'in NEDEN türünü ayırt etmiyordu —
 * her düzeltme denemesi "her şeyi yeniden anlat" şeklinde genel bir talimata
 * dönüşüyordu (kullanıcı mimarisi madde 21 "hata sınıflandır → yalnız
 * hatalı alanı revize et"). Bu kod, hangi düzeltme talimatının (17-gorsel-uret.ts
 * editImage çağrısında) hedefleneceğini belirler — dar, MENAR'ın gerçekten
 * ayırt edebileceği bir alt küme (görsel modeli local diffusion değil,
 * ControlNet/segmentasyon yok; yalnız tek bir vision-LLM bakışıyla makul
 * biçimde ayırt edilebilecek kategoriler seçildi).
 */
export const GorselHataKoduSchema = z.enum([
  "METIN_ARTEFAKTI",
  "VERI_UYUSMAZLIGI",
  "ANLAM_UYUSMAZLIGI",
  "NESNE_UYUMSUZLUGU",
  "YAPAY_GORUNUM",
  "ASIRI_KARMASA",
  "KOMPOZISYON_HATASI",
]);

/** node "54 - AŞAMA 2: Görsel–Manifest Denetimi"nin Responses API JSON şemasının portu. */
export const GorselDenetimLlmSchema = z.object({
  status: z.enum(["PASS", "RED", "DOĞRULANAMADI"]),
  yazi_var_mi: z.boolean(),
  islev: z.string(),
  nedenler: z.array(z.string()),
  hata_kodlari: z.array(GorselHataKoduSchema).nullish(),
  // 0-100: iki aday üretildiğinde (bkz. 20-baglam-gorseli.ts) ikisi de PASS
  // olursa hangisinin kullanılacağına karar vermek için — kullanıcı
  // mimarisi madde 19/42'nin puanlama/otomatik-seçim fikrinin karşılığı.
  kalite_puani: z.number().min(0).max(100).nullish(),
});

export type GorselHataKodu = z.infer<typeof GorselHataKoduSchema>;
export type GorselDenetimLlmOutput = z.infer<typeof GorselDenetimLlmSchema>;
