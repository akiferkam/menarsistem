/**
 * `LLM_PROVIDER_MODE=mock` için sabit, şemaya uygun bir üretici yanıtı.
 * Gerçek API anahtarı olmadan `pnpm mays generate` zincirinin (validate →
 * generate → preflight → otopsi) gerçekten bağlı çalıştığını göstermek
 * içindir — Section 11: "LLM çağrıları testte mock'lanacak; deterministik
 * denetimler gerçek çalışacak." `dogrulama_manifesti` bilerek
 * NUMERIC_EXPRESSION: otopsi aşaması bu sabit yanıtla da gerçek
 * `verify/solver-v25.ts`i çalıştırır, hiçbir Solver A/B LLM çağrısı
 * gerekmez. Brief Bölüm 11'in `fixtures/` altındaki gerçek kabul testi
 * örnekleriyle (rota optimizasyonu, vektörler) karıştırılmamalı — bu yalnız
 * CLI kablolamasını doğrulayan sentetik bir örnektir.
 */
/** node 23 (Yayın Kurulu) için sabit, şemaya uygun bir yanıt — mock modda gerçek çağrı yapılmaz. */
export const MOCK_BOARD_RESPONSE = {
  kazanim_uyumu: "PASS",
  tymm_uyumu: "PASS",
  ders_hakemi: "PASS",
  olcme_uzmani: "PASS",
  bas_editor: "PASS",
  yayin_kurulu: "PASS",
  puanlama: {
    kazanim_uyumu: 1.5,
    matematiksel_dogruluk: 2,
    gorsel_islevsellik: 1.5,
    bilgi_tekrarsizligi: 1,
    celdirici_kalitesi: 1.2,
    iq_uygunlugu: 0.5,
    baglam_islevselligi: 1,
    dil_yayin_duzeni: 0.5,
  },
};

/**
 * node 50P'nin (görsel prompt ajanı) sabit, şemaya uygun yanıtı — mock modda
 * gerçek çağrı yapılmaz. `MOCK_ADAY_RESPONSE.baglam_katmani.gerekli=true`
 * olduğu için `pnpm mays generate` mock akışı node 40-59'un bağlam görseli
 * zincirini de (ajan → üretim → AŞAMA 2 denetimi) gerçekten çalıştırır.
 */
export const MOCK_GORSEL_PROMPT_RESPONSE = {
  prompt: "Bir sınıf ortamında üslü sayı kartlarıyla oynayan öğrenciler, sade ders kitabı estetiğinde.",
  gorsel_ailesi: "MOCK_SINIF_SAHNESI",
  boyut: "3D",
  gerekce: "Bağlam katmanı sahneyi somutlaştırmak için gerekli görüldü.",
};

/** node 54'ün (AŞAMA 2 görsel-manifest denetimi) sabit, şemaya uygun yanıtı. */
export const MOCK_GORSEL_DENETIM_RESPONSE = {
  status: "PASS",
  yazi_var_mi: false,
  islev: "Sahne bağlam katmanını yazı/rakam içermeden anlatıyor.",
  nedenler: [],
};

export const MOCK_ADAY_RESPONSE = {
  status: "PASS",
  baglam_ailesi_kodu: "USLU_SAYI_ORNEK",
  cozum_dna_kodu: "USLU_CARPMA",
  gorsel_veri_manifesti: {
    manifest_id: "MOCK-1",
    kullanilan_sayilar: ["2", "3", "8", "6", "9", "12", "16"],
    tablo: {
      caption: "Üslü Sayılar",
      headers: ["Taban", "Üs", "Sonuç"],
      rows: [["2", "3", "8"]],
    },
  },
  baglam_katmani: {
    gerekli: true,
    sahne: "Sınıf ortamında üslü sayı kartları",
    boyut: "3D",
    gorsel_ailesi: "MOCK_SINIF_SAHNESI",
  },
  veri_katmani: {
    gerekli: true,
    tur: "TABLO",
    baslik: "Üslü Sayılar Tablosu",
  },
  sorular: [
    {
      kok: "2 üzeri 3 ifadesinin değeri kaçtır?",
      secenekler: ["8", "6", "9", "12", "16"],
      dogru_secenek: "A",
      dogru_cevap: "8",
      cozum_adimlari: ["2 üzeri 3 = 2 * 2 * 2 = 8"],
      celdirici_hata_yollari: [
        "DOĞRU CEVAP",
        "taban ile üssü çarpma hatası (2*3)",
        "üssü bir artırma hatası",
        "2 üzeri 2'yi 3 ile çarpma hatası",
        "2 üzeri 4 ile karıştırma hatası",
      ],
      ogrenme_becerisi: "Üslü ifadelerde işlem yaparak sonucu yorumlayabilme.",
      iq: { A: 1, B: 0, C: 0, D: 0, E: 0, F: 0 },
      dogrulama_manifesti: {
        solver_type: "NUMERIC_EXPRESSION",
        expression: "2 * 2 * 2",
        options: [
          { harf: "A", deger: 8 },
          { harf: "B", deger: 6 },
          { harf: "C", deger: 9 },
          { harf: "D", deger: 12 },
          { harf: "E", deger: 16 },
        ],
        claimed_answer: "A",
      },
    },
  ],
};
