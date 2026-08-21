import { makeSkill, processComponents } from "../curriculum/tymm-skill.js";
import { loadLegacyCore } from "../prompts/load.js";
import type { PromptMode } from "../llm/config.js";
import type { Ders, ResolvedJob, RotationLedger, HedefIQ } from "./types.js";

export type { PromptMode };

const DERS_ETIKET: Record<Ders, string> = {
  MATEMATIK: "Matematik",
  GEOMETRI: "Geometri",
  FIZIK: "Fizik",
  KIMYA: "Kimya",
  BIYOLOJI: "Biyoloji",
  TDE: "Türk Dili ve Edebiyatı",
};

// Kaynak: kılavuz/iqmatematik/IQ_SORU_Standartlar_Matematik.docx "3. Nihai 13
// Kademeli IQ Skalası" tablosunun İsimlendirme sütunu — yalnız görüntüleme
// amaçlı (bant eşiği/geçme mantığı 05-preflight.ts'in BAND_ESIK tablosunda).
/**
 * IQ ölçütlerinin (bagimsiz_karar_sayisi + 9 audit kriteri, bkz. 03-generator-
 * schema.ts IqBileseniSchema) HER BİR DERSTE NE ANLAMA GELDİĞİNİ tanımlar.
 * Bant eşikleri (kaç karar/hangi kriterler zorunlu) TÜM derslerde ORTAK ve
 * yalnız 05-preflight.ts'in BAND_ESIK tablosunda yaşıyor — burada değişen
 * yalnız kriterlerin METNİ (o dersin doğasına göre "model kurma" veya
 * "tersine düşünme" ne demek). Matematik/Geometri kaynağı kılavuz/iqmatematik/
 * IQ_SORU_Standartlar_Matematik.docx'ten ("MENAR/MAYS TYT-AYT IQ Bilişsel
 * Zorluk Kalibrasyon Standardı v3") neredeyse birebir taşındı — kullanıcı bu
 * dosyayı özellikle Matematik için ekledi. Fizik/Kimya/Biyoloji/TDE
 * versiyonları bu yapının BENİM (Claude) yaptığım ilk uyarlaması — kullanıcı
 * gerçek üretimle test edip standartları güncelleyebileceğini belirtti.
 */
const IQ_KURALI: Record<Ders, string> = {
  MATEMATIK:
    "IQ KALİBRASYONU (MENAR/MAYS TYT-AYT IQ Bilişsel Zorluk Kalibrasyon Standardı v3 — 13 kademe). IQ düzeyi " +
    "bir puan formülüyle DEĞİL, sorunun gerçekten talep ettiği bilişsel yükle belirlenir. Sabit çapa noktaları: " +
    "IQ75=KOLAY, IQ200=ORTA/GENEL AĞIRLIK/OMURGA, IQ250=ZOR/DERECE-SEÇİCİ.\n" +
    "TEMEL EKSEN — iq.bagimsiz_karar_sayisi: öğrencinin hangi adımı/ilişkiyi kullanacağına KENDİSİ karar " +
    "vermesini gerektiren adım sayısı (minimum 1, üst sınır yok — gerçek sayıyı yaz). SAYILMAZ: mekanik işlem " +
    "tekrarı, büyük/çirkin sayı kullanımı, '16' yerine '2⁴' gibi gösterim değişikliği, uzun bağlam/metin " +
    "eklemek, aynı veriyi tablo+grafikte tekrarlamak, yapay veri eklemek, müfredat dışı terim eklemek, yalnız " +
    "seçenekleri birbirine yaklaştırmak, aynı algoritmayı farklı bağlam/sayılarla tekrarlamak.\n" +
    "DİĞER 9 AUDIT KRİTERİ (her biri true/false, iq şemasındaki alan adıyla):\n" +
    "  veri_secme_eleme: Hangi verinin gerekli olduğunu ayırt etmesi veya yanıltıcı/gereksiz veriyi elemesi gerekiyor mu?\n" +
    "  model_kurma: Sözel/grafiksel/geometrik/tablosal bilgiyi matematiksel modele dönüştürmesi gerekiyor mu?\n" +
    "  temsil_donusumu: Metin↔denklem↔tablo↔grafik↔şekil arasında işlevsel geçiş yapıyor mu?\n" +
    "  ortuk_kosul: Doğrudan söylenmeyen ama çözüm için zorunlu bir koşulu fark etmesi gerekiyor mu?\n" +
    "  tersine_dusunme: Sonuçtan başlangıç koşuluna, çıktıdan girdiye doğru akıl yürütme var mı?\n" +
    "  strateji_secimi: Birden fazla olası yöntemden uygun olanı seçmesi veya ilk yöntemi değiştirmesi gerekiyor mu?\n" +
    "  sinir_durumu: Uç değer, eşitlik durumu, tanım koşulu veya istisna ayrıca denetleniyor mu?\n" +
    "  dogrulama: Bulunan sonucun başka bir koşul veya ikinci temsille kontrolü gerekiyor mu?\n" +
    "  genelleme_ispat: Özel örnekten genel sonuca geçme, gerekçelendirme veya ispat benzeri yapı var mı?\n" +
    "13 KADEME (isim — karakteristik): IQ50 KOLAY/TABAN (doğrudan bilgi/temel işlem, tek kural tanı-uygula, " +
    "stratejik karar yok denecek kadar az) • IQ75 KOLAY[ÇAPA] (taban + kısa ara işlem/basit eşleme/1 küçük " +
    "karar) • IQ100 KOLAY-ORTA (birden fazla veriden gerekeni fark etme, temel karşılaştırma, kısa modelleme) " +
    "• IQ125 ALT-ORTA (iki ilişkiyi ardışık kullanma, 2-3 adım, basit tablo/şekil/grafik okuma) • IQ150 " +
    "ORTA-ALT (veri seçme + 2-3 muhakeme adımı + temel model kurma/temsil okuma) • IQ175 ORTA (yöntem doğrudan " +
    "verilmez, öğrenci işlem sırasını/ilişkiyi/temsili kendi belirler) • IQ200 ORTA/OMURGA[ANA ÇAPA] (3-5 " +
    "muhakeme kararı; veri seçme + model kurma + ilişki sentezi + strateji seçimi BİR ARADA — TYT-AYT " +
    "üretiminin merkezî ağırlığı) • IQ225 ORTA-ZOR/SEÇİCİYE GEÇİŞ (örtük koşul, gizli kısıt, temsil dönüşümü, " +
    "tersine düşünme veya ilk stratejiyi kontrol etme) • IQ250 ZOR/DERECE-SEÇİCİ[ÜST ÇAPA] (çoklu koşul, sınır " +
    "durum/parametre, güçlü modelleme, veri eleme, strateji seçimi VE doğrulama BİR ARADA — çözüm yolu açık " +
    "verilmez) • IQ275 ÇOK ZOR (birden fazla fikri birlikte yönetme, alternatif çözüm yollarını değerlendirme, " +
    "alışılmadık model kurma veya tersine çözüm) • IQ300 ÜST SEÇİCİ (en az ~6 bağlı karar, en az 3 işlevsel " +
    "temsil, strateji seçimi + ara sonuç yorumlama + koşul test etme + bağımsız doğrulama) • IQ325 İLERİ ÜST " +
    "SEÇİCİ (çoklu model arasında seçim, varsayım sınama, strateji değiştirme, güçlü tersine muhakeme, " +
    "genelleme başlangıcı — normal TYT-AYT dağılımında istisnai) • IQ350 BİLİŞSEL ZİRVE (en az ~8 bağlı işlem, " +
    "çoklu model/temsil, strateji karşılaştırma, varsayım testi, tersine akıl yürütme, genelleme/ispat, güçlü " +
    "transfer, bağımsız doğrulama).\n" +
    "MÜFREDAT KURALI: IQ300-IQ350 otomatik olarak müfredat üstü/olimpiyat konusu DEMEK DEĞİLDİR — aynı TYT-AYT " +
    "kazanımı içinde daha derin muhakeme ile üst seviye üretilebilir.\n" +
    "FINAL: sistem karar sayısı + karşılanan kriterlere göre GERÇEK ulaşılan bandı ayrıca hesaplar; bu hedef " +
    "bandın ALTINDAYSA soru o IQ koduyla yayınlanamaz — çözüm DNA'sını yapıca yeniden kurgula, yalnız sayıları " +
    "büyütüp zorlama.",
  GEOMETRI:
    "IQ KALİBRASYONU — Matematik'le AYNI standart ve AYNI 9 audit kriteri (bkz. Matematik açıklaması), yalnız " +
    "geometrik muhakemeye uyarlanmış okuma: model_kurma = sözel/şekilsel bilgiyi geometrik ilişkiye (açı/kenar/ " +
    "benzerlik/dönüşüm) dönüştürme; temsil_donusumu = şekil↔cebirsel ifade↔koordinat↔ispat arasında geçiş; " +
    "ortuk_kosul = şekilde açıkça yazılmayan ama zorunlu bir geometrik koşul (dik açı, teğetlik, eş açı vb.); " +
    "tersine_dusunme = istenen sonuçtan (ör. bir açı/uzunluk) geriye şeklin hangi özelliğinin gerektiğine gitme; " +
    "sinir_durumu = dejenere/sınır konfigürasyon (üçgen eşitsizliği sınırı, teğetlik anı vb.); genelleme_ispat = " +
    "özel şekilden genel bir geometrik teoreme/ilişkiye çıkarım. Bant isimleri/eşikleri ve 13 kademe Matematik'le " +
    "birebir aynıdır.",
  // Kaynak: kılavuz/iqfizik/IQ_SORU_Standartlar_Fizik.md ("MENAR/MAYS Fizik IQ
  // Bilişsel Zorluk Kalibrasyon Standardı v1.0" — kullanıcının kendi
  // araştırmasıyla hazırladığı, Matematik'inkiyle aynı 13-kademeli/karar-
  // sayısı iskeletini kullanan TAM bir fizik-özel kılavuz). Kılavuzun kendi
  // PHYSICS_IQ_AUDIT tablosu 20 ayrı ölçüt listeler (sistem sınırı, referans
  // seçimi, vektör analizi, serbest cisim modeli, grafik muhakemesi, orantısal
  // akıl yürütme, korunum seçimi, birim-boyut, makullük kontrolü, deney
  // değişkeni, kanıt, transfer vb.) — bunlar burada şemanın ortak 9 kriterine
  // (tüm derslerde aynı JSON alanları) katlanarak eşlendi, hiçbiri kaybolmadı.
  FIZIK:
    "IQ KALİBRASYONU (MENAR/MAYS Fizik IQ Bilişsel Zorluk Kalibrasyon Standardı v1.0). Zorluğun kaynağı " +
    "formül bilmek değil, verilen fiziksel durumu doğru MODELLEMEK ve TEMSİL ETMEKTİR. Sabit çapalar: IQ75=KOLAY, " +
    "IQ200=ORTA/GENEL AĞIRLIK/OMURGA, IQ250=ZOR/DERECE-SEÇİCİ.\n" +
    "iq.bagimsiz_karar_sayisi: öğrencinin hangi fiziksel ilkeyi/modeli kullanacağına KENDİSİ karar verdiği " +
    "adım sayısı (minimum 1). KARAR SAYILMAZ: verilen formülde sayı yerine koymak, dört işlem, her seçeneği " +
    "mekanik denemek, şekildeki etiketi okumak, tek başına birim çevirme, uzun cebir yürütmek.\n" +
    "9 kriter (fizik kılavuzunun 20 ölçütü buraya katlanmış hâli):\n" +
    "  veri_secme_eleme: Gereksiz/ikincil veriyi elemesi VEYA deney bağımsız/bağımlı/kontrol değişkenlerini ayırması gerekiyor mu?\n" +
    "  model_kurma: Sistem sınırını (hangi cisimler dahil), referans çerçevesini VEYA serbest cisim diyagramını kendisi kurması, korunum ilkesinin (enerji/momentum/yük) uygulanıp uygulanamayacağına karar vermesi gerekiyor mu?\n" +
    "  temsil_donusumu: Metin↔şekil↔grafik↔denklem arasında işlevsel geçiş var mı VEYA vektör büyüklük-yön/bileşen analizi ya da grafik eğimi/alanının fiziksel anlamı çözümün gerçek parçası mı?\n" +
    "  ortuk_kosul: Sürtünmesiz/ideal gaz/hava direnci yok gibi doğrudan söylenmeyen ama zorunlu bir fiziksel varsayımı fark etmesi gerekiyor mu?\n" +
    "  tersine_dusunme: Sonuçtan başlangıç koşuluna, çıktıdan girdiye ters yönlü muhakeme var mı?\n" +
    "  strateji_secimi: Birden fazla çözüm yolundan (ör. enerji korunumu mu Newton yasaları mı) uygun olanı seçmesi veya ilk modelin geçerliliğini test edip değiştirmesi gerekiyor mu?\n" +
    "  sinir_durumu: Uç değer/denge/limit hız/eşik koşulu ayrıca denetleniyor mu?\n" +
    "  dogrulama: Sonuç birim/boyut kontrolü, fiziksel makullük (işaret/yön/büyüklük) VEYA ikinci bir fiziksel ilkeyle doğrulanıyor mu?\n" +
    "  genelleme_ispat: Bilinen ilke yeni ama müfredat-içi bir düzeneğe transfer ediliyor mu (özel durumdan genel ilkeye çıkarım)?\n" +
    "13 KADEME (isim — karakteristik): IQ50 KOLAY/TABAN (tek nicelik/temel ilişki, stratejik seçim yok) • " +
    "IQ75 KOLAY[ÇAPA] (taban+1 küçük karar, yöntem hemen görünür) • IQ100 KOLAY-ORTA (1-2 karar, birden çok " +
    "veriden gerekeni seçme) • IQ125 ALT-ORTA (2-3 adım, iki ilişki ardışık, basit grafik eğimi/vektör bileşkesi) " +
    "• IQ150 ORTA-ALT (veri seçme+temel model kurma, grafik/devre/serbest cisim/ışın şeması işlevsel) • IQ175 " +
    "ORTA (yöntem doğrudan verilmez, sistem/referans seçimi gerekebilir) • IQ200 OMURGA[ANA ÇAPA] (3-5 karar, " +
    "en az iki işlevsel eksen — model kurma/veri seçme/vektör analizi/grafik yorumlama/sistem seçimi/korunum/" +
    "temsil dönüşümü/doğrulama — bir arada) • IQ225 SEÇİCİYE GEÇİŞ (+örtük koşul/gerçek yön muhakemesi/temsil " +
    "dönüşümü/tersine düşünme/ilk modeli test etme) • IQ250 ZOR[ÜST ÇAPA] (5-6 karar, çoklu koşul, veri eleme, " +
    "en az iki temsil/ilke, strateji seçimi, sınır/yön/korunum/makullük kontrolünden en az biri, ikinci koşulla " +
    "doğrulama, çözüm yolu açık verilmez) • IQ275 ÇOK ZOR (birden fazla model/yol, ilk görünen yöntem optimum " +
    "olmayabilir, tersine çözüm) • IQ300 ÜST SEÇİCİ (≥6 karar, gerektiğinde 3 temsil — şekil+grafik+denklem gibi " +
    "— strateji seçimi, varsayım testi, bağımsız doğrulama) • IQ325 İLERİ ÜST SEÇİCİ (çoklu model seçimi, " +
    "varsayım sınama, strateji değiştirme, modelin geçerlilik sınırını fark etme — istisnai) • IQ350 ZİRVE " +
    "(≥8 karar, çoklu model/temsil, strateji karşılaştırma, sınır durum analizi, tersine akıl yürütme, " +
    "genelleme — müfredat dışı üniversite fiziği DEMEK DEĞİL, bilinen ilkelerin sıra dışı birleşimi).\n" +
    "IQ'YU YÜKSELTMEYEN UNSURLAR: büyük/çirkin sayılar, uzun cebir, çok birim dönüşümü, formülü doğrudan " +
    "verip yalnız hesap yaptırmak, şekli gereksiz ayrıntıyla kalabalıklaştırmak, uzun hikaye/bağlam, müfredat " +
    "dışı ileri terim, çok cisim ekleyip hepsini aynı algoritmayla çözmek, seçenekleri yalnız sayısal " +
    "yaklaştırmak, aynı ilişkiyi üç kez tekrarlatmak, gereksiz trigonometri, çözümde kullanılmayan 'şaşırtıcı' veri.\n" +
    "FINAL: gerçek çözüm DNA'sı hedef bandın gerekliliklerini taşımıyorsa o IQ etiketi verilmez.",
  // Kaynak: kılavuz/iqkimya/IQ_SORU_Standartlar_Kimya.md ("MENAR/MAYS Kimya
  // IQ Bilişsel Zorluk Kalibrasyon Standardı v1.0"). Kimyanın üç temsil
  // düzeyi (makroskobik gözlem / tanecik-atom-molekül / sembolik-formül-
  // denklem) kılavuzun merkezinde — bu üçlü geçiş temsil_donusumu'nun
  // birincil anlamı.
  KIMYA:
    "IQ KALİBRASYONU (MENAR/MAYS Kimya IQ Bilişsel Zorluk Kalibrasyon Standardı v1.0). Kimyada gerçek " +
    "muhakeme üç temsil düzeyi arasında doğru geçiş yaptırır: MAKROSKOBİK (gözlenen renk/çökelti/gaz çıkışı/ " +
    "sıcaklık), TANECİK (atom/iyon/molekül/elektron/bağ), SEMBOLİK (formül/denklem/mol/grafik). Sabit çapalar: " +
    "IQ75=KOLAY, IQ200=ORTA/GENEL AĞIRLIK/OMURGA, IQ250=ZOR/DERECE-SEÇİCİ.\n" +
    "iq.bagimsiz_karar_sayisi: öğrencinin hangi kimyasal ilişkiyi/denklemi ne zaman kuracağına KENDİSİ karar " +
    "verdiği adım sayısı. KARAR SAYILMAZ: molar kütleyi mekanik toplamak, dengelenmiş denklemde katsayıyı " +
    "okumak, uzun dört işlem, tabloda açıkça verilen değeri okumak, basit birim dönüşümü, aynı oranı art arda " +
    "tekrarlamak.\n" +
    "9 kriter: veri_secme_eleme: Gereksiz/ikincil veriyi elemesi VEYA deney değişkenlerini (bağımsız/bağımlı/" +
    "kontrol) ayırması gerekiyor mu?; model_kurma: Makroskobik gözlemi tanecik modeline VEYA tanecik modelini " +
    "denklem/stokiyometrik modele dönüştürmesi gerekiyor mu (mol köprüsü, sınırlayıcı bileşen, gaz/çözelti " +
    "modeli dahil)?; temsil_donusumu: Makro↔tanecik↔sembolik (molekül yapısı↔denklem↔grafik↔tablo) arasında " +
    "işlevsel geçiş var mı?; ortuk_kosul: STP, tam tepkime, denge, çökelme gibi doğrudan söylenmeyen ama " +
    "zorunlu bir koşulu fark etmesi gerekiyor mu?; tersine_dusunme: Son üründen/sonuçtan başlangıç bileşimine, " +
    "yapıya veya koşula geri gidiliyor mu?; strateji_secimi: Birden fazla hesap/model yolundan (mol kavramı/" +
    "oran-orantı/denge sabiti/K-Q karşılaştırması) uygun olanı seçmesi gerekiyor mu?; sinir_durumu: " +
    "Sınırlayıcı bileşen/doygunluk/denge durumu ayrıca denetleniyor mu?; dogrulama: Sonuç atom/kütle/yük/mol " +
    "korunumu veya ikinci bir temsille kontrol ediliyor mu?; genelleme_ispat: Bilgi yeni fakat müfredat içi " +
    "bir kimyasal bağlama transfer ediliyor mu?\n" +
    "13 KADEME: IQ50 KOLAY/TABAN (tek kavram/bilgi, stratejik karar yok) • IQ75 KOLAY[ÇAPA] (taban+1 küçük " +
    "eşleme, yöntem hemen görünür) • IQ100 KOLAY-ORTA (1-2 karar, birkaç veriden gerekeni seçme, temel " +
    "sınıflandırma) • IQ125 ALT-ORTA (2-3 adım, iki ilişki ardışık, basit tablo/Lewis/tanecik modeli) • IQ150 " +
    "ORTA-ALT (veri seçme+temel kimyasal model, makro↔tanecik veya tanecik↔sembolik geçiş) • IQ175 ORTA " +
    "(yöntem doğrudan verilmez, hangi oran/model kullanılacağını öğrenci belirler) • IQ200 OMURGA[ANA ÇAPA] " +
    "(3-5 karar, en az iki işlevsel eksen — temsil dönüşümü/veri seçme/stokiyometrik model/yapı-özellik/deney " +
    "analizi/denge-enerji-hız mantığı/kanıt — bir arada, yalnız formül yerine koyma değil) • IQ225 SEÇİCİYE " +
    "GEÇİŞ (+örtük koşul/veri eleme/tersine çıkarım/makro→tanecik/ikinci kısıtla eleme/alternatif yapı " +
    "olasılıklarını test etme) • IQ250 ZOR[ÜST ÇAPA] (5-6 karar, çoklu koşul, en az iki temsil düzeyi — çoğu " +
    "durumda üçlü tercih — veri eleme, model seçimi, strateji seçimi, ikinci kısıtla doğrulama, çözüm yolu " +
    "açık verilmez) • IQ275 ÇOK ZOR (birden fazla model, alternatifleri eleme, tersine çözüm, verinin tek " +
    "başına yetersiz olduğunu fark etme) • IQ300 ÜST SEÇİCİ (≥6 karar, gerektiğinde 3 temsil — makro gözlem+" +
    "tanecik+denklem gibi — strateji seçimi, varsayım testi, bağımsız doğrulama) • IQ325 İLERİ ÜST SEÇİCİ " +
    "(çoklu model seçimi, varsayımın geçerlilik sınırını test etme, strateji değiştirme, ileri transfer — " +
    "istisnai) • IQ350 ZİRVE (≥8 karar, çoklu model/temsil, alternatif hipotezler, sınır durum, genelleme — " +
    "üniversite kimyası DEMEK DEĞİL, müfredat içi kavramların derin muhakeme mimarisiyle birleşimi).\n" +
    "IQ'YU YÜKSELTMEYEN UNSURLAR: çok büyük mol sayıları, uzun ondalık hesap, gereksiz molar kütle hesabı, " +
    "ezberi güç reaksiyonlar, müfredat dışı bileşik adı, karmaşık organik yapı çizimi, uzun paragraf, çok " +
    "gereksiz deney verisi, seçenekleri yalnız sayısal yaklaştırmak, denklemi uzun denkleştirmek, nadir " +
    "istisna sormak, aynı veriyi tablo+grafikte tekrarlamak, bağlamı yalnız 'yeni nesil görünümü' için eklemek.\n" +
    "FINAL: gerçek çözüm DNA'sı hedef bandın gerekliliklerini taşımıyorsa o IQ etiketi verilmez.",
  // Kaynak: kılavuz/iqbiyoloji/IQ_SORU_Standartlar_Biyoloji.md ("MENAR/MAYS
  // Biyoloji IQ Bilişsel Zorluk Kalibrasyon Standardı v1.0"). Çoğu soru
  // sayısal değildir (solver_type=UNSUPPORTED beklenen NORMAL durum) — asıl
  // eksen molekül→organel→hücre→doku→organ→sistem→organizma→popülasyon→
  // ekosistem düzeyleri arasında geçiş ve neden-sonuç zinciri kurma.
  BIYOLOJI:
    "IQ KALİBRASYONU (MENAR/MAYS Biyoloji IQ Bilişsel Zorluk Kalibrasyon Standardı v1.0). 'Ezber ayrıntısı = " +
    "zor soru' hatasından kaçın — zorluk molekül→organel→hücre→doku→organ→sistem→organizma→popülasyon→" +
    "ekosistem düzeyleri arasındaki geçişten ve neden-sonuç zincirinden gelir. Sabit çapalar: IQ75=KOLAY, " +
    "IQ200=ORTA/GENEL AĞIRLIK/OMURGA, IQ250=ZOR/DERECE-SEÇİCİ.\n" +
    "iq.bagimsiz_karar_sayisi: öğrencinin kavramlar arasında KENDİSİ kurduğu ilişkilendirme/çıkarım adımı " +
    "sayısı. KARAR SAYILMAZ: soru kökünü okumak, seçenekleri sırayla kontrol etmek, tek tanımı hatırlamak, " +
    "şekildeki etiketi okumak, ezberlenmiş bir formülü aynen uygulamak.\n" +
    "9 kriter: veri_secme_eleme: Verilen bilgilerden hangisinin gerekli olduğunu ayırt etmesi VEYA deneyde " +
    "bağımsız/bağımlı/kontrol değişkenlerini ayırması gerekiyor mu?; model_kurma: Gözlem/veriyi biyolojik bir " +
    "mekanizma/süreç şemasına (besin zinciri, geri bildirim döngüsü, genetik model) dönüştürmesi VEYA " +
    "biyolojik düzeyler arasında (molekül-hücre-organ-sistem-ekosistem) geçiş yapması gerekiyor mu?; " +
    "temsil_donusumu: Metin↔grafik↔tablo↔şema↔biyolojik model arasında geçiş var mı?; ortuk_kosul: Doğrudan " +
    "söylenmeyen ama çözüm için zorunlu bir biyolojik koşulu fark etmesi gerekiyor mu?; tersine_dusunme: " +
    "Sonuçtan mekanizmaya/başlangıç koşuluna gidiliyor mu?; strateji_secimi: Birden fazla açıklama/sınıflandırma " +
    "yaklaşımından uygun olanı seçmesi veya ilk hipotezi kontrol edip değiştirmesi gerekiyor mu?; sinir_durumu: " +
    "'Her zaman/yalnızca/tüm/kesinlikle' gibi genellemelerin kapsamı veya istisnai durum test ediliyor mu?; " +
    "dogrulama: Sonuç ikinci bir biyolojik koşul/kanıtla kontrol ediliyor mu (kanıtın iddiayı destekleyip " +
    "desteklemediği değerlendirmesi dahil)?; genelleme_ispat: Birden çok örnekten/veri setinden genel bir " +
    "biyolojik sonuç çıkarılıyor mu?\n" +
    "13 KADEME: IQ50 KOLAY/TABAN (tek kavram/yapı/görev, stratejik karar yok) • IQ75 KOLAY[ÇAPA] (taban+1 " +
    "küçük ilişkilendirme, yöntem hemen görünür) • IQ100 KOLAY-ORTA (2-3 bilgiden gerekeni seçme, temel " +
    "karşılaştırma) • IQ125 ALT-ORTA (2-3 adım, iki ilişki ardışık, basit grafik/tablo/hücre şeması) • IQ150 " +
    "ORTA-ALT (veri seçme+temel biyolojik model kurma, deney/grafik/süreç şemasından çıkarım) • IQ175 ORTA " +
    "(yöntem doğrudan verilmez, iki süreç aynı anda izlenebilir) • IQ200 OMURGA[ANA ÇAPA] (3-5 karar, en az " +
    "iki işlem türü — veri seçme/mekanizma kurma/temsil okuma/neden-sonuç zinciri/sistemler arası ilişki/" +
    "deney yorumu/modelleme — bir arada, salt 'biliyor musun' ölçmez) • IQ225 SEÇİCİYE GEÇİŞ (+örtük koşul/" +
    "gizli kısıt/temsil dönüşümü/neden-sonucu tersine izleme/ilk hipotezi kontrol etme/ikinci kanıtla eleme) " +
    "• IQ250 ZOR[ÜST ÇAPA] (5-6 karar, çoklu koşul, güçlü veri eleme, en az iki biyolojik düzey/süreç " +
    "arasında ilişki, strateji seçimi, ek koşulla doğrulama, çözüm yolu doğrudan verilmez) • IQ275 ÇOK ZOR " +
    "(birden fazla model birlikte yönetilir, ilk açıklama yeterli değildir, tersine akıl yürütme) • IQ300 " +
    "ÜST SEÇİCİ (≥6 karar, gerektiğinde 3 temsil — metin+grafik+şema gibi — strateji seçimi, varsayım testi, " +
    "bağımsız doğrulama) • IQ325 İLERİ ÜST SEÇİCİ (çoklu model seçimi, varsayımın geçerlilik sınırını test " +
    "etme, strateji değiştirme, organizasyon düzeyleri arası ileri transfer — istisnai) • IQ350 ZİRVE (≥8 " +
    "karar, çoklu model/temsil, alternatif hipotezler, sınır durum, genelleme, güçlü uzak transfer — " +
    "üniversite/olimpiyat biyolojisi DEMEK DEĞİL, zorluk içerik yabancılığından değil muhakeme mimarisinden " +
    "gelir).\n" +
    "IQ'YU YÜKSELTMEYEN UNSURLAR: çok uzun paragraf, bilinmeyen tür/Latince takson adı, nadir sağlık bilgisi, " +
    "çok sayıda organel adı, şemaya gereksiz etiket, seçenekleri aşırı uzatmak, görseli kalabalıklaştırmak, " +
    "çok sayı/uzun hesap, genetikte gereksiz büyük örneklem, müfredat dışı molekül/enzim/hormon adı, aynı " +
    "bilgiyi tabloda+metinde tekrarlamak, bağlamı yalnız 'yeni nesil görünümü' için eklemek, 'hangisi " +
    "değildir' kökünü art arda kullanmak.\n" +
    "FINAL: gerçek çözüm DNA'sı hedef bandın gerekliliklerini taşımıyorsa o IQ etiketi verilmez.",
  TDE:
    "IQ KALİBRASYONU — Matematik'in 13 kademeli standardının metinsel/edebi muhakemeye uyarlanmış hâli (soru " +
    "genelde sayısal değildir, solver_type=UNSUPPORTED beklenen NORMAL durumdur). iq.bagimsiz_karar_sayisi = " +
    "öğrencinin metinden kendisi kurduğu çıkarım/yorumlama adımı sayısı. 9 kriter: veri_secme_eleme = metindeki " +
    "hangi ipucunun/kanıtın soru için gerekli olduğunu ayırt etme; model_kurma = metindeki bilgiyi tema/ana " +
    "düşünce/yapı çerçevesine oturtma; temsil_donusumu = metin↔örtük anlam↔tür/üslup karşılaştırması arası " +
    "geçiş; ortuk_kosul = metinde doğrudan söylenmeyen ama anlaşılması gereken örtük ileti/ima; " +
    "tersine_dusunme = bir sonuçtan (yazarın tutumu/mesajı) metindeki kanıta geri gitme; strateji_secimi = " +
    "birden fazla olası yorumdan metne en uygun olanı seçme; sinir_durumu = çok anlamlılık/istisna durumu (ör. " +
    "ironi, çok katmanlı anlam); dogrulama = yorumun metindeki başka bir kanıtla desteklenip desteklenmediğinin " +
    "kontrolü; genelleme_ispat = özel metinden genel bir edebi/dilsel ilkeye çıkarım. Bant isimleri/eşikleri ve " +
    "13 kademe Matematik'le birebir aynıdır.",
};

const HEDEF_BANT: Record<HedefIQ, string> = {
  IQ50: "KOLAY / TABAN",
  IQ75: "KOLAY [ALT ÇAPA]",
  IQ100: "KOLAY-ORTA",
  IQ125: "ALT-ORTA",
  IQ150: "ORTA-ALT",
  IQ175: "ORTA",
  IQ200: "ORTA / GENEL AĞIRLIK / OMURGA [ANA ÇAPA]",
  IQ225: "ORTA-ZOR / SEÇİCİYE GEÇİŞ",
  IQ250: "ZOR / DERECE-SEÇİCİ [ÜST ÇAPA]",
  IQ275: "ÇOK ZOR",
  IQ300: "ÜST SEÇİCİ",
  IQ325: "İLERİ ÜST SEÇİCİ",
  IQ350: "BİLİŞSEL ZİRVE / TEORİK TAVAN",
};

const BOS_LEDGER: RotationLedger = {
  son100BaglamAilesi: [],
  son200AileDna: [],
  son15GorselAilesi: [],
};

/** node "04 - MASTER PROMPT Derleyici"nin modeBlock() portu. */
function modeBlock(resolved: ResolvedJob): string {
  const { input } = resolved;
  switch (input.mode) {
    case "IKIZ_SORU": {
      const ikiz = input.ikiz;
      if (!ikiz) return "MOD: " + input.mode;
      return [
        "MOD: İKİZ SORU ÜRETİMİ",
        "İKİZ SORU SAYISI: " + input.soruSayisi,
        "BAĞLAM DEĞİŞİM DÜZEYİ: " + ikiz.baglamDegisim,
        "MATEMATİKSEL YAPI: " + ikiz.matematikselYapi,
        "KAYNAK SORU / DNA:",
        ikiz.kaynak,
        "",
        "İKİZ SORU KİLİDİ:",
        "- Önce kaynak soruyu bağımsız çöz ve gerçek kazanım, mikro, çözüm DNA'sı, temsil yapısı ve bilişsel adımları çıkar.",
        "- \"Aynı çözüm DNA'sını koru\" seçildiyse temel matematiksel ilişki, çözüm sırası ve stratejik karar korunur.",
        "- Yalnız kurum, kişi, şehir, nesne veya sayı değiştirmek özgün ikiz soru sayılmaz.",
        "- Yeni bağlam ailesi, faaliyet, veri manifesti, sayılar, görsel kimliği, anlatım ve seçenekler kaynak sorudan farklı kurulmalıdır.",
        "- İkiz soru kaynak sorudan bağımsız çözülebilir olmalıdır.",
        "- Kaynak ve ikiz soru ayrı ayrı SOLVER, TEK_DOĞRU, IQ_AUDIT ve MATEMATİKSEL_TUTARLILIK denetiminden geçer.",
      ].join("\n");
    }
    case "BTG": {
      const btg = input.btg;
      if (!btg) return "MOD: " + input.mode;
      return [
        "MOD: BTG – BAĞLAMA TEMELLİ GELİŞİM",
        "BİLİMSEL METİN UZUNLUĞU: " + input.metinUzunlugu,
        "BTG SORU SAYISI: " + input.soruSayisi,
        "BTG KAYNAK AİLESİ: " + btg.kaynak,
        "BELGE / VERİ TÜRÜ: " + btg.belge,
        "KAYNAK KULLANIM BİÇİMİ: " + btg.kullanim,
        "KAYNAK DOĞRULAMA DÜZEYİ: " + btg.dogrulama,
        "VERİ GÜNCELLİĞİ: " + btg.guncellik,
        "DESTEKLEYİCİ MATERYAL: " + btg.materyal,
        "ÖZEL KAYNAK / BELGE İSTEĞİ: " + btg.kaynakNotu,
        "",
        "/BTG_BİLİMSEL_KAYNAK_HAVUZU_V1/",
        "- Kaynak seçimi prestije göre değil; kazanıma uyum, veri açıklığı, yaş düzeyi, matematiksel işlenebilirlik ve doğrulanabilirlik ölçütlerine göre yapılır.",
        "- Popüler bilim yazısı kullanıldığında anlatım kopyalanmaz; bilimsel çekirdek özgün ve sade ortak metne dönüştürülür.",
        "- Başlık, yazar, tarih, dergi, DOI, rapor numarası, tablo numarası veya veri değeri uydurulamaz.",
        "- Ortak metindeki bilimsel bilgi ya da veri en az bir sorunun çözümünde zorunlu görev taşır.",
        "- Her alt soru ortak metinden bağımsız çözülebilir; başka alt sorunun cevabına bağlı olamaz.",
        "- Kaynak doğrulanamazsa AKADEMİK_KAYNAK=RED ver; final üretme veya GERÇEKÇİ_BİLİMSEL_KURGU olarak yeniden sınıflandır.",
        "",
        "ZORUNLU BTG KAYNAK MANİFESTİ:",
        "KAYNAK_AİLESİ=[...]",
        "KURUM / YAYIN=[...]",
        "BELGE_TÜRÜ=[...]",
        "BAŞLIK=[DOĞRULANMIŞ BAŞLIK / KÜNYE VERİLMEDİ]",
        "YIL / VERİ DÖNEMİ=[...]",
        "DOI / RESMÎ KAYIT / URL=[DOĞRULANDI / UYGULANMAZ / VERİLMEDİ]",
        "KULLANILAN BİLİMSEL ÇEKİRDEK=[...]",
        "KULLANILAN VERİ VE BİRİM=[...]",
        "EĞİTİM AMAÇLI SADELEŞTİRME=[YOK / AÇIKLAMA]",
        "KAYNAK–SORU İŞLEVİ=[PASS / RED]",
        "TELİF VE ÖZGÜNLÜK=[PASS / RED]",
        "AKADEMİK_KAYNAK_DOĞRULAMASI=[PASS / RED]",
      ].join("\n");
    }
    case "BT":
      return "MOD: KLASİK BAĞLAM TEMELLİ (BT)\nBAĞLAM UZUNLUĞU: " + input.metinUzunlugu + "\nSORU SAYISI: " + input.soruSayisi;
    case "BTP":
      return "MOD: BAĞLAM TEMELLİ PROBLEM (BTP)\nSENARYO UZUNLUĞU: " + input.metinUzunlugu + "\nPROBLEM SAYISI: " + input.soruSayisi;
    case "ZINCIR":
      return (
        "MOD: ZİNCİR SORU\nALT SORU SAYISI: " +
        input.soruSayisi +
        "\n- Alt sorular ortak bağlam katmanını paylaşır, her biri bağımsız çözülebilir.\n- Numaralandırma: SORU [n]-A, SORU [n]-B ..."
      );
    case "KONU_OZETI":
      return (
        "MOD: KONU ÖZETİ\nÖZET UZUNLUĞU: " +
        input.metinUzunlugu +
        "\n- Her mikro başlık için ayrı soru üretilir, tek soruya sıkıştırılmaz."
      );
    case "ALISTIRMA":
      return "MOD: ALIŞTIRMA SETİ\nALIŞTIRMA SAYISI: " + input.soruSayisi + "\nZORLUK DAĞILIMI: Kolaydan zora";
    case "ACIK_UCLU":
      return (
        "MOD: AÇIK UÇLU\nSORU SAYISI: " +
        input.soruSayisi +
        "\n- Örnek cevap, puanlama ölçütleri ve kabul edilebilir cevap sınırları ayrı ayrı doğrulanır."
      );
    case "DENEME":
      return "MOD: DENEME SORUSU\nSORU SAYISI: " + input.soruSayisi;
    case "ORTAK_IKI_KONU": {
      if (!resolved.outcome2) return "MOD: " + input.mode;
      return [
        "MOD: İKİ KONUDAN ORTAK SORU",
        "2. SINIF: " + input.sinifVeyaSinav,
        "2. TEMA: " + resolved.outcome2.theme,
        "2. KOD: " + input.kod2,
        "2. KAZANIM: " + resolved.outcome2.outcome,
        "2. MİKRO: " + resolved.micro2,
      ].join("\n");
    }
    case "STANDART":
      return [
        "MOD: STANDART TEST SORUSU",
        "SORU SAYISI: " + input.soruSayisi,
        "",
        "STANDART SORU TANIMI: Bu 'kolay soru' DEĞİLDİR — Bağlam Temelli/BTG/Zincir'in basitleştirilmiş " +
          "hâli de değildir, ayrı bir soru ailesidir. Belirlenen TEK öğrenme çıktısının temel bilgisini, " +
          "kuralını, formülünü veya doğrudan uygulanışını; gereksiz bağlam/senaryo ve çoklu muhakeme " +
          "olmadan ölçer. Amaç: öğrenci bu kazanımın temel yeterliğine gerçekten sahip mi?",
        "- TEK kazanım, TEK matematiksel çekirdek — ikinci bir konuyu ana rolde kullanma (yalnız temel ön " +
          "bilgi, ayrı bir öğrenme çıktısı gerektirmeden, kabul edilir).",
        "- Çözüm yolu baştan belirgin olsun: öğrenci strateji seçmez, model kurmaz, veri elemez. En fazla " +
          "2-3 kısa işlem adımı; uzun işlem yükü de bir 'zorluk' sayılmaz, gereksiz aritmetik kalabalığı ekleme.",
        "- Uydurma sahne/hikâye/kurum/kişi anlatısı YASAK ('Ali markete gitti...' türü). Kısa bir durum " +
          "cümlesi gerekiyorsa bile birkaç kelimeyle sınırlı tut; çözüme katkısı olmayan hiçbir cümle yazma.",
        "- Görsel/bağlam fotoğrafı varsayılan olarak GEREKSİZ (baglam_katmani.gerekli=false bırak) — yalnız " +
          "kazanımın kendisi bir temsili (grafik/tablo/sayı doğrusu/koordinat düzlemi) zorunlu kılıyorsa aç, " +
          "o durumda da TEK bir temsil türü yeterli.",
        "- Sayısal veriyi rastgele üretme: önce hedef çözüm ilişkisini kur, sonra sayıları seç. Kazanım " +
          "özellikle gerektirmiyorsa çirkin kesir/kök/büyük sayı ekleme. 0, 1, -1 gibi özel değerler test " +
          "edilen kuralı atlayıp öğrenciyi başka bir yoldan doğru cevaba götürüyorsa o veriyi kullanma.",
        "- Çeldiriciler rastgele değil, bu kuralın gerçek/tipik öğrenci hatalarından türesin (işaret hatası, " +
          "işlem sırası hatası, kuralı ters uygulama, yarım bırakılmış işlem gibi). Beş seçenek aynı " +
          "matematiksel aileden olsun (hepsi sayı, hepsi ifade, hepsi aralık vb.) — biçim farkı doğru " +
          "cevabı ele vermesin.",
      ].join("\n");
    default:
      return "MOD: " + input.mode;
  }
}

/** HTML `menar-btg-word-lock-v20` script'inin lockBlock() portu — bkz. prompts/README.md onarım notu. */
function btgWordLock(resolved: ResolvedJob): string {
  const { input } = resolved;
  if (input.mode !== "BTG") return "";
  const match = String(input.metinUzunlugu || "").match(/(\d{2,4})\s*[–-]\s*(\d{2,4})/);
  const min = match ? match[1] : "SEÇİLEN ALT SINIR";
  const max = match ? match[2] : "SEÇİLEN ÜST SINIR";
  return (
    "\n\n/BTG_METIN_UZUNLUK_KILIDI_V20/\n" +
    "- Kullanıcının seçtiği bilimsel/teknik ortak metin uzunluğu kesin üretim aralığıdır: " +
    input.metinUzunlugu +
    "\n" +
    "- Yalnız ORTAK ÖĞRETİCİ BAĞLAM METNİ sayılır; soru kökleri, seçenekler, tablo hücreleri, başlıklar, kaynak künyesi, cevap ve denetim satırları sayıma katılmaz.\n" +
    "- Gerçek sözcük sayısı " +
    min +
    " değerinden az veya " +
    max +
    " değerinden fazla ise bu adayı kullanma, ortak metni bilimsel neden-sonuç ve problem çekirdeğiyle yeniden üret.\n" +
    "- Alt sınırı tamamlamak için soru kökünü, seçenekleri veya tabloyu uzatma.\n" +
    "- BU KİLİDİN KONTROLÜ TAMAMEN SENİN İÇ MUHAKEMENE AİTTİR — sözcük sayısını, seçilen aralığı veya " +
    "PASS/RED sonucunu ASLA çıktı JSON'unun HİÇBİR alanına yazma (stimulus.notes, stimulus.paragraphs, " +
    "soru kökü, kaynak künyesi dahil hiçbir yere). Öğrenci veya öğretmen bu kilidin var olduğunu bilmemeli; " +
    "nihai JSON yalnız sorunun kendisini içerir, üretim sürecine dair hiçbir iz taşımaz."
  );
}

/** node 04'ün gerçekte gönderdiği kompakt çekirdek (20 satırlık kural listesi). */
function buildCompactPrompt(resolved: ResolvedJob, ledger: RotationLedger): string {
  const { input, outcome } = resolved;
  const ogrenimBecerisi = makeSkill(outcome.outcome);
  const surecBilesenleri = processComponents(outcome.outcome);
  const hedefBant = HEDEF_BANT[input.iq] ?? "hedef forma göre";
  const compactMode = modeBlock(resolved);
  const btgLock = input.mode === "BTG" ? btgWordLock(resolved) : "";

  return [
    "MENAR YAYINCILIK / MAYS " + DERS_ETIKET[input.ders ?? "MATEMATIK"].toLocaleUpperCase("tr-TR") + " V22.3 — KONTROLLÜ ÜRETİM",
    "",
    "ÜRETİM GİRDİSİ",
    "Ders: " + DERS_ETIKET[input.ders ?? "MATEMATIK"],
    "Sınıf / sınav: " + input.sinifVeyaSinav,
    "Tema / ünite: " + outcome.theme,
    "Kazanım kodu: " + input.kod,
    "Kazanım: " + outcome.outcome,
    "Alt konu / mikro: " + resolved.micro,
    "Üretim modu: " + input.mode,
    "Hedef IQ: " + input.iq + " (" + hedefBant + ")",
    "Soru sayısı: " + input.soruSayisi,
    "Çıktı genişliği: " + input.genislik,
    "Çıktı türü: " + input.cikti,
    "Çıktı modu: " + input.ciktiModu,
    "Cevap görünürlüğü: " + input.cevapGorunurlugu,
    "Görsel kararı: " + input.gorselKarari,
    "Seçenek yapısı: " + input.secenekYapisi,
    "TYMM alan becerisi: " + input.tymmAlanBecerisi,
    "TYMM eğilim / okuryazarlık: " + input.tymmEgilim,
    "Öğrenim becerisi: " + ogrenimBecerisi,
    "Süreç bileşenleri: " + surecBilesenleri.join(" | "),
    "Ek istek: " + (input.ekIstek || "YOK"),
    "",
    "MOD KURALLARI",
    compactMode,
    btgLock,
    "",
    "ZORUNLU KALİTE KİLİTLERİ",
    "1. Seçilen kazanım ve mikro başlığın dışına çıkma. Kazanımı değiştirme veya genişletme.",
    "2. Formdaki soru sayısı kadar soru üret. Her soruda tam 5 seçenek ve yalnız 1 doğru cevap bulunmalı.",
    "3. Doğru seçenek A–E harflerinden biri olmalı. Beş seçeneğin metni ve çözüm sonucu birbirinden farklı olmalı.",
    "4. Her yanlış seçenek için farklı, gerçekçi ve dersin kendi mantığıyla (matematiksel/fiziksel/kimyasal/" +
      "biyolojik/metinsel-yorumsal) açıklanabilir bir hata yolu yaz.",
    "5. Soruyu bağımsız çöz; çözüm adımlarını kısa fakat doğrulanabilir yaz. Cevap anahtarı çözümle birebir uyuşmalı.",
    "6. " + IQ_KURALI[input.ders ?? "MATEMATIK"],
    "7. IQ300 ve IQ350 için ikinci konu/kazanım bütünleştirmesi zorunludur; yapay veya süs amaçlı olmamalıdır.",
    "8. 85_MM çıktıda soru kökü en fazla 120 kelime, seçenek başına en fazla 6 kelime; 185_MM çıktıda kök en fazla 220 kelime.",
    "9. Türkçe ondalık ayırıcı virgüldür. Birimler tutarlı olmalı. Ali/Ayşe/Ahmet/Mehmet ve havuz-musluk gibi klişeleri kullanma.",
    "10. Bağlam çıkarıldığında karar veya bilgi kaybı oluşmalı; dekoratif bağlam kurma.",
    "11. VERİ GÖSTERİM HİYERARŞİSİ (ÖNCELİK SIRASI — TÜM DERSLER İÇİN GEÇERLİ, yalnız Geometri'ye özel " +
      "değil, kullanıcı talebiyle 2026-08-18'de YENİDEN düzenlendi): baglam_katmani (fotogerçekçi AI görseli) " +
      "HER ZAMAN riskli/güvenilmez bir kanaldır — 3 denemelik pahalı bir üretim+denetim döngüsünden geçer ve " +
      "başarısız olabilir. veri_katmani (TABLO/GRAFİK/FONKSIYON/GEOMETRI) kod tarafında deterministik üretilir, " +
      "ASLA başarısız olmaz — AMA yine de fazladan bir GÖRSEL ASSET'İdir; kullanıcı, iyi bir bağlam fotoğrafının " +
      "yanında sürekli ayrı bir grafik/tablo GÖRÜNMESİNİ istemiyor ('yine sürekli grafik tablo istemiyorum'). " +
      "Bu yüzden ÜÇÜNCÜ, EN ÖNCELİKLİ bir seçenek var: veri metne yazılabiliyorsa SORU METNİNE (stimulus " +
      "paragrafları) doğrudan cümle/liste olarak yaz — bu HİÇ görsel asset üretmez, %100 güvenilir, ve " +
      "sayfada yalnız fotoğraf + düz metin kalır (kullanıcının istediği görünüm).\n" +
      "YENİ ÖNCELİK SIRASI: (1) ÖNCE SORU METNİ — veri sayısal/kategorik/listelenebilir bir yapıdaysa " +
      "(deney sonuç sayıları, ölçüm kayıtları, kaç adet/hangi kategoriden gibi), bunu 'Güneşli havada mavi " +
      "24, mor 12, sarı 14...' gibi doğrudan bir cümleyle veya kısa bir listeyle stimulus paragrafına yaz; " +
      "veri_katmani.gerekli=false, tur=YOK kalır — bu ARTIK VARSAYILANDIR, önceki turlarda varsayılan olan " +
      "TABLO/GRAFİK DEĞİL. (2) veri_katmani GÖRSEL bir asset olarak YALNIZ şu iki durumda GERÇEKTEN gerekli: " +
      "(a) veri GEOMETRİK/UZAMSAL (nokta/kenar/açı, bir şeklin biçimi) — metne yazmak anlamı kaybettirir, " +
      "GEOMETRI SVG kullan; (b) sorunun ÖLÇME AMACI bizzat 'bir grafiği/tabloyu OKUMA' becerisidir (temsil " +
      "geçişi kasıtlı hedefleniyor, ör. bir FONKSİYON grafiğinin artan/azalan aralığını okuma) VE bu beceri " +
      "metne çevrilirse kaybolur — bu durumda CIZGI/SUTUN/FONKSIYON/TABLO bilinçli bir seçim olarak kalabilir, " +
      "ama bu bir İSTİSNA olarak GEREKÇELENDİRİLMELİ, 'veri 2'den fazla sayı içeriyor' gibi otomatik bir " +
      "varsayılan OLMAMALI. (3) baglam_katmani (fotoğraf) yalnız gerçek bir fiziksel nesnenin/cihazın KENDİ " +
      "EKRANINDAN okunan TEK bir basit değer varsa veri taşıyabilir (bkz. SAYI SINIRI altta, en fazla 1) — " +
      "bu da bir istisna, varsayılan değil.\n" +
      "CIHAZ_EKRANI/TEKNIK_ETIKET/NESNE_INDEKSI'nin aşağıdaki güvenlik ağı mekanizması YALNIZ gerçekten " +
      "fiziksel/fotoğrafik bir okuma metne/deterministik katmana taşınamadığında vardır — çoğu durumda hiç " +
      "gerekmez, çünkü veri artık doğrudan metinde.\n" +
      "ÇOK ÖNEMLİ YANLIŞ ANLAMA UYARISI (kullanıcı geri bildirimi, 2026-08-17): 'veri veri_katmani'ne gider, " +
      "baglam_katmani.gorsel_veri_gosterimi=YOK kalır' cümlesi 'baglam_katmani.gerekli=false yap' ANLAMINA " +
      "GELMEZ — bu sistem ZATEN bağlam temelli soru üretmek için var, bağlam görseli (fotogerçekçi sahne) " +
      "sorunun BÜTÜNSEL kalitesinin önemli bir parçasıdır ve VARSAYILAN olarak İSTENİR. Bu hiyerarşi kuralı " +
      "yalnız SAYININ/DEĞERİN NEREDE gösterileceğini belirler (fotoğrafta mı, deterministik katmanda mı) — " +
      "sahnenin KENDİSİNİN olup olmayacağını değil. Somut kural: senaryonun gerçek bir fiziksel bağlamı/ " +
      "nesnesi/mekânı VARSA (bağlam temelli sorularda neredeyse HER ZAMAN vardır), baglam_katmani.gerekli=true " +
      "kalmalı ve sahne SAF ATMOSFER olarak (gorsel_veri_gosterimi=YOK, hiç sayı/etiket yazdırmadan) " +
      "canlandırılmalı — veri ise (yukarıdaki YENİ öncelik sırasına göre) genellikle SORU METNİNDE, ayrı bir " +
      "görsel katman OLMADAN durur; yalnız gerçekten geometrik/uzamsal ya da grafik-okuma-becerisi hedeflenen " +
      "istisnai durumlarda veri_katmani GÖRSEL bir asset olarak fotoğrafın YANINA eklenir. " +
      "baglam_katmani.gerekli=false YALNIZ senaryonun gerçekten hiç fiziksel/görsel bir sahnesi yoksa (ör. " +
      "tamamen soyut cebirsel/fonksiyonel bir ifade, somutlaştırılacak bir nesne/mekân YOK) kullanılır.\n" +
      "AMA resmî MEB örneklerinde (bkz. kılavuz) bağlam görseli GERÇEKTEN birinci durumu (fiziksel okuma) " +
      "temsil ettiğinde çoğu zaman bir ölçüm cihazının ekranındaki okumayı (gorsel_veri_gosterimi=CIHAZ_EKRANI) " +
      "veya boyutlandırılmış bir teknik çizimi (gorsel_veri_gosterimi=TEKNIK_ETIKET) gösterir — bu durumda " +
      "uygunsa bu türlerden birini seç ve gorselde_gosterilecek_degerler'e TAM OLARAK görünmesi gereken " +
      "değerleri yaz (gorsel_veri_manifesti'nden birebir, uydurma değer ekleme). Cevabı doğrudan ele veren " +
      "bir değer asla gösterilmez. " +
      "SINIR (ÇOK ÖNEMLİ): görsel üretim modeli yalnız KISA, YALIN rakam/ifadeler çizebilir (ör. '2⁸', " +
      "'4,82 × 10⁻³ m', '37 cm') — kök işareti (√, ∛), küme/blackboard-bold sembolleri (ℕ, ℤ, ℚ, ℝ), kesir " +
      "çizgisi, üst üste bindirilmiş çok satırlı ifade veya karmaşık cebirsel gösterim İÇEREN değerleri ASLA " +
      "gorselde_gosterilecek_degerler'e koyma — bunlar görsel modelinde güvenilir çizilmez, üretim 3 " +
      "denemede de RED alıp görsel TAMAMEN kaybolur (zorunlu görsel istenen bir işte bu ciddi bir hatadır). " +
      "Böyle karmaşık ifadeler her zaman gorsel_veri_gosterimi=YOK ile birlikte ayrı, deterministik " +
      "veri_katmani (tablo/SVG) üzerinden gösterilir — bu katman AI görsel modelinden geçmez, kod tarafında " +
      "birebir doğru çizilir. " +
      // Kullanıcı talebi (2026-08-18): "eğer görsel içinde verileri üretemezse
      // görselde değer verilecek şeylere sayılar/harfler verip, soru metni
      // içinde değerleri verebiliriz." Altıncı/ondördüncü turdan beri biriken
      // kanıt (fosil odası 6 değer, su arıtma 4 kartuş, akort modülleri 6,
      // zar deneyi 9 değer — HEPSİ 3/3 RED) artık net: görsel üretim modeli
      // BİRDEN FAZLA ayrı okunaklı GERÇEK DEĞERİ güvenilir çizemiyor. AMA
      // kullanıcının kendi arşivinden bir KARŞIT kanıt da var (job `69c23e99`,
      // 2026-08-15, gpt-image-1): iki ayrı cihaz ekranında KISA/YALIN iki
      // değer ('2¹⁸','8⁸') temiz ve okunaklı çizilmiş, PASS almış. Sınır bu
      // yüzden 1 değil 2'ye ayarlandı — kanıtlanmış güvenli üst sınır.
      "SAYI SINIRI (ÇOK ÖNEMLİ, karmaşıklık sınırı kadar kritik): CIHAZ_EKRANI/TEKNIK_ETIKET " +
      "modunda gorselde_gosterilecek_degerler'de EN FAZLA 2 GERÇEK DEĞER olabilir — yalnız KISA/YALIN " +
      "cihaz okuması/ölçü etiketi (ör. bir kumpasın gösterdiği '4,82 cm', bir ekrandaki '2⁸'). Sahnede 2'DEN " +
      "FAZLA nesne/okuma için AYRI AYRI gerçek değer göstermek GEREKİYORSA (ör. 3 farklı kutunun 3 farklı ağırlığı), " +
      "bunu görsele YAZDIRMAYA ÇALIŞMA — bunun yerine: baglam_katmani.gorsel_veri_gosterimi=YOK bırak " +
      "(fotoğraf yalnız atmosfer, hiçbir sayı/etiket taşımaz), veri_katmani.tur=NESNE_SEMASI seçip her " +
      "nesneye basit bir indeks numarası ata (bu SVG kod tarafında deterministik çizilir, hiç görsel-model " +
      "riski taşımaz), ve GERÇEK DEĞERLERİ doğrudan SORU METNİNDE (stimulus paragraflarında), o indekslerle " +
      "eşleyen açık bir cümleyle ver (ör. '1 numaralı kutu 70 g, 2 numaralı kutu 105 g...' gibi) — ayrı bir " +
      "tablo/görsel yedeği KURMA, veri doğrudan ve TEK KEZ metinde yer alsın. Bu, hem 100% güvenilir " +
      "(metin üretimi hiç başarısız olmaz) hem de görselin gereksiz yere karmaşıklaşıp konudan sapmasını " +
      "(canlı modda tekrar tekrar görüldü) önler.\n" +
      "İstisna — NESNE_INDEKSI ARTIK YASAK, ONUN YERİNE NESNE_SEMASI (canlı modda ÇOK KEZ görüldü, KRİTİK — " +
      "preflight bunu sert kapıyla da engelliyor): bağlamda görselin sayı GÖSTERMESİ değil yalnız hangi " +
      "nesnenin hangi sırada/rafta/indekste olduğunu GÖSTERMESİ yeterliyse, bunu ASLA baglam_katmani." +
      "gorsel_veri_gosterimi=NESNE_INDEKSI ile fotoğrafa AI'ya indeks numarası yazdırarak ÇÖZME — basit " +
      "ardışık 1,2,3... etiketleri bile 3 denemenin 3'ünde eksik/tekrarlı/uydurma-sembollü çıkıyor (fosil " +
      "odası, su arıtma tesisi, akort modülleri — hepsi bu yüzden RED aldı, sağlayıcıdan bağımsız bir zaaf, " +
      "her seferinde 1+ dolarlık boşa giden görsel denemesi). Bunun yerine: baglam_katmani.gorsel_veri_" +
      "gosterimi=YOK bırak (fotoğraf yalnız atmosfer), veri_katmani.tur=NESNE_SEMASI seç ve gorsel_veri_" +
      "manifesti.nesne_semasi'yi doldur (toplam_sayi, varsa isaretli_indeksler + isaret_aciklamasi — ör. " +
      "'sarı uyarı ışığı yanan modül' gibi TEK bir nesneyi öne çıkarman gerekiyorsa). Bu SVG'ye kod " +
      "seviyesinde çizilir, indeks eksikliği/tekrarı YAPISAL OLARAK imkansızdır. Gerçek değerler (varsa) " +
      "ayrı bir TABLO KURULMADAN, aynı indekslerle SORU METNİNDE (stimulus paragraflarında) açık bir " +
      "cümleyle verilir (ör. '1 numaralı modülün değeri 70, 2 numaralı modülün değeri 105...') — verinin " +
      "TEK kaynağı bu cümledir, her durumda öğrenciye gösterilir.\n" +
      "DALLANMA/YÖN KISITI (canlı modda görüldü, ÇOK ÖNEMLİ): tıpkı yukarıdaki gibi, görsel modeli " +
      "nesneleri BİRDEN FAZLA DAL/KOL/YOL arasında (ör. 'ana hat' vs 'yan kol', 'A yolu' vs 'B yolu') " +
      "DOĞRU konuma güvenilir yerleştiremiyor — 3 denemede de yanlış dala/sıraya yerleştirdi. HANGİ " +
      "NESNENİN HANGİ DALDA/KOLDA olduğu çözüm için gerekliyse bu bilgiyi SADECE görselin konumsal " +
      "düzenine bırakma: veri_katmani.tur=TABLO'ya bir 'Konum/Dal' sütunu ekleyip (ör. '1: ana hat', " +
      "'2: yan kol'...) bu bilgiyi AÇIKÇA yaz — görsel yalnız genel/atmosferik sahneyi göstersin, " +
      "dal/konum bilgisi görselden OKUNMASI gereken kritik veri OLMASIN.\n" +
      "EK GRAFİK YASAĞI (canlı modda görüldü): 'akış hattı'/'bağlantı'/'yönlendirme' gibi bir bağlamda " +
      "görsel modeli izin verilmeyen ok/yön işareti gibi EK GRAFİK SEMBOLLER ekleme eğilimindedir (3 " +
      "denemede de görüldü, hepsi bu yüzden RED aldı) — bu tür bağlamları özellikle seçtiysen, prompt " +
      "yazarına (16-gorsel-prompt.ts) sahneyi STATİK/DURAĞAN betimlemesini gerektirecek şekilde " +
      "kurgula (ör. akış oku yerine sadece 'birbirine bağlı borular', yön belirtmeden).\n" +
      "GEOMETRİK/YAPISAL BİLGİ TEK KAYNAK KURALI (canlı modda görüldü, ÇOK ÖNEMLİ — DALLANMA/YÖN " +
      "KISITI'nın genellemesi): veri_katmani.tur=GEOMETRI veya TABLO ile bağlam görselindeki nesneler " +
      "AYNI yapısal bilgiyi (kaç tane nesne var, hangi sırada, hangi açı/uzunluk/işaret değeri taşıyor) " +
      "taşıyorsa, bu bilgi YALNIZ veri_katmani'nde gösterilir. Fotogerçekçi görsel modeli BİRDEN FAZLA " +
      "benzer nesneyi (ör. birden fazla üçgen panel, her biri farklı köşe açısı/damga taşıyan) doğru " +
      "SAYIP DOĞRU SIRAYLA çizmekte GÜVENİLMEZ — canlı testte 3 denemenin 3'ünde de görsel modeli " +
      "istenen sahne yerine TAMAMEN ALAKASIZ, uydurma bir sahne üretti (ör. 'üçgen cam panel montaj " +
      "maketi' istenirken 'iç mekanda dikdörtgen panel taşıyan kişi' + manifestte hiç olmayan uydurma " +
      "nesneler/marka logoları çizdi) — bu, metin/rakam okunaksızlığından FARKLI ve DAHA AĞIR bir " +
      "başarısızlık modu: modelin karmaşık/çok-nesneli kompozisyonu yorumlayamayıp konudan tamamen " +
      "sapması. Bu nedenle: (a) baglam_katmani.islev, veri_katmani'nin ZATEN taşıdığı bir yapısal " +
      "bilgiyi 'görsel kaldırılırsa kaybolur' diye GEREKÇE GÖSTEREMEZ — islev yalnız ATMOSFER/BAĞLAMSAL " +
      "İNANDIRICILIK işlevi tanımlamalı (ör. 'gerçekçi ortam olmadan öğrenci senaryoyu somutlaştıramaz'); " +
      "(b) nesneler/on_plan/orta_plan/arka_plan GENEL nesne isimleri kullanmalı (ör. 'üçgen cam paneller', " +
      "'saçak çerçevesi') — kaç tane olduğunu, hangi sırada olduğunu, hangi açı/damga/etiket taşıdığını " +
      "SAYARAK veya SIRALAYARAK betimleme, bu tam liste zaten geometrik_noktalar/geometrik_kenarlar/ " +
      "geometrik_acilar'da var; (c) yasaklar listesine bu tür sorularda 'nesne sayısını/sırasını/açı " +
      "veya damga değerlerini gösterme' eklenmeli.\n" +
      "AÇI VERİSİ ASLA FOTOĞRAFA VEYA TABLOYA YAZILMAZ, HER ZAMAN ŞEKLİN ÜZERİNDE (canlı modda ÜÇ KEZ " +
      "görüldü, KRİTİK — preflight bunu sert kapıyla da engelliyor, kapı hem ∠ işaretini HEM salt derece " +
      "değerini ('35°') HEM tabloya gizlenmiş açı verisini yakalar, kaçış yok): '∠BAD=38°' gibi açı " +
      "İSİMLERİ gorselde_gosterilecek_degerler'e (baglam_katmani/TEKNIK_ETIKET veya CIHAZ_EKRANI) ASLA " +
      "konmaz — görsel modeli açı isimlerini bozuyor (∠BAD yerine ∠AD gibi) veya uydurma etiket ekliyor. " +
      "AMA salt derece DEĞERİNİ ('35°', '(2x+5)°') isim olmadan fotoğrafa yazdırmak da, ya da açı verisini " +
      "bir 'yedek tablo'ya (ör. 'Sıra/Açı/Değer' sütunlu) gizleyip veri_katmani.tur=TABLO seçmek de AYNI " +
      "İHLALDİR — geometrik_noktalar/geometrik_kenarlar dolu olsa bile bu kaçışlar preflight'ta yakalanır. " +
      "Açı verisi VARSA (soru gerçekten açı ölçüsü kullanıyorsa) TEK doğru yol: veri_katmani.tur=GEOMETRI " +
      "seç, açıları gorsel_veri_manifesti.geometrik_acilar (kose/kenar1/kenar2/deger) ile tanımla — bu " +
      "SVG'ye kod seviyesinde, şeklin ÜZERİNDE çizilir, hiç görsel-model riski taşımaz. baglam_katmani bu " +
      "durumda gorsel_veri_gosterimi=YOK kalır, islev açı eşleşmesini gerekçe gösteremez (SVG zaten taşıyor), " +
      "veri_katmani.tur asla TABLO olamaz (açı içeren bir 'yedek tablo' fikri baştan yanlış — GEOMETRI SVG " +
      "zaten deterministik, hiç başarısız olmaz, yedeğe ihtiyacı yok).",
    "12. Tüm sayısal verilerin tek kaynağı gorsel_veri_manifesti olmalı. Metin, seçenekler, tablo, grafik ve " +
      "(varsa) gorselde_gosterilecek_degerler bu manifestle uyuşmalı. grafik_serisi.tur=CIZGI ise noktalar[]." +
      "etiket alanını BOŞ BIRAK veya x ile AYNI değeri yaz — asla o noktanın y-okumasını veya farklı bir sayıyı " +
      "etiket'e yazma (canlı modda görüldü: x ekseni deney sayısı olması gerekirken etiket'e y-değerleri " +
      "yazılıp x-ekseni yanlış render edildi). etiket yalnız tur=SUTUN'da kategorik bir eksen adı (ör. ay " +
      "adı) gerekiyorsa anlamlıdır.",
    "13. Görsel gerekmiyorsa baglam_katmani.gerekli=false ve veri_katmani.gerekli=false kullan; yine de benzersiz manifest_id üret. " +
      "GÖRSEL KARARI=ISLEVSEL_GORSEL_ZORUNLU İSE (kullanıcı geri bildirimi, ÇOK ÖNEMLİ — preflight bunu sert " +
      "kapıyla da engelliyor): öğrenciye GERÇEK bir görsel/diyagram sunulmalı — baglam_katmani.gerekli=true " +
      "(gerçekten fotoğrafik bir sahne varsa) VEYA veri_katmani.tur∈{GEOMETRI,CIZGI,SUTUN,FONKSIYON," +
      "NESNE_SEMASI} (gerçek bir çizim/grafik/şema) ZORUNLUDUR. veri_katmani.tur=TABLO TEK BAŞINA bu kararı " +
      "KARŞILAMAZ — tablo salt sayısal veri listesidir, bir resim/diyagram değildir; baglam_katmani.gerekli=" +
      "false yapıp yalnız TABLO kurmak 'görsel zorunlu' seçimini boşa çıkarır.",
    "14. Görsel gerekiyorsa bağlam görseli ile veri görselini ayır. Veri katmanı SVG/tablo/grafik için açık veri tanımı taşımalı. " +
      "veri_katmani.tur=GEOMETRI SEÇME (gorsel_veri_manifesti.geometrik_noktalar boşsa hiçbir şey çizilmez, " +
      "veri tamamen kaybolur) — gerçek x/y koordinat noktalarıyla çizilen bir şekil değilse. Kart/etiket " +
      "eşleştirme, sınıflandırma, kategorik liste gibi satır-sütun veriyi ARTIK OTOMATİK OLARAK tur=TABLO'ya " +
      "koyma (madde 11'deki YENİ öncelik sırası) — önce bunu SORU METNİNDE cümle/liste olarak yazmayı dene, " +
      "yalnız metne yazmak GERÇEKTEN anlamı/okunabilirliği ciddi ölçüde kaybettiriyorsa (çok sayıda satır×sütun " +
      "kombinasyonu, karşılaştırmalı okuma gerektiren yoğun veri) tur=TABLO'ya düş. " +
      "İSTİSNA — GEOMETRİ DERSİNDE TABLO YASAK (kullanıcı kararı, preflight bunu sert kapıyla da engelliyor): " +
      "Ders=Geometri olan işlerde veri_katmani.tur ASLA TABLO olamaz — kart/etiket eşleştirme gibi görünen bir " +
      "veri bile olsa, Geometri dersinde görsel gerekiyorsa tek seçenek tur=GEOMETRI'dir (uygun noktalar/ " +
      "kenarlarla yeniden kurgula); hiç uymuyorsa veri_katmani.gerekli=false yap, TABLO'ya asla düşme. " +
      "14a. tur=GEOMETRI ise (özellikle Ders=Geometri sorularında) geometrik_noktalar YALNIZ köşe koordinatları " +
      "değildir — şeklin GERÇEK çizim bilgisini de doldur: geometrik_kenarlar (hangi iki nokta segmentle bağlı; " +
      "ana çokgenin kenarları ZORUNLU, yardımcı doğrular — yükseklik/kenarortay/açıortay/paralel kesit gibi " +
      "iç çizgiler de VARSA burada ayrıca listelenmeli, aksi halde poligon varsayımına düşülür ve o doğru hiç " +
      "çizilmez), geometrik_esit_kenar_gruplari (soru kökünde 'AB=AC' gibi eşitlik iddia edilen HER kenar grubu " +
      "— çentik işaretiyle gösterilir, aksi halde eşitlik görselde hiç görünmez), geometrik_acilar (soru kökünde " +
      "değeri verilen veya dik olduğu belirtilen HER açı için kose/kenar1/kenar2 + varsa deger/dik_aci=true — " +
      "aksi halde açı değeri görselde hiç görünmez). Kenar/açı adları geometrik_noktalar'daki 'ad' değerleriyle " +
      "BİREBİR eşleşmeli (harf/büyük-küçük dahil), yoksa o çizgi/açı sessizce atlanır. " +
      "gorsel_veri_manifesti.tablo'yu (headers/rows) doldur. tablo.footnotes'u yalnız gerçekten gerekli, " +
      "tablonun kendisinden veya soru kökünden ANLAŞILMAYAN bir bilgi için kullan (ör. birim, yuvarlama kuralı, " +
      "istisna). 'Hücrelerde X verilmiştir' gibi tablonun zaten gösterdiği veya soru kökünde zaten söylenmiş " +
      "bir şeyi yeniden yazan dipnot EKLEME — gereksiz, öğrenciye hiçbir yeni bilgi katmıyor (canlı modda görüldü).",
    "15. Fiilen doğrulamadığın kaynak veya denetime PASS yazma. BTG değilse kaynak doğrulamasını UYGULANMAZ olarak kısa tut.",
    "16. Öğrenme Becerisi tek, ölçülebilir ve en fazla 18 kelimelik bir cümle olmalı.",
    "17. Son kullanılan bağlam ailelerinden kaçın: " + (ledger.son100BaglamAilesi.join(" | ") || "kayıt yok"),
    "18. Son aile::DNA eşleşmelerinden kaçın: " + (ledger.son200AileDna.slice(-40).join(" | ") || "kayıt yok"),
    "19. Son görsel ailelerinden kaçın: " + (ledger.son15GorselAilesi.join(" | ") || "kayıt yok"),
    "20. Aynı bilgiyi farklı alanlarda gereksiz biçimde tekrar etme; JSON alanlarını kısa ve işlevsel doldur.",
    "",
    // `dogrulama_manifesti` node 10P'nin orijinal şemasında yok (bkz. 03-generator-schema.ts'in
    // dosya başı yorumu) — 1-20 kaynaktaki node 04'ün gerçekte gönderdiği liste, bu blok değil.
    // Model şemayı (strict mode) doldurmak zorunda ama hangi ifadelerin deterministik solver'da
    // çalışacağını bilmiyorsa `a^2` gibi desteklenmeyen sözdizimine yöneliyor (canlı modda
    // görüldü, bkz. proje hafızası) — bu blok o boşluğu kapatıyor.
    "DOĞRULAMA MANİFESTİ KURALLARI (dogrulama_manifesti)",
    "- solver_type yalnız ALGORITHM_FLOW, NUMERIC_EXPRESSION veya UNSUPPORTED olabilir.",
    "- ALGORITHM_FLOW/NUMERIC_EXPRESSION yalnız TAMAMEN SAYISAL ifadeler içindir: expression/expr " +
      "yalnız + - * / % karşılaştırma (< > <= >= == !=) ve mantıksal (&& ||) operatörleri içerebilir. " +
      "Üs (^), fonksiyon çağrısı (sqrt/max/min/sin vb.), atama ve koşullu ifade DESTEKLENMEZ. " +
      "Kullanılan her değişken variables dizisinde somut bir sayıya bağlanmalıdır.",
    "- Simgesel/cebirsel ifadeler (harfli değişkenli üs/kök gösterimi, genel formül, somut sayıya " +
      "bağlanamayan değişken) için solver_type=UNSUPPORTED yaz. Bu bir hata değildir — UNSUPPORTED " +
      "işaretlenen sorular bağımsız çift-LLM ile ayrıca doğrulanır, üretim durmaz. claimed_answer'ı " +
      "yine de doldur.",
    "- options[].deger ve variables[].deger DAİMA ondalık sayı olmalı (ör. 0.45), asla kesir " +
      "string'i (\"9/20\") veya ifade olmamalı — eşleşme yalnız sayısal karşılaştırmayla yapılır, " +
      "kesir metni sayı olarak ayrıştırılmaz ve doğru seçenek bulunamaz.",
    "- ALGORITHM_FLOW'un output düğümündeki value alanı DOĞRU CEVABIN GERÇEK DEĞERİ olmalı — " +
      "options[].deger içindeki değerlerden biriyle BİREBİR AYNI (aynı sayı, ya da options[].deger'de " +
      "yazılı olduğu gibi aynı metin/kategori adı). value alanına ASLA şık harfi ('A','B','C','D','E') " +
      "yazma — solver, hesaplanan value'yu options[].deger ile eşleştirip şıkkı KENDİSİ bulur; value " +
      "zaten bir harf olursa hiçbir options[].deger ile eşleşmez ve 'Eşleşen şık(lar): yok' RED'i " +
      "üretir (canlı modda görülen gerçek bir hata — claimed_answer alanına şıkkı yazman zaten yeterli, " +
      "output value'ya tekrar yazma).",
    "",
    // Aynı boşluk kategorisi: soru/seçenek metninin nasıl yazılacağı da orijinal
    // node 04 çıktısında yok, çünkü kaynak sistemde LaTeX hiç kullanılmıyordu.
    // node 70'in (bkz. 21-dizgi.ts) düz-metin kalıpları arayan dizgi() fonksiyonu
    // LaTeX tanımıyor — canlı modda görüldü (bkz. proje hafızası): model LaTeX'e
    // kaydığında kesir/kök hiç etiketlenmeden \frac{...} olarak sızıyor.
    "SORU/SEÇENEK METNİ DİZGİ BİÇİMİ",
    "- LaTeX YAZMA (\\frac, \\sqrt, \\cdot, \\left/\\right, $...$, \\[...\\] gibi hiçbir LaTeX komutu kullanma).",
    "- Kesir için düz metin: 3/4 veya (pay)/(payda). Kök için: √16, küpkök için: ∛8.",
    "- Üs için: x^2 veya x² (yalnız kare/küp için ² ³ kısayolu var, diğerlerinde ^ kullan, ör. x^5).",
    "- İndis için: x_1 veya x_{ab}.",
    "- Eksi/negatif işareti için HER ZAMAN düz tire (-) kullan (ör. x^(n-1), f(x-3)) — matematiksel eksi " +
      "sembolü (−) veya farklı genişlikte tire KULLANMA; aksi hâlde aynı testteki sorular farklı " +
      "karakterlerle görsel olarak tutarsız görünür.",
    "- secenekler[] dizisindeki metinlerin BAŞINA kendi harf önekini (A)/B)/C)... ) yazma — sistem " +
      "bu öneki otomatik ekler, tekrar yazarsan çift önek oluşur.",
    "",
    // Kaynak: kılavuz/baglamtemelli-maarif-coktan-secmeli-soru-yazim-kilavuzu.pdf —
    // T.C. Millî Eğitim Bakanlığı'nın resmi "Türkiye Yüzyılı Maarif Modeli Bağlam
    // Temelli Çoktan Seçmeli Soru Yazım Kılavuzu"(Mart 2026, ISBN 978-975-11-9562-3).
    // §2.4-2.5'in (yazım süreci, kontrol listesi, sık yapılan hatalar) özeti — kullanıcı
    // bu belgeyi ekledikten sonra istendi; amaç revizyon döngüsünü azaltmak.
    "MAARİF MODELİ BAĞLAM TEMELLİ SORU İLKELERİ (MEB resmi kılavuz, Mart 2026)",
    "- İşlevsellik testi: 'Öğrenci bu bağlamı hiç okumadan, yalnız ön bilgisiyle veya seçeneklerden " +
      "giderek cevaba ulaşabilir mi?' Cevap evetse bağlam işlevsizdir, yeniden kurgula.",
    "- GÖRSEL İŞLEVSELLİK TESTİ (bağlam görseli varsa zorunlu): 'Bu görsel hiç görülmese/kaldırılsa " +
      "soru yine de metin ve tablo/grafikle eksiksiz çözülebilir mi?' Cevap evetse görsel dekoratiftir " +
      "— YENİDEN KURGULA. Görsel ya (a) çözüm için gerekli, metinde/tabloda TEKRARLANMAYAN bir bilgiyi " +
      "taşımalı (ör. nesnelerin sayısı/düzeni/konumu görselden okunmalı, ya da gorsel_veri_gosterimi ile " +
      "bir cihaz okuması/teknik etiket göstermeli), ya da (b) bağlamı somutlaştırarak öğrencinin metni " +
      "doğru zihinsel modele oturtmasını gerçekten kolaylaştırmalı — yalnız 'güzel görünsün' diye " +
      "eklenmemeli. baglam_katmani.islev alanına görsel kaldırılırsa TAM OLARAK hangi bilginin veya " +
      "anlaşılırlığın kaybolacağını yaz; belirsiz/genel bir açıklama ('bağlamı somutlaştırır' gibi) yeterli " +
      "değildir. EKRAN/GÖSTERGE TUZAĞI (canlı modda görüldü, KRİTİK): gorsel_veri_gosterimi=YOK iken islev'i " +
      "'bu ölçüm/puanlanmış bir değer, ham bir okuma değil' türünden bir ayrımı GÖRSEL OLARAK göstermeye " +
      "dayandırma — bu seni bir cihaza ekran/gösterge ışığı/panel eklemeye iter, 'etiketsiz' olsa bile görsel " +
      "model bunu gerçek bir ekran/TV sahnesi olarak yorumlayıp konudan tamamen sapıyor (canlı testte " +
      "görüldü). Bu tür bir ayrım zaten veri_katmani'nin (grafik/tablo) işidir; islev yalnız SAHNENİN " +
      "FİZİKSEL/BAĞLAMSAL somutlaştırma rolünü tanımlamalı (ör. 'bu ölçümlerin gerçek bir saha " +
      "koşulunda toplandığını gösterir'), asla bir ekran/gösterge/panel unsuruna dayanmamalı.",
    "- Bağlam kaynağı: gerçekçi kanıta dayalı veri (NASA/FAO/Dünya Bankası tarzı küresel veri, " +
      "TÜİK/MGM/AFAD tarzı resmî istatistik, e-ticaret/navigasyon verisi) veya herkesin erişebileceği " +
      "ortak günlük yaşam bağlamı (okul, park, doğa, alışveriş) kullan. Golf, borsa/VİOP gibi dar bir " +
      "sosyoekonomik gruba özgü, fırsat eşitliğini zedeleyen bağlamlardan kaçın.",
    "- baglam_katmani SOMUT, FİZİKSEL bir sahne olmalı — raf, laboratuvar, atölye, tezgâh, doğa, pazar, " +
      "şantiye, ofis masası gibi elle tutulur nesne ve mekânlar kullan. Dijital ekran/panel/dashboard " +
      "(bir ölçüm cihazının LCD'si, bir kontrol panelinin ekranı, bir yazılım arayüzü) da bağlama gerçekten " +
      "uyuyorsa kullanılabilir — bu ZORUNLU değil, yalnız bağlam bunu gerektiriyorsa (ör. bir cihazın " +
      "okuma değerini göstermek) tercih et; bağlama uymuyorsa zorlama, dekoratif/gereksiz dijital öğe " +
      "eklemekten kaçın.",
    "- boyut SEÇİMİ (kullanıcı düzeltmesi, ÇOK ÖNEMLİ — YANLIŞ ANLAMA RİSKİ): boyut=2D 'illüstrasyon/" +
      "vektör çizim' ANLAMINA GELMEZ — 2D ve 3D İKİSİ DE HER ZAMAN GERÇEK BİR FOTOĞRAFTIR (bkz. 16-gorsel-" +
      "prompt.ts stil profili), aralarındaki TEK fark KAMERA AÇISI/DERİNLİK hissidir: 3D = doğal açı, " +
      "nesnelerin hacmi/yanları görünür (ör. bir cihazın üç boyutu da hissedilir); 2D = düz/cepheden veya " +
      "kuş bakışı çekim, derinlik bilinçli olarak minimumda (ör. bir masanın yalnız üstü görünür, arka " +
      "ayakları kadraja girmez — yine gerçek bir fotoğraf, yalnız düz açıdan). boyut=3D VARSAYILANDIR; " +
      "2D yalnız sahnenin kendisi doğal olarak düz/cepheden bir çekimle daha iyi anlaşılıyorsa (ör. bir " +
      "ekran okuması, bir masa üstü düzeni, dikey derinliğin çözüm için önemsiz olduğu bir kompozisyon) " +
      "tercih edilir. 'Nesneler teknik/az bilinen' olması TEK BAŞINA ne 2D ne 3D seçme gerekçesidir.",
    "- baglam_katmani.nesneler'i tek düz liste bırakma — aynı nesneleri on_plan (kompozisyonun ön/alt " +
      "kısmında, en büyük/net görünen 1-3 nesne), orta_plan (asıl konuyu oluşturan 2-4 nesne) ve arka_plan " +
      "(sahneyi tamamlayan, daha küçük/bulanık görünebilecek 1-3 nesne) olarak ayır. Bu, görsel modeline " +
      "rastgele/simetrik bir yerleşim yerine gerçek bir fotoğraf kompozisyonu iskeleti verir. Her katmanda " +
      "en fazla birkaç nesne say — 'bir sürü X' yazma, görsel modeli anlamsız tekrarla doldurur.",
    "- Çeldiriciler rastgele değil, konuyu eksik öğrenen/yanlış yapılandıran öğrencinin düşeceği gerçek " +
      "kavram yanılgısından türetilir. 'Hepsi', 'Hiçbiri', 'A ve B' gibi seçenekler YASAK. Doğru seçenek " +
      "diğerlerinden uzunluk/detay bakımından öne çıkmasın; tüm seçenekler biçim ve uzunlukça benzer olsun.",
    "- Çeldiricinin gerekçesi 'bilgi yanlışlığı' değil 'muhakeme hatası' olmalı: öğrenci seçeneği veriyi " +
      "yanlış yorumlayarak/eksik akıl yürüterek eleyebilmeli, bilgi eksikliğinden değil (bilişsel görüşme " +
      "bulgusu, kılavuz §3.5.2c). Soru, bağlamdaki TEK bir cümle veya veri bulunarak çözülebilir olmamalı " +
      "— en az iki veri/adımın birleştirilmesini gerektirsin.",
    "- Soru kökünde: çift olumsuzluk YASAK ('...olmadığı söylenemez' gibi); öznel ifade YASAK ('sizce' " +
      "gibi); konuyu tekrar anlatma — bilgi bağlama, yönlendirme köke. Aynı bağlamdaki birden fazla soru " +
      "birbirinden BAĞIMSIZ çözülebilmeli; 'bir önceki soruda bulduğunuz sonuca göre' türü zincirleme " +
      "ipucu YASAK.",
    "- Görsel, metinde zaten yazılanı birebir resmetmemeli (ör. '3 elma var' yazıp yanına 3 elma çizmek " +
      "işlevsizdir); metinde YER ALMAYAN, çözüm için okunması gereken yeni bir veriyi taşımalı.",
    "- Bağlam ve soru; kültür, cinsiyet, coğrafi bölge, din veya ideoloji açısından tarafsız ve kapsayıcı " +
      "olmalı.",
    "- stimulus (bağlam metni/notlar) veya soru kökünde sorunun kendi tasarımına dair ÜST-YORUM YAZMA " +
      "(ör. 'Sorunun çözümü için veri tablosunun okunması zorunludur.', 'Bu görsel çözüm için gereklidir.' " +
      "gibi yönergemsi cümleler). Öğrenci bu tür cümleleri asla görmemeli; bağlamın işlevselliği yalnız " +
      "kurgunun kendisinden gelir, açıklanarak değil.",
    "- baglam_katmani.gerekli=true iken stimulus'ta 'Fotoğraf ... gösterir/gösterilmektedir' gibi görseli " +
      "AÇIKÇA ADLANDIRAN bir cümle YAZMA (canlı modda görüldü: fotoğraf 3 denemede de RED alıp sayfada hiç " +
      "görünmeyince metin var olmayan bir görsele atıf yapıyordu, öğrenci için anlamsız/bozuk okunuyordu) — " +
      "fotoğraf her zaman başarısız olabilir, metin bu ihtimalden BAĞIMSIZ, KENDİ BAŞINA tam ve tutarlı " +
      "olmalı. Sahneyi/durumu doğrudan anlat (ör. 'gözlem alanında oyuncaklar birbirinden ayrı yerleştirilmiştir' " +
      "gibi), 'fotoğraf/görsel şunu gösteriyor' diye görselin kendisine referans verme.",
    "",
    // Kullanıcının ilettiği "bağlam temelli soru üretme kılavuzu"nun özeti —
    // tekrarlayan "GÖRSEL DEKORATİF"/bağlam zayıflığı redlerinin (canlı modda
    // görülen fosil-odası, pompa-modülleri örnekleri) kök nedenini hedefler:
    // bu sorularda matematik bağlama SONRADAN EKLENMİŞTİ, bağlamın kendi iç
    // mantığından DOĞMAMIŞTI. Yukarıdaki işlevsellik testi/çeldirici kuralları
    // bunun bir kısmını zaten karşılıyor; burada eklenmeyen katmanlar var.
    "BAĞLAM TEMELLİ SORU OMURGASI (kullanıcı kılavuzu — kritik)",
    "- SIRA: Kazanım ve mikro beceri ÖNCE sabittir (girdiden gelir); bağlam bu kazanıma UYACAK ŞEKİLDE " +
      "seçilir. Asla tam tersi yapma — önce ilginç/gerçekçi bir sahne seçip sonra matematiği ona " +
      "'giydirmeye' çalışma; bu, dışarıdan tutarlı görünse bile içeriden dekoratif kalır.",
    "- Matematiksel ilişki bağlamın KENDİ İÇ MANTIĞINDAN doğmalı, sahneye sonradan eklenmiş bir süs " +
      "olmamalı. Kötü örnek: 'Ali bir fabrikada çalışmaktadır. 2⁵·2³ işleminin sonucu kaçtır?' — fabrika " +
      "tamamen dekoratif, çıkarılsa soru aynı kalır. İyi yapı: bir üretim sisteminin iki aşamasının " +
      "kapasite veya ölçek ilişkisi üstel biçimde verilip öğrencinin BU İLİŞKİYİ BAĞLAMDAN ÇIKARMASI " +
      "gerekir — üs/kök işlemi bağlamın kendisinin doğal bir sonucu olmalı, rastgele seçilip üstüne " +
      "hikaye yazılmamalı.",
    "- Soru kökü bağlamdaki sayıları BİREBİR TEKRARLAMAMALI. 'Buna göre...' dedikten sonra öğrenci hangi " +
      "verinin gerekli olduğunu KENDİSİ seçebilmeli — bağlamda çözüme dahil edilmeyecek, alakasız bir " +
      "veri de bulunabilir (öğrencinin veri seçme becerisini de ölçer).",
    "- Kullanılan sayılar yalnız 'gerçekçi bir bağlam türü' seçmekle yetinmemeli, o SPESİFİK senaryoyla " +
      "mantıksal olarak da tutarlı olmalı — büyüklük mertebesi (bir fosilin ağırlığı, bir pompanın " +
      "basıncı, bir sınıfın öğrenci sayısı gibi) o alanın gerçek dünyadaki makul aralığına uymalı.",
    "- Kısa öz-test: bağlamı zihninden çıkar — soru hâlâ AYNI ŞEKİLDE, aynı verilerle çözülebiliyor mu? " +
      "Cevap evetse bağlam zayıftır, yeniden kurgula. Öğrenci bağlamdan veri seçmek, ilişki kurmak veya " +
      "model oluşturmak ZORUNDAYSA bağlam güçlüdür.",
    "",
    // Kullanıcının ilettiği ikinci kılavuz — özellikle bağlam GÖRSELİ için.
    // Çoğu madde yukarıdaki GÖRSEL İŞLEVSELLİK TESTİ ile zaten örtüşüyor;
    // burada yalnız gerçekten yeni olan KONUM/SIRA tutarlılığı ekleniyor
    // (görsel denetimi de bunu ayrıca kontrol ediyor, bkz. 19-gorsel-denetim.ts).
    "- Soru metninde bir konumsal referans varsa ('soldaki'/'sağdaki', 'üstteki'/'alttaki', " +
      "'birinci'/'ikinci' modül/kutu/rafa gibi), bu referans baglam_katmani'nın on_plan/orta_plan/" +
      "arka_plan sıralamasıyla VE gorsel_veri_manifesti'ndeki sırayla BİREBİR tutarlı olmalı — görsel " +
      "üretim modeline hangi nesnenin hangi konumda olacağı açıkça, sahne betimlemesinde belirtilmeli.",
    "",
    // Kullanıcının ilettiği "/ÖSYM/" mimarisinin özeti — sınav sistemine
    // değil ÖSYM'nin ÖLÇME MANTIĞINA benzemeyi hedefler: bir sorunun "ÖSYM'ye
    // benziyor" görünmesi yetmez, hangi bilişsel davranışı ölçtüğü de bu
    // mantığa uygun olmalı. Yukarıdaki çeldirici/bağlam/görsel işlevsellik
    // kuralları bunun bir parçası zaten; burada eklenmeyen, yeni katmanlar var.
    "ÖSYM ÖLÇME MİMARİSİ (iç kalite standardı, MEB kılavuzunu tamamlar)",
    "- Dil: kısa, açık, tek anlamlı, ölçmeye dönük — süslü anlatım, yapay teknik jargon, gereksiz " +
      "dolgu cümle YASAK. Zorluk dilden değil matematikten/muhakemeden gelmeli. ('Bir sistemin " +
      "operasyonel çevrim kapasitesinin optimizasyonu...' değil, 'Makine bir saatte 240 parça üretir' " +
      "gibi doğrudan, ölçülebilir anlatım.)",
    "- Bilgiyi kullanma: 'formül verilmiş, değerleri yerine yaz' türü soru tek başına yetersizdir. " +
      "Öğrenci şu zinciri kurmalı: veriyi oku → gerekeni seç → ilişkiyi fark et → modeli kur → işlemi " +
      "yap → sonucu yorumla. Özellikle TYT düzeyinde asıl güçlük çoğu zaman işlem değil, HANGİ işlemin " +
      "yapılması gerektiğine karar vermektir.",
    "- Uzun işlem/büyük sayı/karmaşık kesir başlı başına zorluk SAYILMAZ — yapay zorluktur, ekleme. " +
      "Değer katan şey karar noktalarıdır: 'bu üç bilgiden hangisi gerekli', 'hangi aralık/model " +
      "geçerli', 'hangi eşitlik kurulmalı' gibi zihinsel kararlar işlem uzunluğundan daha kıymetlidir.",
    "- Mümkünse en az bir TEMSİL GEÇİŞİ kur (metin↔denklem, tablo↔oran, grafik↔fonksiyon, şekil↔cebir " +
      "gibi) — öğrenci bilgiyi doğrudan hazır almasın, bir temsilden diğerine dönüştürsün. Ama eklenen " +
      "her temsil (tablo/grafik/şekil) çözümde gerçek bir görev yapmalı, yalnız görünmek için eklenmemeli.",
    "- Veri yeterliliği: iki farklı makul çözüm yolu farklı sonuca götürüyorsa RED say, yeniden kurgula " +
      "— zor ama açık olmalı, zor VE muğlak olmamalı. Öğrenci, verilmeyen bir bilgiyi varsaymak zorunda " +
      "kalmamalı; hiçbir değer gereksiz yere eksik bırakılmamalı.",
    "- Kazanım bağlamın içinde GİZLENEBİLİR ama KAYBOLAMAZ: soru kökü doğrudan ders kitabı başlığıyla " +
      "açılmasın (ör. 'Üslü sayıların özelliklerinden yararlanarak...' gibi başlamasın), ama çözümün " +
      "merkezinde hedef kazanım gerçekten olmalı — sorunun büyük kısmı salt okuma/genel kültürle " +
      "çözülebiliyorsa kazanımdan sapmış demektir, yeniden kurgula.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * node "04 - MASTER PROMPT Derleyici"nin portu. Varsayılan mod (`compact`)
 * node'un gerçekte gönderdiği çıktıyla birebir eşleşir. `full` modu,
 * node içinde hesaplanıp hiç kullanılmayan 90k+ karakterlik V15.1/V20/V20.2/V21
 * bloklarını kompakt çekirdeğin önüne ekler (bkz. prompts/README.md, "Faz 1'de
 * karar bekleyen konu").
 */
export function buildMasterPrompt(
  resolved: ResolvedJob,
  ledger: RotationLedger = BOS_LEDGER,
  promptMode: PromptMode = process.env.PROMPT_MODE === "full" ? "full" : "compact"
): string {
  const compact = buildCompactPrompt(resolved, ledger);
  if (promptMode === "full") {
    return loadLegacyCore() + "\n\n" + compact;
  }
  return compact;
}
