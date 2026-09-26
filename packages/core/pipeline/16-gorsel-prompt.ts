import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { GorselPromptOutputSchema } from "./15-gorsel-prompt-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import { genislikSinifi } from "./types.js";
import type { Ders, JobInput, RotationLedger } from "./types.js";

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
  // 2026-08-22 (kullanıcı isteği): "QR kod/filigran/marka logosu/BÜYÜK-BASKIN
  // okunaklı yazı" maddesi buradan kaldırıldı — bu metin de (STİL PROFİLİ
  // bloğunun bir parçası olarak) HER üretimde görsel modele gönderilen
  // promptun içine giriyordu; "yazı/rakam olmasın" demenin tam tersini
  // tetikleme ihtimaline karşı prompttan bu konu tamamen çıkarıldı (bkz.
  // GORSEL_PROMPT_SYSTEM'deki eşlik eden not). Poster/UI-ekranı görünümü ve
  // diğer yapay-görünüm kısıtları (bunlarla ilgisiz) aynen kalıyor. Gerçek
  // metin/rakam artefaktı üretim SONRASI hâlâ `19-gorsel-denetim.ts`nin
  // bağımsız METIN_ARTEFAKTI kontrolüyle yakalanıyor.
  "YAPAY-GÖRÜNÜM KISITLARI (bunlardan biri varsa görsel RED alır): aşırı simetrik/steril " +
  "yerleşim; havada asılı veya birbirine mantıksız bağlı nesneler; kaynaşmış/çoğaltılmış/anlamsız " +
  "tekrar eden küçük nesneler; fiziksel olarak tutarsız gölge/perspektif; aşırı bulanıklaştırılmış " +
  "arka plan (aşırı bokeh); poster/afiş/dashboard/UI ekranı görünümü.";

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
  "turuncu kasa ve 2 gri kasa net sayılabilir şekilde' gibi, sadece 'kasalar' değil). Nesneler manifestte " +
  "bir RENK/BOYUT ile anılıyorsa (ör. 'sarı araba', 'büyük kutu' — harf/numara YERİNE kullanılan bir " +
  "kimliklendirme) bu rengi/boyutu TAM OLARAK, değiştirmeden/yuvarlamadan yaz — metindeki soru bu rengi/ " +
  "sayıyı doğru okuyabildiği kadar güvenilir olacak, hafif bir tutarsızlık (ör. 'sarı' yerine 'turuncu' " +
  "yazman) görselin RED almasına yol açar.\n\n" +
  "OLUMSUZ VARLIK CÜMLESİ YAZMA (canlı modda görüldü, ÇOK ÖNEMLİ): betimlemende 'sahnede hiçbir yazı/ " +
  "rakam/etiket yoktur', 'hiçbir marka veya logo bulunmaz' gibi NELERİN OLMADIĞINI anlatan hiçbir cümle " +
  "kurma — sana bu konuda ayrıca bir talimat verilmemiş olsa bile bu tür cümleleri KENDİLİĞİNDEN ekleme. " +
  "Betimleme SADECE sahnede GERÇEKTEN VAR olan nesneleri/nitelikleri anlatır; olmayan bir şeyden bahsetmek " +
  "(onu yasaklamak amacıyla bile olsa) o kavramı görsel üretim modelinin dikkatine taşır ve tam tersi " +
  "sonuç doğurabilir.\n\n" +
  // KALDIRILDI (2026-08-22, kullanıcı isteği — iki madde birlikte):
  // (1) "Yasaklar listesindeki hiçbir öğeyi sahneye ekleme" + "bunu paragrafa
  // yazma" talimatı — artık `yasaklar` yazar-LLM'e HİÇ verilmiyor (bkz.
  // userPrompt'taki not), o yüzden bu talimat da anlamsız hâle geldi, o da
  // kaldırıldı. (2) EKRAN/GÖSTERGE TUZAĞI paragrafı ("cihaza ekran/gösterge/
  // panel kelimesi kullanma") — aynı gerekçeyle: negatif bir kavramdan
  // bahsetmenin (burada "ekran" kelimesinin) modeli tam o kavramı üretmeye
  // ittiği teorisi, artık TÜM "olmasın" tarzı talimatlar için tutarlı şekilde
  // uygulanıyor. Yazar-LLM artık yalnız SAHNE/İŞLEV'e göre POZİTİF içerik
  // yazıyor; gerçekten metin/ekran/rakam içeren bir görsel çıkarsa bunu
  // yakalamak hâlâ `19-gorsel-denetim.ts`nin (bu dosyadan bağımsız) işi.
  // KALDIRILDI (2026-08-22, kullanıcı isteği): eskiden burada "prompt hiçbir
  // sayı/etiket/yazı istemez" diye bir cümle vardı — yazar-LLM bunu genellikle
  // sahne betimlemesinin İÇİNE "sahnede hiçbir yazı/rakam yoktur" tarzında BİR
  // CÜMLE olarak yazıyordu, bu da görsel üretim modeline GÖNDERİLEN promptun
  // içine "yazı/rakam" kelimelerini sokuyordu. Canlı testte (Ideogram 4.0,
  // ama flux/dev'de de daha önce görülen aynı zaaf) modelin tam olarak
  // yasaklanan şeyi (bankodaki şişelere sahte okunaklı etiket) ürettiği
  // gözlemlendi — negatif bir kavramdan bahsetmenin model tarafından
  // ATLANMAK yerine tetiklenmesi ihtimaline karşı, artık BU KONUDAN HİÇ
  // BAHSEDİLMİYOR: yazar-LLM sahneyi yalnız SAHNE/nesne içeriğine göre
  // anlatır, metin/rakam varlığı-yokluğu hakkında hiçbir cümle kurmaz.
  // Sonrasında gerçekten metin/rakam içeren bir görsel üretilirse bunu
  // yakalamak hâlâ `19-gorsel-denetim.ts`nin (görsel üretildikten SONRA
  // çalışan, bu dosyadan tamamen bağımsız) işidir — o denetim BURADAN hiçbir
  // şey miras almadığı için bu değişiklikten etkilenmez, güvenlik ağı korunuyor.
  "BAĞLAM KATMANI PLANI'nda gorsel_veri_gosterimi CIHAZ_EKRANI veya TEKNIK_ETIKET olarak " +
  "işaretlenmişse, sana ayrıca BOŞ BIRAKILACAK BÖLGE(LER) verilecek — bu bölgede (ör. bir ölçüm " +
  "cihazının ekranı KAPALI/BOŞ göründüğü hâlde, ya da teknik çizimin ölçü etiketi yüzeyi düz/boş " +
  "kaldığı hâlde) sahne DOĞAL biçimde tamamlanmalı; gerçek değerleri SEN ÇİZME/YAZDIRMA — bu değerler " +
  "üretim SONRASI ayrıca, deterministik biçimde bindirilecek. Betimlemende o ekranın/etiketin fiziksel " +
  "olarak VAR olduğunu ama üzerinin boş/kapalı/nötr olduğunu belirt. " +
  "OLCUM_CIZGISI işaretlenmişse: sahnede bir ÖLÇÜM YÜZEYİ (cetvel, mezür, gösterge skalası) fiziksel " +
  "olarak var ve kendi SABİT/basılı skalasını (çentikler, sayılar — bunlar veriye bağlı değil, cetvelin " +
  "kendi üretim etiketi) normal şekilde taşıyabilir; ama ÖLÇÜLEN NOKTAYA işaret eden EK bir renkli " +
  "kılavuz çizgi, ok veya vurgulayıcı işaret SEN EKLEME — bu, üretim SONRASI deterministik bir çizim " +
  "motoruyla ayrıca eklenecek (canlı testte kanıtlandı: AI'nın kendi çizdiği kılavuz çizgi doğru sayısal " +
  "noktaya piksel-kesin denk gelmiyor). Ölçüm yüzeyinin üzerinde ölçülen nesne DOĞAL biçimde dursun " +
  "(ör. bir cetvelin yanına konmuş kalem), yalnız o nesneyi işaretleyen ekstra çizgiyi sen çizme. " +
  "Gerçek yaşam sahnesinde 3D, MEB " +
  "teknik anlatımında 2D seçilir. ÖNCELİK SIRASI: önce 3D dene (gerçek fotoğraf gibi); sahne 3D'de " +
  "doğru ve anlaşılır şekilde temsil edilemiyorsa (ör. gerçekten şematik/teknik bir içerikse) 2D'ye " +
  "geç. Yalnız şemaya uygun JSON döndür.";

/**
 * Ders-özel "bilimsel görsel dili" eki (2026-09-05, kullanıcı isteği: "kimya
 * biyoloji fizik gibi derslerde daha böyle bilimsel şeyler ... buna özel
 * şeyler olması gerekiyor"). GORSEL_PROMPT_SYSTEM tüm derslerde ORTAK kalır
 * (sahne/işlev/format kuralları evrensel) — burada yalnız her dersin kendi
 * bilimsel görsel TUZAKLARI ele alınır: hangi kavramlar GERÇEKTEN fotoğraf-
 * lanabilir (gerçek, elle tutulur laboratuvar/gündelik nesneler) ve hangileri
 * ASLA fotoğrafa çizilmeye çalışılmamalı (gözle görülemeyen/soyut büyüklükler
 * — bunlar için doğru araç `veri_katmani` — GEOMETRI+ok/etiket, ŞEMA, GRAFİK
 * — zaten var, bkz. 02-build-prompt.ts VEKTÖR/KUVVET OKU kuralı). Tıpkı
 * IQ_KURALI gibi Record<Ders,string> deseninde; yalnız gerçekten kendine özgü
 * tuzağı olan dersler (FİZİK/KİMYA/BİYOLOJİ) burada yer alır — MATEMATİK/
 * GEOMETRİ/TDE'nin böyle bir ek gereksinimi tespit edilmedi.
 */
const GORSEL_PROMPT_SYSTEM_DERS: Partial<Record<Ders, string>> = {
  FIZIK:
    "FİZİK'E ÖZEL: kuvvet, alan, dalga boyu, akım yönü, ışın yolu gibi YÖNLÜ/SOYUT büyüklüklerin " +
    "KENDİSİNİ (ok, çizgi, parlaklık hâlesi, alan çizgisi olarak) fotoğrafa ÇİZME — gerçek bir " +
    "fotoğrafta bunlar görünmez, görsel model bunu yapay/CGI bir ekleme olarak üretir ve RED alır; bu " +
    "büyüklükler zaten `veri_katmani` (GEOMETRI+ok/etiket veya GRAFİK) ile ayrı, deterministik olarak " +
    "gösteriliyor. Senin işin yalnız bu büyüklüklerin UYGULANDIĞI GERÇEK, ELLE TUTULUR nesneleri " +
    "(mıknatıs, ağırlık/kütle, eğik düzlem, sarkaç, yay, taşıt modeli, optik bank, mercek/ayna/prizma " +
    "standı, breadboard/kablo/pil/ampul/direnç/multimetre) somut bir laboratuvar/deney masası sahnesinde " +
    "betimlemek. Devre şeması/bağlantı diyagramının kendisi de aynı sebeple ASLA fotoğrafa çizilmez — " +
    "gerçek fiziksel bileşenler (kablolarla bağlı gerçek parçalar) fotoğraflanır, sembolik şema değil.",
  KIMYA:
    "KİMYA'YA ÖZEL: atom, iyon, molekül, elektron, bağ gibi TANECİK-DÜZEYİ kavramların KENDİSİNİ " +
    "fotoğrafa çizme — bunlar çıplak gözle/normal fotoğrafla görünmez, bunun için doğru araç " +
    "`veri_katmani`dir (tanecik/Lewis şeması). Fotoğraf yalnız MAKROSKOBİK gözlemi gösterir: gerçek " +
    "laboratuvar cam malzemesi (beher, erlen, deney tüpü, balon joje, büret) ve KİMYASAL OLARAK MAKUL, " +
    "doğal/donuk renkte çözelti/katı/çökelti/gaz (ör. hafif mavi CuSO4 çözeltisi, beyaz çökelti) — " +
    "rastgele parlak neon renk, 'büyülü iksir' dumanı veya alev/patlama efekti gibi gerçekçi olmayan " +
    "laboratuvar-dışı görünümler YASAK, gerçek bir okul laboratuvarında görülebilecek sahne kur.",
  BIYOLOJI:
    "BİYOLOJİ'YE ÖZEL: hücre içi organel (mitokondri, çekirdek, ribozom vb.), DNA/protein yapısı gibi " +
    "MİKROSKOBİK/MOLEKÜLER kavramların KENDİSİNİ fotoğrafa çizme — bunlar normal bir fotoğrafla " +
    "görünmez, bunun için doğru araç `veri_katmani`dir (şema). Bir mikroskop sahnesinde cihazın KENDİSİ " +
    "(gövde, lam, oküler) fotoğraflanabilir ama mikroskobun ALTINDA GÖRÜNDÜĞÜ VARSAYILAN görüntü " +
    "(hücreler vb.) fotoğrafın bir parçası OLAMAZ. Fotoğraf yalnız GERÇEKTEN görülebilir, elle tutulur " +
    "biyolojik nesneleri betimler: canlı/örnek organizma, yaprak, tohum, böcek, akvaryum, petri kabı, " +
    "laboratuvar ekipmanının kendisi.",
};

/**
 * KONUŞMA (veri_katmani.tur=KONUSMA) için AYRI, kendi başına yeten bir sistem
 * promptu — ORTAK_FOTO_KURALLARI/GORSEL_PROMPT_SYSTEM'in "gerçek fotoğraf,
 * illüstrasyon KESİNLİKLE yasak" kuralı burada BİLİNÇLİ OLARAK tersine
 * çevrilir (kullanıcı isteği, 2026-09-14 — çizgi roman panelinin kendisi
 * istenen çıktı). Ham testte (bkz. proje hafızası) gpt-image-2.5-sunburst
 * doğru girdi verildiğinde Türkçe karakterleri (ş/ı/ğ/ü/ö/ç) DOĞRU çizdi —
 * ama İLK denemede test promptunun kendisi ASCII'ye indirgenmiş Türkçe
 * içerdiği için model de aynı hatayı harfiyen kopyaladı. Bu, modelin kendi
 * hatası değil YAZANIN hatasıydı — o yüzden burada VE userPrompt'ta bu tuzağa
 * karşı açık bir uyarı var.
 */
const GORSEL_PROMPT_SYSTEM_KONUSMA_CIZIM =
  "Sen bir DERS KİTABI ÇİZGİ ROMAN/İLLÜSTRASYON PANELİ üretim ajanısın. Bu görev diğer bağlam görseli " +
  "görevlerinden FARKLI: burada fotogerçekçilik İSTENMİYOR, aksine temiz bir çizgi roman/karikatür " +
  "illüstrasyon stili (siyah-beyaz veya sade renkli çizgi sanatı, ders kitabı/okuma kitabı illüstrasyonu " +
  "estetiğinde) İSTENİYOR. Sahne, verilen konuşmacıların betimlenen ortamda (ör. sınıf, kütüphane, sokak) " +
  "karşılıklı konuştuğu bir an olmalı. HER konuşmacının üzerinde klasik bir çizgi roman konuşma balonu " +
  "(yuvarlak/oval kenarlı, ağza doğru uzanan küçük bir kuyruklu) bulunmalı, balonun içinde SANA VERİLEN " +
  "metin TAM OLARAK, harfi harfine, doğru Türkçe karakterlerle (ş, ı, ğ, ü, ö, ç — bunları ASLA düz ASCII " +
  "harfe (s, i, g, u, o, c) İNDİRGEME) yazılmalı, okunaklı bir çizgi roman harf stiliyle. Balon sayısı TAM " +
  "OLARAK sana verilen replik sayısı kadar olmalı, fazla/eksik balon veya sahneye eklenen başka hiçbir yazı/ " +
  "rakam/logo olmamalı. Yalnız şemaya uygun JSON döndür.";

/** overlay_konumlari'ndaki yüzde koordinatını görsel-üretim promptu için okunur bir konum adına çevirir. */
function konumTanimla(xYuzde: number, yYuzde: number): string {
  const yatay = xYuzde < 33 ? "sol" : xYuzde > 66 ? "sağ" : "orta";
  const dikey = yYuzde < 33 ? "üst" : yYuzde > 66 ? "alt" : "orta";
  if (yatay === "orta" && dikey === "orta") return "tam merkez";
  return `${dikey}-${yatay}`;
}

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

  // KONUŞMA (veri_katmani.tur=KONUSMA, üretici bunu bağlamda GERÇEKTEN bir
  // diyalog varsa kendiliğinden seçer — bkz. 02-build-prompt.ts madde 14b):
  // TAMAMEN AYRI bir yol — normal fotoğraf makinesi (ORTAK_FOTO_KURALLARI'nın
  // "illüstrasyon YASAK" kuralı, overlay_konumlari/renk_miktar_sayimlari
  // mantığı vb.) burada hiç geçerli değil, bu yüzden fonksiyonun geri
  // kalanına hiç girmeden erken dönülür. Kullanıcı isteği (2026-09-16):
  // "ben her seferinde seçmemeliyim, senaryoya uygunsa kullansın, üretim
  // standart olarak AI olsun" — bu yüzden HİÇBİR JobInput bayrağına bakmaz,
  // yalnız üreticinin konusma_baloncuklari doldurup doldurmadığına bakar.
  if ((aday.gorsel_veri_manifesti?.konusma_baloncuklari?.length ?? 0) >= 2) {
    const konusma = aday.gorsel_veri_manifesti!.konusma_baloncuklari!;
    const userPromptKonusma =
      "/KONUŞMA İLLÜSTRASYONU/\n\n" +
      `SAHNE (bağlam): ${bk?.sahne ?? "Konuşmacıların doğal biçimde bulunabileceği bir mekân"}\n` +
      "REPLİKLER (TAM OLARAK bu sırada, bu metinlerle, Türkçe karakterleri KORUYARAK):\n" +
      konusma.map((k, i) => `${i + 1}) ${k.konusmaci}: "${k.metin}"`).join("\n") +
      `\nSON 15 GÖRSEL AİLESİ (tekrar yasak): ${ledger.son15GorselAilesi.join(" | ")}`;
    const p2 = await callStructured(deps.provider, {
      model: deps.model,
      systemPrompt: GORSEL_PROMPT_SYSTEM_KONUSMA_CIZIM,
      userPrompt: userPromptKonusma,
      schema: GorselPromptOutputSchema,
      schemaName: "GorselPromptOutput",
      reasoningEffort: "high",
    });
    const illustrasyonStilProfili =
      "STİL PROFİLİ (MAYS_KONUSMA_CIZIM_V1 — sabit, her üretimde aynı): temiz, sade çizgi roman/karikatür " +
      "illüstrasyon stili (ders/okuma kitabı estetiği); siyah-beyaz çizgi sanatı veya en fazla 2-3 sade renk; " +
      "aşırı detay/gölgeleme/fotogerçekçi doku YOK; her konuşma balonu net kenarlı, kuyruğu doğru konuşmacıya " +
      "işaret ediyor; balon içindeki metin doğru Türkçe karakterlerle (ş/ı/ğ/ü/ö/ç), okunaklı bir çizgi roman " +
      "harf stiliyle yazılı; sahnede balon metinleri DIŞINDA hiçbir yazı/rakam/logo yok.";
    return {
      prompt: [p2.prompt || "", "", illustrasyonStilProfili].join("\n"),
      gorselAilesi: p2.gorsel_ailesi || bk?.gorsel_ailesi || "",
      boyut: "2D",
      imageSize: genislikSinifi(input.genislik) === "DAR" ? "1024x1024" : "1536x1024",
      deneme: 1,
    };
  }

  const veriGosterimi = bk?.gorsel_veri_gosterimi ?? "YOK";
  const gosterilecekDegerler = bk?.gorselde_gosterilecek_degerler ?? [];
  const overlayKonumlari = bk?.overlay_konumlari ?? [];
  const overlayCizgileri = bk?.overlay_cizgileri ?? [];
  // KUVVET_OKU'da veri metin kutusu değil, doğrudan çizgi+etiket olarak
  // taşınabilir (overlay_cizgileri) — bu durumda gosterilecekDegerler BOŞ
  // kalabilir, tek başına "veri yok" sanılmamalı.
  const veriGosteriliyor = veriGosterimi !== "YOK" && (gosterilecekDegerler.length > 0 || overlayCizgileri.length > 0);
  // FOTOGRAF_UZERINDE_HIBRIT (kullanıcı isteği, 2026-09-14): bu fonksiyon
  // yalnız BİR KEZ, ilk denemeden önce çağrılır — bu yüzden "AI önce dener"
  // kararı burada, en baştan verilmeli (retry döngüsündeki strateji
  // değişimi `20-baglam-gorseli.ts`'te, farklı bir mekanizmayla olur).
  const hibritModu = input.gorselVeriStratejisi === "FOTOGRAF_UZERINDE_HIBRIT";
  // NESNE_INDEKSI hâlâ AI'ın kendisinin çizdiği eski yoldan gidiyor (bkz.
  // 20-baglam-gorseli.ts runtime fallback) — yalnız CIHAZ_EKRANI/TEKNIK_ETIKET
  // artık deterministik bindirmeye devrediliyor, bu yüzden burada ayrılıyor.
  const bosBirakilacak = veriGosteriliyor && veriGosterimi !== "NESNE_INDEKSI";
  // GÖRSEL MİKTAR KODLAMASI (bkz. 02-build-prompt.ts madde 11) için beklenen
  // TAM sayı — canlı modda görüldü, KRİTİK: bu satır olmadan yazar-LLM'e
  // hiçbir yerde doğru sayı verilmiyordu (nesneler/on_plan yalnız "yeşil kare
  // pedler" gibi çoğul, sayısız bir liste), o da kendiliğinden YANLIŞ bir
  // sayı uyduruyordu (bir testte beklenen 4 yerine "tam olarak altı" yazdı,
  // görsel üretim modeli de onun üstüne taşarak 8 çizdi). Artık beklenen
  // sayı hem yazara (aşağıda) hem nihai üretim promptuna (zorunluSatirlar'da)
  // AÇIKÇA veriliyor.
  const renkMiktarSayimlari = aday.gorsel_veri_manifesti?.renk_miktar_sayimlari ?? [];

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
    (renkMiktarSayimlari.length
      ? `ZORUNLU SAYI (kesin, değiştirilemez): ${renkMiktarSayimlari
          .map((r) => `${r.nesne} — TAM OLARAK ${r.beklenen_adet} adet`)
          .join(", ")}. Betimlemende bu sayıyı rakamla değil yazıyla ve açıkça belirt (ör. 'tam olarak ` +
        `${renkMiktarSayimlari[0]!.beklenen_adet} adet ${renkMiktarSayimlari[0]!.nesne}'), ne fazla ne eksik.\n`
      : "") +
    // KALDIRILDI (2026-08-22, kullanıcı isteği): burada bir "YASAKLAR
    // (sahneye eklenmeyecek): ..." satırı vardı — yazar-LLM'e neyin YOK
    // olması gerektiğini söylemek, o negatif kavramın (yazı/rakam/ekran gibi)
    // paragrafa/nihai görsel-üretim promptuna sızmasına yol açıyordu (bkz.
    // GORSEL_PROMPT_SYSTEM'deki eşlik eden not). Artık yasaklar hiç
    // gönderilmiyor — yazar yalnız SAHNE/İŞLEV'e göre pozitif içerik yazıyor.
    `SON 15 GÖRSEL AİLESİ (tekrar yasak): ${ledger.son15GorselAilesi.join(" | ")}\n` +
    (veriGosterimi === "KUVVET_OKU"
      ? !hibritModu
        ? `Sahnede kuvvetlerin/vektörlerin uygulandığı GERÇEK fiziksel unsurları (ip, halat, kablo, temas ` +
          `noktası, cisim) doğal biçimde betimle — AMA hiçbir ok, yön çizgisi, vektör işareti veya büyüklük ` +
          `etiketi SEN ÇİZME/EKLEME; bunlar üretim SONRASI ayrıca, kod tarafında eklenecek. Sahne yalnız o ` +
          `okların/etiketlerin ÜZERİNE bineceği nötr fiziksel zemin olsun.`
        : `Sahnede şu kuvvet/vektör oklarını DOĞRUDAN, net ve okunaklı biçimde çiz: ` +
          overlayCizgileri
            .map(
              (c, i) =>
                `${i + 1}) ${konumTanimla((c.x1_yuzde + c.x2_yuzde) / 2, (c.y1_yuzde + c.y2_yuzde) / 2)} ` +
                `bölgesinde, ${c.ok === "IKI_UC" ? "iki ucu da ok başlı" : c.ok === "UC1" ? "başlangıç ucu ok başlı" : "bitiş ucu ok başlı"} ` +
                `bir çizgi/vektör — yanına büyüklük etiketini AÇIKÇA yaz: "${c.etiket ?? ""}".`
            )
            .join(" ") +
          " Ok yönleri ve etiketler MANİFESTTEKİ değerlerle BİREBİR uyuşmalı, fazladan/eksik ok olmamalı."
      : veriGosteriliyor
        ? veriGosterimi === "NESNE_INDEKSI"
          ? `Sahnedeki her ayrı nesneye TEK BASAMAKLI/HARFLİ, ARDIŞIK bir indeks etiketi ver — TAM OLARAK şu ` +
            `indeksler kullanılacak, başka hiçbir ek rakam/etiket/gerçek değer olmayacak: ${gosterilecekDegerler.join(" | ")}. ` +
            `Bunlar GERÇEK VERİ DEĞİL, yalnız hangi nesnenin hangisi olduğunu ayırt eden basit etiketlerdir.`
          : !hibritModu && overlayKonumlari.length === gosterilecekDegerler.length && overlayKonumlari.length > 0
            ? overlayKonumlari
                .map((k, i) =>
                  veriGosterimi === "CIHAZ_EKRANI"
                    ? `Sahnenin ${konumTanimla(k.x_yuzde, k.y_yuzde)} konumunda, işlevin gerektirdiği bir dijital ` +
                      `ekran/gösterge var; bu ekran şu an KAPALI/GÜÇSÜZ görünüyor — yüzeyi düz, karanlık, boş bir ` +
                      `cam/panel gibi, kendisi sahnenin doğal fiziksel bir parçası (${i + 1}. bölge).`
                    : veriGosterimi === "OLCUM_CIZGISI"
                      ? `Sahnenin ${konumTanimla(k.x_yuzde, k.y_yuzde)} konumunda bir ölçüm yüzeyinin (cetvel/skala) ` +
                        `NÖTR bir bölgesi var — skalanın kendi sabit çentik/sayıları normal şekilde görünebilir, ama ` +
                        `bu spesifik bölgede ek bir renkli işaret/vurgu YOK (${i + 1}. bölge).`
                      : `Sahnenin ${konumTanimla(k.x_yuzde, k.y_yuzde)} konumunda düz, boş bir ölçü etiketi/panel ` +
                        `yüzeyi bulunuyor — hazır bir etiket kağıdı/metal plaka gibi fiziksel olarak var, yüzeyi boş ` +
                        `(${i + 1}. bölge).`
                )
                .join(" ")
            : `Sahne, ${veriGosterimi === "CIHAZ_EKRANI" ? "bir cihaz ekranında" : veriGosterimi === "OLCUM_CIZGISI" ? "bir ölçüm yüzeyinin skalasında" : "teknik ölçü etiketleri olarak"} ` +
              `TAM OLARAK şu değerleri gösterecek, başka hiçbir ek rakam/etiket olmayacak: ${gosterilecekDegerler.join(" | ")}`
        : "Sahne yazı/sayı içermez.") +
    // OLCUM_CIZGISI'nin kendi çizgisi (KUVVET_OKU yukarıda AYRI ele alındı):
    // hibritModu'nda AI'ya bırakılmıyor (ruler testinde metin kadar güvenilir
    // çıkmadı, bkz. proje hafızası) — yalnız KUVVET_OKU hibrit kapsamına dahil.
    (veriGosterimi === "OLCUM_CIZGISI" && overlayCizgileri.length
      ? `\nSahnede bir ÖLÇÜM YÜZEYİ (cetvel/mezür/skala) fiziksel olarak var, kendi sabit çentik/sayılarını ` +
        `normal şekilde taşıyabilir — ama ölçülen noktayı işaretleyen renkli kılavuz çizgiyi/oku SEN ÇİZME, bu ` +
        `üretim SONRASI ayrıca eklenecek.`
      : "");

  const dersEki = GORSEL_PROMPT_SYSTEM_DERS[input.ders ?? "MATEMATIK"];
  // KUVVET_OKU + HİBRİT: FİZİK'in genel kuralı ("ok/çizgi/yönlü büyüklüğü
  // ASLA fotoğrafa çizme") bu TEK durumda kasıtlı olarak geçersiz kılınıyor
  // — kullanıcı isteği (2026-09-14) üzerine AI'nın bunu KENDİSİ denemesine
  // izin veriliyor (başarısız olursa 20-baglam-gorseli.ts otomatik olarak
  // deterministik bindirmeye döner). Bu istisna en SONA eklenir ki (LLM'ler
  // metnin sonundaki talimata daha çok ağırlık verme eğiliminde) genel
  // kuralla çelişkisi net şekilde bu spesifik çağrı için çözülsün.
  const kuvvetHibritIstisnasi =
    hibritModu && veriGosterimi === "KUVVET_OKU"
      ? "\n\nİSTİSNA (yalnız bu görsel için geçerli): yukarıdaki 'kuvvet/vektör okunu fotoğrafa çizme' " +
        "kuralı BU SEFER GEÇERLİ DEĞİL — kullanıcı deneme amacıyla AI'nın ok+etiketi doğrudan çizmesini " +
        "istiyor. Aşağıdaki BAĞLAM GÖRSELİ talimatındaki ok/etiket açıklamasını harfiyen uygula."
      : "";
  const systemPrompt =
    (dersEki ? `${GORSEL_PROMPT_SYSTEM}\n\n${dersEki}` : GORSEL_PROMPT_SYSTEM) + kuvvetHibritIstisnasi;

  const p = await callStructured(deps.provider, {
    model: deps.model,
    systemPrompt,
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

  // "hiçbir yazı/rakam olmayacak" kuralı eskiden ZORUNLU idi, sonra (2026-08-18)
  // TERCİH'e gevşetildi, sonra (2026-08-22, bkz. GORSEL_PROMPT_SYSTEM'deki not)
  // konudan tamamen vazgeçildi — yalnız gerçek veri (gosterilecekDegerler
  // doluysa) ZORUNLU kalıyor, o da negatif değil POZİTİF bir talimat ("şu
  // değerler görünmeli", "yazı olmasın" değil).
  const zorunluSatirlar =
    veriGosteriliyor || renkMiktarSayimlari.length
      ? [
          "ZORUNLU KURALLAR (MENAR):",
          ...(veriGosteriliyor
            ? [
                `- Görselde şu değerler net, okunaklı ve verildiği gibi (değiştirmeden) görünmeli: ` +
                  `${gosterilecekDegerler.join(" | ")}.`,
              ]
            : []),
          // Yazının ÜSTÜNE bindirilen "yazar-LLM buna uysun" talimatına ek
          // olarak, nihai üretim promptuna da AÇIKÇA ve rakamla (yazar bunu
          // hâlâ kelimeyle yazacak, ama burada sayı bir kez daha, kod
          // seviyesinde sabitleniyor) tekrarlanıyor — canlı modda yazar-LLM'in
          // yanlış sayı uydurma riskine karşı ikinci bir güvence katmanı.
          ...renkMiktarSayimlari.map(
            (r) => `- Sahnede TAM OLARAK ${r.beklenen_adet} adet "${r.nesne}" bulunmalı — ne fazla ne eksik.`
          ),
          "",
        ]
      : [];

  // KALDIRILDI (2026-08-22, kullanıcı isteği): burada "sahnede yazı/rakam/
  // etiket olmaması tercih edilir" diyen bir TERCİH bloğu vardı — negatif
  // bir kavramdan bahsetmenin (görsel modele gönderilen promptun İÇİNDE)
  // modeli tam tersine iteceğinden şüphelenildi (bkz. GORSEL_PROMPT_SYSTEM'deki
  // eşlik eden not, canlı Ideogram 4.0 testinde doğrulandı). Artık `veriGosteriliyor`
  // durumunda YALNIZ zorunluSatirlar (hangi değerlerin görünmesi GEREKTİĞİ,
  // pozitif bir talimat) gönderiliyor; aksi halde bu konudan hiç bahsedilmiyor.

  const prompt = [
    p.prompt || "",
    "",
    ...zorunluSatirlar,
    "STİL PROFİLİ (MAYS_EDU_" + boyut + "_V1 — sabit, her üretimde aynı):",
    stilProfili,
  ].join("\n");

  return {
    prompt,
    gorselAilesi: p.gorsel_ailesi || bk?.gorsel_ailesi || "",
    boyut,
    imageSize: genislikSinifi(input.genislik) === "DAR" ? "1024x1024" : "1536x1024",
    deneme: 1,
  };
}
