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
  /**
   * RENK/MİKTAR kodlamasıyla ayırt edilen nesne gruplarının (bkz.
   * `gorsel_veri_manifesti.renk_miktar_sayimlari`) HER biri için modelin
   * görselde GERÇEKTEN TEK TEK SAYARAK bulduğu adet — kendi status/PASS
   * yargısından BAĞIMSIZ, ham bir sayım. Canlı testte görüldü: model
   * kendisine önceden verilen "beklenen 4 ped" bilgisini görmeden önce
   * saysaydı bile, verilen bu bilgiyi görüp doğrulamak yerine PARAFRAZ
   * ETME eğiliminde — bu alan onu status'tan ayırarak `denetleGorsel()`in
   * kod tarafında BAĞIMSIZ, deterministik bir karşılaştırma yapmasını sağlar.
   */
  sayilan_nesneler: z.array(z.object({ nesne: z.string(), sayilan_adet: z.number().int().min(0) })).nullish(),
  // 0-100: iki aday üretildiğinde (bkz. 20-baglam-gorseli.ts) ikisi de PASS
  // olursa hangisinin kullanılacağına karar vermek için — kullanıcı
  // mimarisi madde 19/42'nin puanlama/otomatik-seçim fikrinin karşılığı.
  kalite_puani: z.number().min(0).max(100).nullish(),
  // Üretici overlay_konumlari'nı fotoğraf üretilmeden ÖNCE (bir tahmin
  // olarak) belirliyor — canlı testte görüldü, gerçek görselde boş bölge
  // her zaman tam o tahmin edilen yere düşmüyor (ör. tahmin edilen y=%78
  // iken gerçek etiket görselde daha solda/yukarıda çıktı), bindirilen metin
  // bölgenin biraz dışına taşabiliyor. Bu alan, denetleyen vision-LLM'in
  // GÖRDÜĞÜ (tahmin değil, GERÇEK) boş bölge merkezini raporlamasını sağlar
  // — `bosBirakilmisOlmali` true iken doldurulur, sırası ve uzunluğu
  // `gorselde_gosterilecek_degerler`/`overlay_konumlari` ile BİREBİR aynı
  // olmalı. 20-baglam-gorseli.ts bindirmede bunu (varsa) önceden tahmin
  // edilen overlay_konumlari'na TERCİHEN kullanır.
  // Kullanıcı geri bildirimi (2026-09-28): bindirilen metin/kart HER ZAMAN
  // ekrana paralel/düz basılıyordu — fotoğraftaki cihaz ekranı perspektifle
  // (kamera açısıyla) eğik/döndürülmüş durduğunda ("ekran yamuk, yazı düz")
  // bindirme yapıştırılmış gibi duruyordu. Her konumun kendi `aci_derece`si,
  // denetçinin GERÇEK görselde gördüğü ekran/etiket yüzeyinin yataydan ne
  // kadar döndüğünü (derece, saat yönü pozitif) tahmin etmesini sağlar —
  // `render/gorsel-overlay.ts` bindirdiği kartı bu açıyla döndürerek yüzeye
  // oturtur. Emin değilse veya yüzey zaten düzse 0 yazmalı, ASLA rastgele
  // bir açı uydurmamalı.
  tespit_edilen_konumlar: z
    .array(z.object({ x_yuzde: z.number().min(0).max(100), y_yuzde: z.number().min(0).max(100), aci_derece: z.number().min(-45).max(45).nullish() }))
    .nullish(),
});

export type GorselHataKodu = z.infer<typeof GorselHataKoduSchema>;
export type GorselDenetimLlmOutput = z.infer<typeof GorselDenetimLlmSchema>;
