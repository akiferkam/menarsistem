import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { GorselDenetimLlmSchema } from "./18-gorsel-denetim-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { GorselDenetimi } from "./types.js";
import type { GorselUretimSonucu } from "./17-gorsel-uret.js";

const GORSEL_DENETIM_SYSTEM =
  "Sen MENAR AŞAMA 2 görsel-manifest son kapısı denetçisisin. Fiilen görmediğin bir şeyi PASS " +
  "yazma; emin değilsen DOĞRULANAMADI yaz. RED verirsen nedenler'deki her cümleye karşılık " +
  "hata_kodlari'na EN UYGUN kodu ekle (METIN_ARTEFAKTI: izinsiz BÜYÜK/BASKIN yazı, okunaklı sayı/veri " +
  "ifadesi, marka logosu, QR kod veya filigran — küçük/arka plandaki genel çevresel yazı/tabela bu koda " +
  "girmez; " +
  "VERI_UYUSMAZLIGI: izin verilen değerlerden biri eksik/yanlış/okunaksız; ANLAM_UYUSMAZLIGI: " +
  "sahne planlanan bilgi rolünü taşımıyor; NESNE_UYUMSUZLUGU: nesne sayısı/oranı/KONUMU (soldaki/sağdaki, " +
  "üstteki/alttaki gibi metindeki konumsal iddialarla görseldeki gerçek yerleşim çelişiyor) soru metniyle " +
  "çelişiyor; YAPAY_GORUNUM: yapay zekâ görseli izlenimi — aşırı simetrik/steril yerleşim, havada " +
  "asılı/bağlantısız nesneler, plastik/mumsu yüzey parlaklığı, karikatürize oran; ASIRI_KARMASA: " +
  "dekoratif kalabalık, gereksiz nesne yoğunluğu; KOMPOZISYON_HATASI: kadraj/perspektif/kesme " +
  "sorunu). kalite_puani'nı 0-100 aralığında, PASS ise genelde 70+, RED ise sorunun ciddiyetine " +
  "göre ver. Yalnız şemaya uygun JSON döndür.";

export interface GorselDenetimDeps {
  provider: LlmProvider;
  model: string;
}

/**
 * node "54 - AŞAMA 2: Görsel–Manifest Denetimi" + "55 - Görsel Denetimini
 * Birleştir"in portu. Section 15: model kendi kendini PASS ilan edemez —
 * bu görsel-tabanlı denetim de diğer tüm CheckResult'lar gibi yalnız kanıt
 * (burada: fiilen görülen görsel) üzerinden PASS/RED/DOĞRULANAMADI üretir.
 */
export async function denetleGorsel(
  aday: GeneratorOutput,
  gorsel: GorselUretimSonucu,
  deps: GorselDenetimDeps
): Promise<GorselDenetimi> {
  const veriGosterimi = aday.baglam_katmani?.gorsel_veri_gosterimi ?? "YOK";
  const gosterilecekDegerler = aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? [];
  const veriGosteriliyor = veriGosterimi !== "YOK" && gosterilecekDegerler.length > 0;

  const userPrompt =
    "AŞAMA 2 — GÖRSEL/MANİFEST SON KAPISI. Bu görsel yalnız BAĞLAM katmanıdır.\n\n" +
    `BAĞLAM PLANI: ${JSON.stringify(aday.baglam_katmani ?? {})}\n` +
    `MANİFEST (görseldeki verinin doğrulama kaynağı): ${JSON.stringify(aday.gorsel_veri_manifesti ?? {})}\n\n` +
    "DENETLE:\n" +
    (veriGosteriliyor
      ? `1. Görselde YALNIZ şu değerler görünmeli, başka hiçbir yazı/rakam/etiket/logo/filigran olmamalı: ` +
        `${gosterilecekDegerler.join(" | ")}. Değerlerden biri eksikse, yanlışsa, bulanık/okunaksızsa veya ` +
        `fazladan bir rakam/etiket varsa RED.\n`
      : "1. Görselde okunaklı bir SAYI/RAKAM, veri gibi görünen bir ifade, MARKA LOGOSU, QR kod veya filigran " +
        "varsa RED. Küçük, arka planda kalan, veriyle karıştırılamayacak genel çevresel yazı/tabela (ör. bir " +
        "binanın üzerindeki genel bir isim, bir dükkân tabelası, mimari bir yazı) TEK BAŞINA RED nedeni " +
        "DEĞİLDİR — yalnız BÜYÜK/BASKIN/dikkat çekici bir yazı veya sayısal/veri niteliğinde bir ifade RED " +
        "sebebidir (kullanıcı geri bildirimi: zengin/gerçekçi bağlam sahnelerinde bu tür küçük çevresel " +
        "detaylar kaçınılmaz ve pedagojik risk taşımıyor, katı yasak gereksiz RED oranını artırıyordu).\n") +
    "2. Sahne planlanan bilgi rolünü taşıyor mu?\n" +
    "3. Nesne sayıları, oranlar ve düzenek soru metniyle çelişiyor mu?\n" +
    "4. KONUM/SIRA İDDİALARI: soru metninde 'soldaki'/'sağdaki', 'üstteki'/'alttaki', 'birinci'/'ikinci' " +
    "gibi bir konumsal referans varsa (bkz. BAĞLAM PLANI'ndaki on_plan/orta_plan/arka_plan sırası), " +
    "görseldeki GERÇEK konum bununla eşleşiyor mu? Eşleşmiyorsa (ör. metin 'soldaki' diyor ama görselde " +
    "o nesne sağda duruyor) RED — bu, öğrenciyi yanlış veriye yönlendiren ciddi bir hatadır.\n" +
    "5. Açık zemin, ders kitabı estetiği ve dekoratif kalabalık olmaması beklenir.\n" +
    "Emin değilsen DOĞRULANAMADI.";

  const v = await callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: GORSEL_DENETIM_SYSTEM,
    userPrompt,
    schema: GorselDenetimLlmSchema,
    schemaName: "GorselDenetimi",
    images: [{ mimeType: gorsel.mimeType, data: gorsel.data }],
  });

  return {
    status: v.status,
    nedenler: v.nedenler,
    yaziVarMi: v.yazi_var_mi,
    islev: v.islev,
    hataKodlari: v.hata_kodlari ?? [],
    kalitePuani: v.kalite_puani ?? null,
  };
}

/** node 55'in `asama2_satiri` metin biçimlendirmesinin portu. */
export function asama2Satiri(denetim: GorselDenetimi): string {
  return `AŞAMA 2 (GÖRSEL-MANİFEST) DENETİMİ: ${denetim.status} — ${denetim.nedenler.join("; ") || "manifest ile karşılaştırıldı"}`;
}
