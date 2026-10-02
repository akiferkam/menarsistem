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
  /**
   * VEKTÖR/KUVVET OKU (2026-09-05 eklendi) — özellikle FİZİK'te kuvvet/hız/
   * ivme diyagramları GEOMETRI renderer'ını (nokta+kenar) kullanıyordu ama
   * kenarın bir YÖNÜ olduğunu gösterecek hiçbir alan yoktu; canlı testte
   * (job MENAR-FIZ924-20260905125513) bir kuvvet şeması yalnız düz bir
   * çizgi+nokta harfleriyle çizildi, ok/yön hiç görsele işlenmedi. "NOKTA1"/
   * "NOKTA2" ucuna, veya "IKI_UC"a ok başı ekler; "YOK"/boş = düz kenar
   * (eski davranış, geriye dönük uyumlu).
   */
  ok: z.enum(["YOK", "NOKTA1", "NOKTA2", "IKI_UC"]).nullish(),
  /**
   * Kenarın yanına yazılacak KISA etiket (ör. "F₁ = 4 N", "v = 12 m/s") —
   * aynı canlı testte kuvvet büyüklükleri yalnız paragraf metninde geçiyordu,
   * diyagramın kendisi hiçbir sayı taşımıyordu. Deterministik SVG <text> ile
   * çizilir (AI çizmez), bu yüzden güvenilir — istenilen uzunlukta/sembolde
   * kullanılabilir.
   */
  etiket: z.string().nullish(),
});

const GeometrikAciSchema = z.object({
  kose: z.string(),
  kenar1: z.string(),
  kenar2: z.string(),
  deger: z.string().nullish(),
  dik_aci: z.boolean().nullish(),
});

/**
 * GEOMETRİ dersinde gerçek-yaşam bağlamlı ama geometrik olarak basit
 * sahneler (merdiven-duvar, direk-gölge, rampa, bina, köprü, çatı, halat,
 * saat, tekerlek, ağaç...) için — kullanıcı isteği 2026-08-23: bu tür
 * sahnelerde fotogerçekçi AI görseli yerine, geometrik_noktalar/kenarlar/
 * acilar'ın ZATEN taşıdığı matematiksel gerçeği bir "gerçek dünya derisiyle"
 * giydirmek çok daha güvenilir (açı/uzunluk verisi hiç AI'dan geçmez).
 * kenar/nokta yalnız HANGİ segmentin/noktanın hangi öğeyle temsil edileceğini
 * eşler — yeni bir sayısal veri taşımaz, bkz. 14-veri-katmani.ts.
 */
const BaglamSahnesiElemaniSchema = z.object({
  tur: z.enum([
    "DUVAR",
    "ZEMIN",
    "MERDIVEN",
    "DIREK",
    "GOLGE",
    "RAMPA",
    "BINA",
    "KOPRU",
    "CATI",
    "HALAT",
    "TEKERLEK",
    "AGAC",
    "KISI_SILUETI",
    "SAAT_KADRANI",
  ]),
  // Kenar-tabanlı öğeler (DUVAR/ZEMIN/MERDIVEN/GOLGE/RAMPA/KOPRU/HALAT/DIREK)
  // iki nokta adı arasındaki segmenti "giydirir" — nokta adları
  // geometrik_noktalar'daki 'ad' değerleriyle birebir eşleşmeli.
  kenar: KenarUcSchema.nullish(),
  // Nokta-tabanlı öğeler (BINA/CATI/TEKERLEK/AGAC/KISI_SILUETI/SAAT_KADRANI,
  // veya tek bir noktadan yükselen DIREK) tek bir nokta adının yanına çizilir.
  nokta: z.string().nullish(),
});

const GrafikNoktaSchema = z.object({ x: z.number().nullish(), y: z.number().nullish(), etiket: z.string().nullish() });

// Kullanıcı geri bildirimi (2026-09-29, "grafik çizme falan yapamıyorsun"):
// tek düz `noktalar` dizisi yalnız BİR veri serisini taşıyabiliyordu — "A ve
// B deposunun haftalık stok değişimini KARŞILAŞTIR" gibi çok yaygın bir
// bağlam-temelli kalıp (aynı eksende birden fazla trendi karşılaştırma)
// yapısal olarak İMKANSIZDI. `seriler` (opsiyonel) birden fazla adlandırılmış
// seriyi taşır — render/14-veri-katmani.ts her seriyi kendi rengiyle çizip
// bir gösterge (lejant) ekler. Geriye dönük uyumluluk için tekli `noktalar`
// alanı KALDIRILMADI — `seriler` boşsa eski tek-seri davranışı aynen sürer.
const GrafikSerisiSchema = z.object({
  tur: z.enum(["CIZGI", "SUTUN"]),
  baslik: z.string().nullish(),
  x_baslik: z.string().nullish(),
  y_baslik: z.string().nullish(),
  noktalar: z.array(GrafikNoktaSchema).nullish(),
  // Birden fazla seri karşılaştırılacaksa BUNU kullan, `noktalar`ı BOŞ
  // bırak. En fazla 4 seri — daha fazlası okunaksız/renk karmaşası yaratır.
  // Her serinin `noktalar` dizisi AYNI x eksenini (aynı zaman/kategori
  // noktalarını) paylaşmalı, aksi halde karşılaştırma anlamsızlaşır.
  seriler: z.array(z.object({ ad: z.string(), noktalar: z.array(GrafikNoktaSchema) })).min(2).max(4).nullish(),
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
  // bkz. BaglamSahnesiElemaniSchema yorumu — GEOMETRİ dersinde gerçek-yaşam
  // bağlamını fotogerçekçi AI görseli yerine deterministik "sahne derisi"yle
  // temsil eder.
  baglam_sahnesi_elemanlari: z.array(BaglamSahnesiElemaniSchema).nullish(),
  olcekli_cizim: z.boolean().nullish(),
  grafik_serisi: GrafikSerisiSchema.nullish(),
  tablo: TabloSchema.nullish(),
  nesne_semasi: NesneSemasiSchema.nullish(),
  // Bağlam temelli sorularda (özellikle TDE, ileride Tarih/Coğrafya/Din/
  // Felsefe) iki+ kişi arasındaki konuşmayı göstermek için (kullanıcı
  // isteği, 2026-09-14). `yon` verilmezse renderer sırayla sol/sağ dağıtır.
  konusma_baloncuklari: z
    .array(z.object({ konusmaci: z.string(), metin: z.string(), yon: z.enum(["SOL", "SAG"]).nullish() }))
    .nullish(),
  dogru_cevap_degeri: z.string().nullish(),
  secenek_degerleri: z.array(z.string()).nullish(),
  baglam_katmani_nesneleri: z.array(z.string()).nullish(),
  // GÖRSEL MİKTAR/KİMLİK KODLAMASI (bkz. 02-build-prompt.ts madde 11) için —
  // canlı testte görüldü, KRİTİK: görsel denetimi (19-gorsel-denetim.ts)
  // sayı doğruluğunu kendi vision-LLM yargısına bırakınca bu, manifestin
  // KENDİSİYLE ("4 ayrı yeşil ped" gibi) ÖNCEDEN beslendiği için modeli
  // "zaten doğru" demeye yönlendirdi (bir job'da görsel gerçekte 6 ped/3
  // numune içeriyordu, denetim yine de "4 ped/2 numune, PASS" yazdı — kod
  // seviyesinde deterministik bir karşılaştırma OLMADIĞI için bu sessizce
  // yanlış bir cevap anahtarına yol açabilirdi). Bu alan, renk/miktar
  // kodlamasıyla ayırt edilen HER nesne grubu için beklenen TAM sayıyı
  // yapılandırılmış olarak tutar — `denetleGorsel()` artık vision-LLM'in
  // kendi PASS/RED yargısına değil, bu sayıyla LLM'in BAĞIMSIZ SAYDIĞI
  // (sayilan_nesneler, bkz. 18-gorsel-denetim-schema.ts) değerin KOD
  // TARAFINDA birebir eşleşip eşleşmediğine bakar.
  renk_miktar_sayimlari: z
    .array(z.object({ nesne: z.string(), beklenen_adet: z.number().int().min(1) }))
    .nullish(),
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
  // OLCUM_CIZGISI (2026-09-14, kullanıcı isteği — "FOTOGRAF_UZERINDE" stratejisi):
  // cetvel/mezür/gösterge skalası gibi bir ÖLÇÜM YÜZEYİ sahnede fiziksel
  // olarak var (ve kendi sabit ölçek çentikleri/rakamları normal şekilde AI
  // tarafından çizilebilir — bunlar veriye bağlı değil, cetvelin kendi
  // basılı skalasıdır) ama ÖLÇÜLEN NOKTAYA işaret eden renkli kılavuz
  // çizgi(ler) ve o çizginin taşıdığı değer AI'DAN ÇİZDİRİLMEZ — bunlar
  // `overlay_cizgileri` + `overlay_konumlari`/`gorselde_gosterilecek_degerler`
  // ile üretim SONRASI deterministik bindirilir (bkz. render/gorsel-overlay.ts).
  // KUVVET_OKU (2026-09-14, kullanıcı isteği — "üstte grafik şeklinde kuvvet
  // gösterimi istemiyorum, seçime bırak, AI'ya bırak çizsin"): kuvvet/hız/ivme
  // gibi VEKTÖREL bir büyüklüğün oku+etiketi artık ayrı bir GEOMETRI SVG
  // şeması olarak DEĞİL, doğrudan bağlam fotoğrafının ÜZERİNDE gösterilebilir
  // — DETERMINISTIK_SVG stratejisinde (varsayılan) bu tür hâlâ geçerli DEĞİL,
  // yalnız FOTOGRAF_UZERINDE/FOTOGRAF_UZERINDE_HIBRIT seçiliyken kullanılır
  // (bkz. 02-build-prompt.ts). Ok(lar) `overlay_cizgileri`nin `ok` alanıyla,
  // büyüklük etiketi (ör. 'F=6 N') aynı çizginin `etiket` alanıyla taşınır.
  gorsel_veri_gosterimi: z
    .enum(["YOK", "CIHAZ_EKRANI", "TEKNIK_ETIKET", "OLCUM_CIZGISI", "KUVVET_OKU", "NESNE_INDEKSI"])
    .nullish(),
  // CIHAZ_EKRANI/TEKNIK_ETIKET ise görselde TAM OLARAK görünmesi gereken
  // gerçek değerler; NESNE_INDEKSI ise yalnız basit indeks etiketleri
  // ("1","2","3"... — gerçek değerler DEĞİL). gorsel_veri_manifesti ile
  // birebir uyuşmalı, fazladan uydurma rakam eklenmez.
  gorselde_gosterilecek_degerler: z.array(z.string()).nullish(),
  // AI görsel modeli metin/rakam çizmekte KALICI OLARAK güvenilmez (bkz.
  // proje hafızası menar-mays-gorsel-mimari — gpt-image-1/fal.ai ikisi de
  // canlı testte rakam/etiket bozuyor). Bu yüzden gorsel_veri_gosterimi!=YOK
  // olduğunda AI'dan değerleri KENDİSİ ÇİZMESİ artık istenmiyor — bunun
  // yerine AI yalnız o bölgeyi BOŞ/NÖTR bırakır (ör. kapalı/boş bir ekran,
  // düz boş bir etiket yüzeyi), gerçek metin `render/gorsel-overlay.ts`
  // tarafından üretim SONRASI, gerçek bir tarayıcı font motoruyla (hiç AI
  // riski taşımadan) bindirilir (bkz. 20-baglam-gorseli.ts). Her giriş
  // `gorselde_gosterilecek_degerler`deki AYNI İNDEKSTEKİ değere karşılık
  // gelir (dizi uzunlukları birebir eşleşmeli) — üretici bu boş bölgenin
  // görselin neresinde olacağına (yüzde cinsinden, sol-üst köşe 0,0) kendisi
  // karar verir, biz yalnız o koordinata yazıyoruz.
  overlay_konumlari: z
    .array(z.object({ x_yuzde: z.number().min(0).max(100), y_yuzde: z.number().min(0).max(100) }))
    .nullish(),
  // OLCUM_CIZGISI için: bir ölçüm/kılavuz çizgisinin iki ucu (yüzde, sol-üst
  // köşe 0,0) — ör. bir cetvelin üzerinde ölçülen nesnenin başlangıç/bitiş
  // noktasını işaretleyen dikey çizgi. overlay_konumlari'nin AYNI mantığı:
  // AI bu çizgiyi KENDİSİ ÇİZMEZ (piksel-kesin değil, kanıtlanmış — bkz.
  // proje hafızası), yalnız çizginin GEÇECEĞİ konumu (fotoğraf üretilmeden
  // önceki tahmini) belirtir; gerçek çizgi render/gorsel-overlay.ts tarafından
  // üretim SONRASI, gerçek bir SVG çizim motoruyla bindirilir.
  overlay_cizgileri: z
    .array(
      z.object({
        x1_yuzde: z.number().min(0).max(100),
        y1_yuzde: z.number().min(0).max(100),
        x2_yuzde: z.number().min(0).max(100),
        y2_yuzde: z.number().min(0).max(100),
        renk: z.string().nullish(),
        etiket: z.string().nullish(),
        // KUVVET_OKU için: bu çizginin hangi ucu (varsa) ok başı taşır —
        // `geometrik_kenarlar.ok` ile AYNI sözleşme (bkz. GeometrikKenarSchema).
        // OLCUM_CIZGISI'nde genelde YOK/boş kalır (düz kılavuz çizgisi yeterli).
        ok: z.enum(["YOK", "UC1", "UC2", "IKI_UC"]).nullish(),
      })
    )
    .nullish(),
});

const VeriKatmaniSchema = z.object({
  gerekli: z.boolean().nullish(),
  tur: z.enum(["TABLO", "CIZGI", "SUTUN", "GEOMETRI", "FONKSIYON", "NESNE_SEMASI", "KONUSMA", "YOK"]).nullish(),
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
export type BaglamSahnesiElemani = z.infer<typeof BaglamSahnesiElemaniSchema>;
