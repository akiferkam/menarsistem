import type { Outcome } from "../curriculum/schema.js";

export type UretimModu =
  | "KONU_OZETI"
  | "ALISTIRMA"
  | "ACIK_UCLU"
  | "DENEME"
  | "ORTAK_IKI_KONU"
  | "BT"
  | "BTP"
  | "BTG"
  | "ZINCIR"
  | "IKIZ_SORU"
  | "STANDART";

/**
 * 2026-08-17'de 7 kademeden (IQ50/100/150/200/250/300/350) 13 kademeye
 * genişletildi — kaynak: kılavuz/iqmatematik/IQ_SORU_Standartlar_Matematik.docx
 * ("MENAR/MAYS — TYT-AYT IQ Bilişsel Zorluk Kalibrasyon Standardı", v3).
 * Sabit çapa noktaları: IQ75=KOLAY, IQ200=ORTA/GENEL AĞIRLIK, IQ250=ZOR/
 * DERECE-SEÇİCİ. Bant/kriter yapısı TÜM derslerde ortak (bkz. 03-generator-
 * schema.ts IqBileseniSchema, 05-preflight.ts IQ_ESIK) — yalnız bu kademelerin
 * PROMPT'TAKİ açıklama metni derse göre değişir (02-build-prompt.ts IQ_KURALI).
 */
export type HedefIQ =
  | "IQ50"
  | "IQ75"
  | "IQ100"
  | "IQ125"
  | "IQ150"
  | "IQ175"
  | "IQ200"
  | "IQ225"
  | "IQ250"
  | "IQ275"
  | "IQ300"
  | "IQ325"
  | "IQ350";
export type CiktiGenisligi = "85_MM" | "185_MM";
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
 * OTOMATIK (varsayılan): boyut kararını görsel prompt ajanı verir (önce 3D
 * dener, gerçek fotoğrafla temsil edilemeyen şematik/teknik içerikte 2D'ye
 * geçer). 2D/3D: kullanıcı elle zorlar — 2D genelde sınav/ders kitabı
 * formatına daha uygun düşebilir ve daha basit bir sahne olduğundan zaman/
 * maliyet üzerinde de hafif bir etkisi olabilir (garanti değil — asıl
 * maliyet dial'ı model/aday sayısı, bkz. proje hafızası `menar-mays-gorsel-mimari`).
 */
export type GorselBoyutu = "OTOMATIK" | "2D" | "3D";
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

export interface IkizInput {
  kaynak: string;
  baglamDegisim: string;
  matematikselYapi: string;
}

/**
 * Verilmezse MATEMATIK — geriye dönük uyumlu, mevcut işleri etkilemez.
 * FIZIK/KIMYA/BIYOLOJI/TDE 2026-08-17'de eklendi (bkz. curriculum/
 * maarif_modeli_9_12_fizik_kimya_biyoloji_tde_tyt_ayt.md) — yalnız müfredat
 * verisi + arayüz seçimi kablolandı; generator prompt'unun ÖSYM/IQ/solver
 * kuralları hâlâ sayısal-akıl-yürütme (Matematik/Geometri) odaklı yazıldı,
 * bu 4 yeni ders için soru KALİTESİ henüz ayrıca ayarlanmadı/test edilmedi.
 */
export type Ders = "MATEMATIK" | "GEOMETRI" | "FIZIK" | "KIMYA" | "BIYOLOJI" | "TDE";

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
  /** Verilmezse OTOMATIK — geriye dönük uyumlu, mevcut işleri etkilemez. */
  gorselBoyutu?: GorselBoyutu;
  secenekYapisi: SecenekYapisi;
  soruSayisi: number;
  tymmAlanBecerisi: TymmAlanBecerisi;
  tymmEgilim: TymmEgilim;
  metinUzunlugu: string;
  btg?: BtgInput;
  ikiz?: IkizInput;
  kod2?: string;
  mikro2?: string;
  sonKullanilanBaglamAileleri?: string;
  ekIstek?: string;
}

/** node 01/02/03'ün ürettiği, kazanım zincirinin çözülmüş hâli. */
export interface ResolvedJob {
  input: JobInput;
  outcome: Outcome;
  micro: string;
  outcome2?: Outcome;
  micro2?: string;
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
  tur: "TABLO" | "GRAFİK" | "GEOMETRİ" | "ŞEMA";
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
