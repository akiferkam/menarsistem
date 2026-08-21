import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { GorselPromptOutputSchema } from "./15-gorsel-prompt-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { JobInput, RotationLedger } from "./types.js";

/**
 * "İçerik" (bu sahnede ne var) ile "stil" (nasıl çekilmiş/çizilmiş görünsün)
 * eskiden aynı tek LLM çağrısında, serbest metin içinde karışıktı — model
 * her seferinde stil sözcüklerini biraz farklı ifade ediyor, aynı promptun
 * her çalıştırmada farklı kalitede sonuç vermesine yol açıyordu. Stil artık
 * KOD SEVİYESİNDE SABİT: her üretimde birebir aynı, LLM'e hiç bırakılmaz.
 * LLM'in tek işi kalır: bu SORUYA özgü sahnenin içeriğini (madde: on_plan/
 * orta_plan/arka_plan) betimlemek. (Referans: kullanıcının ilettiği görsel
 * üretim mimarisi, madde 8/25/39 "content variables ≠ style variables".)
 */
// ORTAK — hem 2D hem 3D için AYNI: kullanıcının düzeltmesi (2026-08-17)
// üzerine "2D" ARTIK "illüstrasyon/vektör çizim" DEĞİL — ikisi de HER ZAMAN
// gerçek bir fotoğraf, tek fark KAMERA AÇISI/DERİNLİK HİSSİ (bkz. altta
// KOMPOZISYON_3D/KOMPOZISYON_2D). Önceki sürüm 2D'yi "vektör/teknik çizim
// hissi" olarak tanımlıyordu — bu YANLIŞTI, kullanıcı hiçbir zaman
// illüstrasyon istemedi, yalnız daha DÜZ/derinliksiz bir kadraj (ör. bir
// masanın yalnız üstü görünen, arka ayakları kadraja girmeyen bir fotoğraf)
// kastediyordu. Ayrıca fal.ai/Flux gibi fotogerçekçilik-odaklı modellere
// "vektör illüstrasyon" istemek, modelin doğal eğilimiyle çelişip beklenmedik
// sapmalara (canlı modda görülen alakasız sahneler) yol açıyor olabilir.
const ORTAK_FOTO_KURALLARI =
  "IŞIK: yumuşak, dağınık gün ışığı veya nötr iç mekân aydınlatması; hafif doğal gölgeler. " +
  "Dramatik spot ışık, sinematik rim light, parlak reklam fotoğrafçılığı ışığı YOK.\n" +
  "MALZEME: her yüzey kendi gerçek malzemesi gibi görünsün — ahşap ahşap, metal metal, plastik " +
  "mat plastik dokusunda; parlak/mumsu/CGI yüzey parlaklığı YOK. Hafif, gerçekçi kullanım izleri " +
  "(çizik, hafif toz) serbest ama abartılı 'grunge' değil.\n" +
  "RENK: doğal, ölçülü doygunlukta 2-4 baskın renk; neon, aşırı doygunluk, HDR görünümü, " +
  "Instagram filtre estetiği YOK. Beyaz/açık düz zemin, ders kitabı estetiği.\n" +
  // GERİ ALINDI (2026-08-18): "haber fotoğrafçılığı" kaldırılıp GERÇEKÇİLİK
  // "tercih, zorunlu değil"e gevşetilmişti (22. tur) — o sırada sahne
  // sapmasının nedeni SANILMIŞTI. Sonradan netleşti: sapma HER İKİ durumda
  // (eski "haber" wording + yeni "ürün" wording) da aynı şiddette devam
  // etti, gerçek kök neden fal.ai/Flux idi (bkz. proje hafızası, yirmiyedi/
  // yirmisekizinci tur — 5/5 fal.ai testi sapma, 2/2 gpt-image-1 testi
  // sorunsuz). YUKSEK kalite artık gpt-image-1'e sabitlendiği için (bkz.
  // `apps/api/lib/provider-deps.ts`) katı stil kısıtı tekrar güvenli — eski,
  // KANITLANMIŞ İYİ ÇALIŞAN sürüme dönüldü (kullanıcının kendi arşivindeki
  // 2026-08-15 tarihli job `69c23e99`, gpt-image-1 + bu katı kural ile
  // temiz/gerçekçi bir sonuç üretmişti).
  "GERÇEKÇİLİK: GERÇEK BİR FOTOĞRAF gibi — stüdyo/ürün fotoğrafçılığı kalitesinde, hem 2D hem 3D " +
  "İÇİN GEÇERLİ. Çizgi film, vektör illüstrasyon, 'flat design', karikatür, elle çizilmiş görünüm " +
  "KESİNLİKLE YASAK — 2D SEÇİLMİŞ OLMASI BUNU DEĞİŞTİRMEZ, 2D yalnız kamera açısı/derinlik demektir.\n" +
  "YAPAY-GÖRÜNÜM KISITLARI (bunlardan biri varsa görsel RED alır): aşırı simetrik/steril " +
  "yerleşim; havada asılı veya birbirine mantıksız bağlı nesneler; kaynaşmış/çoğaltılmış/anlamsız " +
  "tekrar eden küçük nesneler; fiziksel olarak tutarsız gölge/perspektif; aşırı bulanıklaştırılmış " +
  "arka plan (aşırı bokeh); poster/afiş/dashboard/UI ekranı görünümü; QR kod, filigran, marka logosu, " +
  "BÜYÜK/BASKIN okunaklı tabela yazısı veya sayısal ifade (küçük/arka plandaki genel çevresel yazı " +
  "SORUN DEĞİL — gerçekçi sahnelerde kaçınılmaz, yasak değil).";

const STIL_PROFILI_3D =
  "KOMPOZİSYON: doğal göz hizasından, hafif aşağı bakan açı, orta-geniş kadraj (medium-wide) — " +
  "GERÇEK ÜÇ BOYUTLU DERİNLİK hissedilsin (nesnelerin yanları/hacmi görünür). Asimetrik ama " +
  "dengeli yerleşim — sahneyi tam ortalayıp simetrik/steril bir düzen kurma. Ön planda 1-3 net " +
  "nesne, orta planda asıl konu, arka planda tamamlayıcı, biraz daha az net nesneler; üç katman " +
  "birbirinden gerçek bir derinlik hissiyle ayrılsın (bkz. verilen on_plan/orta_plan/arka_plan).\n" +
  ORTAK_FOTO_KURALLARI;

const STIL_PROFILI_2D =
  "KOMPOZİSYON: DÜZ/CEPHEDEN (straight-on) veya KUŞ BAKIŞI (top-down/flat-lay) kamera açısı — bu " +
  "HÂLÂ GERÇEK BİR FOTOĞRAF, yalnız derinlik/perspektif BİLİNÇLİ OLARAK MİNİMUMA indirilmiş (ör. " +
  "bir masanın yalnız üstü kadraja girer, arka ayakları/yanları görünmez; bir cihazın yalnız ön " +
  "yüzü doğrudan karşıdan çekilmiş gibi görünür — 'düz bir fotoğraf', illüstrasyon DEĞİL). Ön/orta/" +
  "arka plan ayrımı hâlâ geçerli ama fiziksel derinlik yerine kadraj İÇİNDEKİ YERLEŞİM (üst/orta/alt " +
  "veya sol/orta/sağ) ile ifade edilir (bkz. verilen on_plan/orta_plan/arka_plan).\n" +
  ORTAK_FOTO_KURALLARI;

const GORSEL_PROMPT_SYSTEM =
  "Sen MENAR bağlam görseli İÇERİK yazarısın. Tek işin: verilen sahne manifestindeki (sahne, " +
  "on_plan, orta_plan, arka_plan, nesneler) bilgiyi tek, akıcı bir paragrafta betimlemek — HANGİ " +
  "NESNENİN NEREDE (ön/orta/arka planda) olduğunu netleştir. Stil, ışık, kompozyon, malzeme, renk " +
  "KURALLARI SANA AİT DEĞİL — bunlar ayrıca, sabit olarak eklenecek, sen onları yazma/tekrarlama.\n\n" +
  "SAHNE SAPMASINI ÖNLEME (canlı modda görüldü, ÇOK ÖNEMLİ): görsel üretim modeli, sahne yeterince " +
  "SOMUT/ÇAPALANMIŞ tanımlanmazsa niş/teknik senaryoları (ör. 'fotoğraf negatifi tarama atölyesi') " +
  "tanımadığı için TAMAMEN ALAKASIZ, jenerik 'hoş' sahnelere (park, marina, sokak manzarası) " +
  "kayabiliyor — 3 denemenin 3'ünde de bu görüldü. Bunu önlemek için: paragrafın İLK CÜMLESİ " +
  "MEKÂNI KESİN VE SOMUT olarak sabitlesin (ör. 'Kapalı bir iç mekân çalışma masası: üzerinde X, Y, " +
  "Z bulunuyor' gibi — 'atölye', 'köşe', 'alan' gibi belirsiz/soyut kelimelerle açma). Manifestteki " +
  "HER nesneyi (on_plan/orta_plan/arka_plan) doğrudan/somut biçimde adıyla geç — genel/atmosferik " +
  "ifadelerle ('sade bir çalışma ortamı' gibi) nesne listesinin yerine geçme, listedeki her öğe " +
  "paragrafta AÇIKÇA görünmeli. Sahnenin İÇ MEKÂN mı DIŞ MEKÂN mı olduğunu da açıkça belirt.\n\n" +
  "EN ÖNEMLİ KURAL — İŞLEV: Sana verilen İŞLEV cümlesi bu görselin öğrenci için NEDEN var olduğunu " +
  "anlatır (görsel kaldırılırsa hangi bilgi kaybolur). Yazdığın betimleme bu işlevi GERÇEKTEN " +
  "karşılamalı — yalnız 'güzel/atmosferik bir sahne' değil, İŞLEV cümlesinde belirtilen bilginin " +
  "(ör. sayılabilir nesne adedi, göreli konum/düzen, kategori/renk ayrımı) sahnede AÇIKÇA VE NET " +
  "OKUNUR biçimde göründüğünden emin ol; betimlemende bunu somutça belirt (ör. 'tam olarak 3 " +
  "turuncu kasa ve 2 gri kasa net sayılabilir şekilde' gibi, sadece 'kasalar' değil). Yasaklar " +
  "listesindeki hiçbir öğeyi sahneye ekleme.\n\n" +
  "EKRAN/GÖSTERGE TUZAĞI (canlı modda görüldü, KRİTİK): gorsel_veri_gosterimi=YOK ise, İŞLEV'i " +
  "karşılamak için bir cihaza EKRAN, GÖSTERGE IŞIĞI, PANEL veya herhangi bir 'okuma/gösterge' unsuru " +
  "EKLEME — 'etiketsiz' veya 'boş' bile olsa. Görsel model, bir cihazda ekran/gösterge KAVRAMI " +
  "gördüğünde orada GERÇEK bir ekran/TV/panel görüntüsü hayal edip konudan tamamen sapıyor (canlı " +
  "testte 'etiketsiz gösterge ışıkları' istenmiş, sonuç 3 denemede de oturma odasında televizyon " +
  "sahnesi oldu). gorsel_veri_gosterimi=YOK'ta cihazlar YALNIZ dış gövdeleri/fiziksel biçimleriyle " +
  "betimlenir (ör. 'muhafazalı bir kayıt cihazı'), hiçbir ekran/panel/gösterge kelimesi kullanma. " +
  "İŞLEV'in 'bu ölçülmüş/puanlanmış bir veri' türünden bir bilgi taşıması gerekiyorsa bu veri_katmani'nin " +
  "(grafik/tablo) işidir — fotoğrafın işi DEĞİLDİR, fotoğraf yalnız fiziksel sahneyi somutlaştırır.\n\n" +
  "Varsayılan olarak prompt hiçbir sayı, ölçü, etiket, yazı veya logo istemez — AMA BAĞLAM " +
  "KATMANI PLANI'nda gorsel_veri_gosterimi CIHAZ_EKRANI veya TEKNIK_ETIKET olarak işaretlenmişse, " +
  "gorselde_gosterilecek_degerler listesindeki değerlerin TAM OLARAK (başka hiçbir ek rakam/etiket " +
  "olmadan) sahnenin doğal bir parçası (bir ölçüm cihazının ekranı veya teknik çizimin ölçü " +
  "etiketleri) olarak görünmesini iste. Gerçek yaşam sahnesinde 3D, MEB teknik anlatımında 2D " +
  "seçilir. ÖNCELİK SIRASI: önce 3D dene (gerçek fotoğraf gibi); sahne 3D'de doğru ve anlaşılır " +
  "şekilde temsil edilemiyorsa (ör. gerçekten şematik/teknik bir içerikse) 2D'ye geç. Yalnız " +
  "şemaya uygun JSON döndür.";

export interface GorselPromptDeps {
  provider: LlmProvider;
  model: string;
}

/** node 51'in `gorsel_deneme`/`image_size` dahil tüm çalışma durumunu taşıyan port karşılığı. */
export interface GorselIstekState {
  prompt: string;
  gorselAilesi: string;
  boyut: "2D" | "3D";
  imageSize: "1024x1024" | "1536x1024";
  deneme: number;
}

/**
 * node "50 - Bağlam Görsel Prompt Ajanı" + "51 - Görsel İstek Durumu"nun
 * portu. Yalnız bir kez çağrılır — sonraki denemeler artık tam yeniden
 * üretim değil, hedefli `images.edit` düzeltmesi (bkz. `20-baglam-gorseli.ts`).
 */
export async function runGorselPromptAjani(
  aday: GeneratorOutput,
  input: JobInput,
  ledger: RotationLedger,
  deps: GorselPromptDeps
): Promise<GorselIstekState> {
  const bk = aday.baglam_katmani;
  const veriGosterimi = bk?.gorsel_veri_gosterimi ?? "YOK";
  const gosterilecekDegerler = bk?.gorselde_gosterilecek_degerler ?? [];
  const veriGosteriliyor = veriGosterimi !== "YOK" && gosterilecekDegerler.length > 0;

  const katmanlar =
    (bk?.on_plan?.length || bk?.orta_plan?.length || bk?.arka_plan?.length)
      ? `ON PLAN: ${(bk?.on_plan ?? []).join(", ") || "—"} | ORTA PLAN: ${(bk?.orta_plan ?? []).join(", ") || "—"} | ` +
        `ARKA PLAN: ${(bk?.arka_plan ?? []).join(", ") || "—"}`
      : `NESNELER (katmansız): ${(bk?.nesneler ?? []).join(", ") || "—"}`;

  const userPrompt =
    "/BAĞLAM GÖRSELİ/\n\n" +
    `SAHNE: ${bk?.sahne ?? ""}\n` +
    `${katmanlar}\n` +
    `İŞLEV (bu görsel neden var — mutlaka karşılanmalı): ${bk?.islev ?? "—"}\n` +
    `YASAKLAR (sahneye eklenmeyecek): ${(bk?.yasaklar ?? []).join(", ") || "—"}\n` +
    `SON 15 GÖRSEL AİLESİ (tekrar yasak): ${ledger.son15GorselAilesi.join(" | ")}\n` +
    (veriGosteriliyor
      ? veriGosterimi === "NESNE_INDEKSI"
        ? `Sahnedeki her ayrı nesneye TEK BASAMAKLI/HARFLİ, ARDIŞIK bir indeks etiketi ver — TAM OLARAK şu ` +
          `indeksler kullanılacak, başka hiçbir ek rakam/etiket/gerçek değer olmayacak: ${gosterilecekDegerler.join(" | ")}. ` +
          `Bunlar GERÇEK VERİ DEĞİL, yalnız hangi nesnenin hangisi olduğunu ayırt eden basit etiketlerdir.`
        : `Sahne, ${veriGosterimi === "CIHAZ_EKRANI" ? "bir cihaz ekranında" : "teknik ölçü etiketleri olarak"} ` +
          `TAM OLARAK şu değerleri gösterecek, başka hiçbir ek rakam/etiket olmayacak: ${gosterilecekDegerler.join(" | ")}`
      : "Sahne yazı/sayı içermez.");

  const p = await callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: GORSEL_PROMPT_SYSTEM,
    userPrompt,
    schema: GorselPromptOutputSchema,
    schemaName: "GorselPromptOutput",
    // Sahne-sapması (canlı modda tekrar tekrar görüldü — bkz. proje hafızası
    // gorsel-mimari) bu aşamanın en kritik halkası: kullanıcı isteği üzerine
    // reasoning effort yükseltildi, modelin sahneyi somut/tutarlı kurmasına
    // daha fazla "düşünme bütçesi" ayrılsın diye.
    reasoningEffort: "high",
  });

  // input.gorselBoyutu kullanıcının elle seçtiği zorlama (bkz. types.ts) —
  // verilmişse (OTOMATIK dışında) LLM'in/adayın kararından önceliklidir.
  const boyut =
    input.gorselBoyutu && input.gorselBoyutu !== "OTOMATIK"
      ? input.gorselBoyutu
      : (String(p.boyut || bk?.boyut || "3D").toUpperCase() as "2D" | "3D");
  const stilProfili = boyut === "2D" ? STIL_PROFILI_2D : STIL_PROFILI_3D;

  // ÖNEMLİ (kullanıcı düzeltmesi, 2026-08-18): "hiçbir yazı/rakam olmayacak"
  // kuralı eskiden ZORUNLU idi — canlı testte bu, görsel modelin dikkatini
  // asıl SAHNE içeriğinden çalıp alakasız kaçışlara (bilim şenliği sahnesi
  // yerine sokak/tabela sahnesi) yol açtığından şüphelenildi. Artık yalnız
  // gerçek veri (gosterilecekDegerler doluysa) ZORUNLU; metin/logo yokluğu
  // yalnız bir TERCİH — sahne doğruluğu ondan önceliklidir. Denetim tarafı
  // (19-gorsel-denetim.ts) zaten aynı gevşek eşiği kullanıyor.
  const zorunluSatirlar = veriGosteriliyor
    ? [
        "ZORUNLU KURALLAR (MENAR):",
        `- Görselde şu değerler net, okunaklı ve verildiği gibi (değiştirmeden) görünmeli: ` +
          `${gosterilecekDegerler.join(" | ")}.`,
        "",
      ]
    : [];

  const tercihSatirlari = [
    "TERCİH (ZORUNLU DEĞİL — sahnenin doğru ve gerçekçi olması bundan önceliklidir):",
    veriGosteriliyor
      ? "- Yukarıdaki değerler dışında sahnede ekstra yazı/rakam/etiket/logo/filigran olmaması tercih edilir."
      : "- Sahnede yazı/rakam/etiket/logo/filigran bulunmaması tercih edilir, ama bu ZORUNLU DEĞİLDİR. " +
        "Gerçek mekânlarda kaçınılmaz olan tabela, ambalaj yazısı, marka ismi gibi çevresel detaylar " +
        "serbesttir — yalnız BÜYÜK/BASKIN, veri/ölçü gibi ANLAMLI bir sayısal ifade taşımamaları yeterli.",
  ];

  const prompt = [
    p.prompt || "",
    "",
    ...zorunluSatirlar,
    ...tercihSatirlari,
    "",
    "STİL PROFİLİ (MAYS_EDU_" + boyut + "_V1 — sabit, her üretimde aynı):",
    stilProfili,
  ].join("\n");

  return {
    prompt,
    gorselAilesi: p.gorsel_ailesi || bk?.gorsel_ailesi || "",
    boyut,
    imageSize: input.genislik === "85_MM" ? "1024x1024" : "1536x1024",
    deneme: 1,
  };
}
