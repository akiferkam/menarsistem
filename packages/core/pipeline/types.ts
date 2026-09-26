import type { Outcome } from "../curriculum/schema.js";

export type UretimModu =
  | "ACIK_UCLU"
  | "DENEME"
  | "BT"
  // BT ile aynı bağlam kurgusu, tek fark: görsel yalnız sahneyi somutlaştırır
  // (MAARİF görsel işlevsellik testinin (b) seçeneği), asla sayılması/okunması
  // gereken kesin veri taşımaz — bkz. 02-build-prompt.ts modeBlock() case "BTV1".
  | "BTV1"
  | "BTP"
  | "BTG"
  | "STANDART";

/**
 * 2026-09-16'da 13 kademeden (IQ50..IQ350) 5 kademeye İNDİRGENDİ — kullanıcı
 * geri bildirimi: "Hedef IQ için çok fazla hata gördüğümüz için" yalnız
 * "Çok Kolay, Kolay, Orta, Zor, Çok Zor" seçenekleri istendi. 13 kademenin
 * ince ayrımları (IQ100 vs IQ125, IQ300 vs IQ325 gibi) hem öğretmen arayüzünde
 * seçim hatasına hem üretici LLM'in hedefi tutturmasında (bu oturumdan önceki
 * IQ75/IQ100 undershoot vakaları, bkz. proje hafızası) belirsizliğe yol
 * açıyordu — daha az ve birbirinden AÇIKÇA ayrışan bant, her ikisini de
 * azaltması beklenen bir sadeleştirme. Altyapı (bagimsiz_karar_sayisi + 9
 * audit kriteri, bkz. 03-generator-schema.ts IqBileseniSchema, 05-preflight.ts
 * BAND_ESIK) DEĞİŞMEDİ — yalnız hedeflenen bant SAYISI azaldı, eski 13
 * bandın uç noktaları (IQ50→ÇOK_KOLAY, IQ75→KOLAY, IQ200→ORTA, IQ250→ZOR,
 * IQ300+→ÇOK_ZOR) yeni bantlara ÇAPA olarak taşındı.
 */
export type HedefIQ = "COK_KOLAY" | "KOLAY" | "ORTA" | "ZOR" | "COK_ZOR";
/**
 * 90_MM/180_MM: "Helvetica 9 punto" tipo tercihiyle eklenen ikinci genişlik
 * çifti — 85_MM/185_MM'in DAR/GENİŞ ayrımını korur (aynı kelime limitleri,
 * aynı görsel oranı), yalnız yazı tipi/punto farklıdır (bkz. 21-dizgi.ts,
 * render/page-preview.ts). Eski değerler davranışça DEĞİŞMEDİ.
 */
export type CiktiGenisligi = "85_MM" | "185_MM" | "90_MM" | "180_MM";

/** DAR (85_MM/90_MM) vs GENİŞ (185_MM/180_MM) — kelime limiti/görsel oranı gibi genişliğe bağlı kararların TEK kaynağı. */
export function genislikSinifi(g: CiktiGenisligi): "DAR" | "GENIS" {
  return g === "85_MM" || g === "90_MM" ? "DAR" : "GENIS";
}
export type CiktiMotoru =
  | "SORU_METNI"
  | "TEK_TIP_PNG_SPEC"
  | "INDD_RAW_PRO"
  | "MENAR_BUILDER_JSON"
  | "IDML_PAKET"
  | "INDD_PAKET";
export type CiktiModu = "OGRETMEN" | "OGRENCI";
export type CevapGorunurlugu = "ACIK" | "KAPALI";
export type GorselKarari = "AI_OTOMATIK" | "GORSEL_YOK" | "ISLEVSEL_GORSEL_ZORUNLU";
/**
 * STANDART: gpt-image-1 (varsayılan, ek maliyetsiz). YUKSEK: bu iş için
 * bağlam görseli fal.ai/Flux (flux-pro/v1.1-ultra + kontext düzeltme)
 * üzerinden üretilir — daha gerçekçi/keskin, ama daha pahalı. Yalnız
 * gorsel_veri_gosterimi=YOK olan (ekranda/etikette metin göstermeyen)
 * adaylarda kullanılır; CIHAZ_EKRANI/TEKNIK_ETIKET gerektiğinde Flux'un
 * metin/rakam üretimindeki güvenilmezliği yüzünden (bkz. proje hafızası
 * `menar-mays-gorsel-mimari`) YUKSEK seçili olsa bile gpt-image-1'e
 * otomatik geri düşülür — bu, `20-baglam-gorseli.ts`'de per-aday karar verilir.
 */
export type GorselKalitesi = "STANDART" | "YUKSEK";
/**
 * STANDART kalitede hangi OpenAI görsel modelinin çağrılacağını seçer —
 * gpt-image-2.5-sunburst (2026-09-08 çıkışlı, gpt-image-2'nin yerini aldı;
 * "sunburst" varyantı daha detaylı/keskin, "flare" varyantı hız önceliklidir
 * ama seçilmedi) hem daha ucuz hem daha güvenilir metin/rakam çizimi
 * sunuyor, ama kullanıcı isteğiyle varsayılan DEĞİL, açıkça seçilebilen bir
 * seçenek olarak eklendi (bkz. apps/cli/lib/providers.ts,
 * apps/api/lib/provider-deps.ts). Verilmezse `.env`'deki MODEL_IMAGE
 * (gpt-image-1) kullanılır.
 */
export type GorselModeli = "gpt-image-1" | "gpt-image-2.5-sunburst";
/**
 * OTOMATIK (varsayılan): boyut kararını görsel prompt ajanı verir (önce 3D
 * dener, gerçek fotoğrafla temsil edilemeyen şematik/teknik içerikte 2D'ye
 * geçer). 2D/3D: kullanıcı elle zorlar — 2D genelde sınav/ders kitabı
 * formatına daha uygun düşebilir ve daha basit bir sahne olduğundan zaman/
 * maliyet üzerinde de hafif bir etkisi olabilir (garanti değil — asıl
 * maliyet dial'ı model/aday sayısı, bkz. proje hafızası `menar-mays-gorsel-mimari`).
 */
export type GorselBoyutu = "OTOMATIK" | "2D" | "3D";
/**
 * DETERMINISTIK_SVG (varsayılan): eskisi gibi — sayısal veri gerekiyorsa
 * üretici `veri_katmani` (TABLO/CIZGI/SUTUN/FONKSIYON, kod tarafında SVG
 * olarak çizilir) kurar, bu SVG bağlam fotoğrafından AYRI bir blok olarak
 * sayfada görünür. FOTOGRAF_UZERINDE (kullanıcı isteği, 2026-09-14 —
 * "sorunun üstünde grafik görmek istemiyorum, çizgi/rakam/yazının GÖRSELİN
 * İÇİNDE olmasını istiyorum"): üretici bunun yerine `baglam_katmani.
 * gorsel_veri_gosterimi` (CIHAZ_EKRANI/TEKNIK_ETIKET/OLCUM_CIZGISI) + overlay
 * alanlarını kullanır — gerçek değerler ve ölçüm çizgileri AI fotoğrafın
 * KENDİSİNE, üretim SONRASI deterministik olarak bindirilir (bkz.
 * `render/gorsel-overlay.ts`, `20-baglam-gorseli.ts`) — hiçbir ayrı SVG
 * grafik/tablo bloğu sayfada görünmez. Bu, AI'nın kendisinin çizgi/rakam
 * çizmesinden (kanıtlanmış şekilde piksel-kesin değil, bkz. proje hafızası)
 * FARKLIDIR — yalnız fotoğrafın ZEMİNİ AI'dan gelir, üzerindeki gerçek
 * veri/çizgi hep koddan gelir, aynı SVG katmanı kadar güvenilirdir.
 * FOTOGRAF_UZERINDE_HIBRIT (kullanıcı isteği, 2026-09-14 — "AI bırakalım
 * AI'ın yazmasını isteyelim bir de bakalım nasıl olacak"): FOTOGRAF_UZERINDE
 * ile AYNI üretici çıktısını kullanır, ama İLK denemede AI'nın gerçek
 * değeri KENDİSİ çizmesine izin verilir (canlı testte tek bir kısa değerde
 * — bir termometre ekranı — başarılı olduğu görüldü); yalnız görsel denetimi
 * bunu RED ederse (değer yanlış/okunaksız) sistem otomatik olarak yukarıdaki
 * deterministik bindirme yoluna döner (`20-baglam-gorseli.ts`) — hiçbir
 * zaman "kör güven" yok, her zaman bir güvenlik ağı var.
 */
export type GorselVeriStratejisi = "DETERMINISTIK_SVG" | "FOTOGRAF_UZERINDE" | "FOTOGRAF_UZERINDE_HIBRIT";
/**
 * Bağlam temelli sorularda (özellikle TDE, ileride Tarih/Coğrafya/Din/
 * Felsefe) iki+ kişi arasındaki konuşmayı göstermek için (kullanıcı isteği,
 * 2026-09-14/16: "konuşmalar baloncuk içinde ... her soruda zorunlu olmasın,
 * senaryoya uygunsa kullansın, ben her seferinde seçmemeliyim, stilin hepsi
 * aynı olsun, üretim standart olarak AI olsun, başarısız olursa SVG'ye
 * dönsün"). Bu yüzden JobInput'ta SEÇİLECEK bir alan YOK — üreticinin
 * KENDİSİ, bağlamda gerçekten diyalog geçiyorsa (bkz. 02-build-prompt.ts
 * madde 14b) `veri_katmani.tur=KONUSMA` seçer; davranış HER ZAMAN aynıdır:
 * önce AI'nın kendisi tüm illüstrasyonu (karakterler+balonlar+metin) çizmeyi
 * dener (`16-gorsel-prompt.ts` GORSEL_PROMPT_SYSTEM_KONUSMA_CIZIM,
 * `19-gorsel-denetim.ts` konusmaCizimModu — canlı testte KANITLANDI:
 * gpt-image-2.5-sunburst doğru Türkçe karakterlerle (ş/ı/ğ) okunaklı bir
 * illüstrasyon+balon çizebiliyor), başarısız olursa (3 deneme) OTOMATİK
 * olarak tek bir sabit deterministik SVG stiline (`buildKonusmaSvg` — kuyruklu
 * çizgi roman balonu) düşer — `veri_katmani.yalnizca_gorsel_yedegi=true`
 * zorunlu kılınarak (bkz. 02-build-prompt.ts), `run.ts`'in var olan "yedek
 * gereksizse filtrele" mekanizması yeniden kullanılıyor.
 */
export type SecenekYapisi = "METIN_SECENEKLER" | "GORSEL_SVG_SECENEKLER" | "AI_EN_UYGUN_YAPIYI_SECSIN";
export type TymmAlanBecerisi = "SERBEST" | "MAB1_MATEMATIKSEL_MUHAKEME" | "MAB2_MATEMATIKSEL_MODELLEME" | "MAB3_MATEMATIKSEL_PROBLEM_COZME";
export type TymmEgilim = "YOK" | "VERI_OKURYAZARLIGI" | "FINANSAL_OKURYAZARLIK" | "DIJITAL_OKURYAZARLIK";

export interface BtgInput {
  kaynak: string;
  belge: string;
  kullanim: string;
  dogrulama: string;
  materyal: string;
  guncellik: string;
  kaynakNotu: string;
}

/**
 * Verilmezse MATEMATIK — geriye dönük uyumlu, mevcut işleri etkilemez.
 * FIZIK/KIMYA/BIYOLOJI/TDE 2026-08-17'de eklendi (bkz. curriculum/
 * maarif_modeli_9_12_fizik_kimya_biyoloji_tde_tyt_ayt.md) — yalnız müfredat
 * verisi + arayüz seçimi kablolandı; generator prompt'unun ÖSYM/IQ/solver
 * kuralları hâlâ sayısal-akıl-yürütme (Matematik/Geometri) odaklı yazıldı,
 * bu 4 yeni ders için soru KALİTESİ henüz ayrıca ayarlanmadı/test edilmedi.
 * COGRAFYA/TARIH/FELSEFE/DKAB 2026-09-16'da eklendi (kullanıcının curriculum/
 * klasörüne koyduğu 4 resmî MEB ünite/kazanım belgesi, bkz. packages/core/
 * curriculum/{cografya,tarih,felsefe,dkab}.json) — AYNI uyarı geçerli: yalnız
 * müfredat verisi kablolandı, bu derslerin soru KALİTESİ (IQ_KURALI vb.) ilk
 * kez bu turda, hiç canlı testsiz yazıldı.
 */
export type Ders =
  | "MATEMATIK"
  | "GEOMETRI"
  | "FIZIK"
  | "KIMYA"
  | "BIYOLOJI"
  | "TDE"
  | "COGRAFYA"
  | "TARIH"
  | "FELSEFE"
  | "DKAB";

/** Formdan/API'den gelen ham girdi — HTML/n8n formundaki alanların 1:1 karşılığı. */
export interface JobInput {
  mode: UretimModu;
  ders?: Ders;
  sinifVeyaSinav: string; // "9. Sınıf" | "10. Sınıf" | "11. Sınıf" | "TYT" | "AYT"
  kod: string;
  mikro?: string;
  iq: HedefIQ;
  genislik: CiktiGenisligi;
  cikti: CiktiMotoru;
  ciktiModu: CiktiModu;
  cevapGorunurlugu: CevapGorunurlugu;
  gorselKarari: GorselKarari;
  /** Verilmezse STANDART (gpt-image-1) — geriye dönük uyumlu, mevcut işleri etkilemez. */
  gorselKalitesi?: GorselKalitesi;
  /** Verilmezse `.env`'deki MODEL_IMAGE (gpt-image-1) — bkz. GorselModeli yorumu. */
  gorselModeli?: GorselModeli;
  /** Verilmezse OTOMATIK — geriye dönük uyumlu, mevcut işleri etkilemez. */
  gorselBoyutu?: GorselBoyutu;
  /** Verilmezse DETERMINISTIK_SVG — geriye dönük uyumlu, mevcut işleri etkilemez. */
  gorselVeriStratejisi?: GorselVeriStratejisi;
  secenekYapisi: SecenekYapisi;
  soruSayisi: number;
  tymmAlanBecerisi: TymmAlanBecerisi;
  tymmEgilim: TymmEgilim;
  metinUzunlugu: string;
  btg?: BtgInput;
  sonKullanilanBaglamAileleri?: string;
  ekIstek?: string;
  /**
   * Yalnız `page-preview.ts`'in önizleme HTML/PNG'sinin görsel temasını
   * seçer — LLM prompt'una hiç girmez, üretim mantığını etkilemez.
   * Verilmezse STANDART (geriye dönük uyumlu). OKYANUS, sunumda gösterilecek
   * bir örnek yayının (marka/logo hariç) genel dershane sayfa düzeni dilinden
   * (başlık şeridi, bölümlendirme, boşluk) esinlenen alternatif bir tema.
   */
  sayfaSablonu?: "STANDART" | "OKYANUS";
}

/** node 01/02/03'ün ürettiği, kazanım zincirinin çözülmüş hâli. */
export interface ResolvedJob {
  input: JobInput;
  outcome: Outcome;
  micro: string;
}

export interface ValidationFailure {
  valid: false;
  errors: string[];
}
export interface ValidationSuccess {
  valid: true;
  resolved: ResolvedJob;
}
export type ValidationResult = ValidationFailure | ValidationSuccess;

/** Section 5: fiilen çalıştırılmamış denetime PASS yazılamaz — PASS yalnız evidence ile üretilebilir. */
export type CheckResult =
  | { status: "PASS"; evidence: string }
  | { status: "RED"; reasons: string[] }
  | { status: "DOGRULANAMADI"; why: string };

export interface RotationEntry {
  timestamp: string;
  kod: string;
  mikro: string;
  mode: UretimModu;
  iq: HedefIQ;
  baglamAilesi: string;
  cozumDna: string;
  gorselAilesi: string;
  puan: number;
}

export interface RotationLedger {
  son100BaglamAilesi: string[];
  son200AileDna: string[]; // "aile::dna" formatında
  son15GorselAilesi: string[];
}

/**
 * Yeni standardın (bkz. HedefIQ yorumu) 10 audit ölçütü — eski A-F toplamalı
 * formülün yerini aldı. Her biri modelin kendi öz-değerlendirmesi (üretici
 * çıktısındaki iq alanı, bkz. 03-generator-schema.ts IqBileseniSchema) —
 * "bagimsizKararSayisi" hariç hepsi var/yok (boolean).
 */
export interface IqKriterleri {
  veriSecmeEleme: boolean;
  modelKurma: boolean;
  temsilDonusumu: boolean;
  ortukKosul: boolean;
  tersineDusunme: boolean;
  stratejiSecimi: boolean;
  sinirDurumu: boolean;
  dogrulama: boolean;
  genellemeIspat: boolean;
}

/** node "11 - Deterministik Ön Denetim"in her soru için hesapladığı IQ kırılımı. */
export interface SoruIqHesaplanan {
  bagimsizKararSayisi: number;
  kriterler: IqKriterleri;
  hedef: HedefIQ;
  /** Bu sorunun kriterleri/karar sayısı hangi ENA ÜST bandı gerçekten karşılıyor — "IQ GERÇEK SEVİYE". */
  ulasilanSeviye: HedefIQ;
  hedefKarsilandi: boolean;
}

/**
 * node 11'in çıktısı. Section 5: yalnız teknik bütünlük ihlalleri (soru
 * üretilmedi, seçenek sayısı ≠5, tekrar eden seçenek, doğru harf geçersiz,
 * istenen/üretilen soru sayısı uyuşmazlığı) `kritik` olur ve FINAL'i kapatır.
 * IQ bandı, dizgi sınırı, rotasyon tekrarı gibi pedagojik/estetik sorunlar
 * `uyari`dır — OTOPSİ ve YAYIN KURULU aşamalarına aktarılır, üretimi durdurmaz.
 */
export interface PreflightResult {
  status: "PASS" | "RED";
  kritik: string[];
  uyari: string[];
  kaliteDurumu: "TEMİZ_PASS" | "UYARILI_PASS";
  soruPuanlari: SoruIqHesaplanan[];
}

/**
 * node "20-22 /OTOPSİ/"nin portu için tek soru sonucu. `DETERMINISTIK` yolu
 * `verify/solver-v25.ts`in gerçekten çalıştırdığı manifestten gelir ve LLM
 * çağrısı gerektirmez; `CIFT_LLM` yolu yalnız `dogrulama_manifesti.solver_type`
 * `UNSUPPORTED` olduğunda devreye girer (node 20/21 Solver A/B çapraz
 * kontrolü) — bkz. [[menar-mays-faz1-progress]] mimari kararı.
 */
export interface OtopsiSoru {
  soruNo: number;
  yontem: "DETERMINISTIK" | "CIFT_LLM";
  cevapKontrolu: CheckResult;
}

export interface OtopsiResult {
  status: "PASS" | "RED";
  red: string[];
  sorular: OtopsiSoru[];
}

/** node "24 - Kanıt Tablosu + FINAL KİLİDİ"nin portu. */
export interface KanitTablosu {
  satirlar: Record<string, string>;
  kanitTablosuMetni: string;
  denetimSatiri: string;
  yayinPuani: number;
  finalKilidi: "KAPALI" | "UYARILI_AÇIK" | "AÇIK";
  redNedenleri: string[];
  kritikRedNedenleri: string[];
  yayinUyarilari: string[];
}

/** node "28 - Üç Kontrollü Revizyon Sonrası Durdur"un portu — 3 denemede de FINAL KİLİDİ kapalı kaldığında. */
export interface UretimDurduruldu {
  baslik: string;
  surekliRedVeren: string;
  enYakinPuan: string;
  onerilenTekDegisiklik: string;
  kanitTablosuMetni: string;
  redNedenleri: string[];
  revizyonSayisi: number;
}

/** node "30 - Rotasyon Defteri + Görünmez Künye"nin görünmez künye kısmının portu. */
export interface GorunmezKunye {
  soruId: string;
  kazanimKodu: string;
  sinifVeyaSinav: string;
  altKonu: string;
  iqKodu: HedefIQ;
  /** Her sorunun gerçekten ulaştığı bant kodu (bkz. SoruIqHesaplanan.ulasilanSeviye) — eskiden ham puandı. */
  iqGercek: HedefIQ[];
  baglamAilesi: string;
  puan: number;
  uretimTarihi: string;
}

/** node "41 - VERİ KATMANI: Tablo/Grafik SVG"nin ürettiği tek bir SVG varlığı. */
export interface SvgAsset {
  name: string;
  svg: string;
  tur: "TABLO" | "GRAFİK" | "GEOMETRİ" | "ŞEMA" | "KONUŞMA";
}

/** node 40+41'in portu — `gorselGerekli`, node 40'ın if-koşulunun (node 41'in kendi hesapladığı) karşılığı. */
export interface VeriKatmaniSonuc {
  assets: SvgAsset[];
  gorselGerekli: boolean;
}

/** node "54 - AŞAMA 2: Görsel–Manifest Denetimi" + "55 - Görsel Denetimini Birleştir"in portu. */
export interface GorselDenetimi {
  status: "PASS" | "RED" | "DOĞRULANAMADI";
  nedenler: string[];
  yaziVarMi: boolean;
  islev: string | null;
  hataKodlari: string[];
  kalitePuani: number | null;
  /** bkz. render/gorsel-overlay.ts — denetçinin GERÇEKTE gördüğü boş bölge konumu, önceden tahmin edilenin yerine kullanılır. */
  tespitEdilenKonumlar?: { x_yuzde: number; y_yuzde: number }[] | null;
}

/**
 * node "56-59"un (retry orkestrasyonu) nihai çıktısı — ya bir bağlam görseli
 * üretilip AŞAMA 2'den PASS almıştır, ya da en fazla 3 denemeden sonra
 * "görselsiz devam" (node 59) ile yayına geçilmiştir. `kullanildi=false`
 * hem "görsel hiç gerekmedi" (node 40 false dalı) hem "3 denemede de RED"
 * durumlarını kapsar — ikisi de aynı node 59 satırını üretir.
 */
export interface BaglamGorseliSonuc {
  kullanildi: boolean;
  contextImageFilename: string | null;
  imageMimeType?: "image/png";
  /** base64, data: öneki olmadan. */
  imageBase64?: string;
  gorselDenetimi?: GorselDenetimi;
  asama2Satiri: string;
  deneme: number;
  /**
   * true ise görsel gerçek değerlerle değil, sıra numarasıyla (NESNE_INDEKSI'ye
   * düşülerek) başarılı oldu — bu durumda `run.ts`'in `tamamla()`'sı
   * `veri_katmani.yalnizca_gorsel_yedegi=true` olan yedek tabloyu nihai
   * sayfaya dahil ETMELİDİR (aksi halde öğrenci sıra numaralarının gerçek
   * karşılığını hiç göremez). false ise (görsel gerçek değerlerle başarılı
   * oldu ya da hiç düşüş gerekmedi) aynı tablo GEREKSİZ TEKRAR sayılır ve
   * dahil edilmemelidir (bkz. proje hafızası "aynı veri iki yerde tekrar
   * edilmemeli" kuralı).
   */
  indeksModunaGecildi: boolean;
  /**
   * Bu iş için görsel üretiminde HANGİ sağlayıcı kullanıldı — "YUKSEK" ise
   * `uretimYuksekKalite` (fal.ai/Flux), "STANDART" ise `uretim` (gpt-image-1).
   * `apps/api/queue/worker.ts`'in usage_log'a doğru sağlayıcı/modeli
   * yazabilmesi için gerekli: eskiden bu her zaman `deps.gorsel.uretim`
   * (gpt-image-1) olarak SABİT loglanıyordu — YUKSEK kalite işlerinde asıl
   * çağrı fal.ai'ye gitmiş olsa bile (`provider.getUsage()` sağlayıcı BAZLI
   * biriktiği için) fal.ai'nin gerçek görsel sayısı/maliyeti hiç kaydedilmiyor,
   * sessizce kayboluyordu — Section 13 #1 "gerçek maliyet" hedefiyle çelişen
   * gizli bir izleme boşluğu (canlı bir görsel-hata teşhisi sırasında fark edildi).
   */
  gorselSaglayici: "STANDART" | "YUKSEK";
  /**
   * `gorselSaglayici="YUKSEK"` iken hangi DERS override'ının (bkz.
   * `StageModels.imageHighQualityByDers`) fiilen kullanıldığı — ders bazlı
   * override yoksa (genel `uretimYuksekKalite`ye düşüldüyse) `undefined`.
   * `apps/api/queue/worker.ts`'in maliyet loglaması, hangi gerçek model/
   * sağlayıcı nesnesinin çağrıldığını bu alandan yeniden kurar (aksi halde
   * `LlmProvider` örneği burada saklanamaz — sonuç JSON'a serileştirilir).
   */
  gorselYuksekKaliteDersAnahtari?: Ders;
  /**
   * `kullanildi=false` olduğunda HER denemenin gerçek RED nedenlerini taşır
   * — eskiden yalnız sabit "3 denemede de RED aldı" metni kalıyordu, hangi
   * denemede TAM OLARAK ne yanlış gittiği (ör. hangi değer eksikti, hangi
   * hata_kodu) kayıptı; teşhis mümkün değildi (bkz. proje hafızası
   * `menar-mays-gorsel-mimari`, kullanıcının "bunu çözmen lazım" geri bildirimi).
   */
  denemeGecmisi?: { deneme: number; status: string; nedenler: string[] }[];
  /**
   * Görsel üretim modeline GERÇEKTEN gönderilen tam prompt metni (bkz.
   * 16-gorsel-prompt.ts'in GorselIstekState.prompt'u) — eskiden hiçbir yerde
   * saklanmıyordu, bir görsel 3 denemede de RED aldığında NEDEN yanlış bir
   * sahne (ör. istenen atölye yerine marina) üretildiğini anlamak için
   * yalnız vision-audit'in TAHMİNİ yorumuna güvenmek gerekiyordu — asıl
   * gönderilen metin hiç görülemiyordu (kullanıcının "her şeyi kontrol et"
   * geri bildirimi sırasında fark edilen bir gözlemlenebilirlik boşluğu).
   */
  gorselPrompt?: string;
}

/** node "71 - INDD Paketini Kur"nun tek bir paket dosyası — `encoding` içeriğin nasıl yazılacağını belirler. */
export interface InddPaketDosyasi {
  name: string;
  mimeType: string;
  content: string;
  encoding: "utf8" | "base64";
}

/** node "71 - INDD Paketini Kur" + "72 - ZIP Paketi"nin girdisi — dosya listesi henüz sıkıştırılmamıştır (bkz. `23-zip.ts`). */
export interface InddPaket {
  files: InddPaketDosyasi[];
  zipFilename: string;
  paketIcerigi: string[];
}
