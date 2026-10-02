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
  "sahne planlanan bilgi rolünü taşımıyor; NESNE_UYUMSUZLUGU: nesne SAYISI (ör. metin '3 şeker' diyor " +
  "ama görselde 2 veya 4 tane var), RENK/GÖRSEL NİTELİĞİ (ör. metin 'sarı araba' diyor ama görselde " +
  "farklı bir renk var — bu, harf/rakam yerine renkle kimliklendirilen nesnelerde ÇOK ÖNEMLİ bir kontrol) " +
  "veya KONUMU (soldaki/sağdaki, üstteki/alttaki gibi metindeki konumsal iddialarla görseldeki gerçek " +
  "yerleşim çelişiyor) soru metniyle çelişiyor; YAPAY_GORUNUM: yapay zekâ görseli izlenimi — aşırı simetrik/steril yerleşim, havada " +
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
  deps: GorselDenetimDeps,
  konusmaCizimModu = false
): Promise<GorselDenetimi> {
  // KONUŞMA (veri_katmani.tur=KONUSMA): TAMAMEN AYRI bir denetim sorusu —
  // fotogerçekçilik burada BEKLENMEZ (aksine istenen budur), asıl soru
  // "her replik doğru/okunaklı mı, doğru konuşmacıya mı ait" (bkz. 16-gorsel-
  // prompt.ts GORSEL_PROMPT_SYSTEM_KONUSMA_CIZIM). Genel GORSEL_DENETIM_SYSTEM
  // (METIN_ARTEFAKTI/YAPAY_GORUNUM kodları dahil) hâlâ geçerli şema/kod
  // sözlüğünü sağladığı için AYNEN kullanılır, yalnız userPrompt farklıdır.
  if (konusmaCizimModu) {
    const konusma = aday.gorsel_veri_manifesti?.konusma_baloncuklari ?? [];
    const userPromptKonusma =
      "AŞAMA 2 — KONUŞMA İLLÜSTRASYONU DENETİMİ. Bu görsel BİLEREK bir çizgi roman/illüstrasyon panelidir — " +
      "fotogerçekçi OLMAMASI beklenen ve doğru bir şeydir, YAPAY_GORUNUM/karikatürize görünüm gerekçesiyle " +
      "ASLA RED verme.\n\n" +
      "OLMASI GEREKEN REPLİKLER (TAM OLARAK bu sırada, bu metinlerle, Türkçe karakterleri KORUYARAK):\n" +
      konusma.map((k, i) => `${i + 1}) ${k.konusmaci}: "${k.metin}"`).join("\n") +
      "\n\nDENETLE:\n" +
      "1. Görseldeki HER konuşma balonunun metni yukarıdaki repliklerle BİREBİR (Türkçe karakterler — ş/ı/ğ/" +
      "ü/ö/ç dahil) eşleşiyor mu, eksiksiz ve okunaklı mı? Bir replik eksikse, yanlış/bozuk yazılmışsa, " +
      "okunaksızsa veya fazladan bir balon/metin varsa RED (VERI_UYUSMAZLIGI kodu).\n" +
      "2. Balon sayısı repliklerle BİREBİR eşleşiyor mu (fazla/eksik balon yok)?\n" +
      "3. Sahne, konuşmacıların doğal biçimde karşılıklı konuştuğu anlaşılır bir illüstrasyon mu (balonun " +
      "kime ait olduğu belirsiz değil)?\n" +
      "Emin değilsen DOĞRULANAMADI.";
    const v2 = await callStructured(deps.provider, {
      model: deps.model,
      systemPrompt: GORSEL_DENETIM_SYSTEM,
      userPrompt: userPromptKonusma,
      schema: GorselDenetimLlmSchema,
      schemaName: "GorselDenetimi",
      images: [{ mimeType: gorsel.mimeType, data: gorsel.data }],
    });
    return {
      status: v2.status,
      nedenler: v2.nedenler,
      yaziVarMi: v2.yazi_var_mi,
      islev: v2.islev,
      hataKodlari: v2.hata_kodlari ?? [],
      kalitePuani: v2.kalite_puani ?? null,
      tespitEdilenKonumlar: v2.tespit_edilen_konumlar,
    };
  }

  const veriGosterimi = aday.baglam_katmani?.gorsel_veri_gosterimi ?? "YOK";
  const gosterilecekDegerler = aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? [];
  const overlayKonumlari = aday.baglam_katmani?.overlay_konumlari ?? [];
  // KUVVET_OKU'da veri metin kutusu değil, doğrudan çizgi+etiket olarak
  // taşınabilir (bkz. overlay_cizgileri) — bu durumda gosterilecekDegerler
  // BOŞ kalabilir, tek başına "veri gösterilmiyor" sanılmamalı.
  const overlayCizgileri = aday.baglam_katmani?.overlay_cizgileri ?? [];
  const veriGosteriliyor = veriGosterimi !== "YOK" && (gosterilecekDegerler.length > 0 || overlayCizgileri.length > 0);
  // CIHAZ_EKRANI/TEKNIK_ETIKET/OLCUM_CIZGISI/KUVVET_OKU artık AI'ya
  // çizdirilmiyor (bkz. 16-gorsel-prompt.ts) — gerçek değerler/çizgiler
  // üretim SONRASI deterministik bindiriliyor (20-baglam-gorseli.ts). Bu
  // yüzden AŞAMA 2'nin görevi de değişti: "değerler doğru mu" değil, "AI o
  // bölgeyi gerçekten BOŞ mu bıraktı" sorusu (aksi halde bindirme, AI'nın
  // kendi (muhtemelen yanlış) çiziminin ÜSTÜNE biner). HİBRİT modda (bkz.
  // 20-baglam-gorseli.ts) bu, ÇAĞIRAN TARAFIN geçici olarak overlay_konumlari/
  // overlay_cizgileri'ni BOŞALTILMIŞ bir kopyayla göndermesiyle bilinçli
  // olarak devre dışı bırakılabilir — o turda bu fonksiyon "değer/çizgi doğru
  // mu" sorusunu sorar (aşağıdaki else dallarına düşer).
  const bosBirakilmisOlmali =
    veriGosteriliyor && veriGosterimi !== "NESNE_INDEKSI" && (overlayKonumlari.length > 0 || overlayCizgileri.length > 0);
  const renkMiktarSayimlari = aday.gorsel_veri_manifesti?.renk_miktar_sayimlari ?? [];

  const userPrompt =
    "AŞAMA 2 — GÖRSEL/MANİFEST SON KAPISI. Bu görsel yalnız BAĞLAM katmanıdır.\n\n" +
    `BAĞLAM PLANI: ${JSON.stringify(aday.baglam_katmani ?? {})}\n` +
    `MANİFEST (görseldeki verinin doğrulama kaynağı): ${JSON.stringify(aday.gorsel_veri_manifesti ?? {})}\n\n` +
    (renkMiktarSayimlari.length
      ? "ZORUNLU BAĞIMSIZ SAYIM (ÇOK ÖNEMLİ — sana yukarıda 'beklenen' sayı zaten verildi diye onu " +
        "onaylama/parafraz etme; görseldeki HER kopyayı tek tek, gerçekten sayarak `sayilan_nesneler`e " +
        "kendi bulduğun sayıyı yaz — beklenenle aynı çıkması ZORUNLU DEĞİL, senin görevin yalnız GERÇEKTEN " +
        `GÖRDÜĞÜNÜ raporlamak): ${renkMiktarSayimlari.map((r) => r.nesne).join(", ")}. Her biri için ` +
        "`sayilan_nesneler` dizisine `{nesne: (yukarıdaki isimle BİREBİR AYNI yaz), sayilan_adet: (senin " +
        "saydığın sayı)}` ekle.\n\n"
      : "") +
    "DENETLE:\n" +
    (bosBirakilmisOlmali
      ? `1. Görselde bir dijital ekran/gösterge ya da teknik etiket/panel yüzeyi olmalı, AMA bu yüzey BOŞ/ ` +
        `KAPALI/NÖTR görünmeli — üzerinde HİÇBİR okunaklı rakam, harf, sembol veya işaret OLMAMALI (gerçek ` +
        `değerler üretim sonrası ayrıca bindirilecek, senin görevin AI'nın o bölgeye YANLIŞLIKLA bir şey ` +
        `ÇİZİP ÇİZMEDİĞİNİ yakalamak). Yüzey doluysa/üzerinde herhangi bir işaret varsa RED.` +
        (overlayKonumlari.length
          ? ` Ayrıca bu ${overlayKonumlari.length} boş bölgenin HER birinin GÖRSELDE GERÇEKTE durduğu ` +
            `merkezi (planlanan konum tahmindi, sen GÖRDÜĞÜNÜ raporla) yüzde cinsinden (sol-üst köşe 0,0; ` +
            `sağ-alt köşe 100,100) \`tespit_edilen_konumlar\` dizisine, ${gosterilecekDegerler.join(" | ")} ` +
            `değerleriyle AYNI SIRADA ekle — bu, gerçek metnin görselde YANLIŞ bir yere değil TAM O ` +
            `BÖLGENİN üzerine bindirilmesini sağlar. Her kayda ayrıca \`aci_derece\` ekle: o ekran/etiket ` +
            `yüzeyinin kamera açısı yüzünden YATAYDAN kaç derece döndürülmüş/eğik göründüğünü tahmin et ` +
            `(saat yönü pozitif, ör. sağ kenarı sola göre daha aşağıdaysa pozitif bir açı) — bindirilecek ` +
            `metin/kart bu açıyla döndürülüp yüzeye TAM OTURACAK; yüzey zaten kameraya dik/düz duruyorsa 0 ` +
            `yaz, EMİN DEĞİLSEN 0 yaz, ASLA rastgele bir sayı uydurma.`
          : "") +
        (overlayCizgileri.length
          ? ` KUVVET_OKU/OLCUM_CIZGISI: sahnede ayrıca hiçbir EK ok, çizgi, vektör işareti veya ölçüm ` +
            `kılavuzu ÇİZİLMEMİŞ olmalı — bunlar da üretim SONRASI ayrıca eklenecek, AI'nın kendiliğinden ` +
            `bir ok/çizgi eklemesi (özellikle FİZİK sahnelerinde doğal bir kompozisyon içgüdüsü) RED sebebidir.`
          : "") +
        "\n"
      : veriGosteriliyor
      ? `1. Görselde YALNIZ şu değerler görünmeli, başka hiçbir yazı/rakam/etiket/logo/filigran olmamalı: ` +
        `${gosterilecekDegerler.join(" | ")}.` +
        (overlayCizgileri.length
          ? ` Ayrıca sahnede ŞU ok/çizgi(ler) TAM OLARAK doğru yönde ve doğru konumda görünmeli: ` +
            overlayCizgileri
              .map((c, i) => `${i + 1}) ${c.etiket ?? "(etiketsiz)"} — ${c.ok && c.ok !== "YOK" ? "ok başlı" : "düz çizgi"}`)
              .join(", ") +
            ". Ok yönü/konumu belirsiz, yanlış veya eksikse RED."
          : "") +
        ` Değerlerden biri eksikse, yanlışsa, bulanık/okunaksızsa veya fazladan bir rakam/etiket varsa RED.\n`
      : "1. Görselde okunaklı bir SAYI/RAKAM, veri gibi görünen bir ifade, MARKA LOGOSU, QR kod veya filigran " +
        "varsa RED. Küçük, arka planda kalan, veriyle karıştırılamayacak genel çevresel yazı/tabela (ör. bir " +
        "binanın üzerindeki genel bir isim, bir dükkân tabelası, mimari bir yazı) TEK BAŞINA RED nedeni " +
        "DEĞİLDİR — yalnız BÜYÜK/BASKIN/dikkat çekici bir yazı veya sayısal/veri niteliğinde bir ifade RED " +
        "sebebidir (kullanıcı geri bildirimi: zengin/gerçekçi bağlam sahnelerinde bu tür küçük çevresel " +
        "detaylar kaçınılmaz ve pedagojik risk taşımıyor, katı yasak gereksiz RED oranını artırıyordu).\n") +
    "2. Sahne planlanan bilgi rolünü taşıyor mu?\n" +
    "3. Nesne SAYILARI (metinde belirtilen adet ile görseldeki gerçek adet BİREBİR eşleşmeli — ör. '3 " +
    "şeker' dendiyse net olarak 3 tane, ne eksik ne fazla), RENK/GÖRSEL NİTELİKLERİ (metin bir nesneyi " +
    "renk/boyut/özellikle andıysa — ör. 'sarı araba', 'büyük kutu' — görseldeki o nesne GERÇEKTEN o " +
    "renkte/nitelikte mi, yoksa farklı mı çizilmiş) ve düzenek soru metniyle çelişiyor mu?\n" +
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

  // Canlı testte görüldü (KRİTİK): vision-LLM'e beklenen sayı ÖNCEDEN
  // (BAĞLAM PLANI/MANİFEST içinde) verildiği için, model kendi PASS/RED
  // yargısında bu sayıyı bağımsızca doğrulamak yerine sessizce ONAYLIYORDU
  // — gerçek görsel 6 nesne içerirken bile "4 nesne, PASS" yazabiliyordu.
  // Bu yüzden nihai karar artık modelin kendi status'una DEĞİL, onun
  // BAĞIMSIZ SAYDIĞI (sayilan_nesneler) değerin `renk_miktar_sayimlari`
  // ile KOD SEVİYESİNDE birebir eşleşip eşleşmediğine dayanıyor — model
  // "PASS" dese bile sayı uyuşmuyorsa burada RED'e ÇEVRİLİYOR.
  const sayimUyusmazliklari = renkMiktarSayimlari
    .map((beklenen) => {
      const sayilan = (v.sayilan_nesneler ?? []).find((s) => s.nesne === beklenen.nesne);
      if (!sayilan) return `"${beklenen.nesne}" için sayım hiç yapılmadı (beklenen: ${beklenen.beklenen_adet})`;
      if (sayilan.sayilan_adet !== beklenen.beklenen_adet) {
        return `"${beklenen.nesne}": beklenen ${beklenen.beklenen_adet}, görselde sayılan ${sayilan.sayilan_adet}`;
      }
      return null;
    })
    .filter((x): x is string => x !== null);

  if (sayimUyusmazliklari.length) {
    return {
      status: "RED",
      nedenler: [...v.nedenler, `NESNE SAYIMI UYUŞMAZLIĞI: ${sayimUyusmazliklari.join("; ")}`],
      yaziVarMi: v.yazi_var_mi,
      islev: v.islev,
      hataKodlari: [...new Set([...(v.hata_kodlari ?? []), "NESNE_UYUMSUZLUGU" as const])],
      kalitePuani: v.kalite_puani ?? null,
      tespitEdilenKonumlar: v.tespit_edilen_konumlar,
    };
  }

  return {
    status: v.status,
    nedenler: v.nedenler,
    yaziVarMi: v.yazi_var_mi,
    islev: v.islev,
    hataKodlari: v.hata_kodlari ?? [],
    kalitePuani: v.kalite_puani ?? null,
    tespitEdilenKonumlar: v.tespit_edilen_konumlar,
  };
}

/** node 55'in `asama2_satiri` metin biçimlendirmesinin portu. */
export function asama2Satiri(denetim: GorselDenetimi): string {
  return `AŞAMA 2 (GÖRSEL-MANİFEST) DENETİMİ: ${denetim.status} — ${denetim.nedenler.join("; ") || "manifest ile karşılaştırıldı"}`;
}
