import { z } from "zod";

/**
 * node "10P - Üretici Şeması"nın birebir portu (LangChain structured-output
 * parser JSON Schema'sı). Alan adları Türkçe ve snake_case korunur — bu
 * şema hem prompt'a hem de sağlayıcı API'sine (OpenAI/Anthropic) doğrudan
 * gönderilir, adları değiştirmek modelin eğitildiği alan isimlerini bozar.
 */

/**
 * `dogrulama_manifesti` node 10P'nin gerçek şemasında yok — bu, V25 CORE
 * BUILDER'ın (bkz. verify/solver-v25.ts, brief Bölüm 5) çalıştırılabilir
 * doğrulama manifestosunu üretim aşamasına bağlayan kasıtlı bir ek alandır.
 * Alan adları (solver_type/variables/start/nodes/expression/options/
 * claimed_answer) kaynaktaki manifestle aynı tutulur — ama `variables`/
 * `nodes`/`options` kaynakta sözlük (anahtar→değer) iken burada dizi-of-çift
 * olarak modellenir: OpenAI'nin `strict:true` yapılandırılmış çıktı modu
 * açık uçlu anahtarlı nesneleri (`z.record`) desteklemiyor ("propertyNames
 * is not permitted" — canlı modda ilk gerçek denemede yakalandı, mock modda
 * hiç görülmemişti). `verify/solver-v25.ts` bu diziyi kendi içinde
 * Map/Record'a çevirir; solver mantığının kendisi değişmedi.
 */
const AkisDugumuSchema = z.object({
  type: z.enum(["start", "assign", "condition", "output", "end"]),
  next: z.string().nullish(),
  var: z.string().nullish(),
  expr: z.string().nullish(),
  true: z.string().nullish(),
  false: z.string().nullish(),
  value: z.union([z.string(), z.number()]).nullish(),
});

const AkisDugumuGirdisiSchema = z.object({ id: z.string(), dugum: AkisDugumuSchema });
const DegiskenGirdisiSchema = z.object({ ad: z.string(), deger: z.number() });
const SecenekDegeriGirdisiSchema = z.object({ harf: z.string(), deger: z.union([z.string(), z.number()]) });

const DogrulamaManifestiSchema = z.object({
  solver_type: z.enum(["ALGORITHM_FLOW", "NUMERIC_EXPRESSION", "UNSUPPORTED"]),
  variables: z.array(DegiskenGirdisiSchema).nullish(),
  start: z.string().nullish(),
  nodes: z.array(AkisDugumuGirdisiSchema).nullish(),
  expression: z.string().nullish(),
  options: z.array(SecenekDegeriGirdisiSchema).nullish(),
  claimed_answer: z.string().nullish(),
});

/**
 * 2026-08-17'de eski toplamalı A-F formülünden (A×40+B×15+...) yeni 13-kademeli
 * kalite standardının 10 audit ölçütüne geçildi (bkz. types.ts HedefIQ yorumu,
 * kaynak: kılavuz/iqmatematik/IQ_SORU_Standartlar_Matematik.docx). Alan adları
 * kaynağın "4. IQ Audit" tablosundaki 10 satırla birebir eşleşiyor —
 * bagimsiz_karar_sayisi hariç hepsi var/yok (kaynağın kendi ifadesiyle "evet/
 * hayır" denetim soruları).
 */
const IqBileseniSchema = z.object({
  bagimsiz_karar_sayisi: z.number().min(1),
  veri_secme_eleme: z.boolean(),
  model_kurma: z.boolean(),
  temsil_donusumu: z.boolean(),
  ortuk_kosul: z.boolean(),
  tersine_dusunme: z.boolean(),
  strateji_secimi: z.boolean(),
  sinir_durumu: z.boolean(),
  dogrulama: z.boolean(),
  genelleme_ispat: z.boolean(),
  gerekce: z.string().optional(),
});

const GeneratorSoruSchema = z.object({
  kok: z.string(),
  secenekler: z.array(z.string()).length(5),
  dogru_secenek: z.enum(["A", "B", "C", "D", "E"]),
  dogru_cevap: z.string(),
  cozum_adimlari: z.array(z.string()),
  cozum_dna: z.array(z.string()).nullish(),
  celdirici_hata_yollari: z.array(z.string()).length(5),
  ogrenme_becerisi: z.string(),
  ikinci_konu: z.string().nullish(),
  iq: IqBileseniSchema,
  dogrulama_manifesti: DogrulamaManifestiSchema,
});

const StimulusSchema = z.object({
  paragraphs: z.array(z.string()).nullish(),
  notes: z.array(z.string()).nullish(),
});

const BtgKaynakManifestiSchema = z.object({
  KAYNAK_AILESI: z.string().nullish(),
  KURUM_YAYIN: z.string().nullish(),
  BELGE_TURU: z.string().nullish(),
  BASLIK: z.string().nullish(),
  YIL_VERI_DONEMI: z.string().nullish(),
  DOI_KAYIT_URL: z.string().nullish(),
  BILIMSEL_CEKIRDEK: z.string().nullish(),
  VERI_VE_BIRIM: z.string().nullish(),
  SADELESTIRME: z.string().nullish(),
  AKADEMIK_KAYNAK_DOGRULAMASI: z.enum(["PASS", "RED", "UYGULANMAZ"]).nullish(),
});

const GeometrikNoktaSchema = z.object({
  ad: z.string().nullish(),
  x: z.number().nullish(),
  y: z.number().nullish(),
});

/**
 * geometrik_noktalar eskiden yalnız kapalı bir çokgen (nokta sırasıyla
 * birleştirilir) çizebiliyordu — yardımcı doğrulara (Öklid yüksekliği,
 * kenarortay/açıortay), eşlik/uzunluk işaretlerine veya açı yaylarına yer
 * yoktu. Bu üç alan MEB/ÖSYM tarzı bir geometri şeklinin gerçekte taşıdığı
 * bilgiyi (hangi noktalar segmentle bağlı, hangi kenarlar eşit uzunlukta,
 * hangi köşede kaç derecelik/dik açı var) açıkça modelliyor — SVG renderer
 * (14-veri-katmani.ts) artık sabit bir çokgen yerine bunlardan çizim üretir.
 */
/**
 * OpenAI structured-output (strict) response_format, Zod tuple'ların
 * ("z.tuple") ürettiği pozisyonel-items JSON şemasını KABUL ETMİYOR ("array
 * schema missing items" hatası — 2026-08-17'de canlı modda ilk kez görüldü,
 * bu alan o güne kadar hiç doldurulmamış olduğu için gizli kalmıştı: sunucu
 * saatlerce bayat kod çalıştırıyordu, bkz. proje hafızası). Sabit-uzunluklu
 * çift yerine adlandırılmış alanlı bir nesne kullanmak strict modda güvenli.
 */
const KenarUcSchema = z.object({ nokta1: z.string(), nokta2: z.string() });

const GeometrikKenarSchema = z.object({
  uclar: KenarUcSchema,
  stil: z.enum(["DUZ", "KESIKLI"]).nullish(),
});

const GeometrikAciSchema = z.object({
  kose: z.string(),
  kenar1: z.string(),
  kenar2: z.string(),
  deger: z.string().nullish(),
  dik_aci: z.boolean().nullish(),
});

const GrafikSerisiSchema = z.object({
  tur: z.enum(["CIZGI", "SUTUN"]),
  baslik: z.string().nullish(),
  x_baslik: z.string().nullish(),
  y_baslik: z.string().nullish(),
  noktalar: z.array(z.object({ x: z.number().nullish(), y: z.number().nullish(), etiket: z.string().nullish() })).nullish(),
});

const TabloSchema = z.object({
  caption: z.string().nullish(),
  headers: z.array(z.string()).nullish(),
  rows: z.array(z.array(z.string())).nullish(),
  footnotes: z.array(z.string()).nullish(),
});

/**
 * `gorsel_veri_gosterimi=NESNE_INDEKSI`'nin (fotoğrafa AI ile indeks
 * numarası çizdirme) deterministik yerine geçeni — canlı modda tekrar tekrar
 * (fosil odası, su arıtma, akort modülleri...) görüldü: 6 nesneye 1-6 indeks
 * yazdırmak bile 3 denemenin 3'ünde de eksik/tekrarlı/uydurma-sembollü
 * çıkıyor, sağlayıcıdan bağımsız bir zaaf (bkz. proje hafızası). Basit
 * ardışık indeksler geometrik açı/nokta kadar karmaşık değil ama YİNE DE bir
 * "N nesneyi say ve doğru sırala" görevi — tam olarak AI görsel modelinin
 * güvenilmediği tür. nesne_semasi bunu kod tarafında, hiç AI görsel
 * üretimi/denetiminden geçmeden çizer: toplam_sayi kadar numaralı kutu, isim
 * isaretli_indeksler'de listelenenler ayrı renkte vurgulanır (ör. "hangi
 * modülde uyarı ışığı yanıyor" gibi bir tek-nesne ayırt etme ihtiyacı için).
 */
const NesneSemasiSchema = z.object({
  toplam_sayi: z.number().min(2).max(12),
  indeks_etiketleri: z.array(z.string()).nullish(),
  isaretli_indeksler: z.array(z.number()).nullish(),
  isaret_aciklamasi: z.string().nullish(),
});

const GorselVeriManifestiSchema = z.object({
  manifest_id: z.string(),
  kullanilan_sayilar: z.array(z.string()).nullish(),
  birimler: z.array(z.string()).nullish(),
  degiskenler: z.array(z.string()).nullish(),
  geometrik_noktalar: z.array(GeometrikNoktaSchema).nullish(),
  // Boş/eksikse renderer eski davranışa döner: noktalar sırasıyla kapalı
  // çokgen olarak birleştirilir. Doluysa TAM OLARAK bu kenarlar çizilir
  // (yardımcı doğrular/kenarortay/yükseklik dahil) — çokgen varsayımı yok.
  geometrik_kenarlar: z.array(GeometrikKenarSchema).nullish(),
  // Her iç dizi, aynı işaretle (tek/çift/üç çentik) gösterilecek kenar
  // uçlarının grubu — ör. [{nokta1:"A",nokta2:"B"},{nokta1:"A",nokta2:"C"}]
  // AB=AC eşliğini işaretler.
  geometrik_esit_kenar_gruplari: z.array(z.array(KenarUcSchema)).nullish(),
  geometrik_acilar: z.array(GeometrikAciSchema).nullish(),
  olcekli_cizim: z.boolean().nullish(),
  grafik_serisi: GrafikSerisiSchema.nullish(),
  tablo: TabloSchema.nullish(),
  nesne_semasi: NesneSemasiSchema.nullish(),
  dogru_cevap_degeri: z.string().nullish(),
  secenek_degerleri: z.array(z.string()).nullish(),
  baglam_katmani_nesneleri: z.array(z.string()).nullish(),
});

const BaglamKatmaniSchema = z.object({
  gerekli: z.boolean().nullish(),
  sahne: z.string().nullish(),
  nesneler: z.array(z.string()).nullish(),
  // "nesneler" tek düz liste olduğunda görsel prompt yazarı hangi nesnenin
  // kompozisyonun neresinde durması gerektiğini bilmiyordu — model sahneyi
  // kendi kararına bırakıyor, sonuç genelde ya boş/simetrik ya da rastgele
  // dolu oluyordu. Bu üç alan aynı nesneleri ön/orta/arka plana ayırarak
  // gerçek bir fotoğraf kompozisyonu iskeleti verir (bkz. 16-gorsel-prompt.ts).
  // Boş bırakılırsa prompt yazarı eski davranışa (düz nesneler listesi) döner.
  on_plan: z.array(z.string()).nullish(),
  orta_plan: z.array(z.string()).nullish(),
  arka_plan: z.array(z.string()).nullish(),
  yasaklar: z.array(z.string()).nullish(),
  islev: z.string().nullish(),
  gorsel_ailesi: z.string().nullish(),
  boyut: z.enum(["2D", "3D"]).nullish(),
  alt_metin: z.string().nullish(),
  // MEB resmî örneklerinde (bkz. example/ klasörü) bağlam görseli çoğu zaman
  // saf atmosfer sahnesi değil — bir ölçüm cihazının ekranındaki okuma
  // (kumpas, kalibrasyon paneli) veya boyutlandırılmış bir teknik çizim
  // (atletizm piste kapıları, mikroçip plaka ölçüleri) gibi görselin
  // KENDİSİ veri taşıyor. YOK: eski davranış (hiç yazı/rakam yok). CIHAZ_EKRANI:
  // fotogerçekçi sahnede küçük bir dijital ekran/gösterge birkaç değeri
  // gösterir. TEKNIK_ETIKET: sahnenin üzerine ölçü/değer etiketleri iliştirilir.
  // NESNE_INDEKSI: ARTIK ÜRETİCİ TARAFINDAN PROAKTİF SEÇİLMEMELİ (preflight
  // bunu engelliyor) — fotoğrafa AI ile basit ardışık indeks (1,2,3...)
  // yazdırmak bile canlı modda tekrar tekrar (fosil odası, su arıtma,
  // akort modülleri...) 3/3 RED aldı, sağlayıcıdan bağımsız bir zaaf.
  // Nesneleri indekslemek/bir nesneyi öne çıkarmak gerekiyorsa bunun yerine
  // gorsel_veri_manifesti.nesne_semasi + veri_katmani.tur=NESNE_SEMASI kullan
  // (kod tarafında deterministik çizilir, hiç AI görsel riski taşımaz) —
  // baglam_katmani bu durumda gorsel_veri_gosterimi=YOK kalır. NESNE_INDEKSI
  // yalnız sistemin kendi iç retry-fallback mekanizmasında (20-baglam-
  // gorseli.ts) hâlâ var — üretici JSON'unda bunu baştan seçmemeli.
  gorsel_veri_gosterimi: z.enum(["YOK", "CIHAZ_EKRANI", "TEKNIK_ETIKET", "NESNE_INDEKSI"]).nullish(),
  // CIHAZ_EKRANI/TEKNIK_ETIKET ise görselde TAM OLARAK görünmesi gereken
  // gerçek değerler; NESNE_INDEKSI ise yalnız basit indeks etiketleri
  // ("1","2","3"... — gerçek değerler DEĞİL). gorsel_veri_manifesti ile
  // birebir uyuşmalı, fazladan uydurma rakam eklenmez. Görsel denetimi
  // (19-gorsel-denetim.ts) bunlarla karşılaştırır.
  gorselde_gosterilecek_degerler: z.array(z.string()).nullish(),
});

const VeriKatmaniSchema = z.object({
  gerekli: z.boolean().nullish(),
  tur: z.enum(["TABLO", "CIZGI", "SUTUN", "GEOMETRI", "FONKSIYON", "NESNE_SEMASI", "YOK"]).nullish(),
  baslik: z.string().nullish(),
  // gorselde_gosterilecek_degerler 2'den fazla değer içerdiğinde (bkz.
  // 02-build-prompt.ts "SAYI SINIRI VE YEDEK TABLO") kurulması ZORUNLU olan
  // tablo — ama bu tablo yalnız görsel üretimi başarısız olup sistem
  // NESNE_INDEKSI'ye düştüğünde öğrenciye gösterilir (bkz. proje hafızası
  // "aynı veri farklı yerlerde tekrar edilmemeli" kuralı). true ise ve görsel
  // gerçek değerlerle başarılı olursa (`20-baglam-gorseli.ts` hiç düşüş
  // yapmazsa) bu tablo nihai sayfadan ÇIKARILIR — yalnız iç güvenlik ağıdır,
  // görselden bağımsız kendi başına gerekli bir tablo DEĞİLDİR. Görselden
  // bağımsız gerçekten gerekli bir tablo (ör. işlem kuralları kartı) için bu
  // alanı false/boş bırak.
  yalnizca_gorsel_yedegi: z.boolean().nullish(),
});

export const GeneratorOutputSchema = z.object({
  status: z.enum(["PASS", "RED"]),
  red_nedenleri: z.array(z.string()).nullish(),
  baglam_ailesi_kodu: z.string(),
  baglam_ailesi_ad: z.string().nullish(),
  baglam_secim_gerekcesi: z.string().nullish(),
  cozum_dna_kodu: z.string(),
  ikinci_konu: z.string().nullish(),
  stimulus: StimulusSchema.nullish(),
  btg_kaynak_manifesti: BtgKaynakManifestiSchema.nullish(),
  gorsel_veri_manifesti: GorselVeriManifestiSchema,
  baglam_katmani: BaglamKatmaniSchema.nullish(),
  veri_katmani: VeriKatmaniSchema.nullish(),
  sorular: z.array(GeneratorSoruSchema).min(1).max(5),
});

export type GeneratorOutput = z.infer<typeof GeneratorOutputSchema>;
export type GeneratorSoru = z.infer<typeof GeneratorSoruSchema>;
