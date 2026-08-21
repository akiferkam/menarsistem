# MENAR / MAYS — Fizik IQ Bilişsel Zorluk Kalibrasyon Standardı

**Sürüm:** v1.0 — Fiziğe Özel  
**Araştırma tarihi:** 17.08.2026  
**Kapsam:** 9, 10, 11, 12. sınıf • TYT • AYT • Türkiye Yüzyılı Maarif Modeli • soru bankası / deneme üretimi  
**Ölçek:** 13 kademe — IQ50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350  
**Ana çapa noktaları:** **IQ75 = KOLAY** • **IQ200 = ORTA / GENEL AĞIRLIK** • **IQ250 = ZOR / DERECE-SEÇİCİ**

> **Önemli:** Bu dosyadaki “IQ”, gerçek insan zekâ puanı değildir. MENAR/MAYS içinde bir fizik sorusunun çözümünde gereken **bilişsel yükü, bağımsız karar sayısını, fiziksel model kurma derinliğini, temsil dönüşümünü, veri seçimini, strateji seçimini ve doğrulamayı** ifade eden kurum içi zorluk indeksidir.

---

# 1. Amaç

Bu standart, fizik soru üretim uygulamasında aynı öğrenme çıktısından farklı bilişsel seviyelerde fakat **müfredat içinde**, fiziksel olarak doğru ve Türkiye’deki okul/TYT/AYT soru karakterine uygun maddeler üretmek için kullanılır.

Temel hedefler:

1. 9–12. sınıf fizik sorularını tek IQ ölçeğinde kalibre etmek.
2. TYT ile AYT’nin farklı fizik soru DNA’larını ayırmak.
3. Türkiye Yüzyılı Maarif Modeli’nin beceri, modelleme, deney, veri ve çıkarım yaklaşımını üretime taşımak.
4. “Uzun işlem = zor soru” hatasını engellemek.
5. Grafik, vektör, serbest cisim diyagramı, devre, ışın diyagramı, deney düzeneği ve fiziksel model gibi temsilleri işlevsel kullanmak.
6. Müfredat dışı formül/teknik kullanmadan seçici soru üretmek.
7. Hedef IQ’yu bağımsız çözüm ve **PHYSICS_IQ_AUDIT** ile doğrulamak.

---

# 2. Müfredat / Sınav Profili Sürümleme Kuralı

Fizik üretim motoru, **içerik kapsamı** ile **bilişsel zorluğu** birbirinden ayırmalıdır.

```yaml
curriculum_profile:
  - TYMM_2026
  - YKS_2026
  - LEGACY_MEB
  - HYBRID_TRANSITION
```

## 2.1. TYMM_2026

Türkiye Yüzyılı Maarif Modeli Fizik Dersi 9–12 öğretim programındaki ünite, öğrenme çıktısı, süreç bileşeni ve içerik çerçevesi esas alınır.

## 2.2. YKS_2026

2026 YKS’nin fiilî kapsamı ve ÖSYM soru karakteri esas alınır.

## 2.3. LEGACY_MEB

Kademeli geçiş nedeniyle önceki programdan sorumlu öğrenci grupları için kullanılır.

## 2.4. HYBRID_TRANSITION

Yeni programın beceri yaklaşımı ile güncel YKS kapsamının birlikte hedeflendiği hazırlık ürünleri için kullanılır.

## 2.5. Üretim sırası

```text
SINAV / MÜFREDAT PROFİLİNİ SEÇ
→ SINIF / ÜNİTE / ÖĞRENME ÇIKTISINI SEÇ
→ FİZİKSEL ÇEKİRDEK MODELİ BELİRLE
→ HEDEF IQ'YU UYGULA
```

**IQ seviyesi müfredat kapsamını belirlemez.**

---

# 3. Fizik İçin Bilişsel Omurga

Fizikte zorluğun temel kaynağı yalnız formül bilmek değil, verilen fiziksel durumu doğru **modellemek** ve temsil etmektir.

## 3.1. Ana bilişsel eksenler

1. Fiziksel niceliği tanıma.
2. Skaler–vektörel ayrımı.
3. Sistem sınırını belirleme.
4. Referans çerçevesini seçme.
5. Serbest cisim diyagramı kurma.
6. Vektör yönlerini ve işaretleri yönetme.
7. Sözel durumdan fiziksel modele geçme.
8. Şekil ↔ grafik ↔ denklem ↔ sözel açıklama dönüşümü.
9. Grafik eğimi / alanını fiziksel büyüklükle ilişkilendirme.
10. Korunum ilkesinin uygulanıp uygulanamayacağını belirleme.
11. Neden–sonuç zinciri kurma.
12. Orantısal / fonksiyonel ilişki kurma.
13. Sınır durumu test etme.
14. Birim / boyut tutarlılığı kontrolü.
15. Yaklaşık büyüklük / fiziksel makullük kontrolü.
16. Deney değişkenlerini ayırma.
17. Veriden model veya yasa çıkarma.
18. Hipotez / öngörü test etme.
19. Alternatif çözüm stratejileri arasında seçim.
20. Sonucu bağımsız ikinci bir fiziksel ilkeyle doğrulama.

---

# 4. 9. Sınıf — TYMM Fizik Haritası

## Ünite 1 — Fizik Bilimi ve Kariyer Keşfi

Ana içerik:

- Fizik biliminin konusu
- Fizik biliminin alt dalları
- Fizik bilimine katkı sağlayan bilim insanları
- Fizikle ilişkili meslekler
- Bilimsel araştırma / sınıflandırma / çıkarım

Doğal soru becerileri:

- verilen çalışma alanını fizik alt dalıyla eşleme,
- bilimsel bilgi / gözlem / çıkarımı ayırma,
- günlük teknolojiyi fizik alanıyla ilişkilendirme,
- veriden sınıflandırma ölçütü çıkarma.

## Ünite 2 — Kuvvet ve Hareket

Ana içerik:

- Temel ve türetilmiş nicelikler
- Skaler ve vektörel nicelikler
- Vektörler
- Doğadaki temel kuvvetler
- Hareket ve hareket türleri

Doğal soru becerileri:

- vektör bileşke / yön muhakemesi,
- nicelik sınıflandırma,
- konum–yer değiştirme–alınan yol ayrımı,
- hareketi sözel / görsel / vektörel temsil etme.

## Ünite 3 — Akışkanlar

Ana içerik:

- Basınç
- Sıvı basıncı
- Açık hava basıncı
- Kaldırma kuvveti
- Bernoulli ilkesi

Doğal soru becerileri:

- değişken–basınç ilişkisi,
- kap geometrisi ile sıvı basıncını ayırma,
- kaldırma kuvveti / yoğunluk ilişkisi,
- günlük durumdan Bernoulli modeli çıkarma,
- deney düzeneğini yorumlama.

## Ünite 4 — Enerji

Ana içerik:

- İç enerji
- Isı
- Sıcaklık
- Öz ısı
- Isı sığası
- Sıcaklık farkı
- Hâl değişimi
- Isıl denge
- Isı aktarımı
- Isı iletim hızı

Doğal soru becerileri:

- ısı–sıcaklık ayrımı,
- termal denge,
- enerji aktarımı yönü,
- ısıtma / soğuma grafikleri,
- madde özellikleri ile sıcaklık değişimini ilişkilendirme.

---

# 5. 10. Sınıf — TYMM Fizik Haritası

## Ünite 1 — Kuvvet ve Hareket

Ana içerik:

- Sabit hızlı hareket
- Bir boyutta sabit ivmeli hareket
- Konum, hız ve ivme grafikleri
- Grafiklerden matematiksel model üretme

Doğal soru becerileri:

- x–t, v–t, a–t grafikleri arasında dönüşüm,
- eğim / alan anlamı,
- hareket modelini seçme,
- çok aşamalı hareketi parçalama.

## Ünite 2 — Enerji

Ana içerik:

- İş
- Enerji
- Güç
- Enerji türleri
- Mekanik enerji
- Enerji kaynakları

Doğal soru becerileri:

- sistem seçimi,
- işaret / yön,
- iş–enerji ilişkisi,
- enerji dönüşümü,
- güç karşılaştırması,
- enerji kaynağı verisi değerlendirme.

## Ünite 3 — Elektrik

Ana içerik:

- Basit elektrik devreleri
- Akım
- Potansiyel fark
- Direnç
- Ohm ilişkisi
- Dirençlerin bağlanması
- Üreteç / pil bağlantıları
- Elektrik güvenliği
- Topraklama

Doğal soru becerileri:

- devre eşdeğerini kurma,
- akım / gerilim paylaşımı,
- devre değişikliğinin sonucunu öngörme,
- ölçü aletini doğru bağlama,
- güvenlik bağlamında fiziksel gerekçe.

## Ünite 4 — Dalgalar

Ana içerik:

- Periyodik hareket
- Dalga kavramları
- Dalga sınıflandırması
- Dalga hızını etkileyen etmenler
- Su dalgalarında yansıma / kırılma
- Rezonans
- Deprem ve dalga ilişkisi

Doğal soru becerileri:

- periyot–frekans ilişkisi,
- dalga hızı / ortam etkisi,
- dalga cephesi / ışın yorumu,
- rezonans koşulu,
- model / simülasyon verisini yorumlama.

---

# 6. 11. Sınıf — TYMM Fizik Haritası

## Ünite 1 — Kuvvet ve Hareket

Ana içerik:

- Serbest düşme
- İki boyutta sabit ivmeli hareket
- Newton yasaları
- Sürtünme
- Limit hız
- Düzgün çembersel hareket

Doğal soru becerileri:

- serbest cisim diyagramı,
- bileşenlere ayırma,
- göreli / iki boyutlu hareket,
- kuvvet–ivme ilişkisi,
- terminal hız koşulu,
- merkezcil büyüklükleri ilişkilendirme.

## Ünite 2 — Elektrik ve Manyetizma

Ana içerik:

- Elektriksel kuvvet
- Elektrik alan
- Manyetik alan
- Manyetik kuvvet
- Manyetik akı
- İndüksiyon
- İndüksiyon emk’sı / akımı
- Alternatif akım
- Transformatörler
- Elektromıknatıs / motor / Faraday kafesi gibi uygulamalar

Doğal soru becerileri:

- alan–kuvvet ayrımı,
- yön tayini,
- yük / akım / hız yönü analizi,
- manyetik akı değişimi,
- Lenz yasası yön muhakemesi,
- devre / grafik / alan modeli entegrasyonu.

## Ünite 3 — Optik

Ana içerik:

- Işık şiddeti
- Işık akısı
- Aydınlanma
- Düzlem ayna
- Küresel aynalar
- Kırılma
- Görünür derinlik
- Fiber optik
- Prizmalar
- Mercekler

Doğal soru becerileri:

- ışın diyagramı,
- görüntü özellikleri,
- geometrik ilişki,
- ortam / kırılma davranışı,
- deney / ölçüm verisinden sonuç çıkarma.

---

# 7. 12. Sınıf — TYMM Fizik Haritası

## Ünite 1 — Kuvvet ve Hareket

Ana içerik:

- Tork
- Denge
- İtme
- Momentum
- Momentumun korunumu
- Eylemsizlik momenti
- Açısal momentum

Doğal soru becerileri:

- dönme ekseni seçimi,
- tork işareti,
- doğrusal–açısal büyüklükleri ayırma,
- sistem sınırı / korunum,
- çarpışma modelini seçme.

## Ünite 2 — Enerji

Ana içerik:

- Yay sabiti
- Hooke yasası
- Esneklik potansiyel enerjisi
- Sürtünmenin yaptığı iş
- Enerji korunumu
- Verim

Doğal soru becerileri:

- enerji depolama / aktarım,
- sürtünmeli sistemlerde enerji bilançosu,
- deneysel yay sabiti belirleme,
- grafik alanı / eğimi ile fiziksel büyüklük çıkarma.

## Ünite 3 — Dalgalar

Ana içerik:

- Su dalgalarında girişim
- Kırınım
- Işıkta girişim / kırınım
- Elektromanyetik dalgalar
- Dalga boyu / renk
- Mekanik ve elektromanyetik dalga uygulamaları

Doğal soru becerileri:

- yol farkı,
- girişim koşulu,
- parametre değişiminin saçaklara etkisi,
- mekanik–EM dalga ayrımı,
- deney verisi / desen yorumu.

## Ünite 4 — Madde ve Doğa

Ana içerik:

- Siyah cisim ışıması
- Planck yaklaşımı
- Fotoelektrik olay
- Foton
- Yarı iletkenler
- Süper iletkenler
- Standart Model
- Modern atom yaklaşımı

Doğal soru becerileri:

- klasik / modern model ayrımı,
- foton enerjisi,
- eşik koşulu,
- deney sonucu ile model karşılaştırma,
- teknolojik uygulamayı fiziksel ilkeyle ilişkilendirme.

---

# 8. Nihai 13 Kademeli Fizik IQ Skalası

## IQ50 — KOLAY / TABAN

**Bilişsel eksen:** Hatırlama → temel uygulama

- Tek fiziksel bilgi / kavram.
- Tek birim / nicelik / temel ilişki.
- Stratejik seçim yok.
- Gerekli formül açıktır veya hiç işlem yoktur.

**Örnek DNA:**  
`niceliği tanı → temel kuralı uygula`

---

## IQ75 — KOLAY [ALT ÇAPA]

**Bilişsel eksen:** Anlama / uygulama

- IQ50 + 1 küçük karar.
- Basit yön / sınıflandırma / eşleme.
- Tek kısa hesap olabilir.
- Yöntem hemen görünür.

**Örnek:** verilen basit harekette alınan yol ile yer değiştirmeyi ayırt etme.

---

## IQ100 — KOLAY-ORTA

**Bilişsel eksen:** Uygulama

- 1–2 gerçek karar.
- Birden çok veriden gerekli olanı seçme.
- Temel karşılaştırma.
- Basit grafik / şekil kullanılabilir.
- Standart çözüm yolu hâlâ öngörülebilir.

---

## IQ125 — ALT-ORTA

**Bilişsel eksen:** Uygulama → analiz

- 2–3 bilişsel adım.
- İki fiziksel ilişki ardışık kullanılabilir.
- Basit grafik eğimi / alanı veya vektör bileşkesi.
- Bir ara sonuç gerekir.

```text
temsili oku
→ fiziksel ilişkiyi seç
→ ara sonuç çıkar
→ sonuca git
```

---

## IQ150 — ORTA-ALT

**Bilişsel eksen:** Analiz

- 2–3 anlamlı karar.
- Veri seçme + temel model kurma.
- Grafik / devre / serbest cisim / ışın şeması işlevsel olabilir.
- Yeni nesil fizik sorusu başlangıcı.

---

## IQ175 — ORTA

**Bilişsel eksen:** Analiz → sentez

- Kullanılacak ilişkinin hangisi olduğu doğrudan verilmez.
- Sistem veya referans seçimi gerekebilir.
- İki temsil / iki fizik ilkesi ilişkilendirilebilir.
- Çeldiriciler doğal fizik yanılgılarından doğar.

---

## IQ200 — ORTA / GENEL AĞIRLIK / OMURGA [ANA ÇAPA]

**Bilişsel eksen:** Analiz–sentez–değerlendirme

**Fizik üretiminin ana omurgasıdır.**

Minimum karakteristik:

- Yaklaşık 3–5 anlamlı bilişsel karar.
- En az iki işlevsel eksen:
  - model kurma,
  - veri seçme,
  - vektör analizi,
  - grafik yorumlama,
  - sistem seçimi,
  - korunum,
  - temsil dönüşümü,
  - fiziksel doğrulama.
- Bir ara sonuç üretilmeden güvenli cevap bulunmaz.
- Uzun işlem zorunlu değildir.

---

## IQ225 — ORTA-ZOR / SEÇİCİYE GEÇİŞ

**Bilişsel eksen:** Değerlendirme

IQ200 + en az biri:

- örtük fiziksel koşul,
- işaret / yön tuzağı değil, gerçek yön muhakemesi,
- temsil dönüşümü,
- tersine düşünme,
- ilk modelin geçerli olup olmadığını test etme,
- “kesin / olabilir / zorunlu değildir” ayrımı,
- ikinci bir fiziksel kısıtla eleme.

---

## IQ250 — ZOR / DERECE-SEÇİCİ [ÜST ÇAPA]

**Bilişsel eksen:** Değerlendirme → yaratma sınırı

- Yaklaşık 5–6 gerçek karar.
- Çoklu koşul.
- Fiziksel sistemin doğru kurulması zorunlu.
- Veri eleme.
- En az iki temsil veya iki güçlü fizik ilkesi.
- Strateji seçimi.
- Sınır / yön / korunum / makullük kontrolünden en az biri.
- Sonuç ikinci bir koşulla doğrulanır.
- Çözüm yolu soru kökünde açık edilmez.

---

## IQ275 — ÇOK ZOR

**Bilişsel eksen:** Yaratma

- Birden fazla olası model / çözüm yolu.
- İlk görünen yöntem optimum olmayabilir.
- Tersine çözüm veya başlangıç koşulu çıkarımı.
- Yeni bağlama güçlü transfer.
- Alternatif yolların fiziksel geçerliliğini değerlendirme.

---

## IQ300 — ÜST SEÇİCİ

**Bilişsel eksen:** Yaratma + üst-biliş

- Yaklaşık ≥6 bağlı bilişsel karar.
- Gerektiğinde 3 işlevsel temsil:
  - şekil + grafik + denklem,
  - devre + ölçüm tablosu + grafik,
  - hareket diyagramı + vektör + grafik.
- Strateji seçimi.
- Varsayım testi.
- Ara sonuç yorumlama.
- Bağımsız doğrulama.

---

## IQ325 — İLERİ ÜST SEÇİCİ

**Bilişsel eksen:** Uzman düzeyi yaratma

- Çoklu fizik modeli arasında seçim.
- Varsayım sınama.
- Strateji değiştirme.
- Güçlü tersine muhakeme.
- Bir modelin geçerlilik sınırını fark etme.
- Genelleme başlangıcı.

Normal TYT–AYT havuzunda istisnaidir.

---

## IQ350 — BİLİŞSEL ZİRVE / TEORİK TAVAN

**Bilişsel eksen:** Yaratma + genelleme / kanıt

- Yaklaşık ≥8 bağlı muhakeme kararı.
- Çoklu model / temsil.
- Strateji karşılaştırma.
- Varsayım testi.
- Sınır durum analizi.
- Tersine akıl yürütme.
- Genelleme.
- Bağımsız fiziksel doğrulama.

**IQ350, müfredat dışı üniversite fiziği demek değildir.** Zorluk, bilinen ilkelerin sıra dışı fakat müfredat içi birleşiminden gelebilir.

---

# 9. PHYSICS_IQ_AUDIT

| Ölçüt | Denetim sorusu |
|---|---|
| Bağımsız karar | Öğrenci hangi fizik ilkesini kullanacağını kendisi seçiyor mu? |
| Veri seçme | Gereksiz / ikincil veriyi elemesi gerekiyor mu? |
| Sistem sınırı | Hangi cisimlerin / parçaların sisteme dâhil olduğuna karar vermeli mi? |
| Referans seçimi | Konum, hız veya yön için referans çerçevesi kritik mi? |
| Vektör analizi | Büyüklük-yön / bileşen analizi gerçek çözüm adımı mı? |
| Serbest cisim modeli | Kuvvetleri doğru belirlemek gerekiyor mu? |
| Temsil dönüşümü | Metin ↔ şekil ↔ grafik ↔ denklem arasında geçiş var mı? |
| Grafik muhakemesi | Eğim / alan / şekil fiziksel anlam taşıyor mu? |
| Model kurma | Gerçek durum idealize edilerek fiziksel modele dönüştürülüyor mu? |
| Orantısal akıl yürütme | Parametre değişiminin etkisi fonksiyonel olarak izleniyor mu? |
| Korunum seçimi | Enerji / momentum / yük vb. korunumu ne zaman uygulanacağını seçiyor mu? |
| Örtük koşul | Temas, denge, kaymama, eşik, ideal kabul gibi koşul fark edilmeli mi? |
| Tersine düşünme | Sonuçtan başlangıç koşuluna veya kuvvetten harekete ters yönlü muhakeme var mı? |
| Strateji seçimi | Birden fazla çözüm yolu arasında uygun olan seçiliyor mu? |
| Sınır durum | Uç değer / sıfır / maksimum / denge durumu kontrol ediliyor mu? |
| Birim-boyut | Sonuç boyutsal olarak doğrulanıyor mu? |
| Makullük kontrolü | İşaret, yön ve büyüklük fiziksel olarak kontrol ediliyor mu? |
| Deney değişkeni | Bağımsız / bağımlı / kontrol değişkenleri ayrılıyor mu? |
| Kanıt | Ölçüm veya veri fiziksel iddiayı gerçekten destekliyor mu? |
| Doğrulama | Sonuç başka bir fizik ilkesi / temsil ile denetleniyor mu? |
| Transfer | Bilinen ilke yeni fakat müfredat içi düzeneğe uygulanıyor mu? |

---

# 10. Gerçek Karar Sayısı Nasıl Sayılır?

## Karar sayılmayanlar

- verilen formülde sayıları yerine koymak,
- dört aritmetik işlem yapmak,
- her seçeneği mekanik denemek,
- şekil üzerindeki etiketi okumak,
- standart birim dönüşümünü tek başına yapmak,
- aynı denklemde uzun cebir yürütmek.

## Gerçek bilişsel karar örnekleri

- Sistemi hangi cisimlerden kuracağına karar vermek.
- Sürtünmenin yönünü belirlemek.
- Hangi grafiğin eğiminin hangi niceliği verdiğini seçmek.
- Enerji korunumu mu Newton yasaları mı daha uygun karar vermek.
- Devrede hangi kolların seri / paralel olduğunu yeniden modellemek.
- Manyetik kuvvetin yönünü belirlemek.
- Optikte doğru ışın diyagramını seçmek.
- Fotoelektrikte hangi niceliğin maksimum kinetik enerjiyi etkilediğini ayırmak.
- Sonucun fiziksel olarak mümkün olup olmadığını kontrol etmek.

---

# 11. IQ'yu Tek Başına Yükseltmeyen Unsurlar

- Büyük / çirkin sayılar.
- Uzun cebir.
- Çok fazla birim dönüşümü.
- Gereksiz ondalık işlem.
- Formülü doğrudan vermek ve yalnız hesap yaptırmak.
- Şekli gereksiz ayrıntıyla kalabalıklaştırmak.
- Uzun hikâye / bağlam.
- Müfredat dışı ileri fizik terimi.
- Çok sayıda cisim ekleyip hepsini aynı algoritmayla çözmek.
- Seçenekleri yalnız sayısal olarak yakınlaştırmak.
- Aynı fizik ilişkisini üç kez tekrar ettirmek.
- Gereksiz trigonometrik işlem.
- “Şaşırtıcı” görünen ama çözümde kullanılmayan veri.
- Bilgi eksikliğini zorluk sanmak.

---

# 12. Bağlam Temelli Fizik Sorusu Standardı

Bağlam yalnız dekor olmamalıdır.

## İşlevsel bağlam için en az bir şart

- gerekli ölçüm / veri sunmalı,
- fiziksel modeli seçtirmeli,
- öğrenciyi varsayım yapmaya zorlamalı,
- gerçek bir deney / gözlem içermeli,
- grafiği / diyagramı anlamlandırmalı,
- karar veya karşılaştırma üretmeli.

**Bağlam kaldırıldığında çözüm değişmiyorsa**, bağlam büyük olasılıkla işlevsizdir.

Uygun bağlamlar:

- ulaşım,
- spor,
- enerji kullanımı,
- elektrik güvenliği,
- laboratuvar deneyi,
- sensör / ölçüm,
- dalga / deprem,
- optik cihaz,
- araç hareketi,
- güneş / enerji teknolojileri.

---

# 13. Görsel / Grafik / Şema Standardı

## IQ50–100

- Görsel opsiyonel.
- Tek cisim / basit vektör / basit devre.
- Görsel çoğunlukla tanıma/eşleme.

## IQ125–175

- Grafik, vektör, devre, ışın veya deney şeması kullanılabilir.
- En az bir görsel bilgi çözüm için zorunlu olmalı.

## IQ200–250

- Görsel, ara sonuç üretmeye zorlamalı.
- Etiketler cevabı sızdırmamalı.
- Yön, ölçek, eksen, bağlantı veya geometrik düzen işlevsel olmalı.

## IQ275–350

- Birden fazla temsil kullanılabilir.
- Her temsil farklı bilgi taşımalı.
- Aynı veriyi üç kez göstermenin IQ katkısı yoktur.

---

# 14. Fizik Soru Arketipleri

## A. Kavram / sınıflandırma
**Doğal bant:** IQ50–150

## B. Vektör / hareket
**Doğal bant:** IQ75–275

- yer değiştirme,
- hız,
- ivme,
- göreli hareket,
- iki boyutlu hareket.

## C. Kuvvet / serbest cisim
**Doğal bant:** IQ100–300

- kuvvet yönleri,
- Newton yasaları,
- sürtünme,
- bağlı cisimler,
- çembersel hareket.

## D. Grafik / veri
**Doğal bant:** IQ100–300

- x–t,
- v–t,
- a–t,
- F–x,
- I–V,
- deneysel veri.

## E. Enerji / momentum / korunum
**Doğal bant:** IQ125–325

## F. Akışkan / termal
**Doğal bant:** IQ75–250

## G. Elektrik devresi
**Doğal bant:** IQ100–300

## H. Elektrik–manyetizma alan modeli
**Doğal bant:** IQ150–325

## I. Dalga / optik
**Doğal bant:** IQ100–300

## J. Modern fizik
**Doğal bant:** IQ125–300

## K. Deney / hipotez / model doğrulama
**Doğal bant:** IQ125–325

---

# 15. Çeldirici Üretim Standardı

Her yanlış seçenek doğal bir fizik yanılgısına dayanmalıdır.

## Tercih edilen hata yolları

1. Yol–yer değiştirme karışıklığı.
2. Sürat–hız karışıklığı.
3. Skaler–vektörel karışıklık.
4. Hız ile ivmenin yönünü aynı sanma.
5. Net kuvvet ile tek kuvveti karıştırma.
6. Etki–tepki kuvvetlerini aynı cisim üzerinde sanma.
7. Normal kuvveti her zaman `mg` kabul etme.
8. Sürtünmeyi her zaman hareket yönüne zıt kabul etme.
9. Kütle–ağırlık karışıklığı.
10. Grafik eğimi–alanı karışıklığı.
11. Enerjinin “kaybolduğunu” sanma.
12. Momentum korunumu için sistem dışı kuvveti göz ardı etme.
13. Akım–gerilim karışıklığı.
14. Seri–paralel bağlantıyı yanlış modelleme.
15. Direnç artınca her durumda akımın aynı biçimde değişeceğini sanma.
16. Elektrik alan–elektrik kuvvet karışıklığı.
17. Manyetik kuvvette yön hatası.
18. Manyetik akı ile manyetik alanı aynı sanma.
19. Lenz yasasında değişime karşı koymayı alana karşı koymak sanma.
20. Dalga hızı–frekans–dalga boyu ilişkisini ortam değişiminde yanlış kurma.
21. Ayna / mercekte gerçek–sanal görüntü karışıklığı.
22. Işık şiddeti–ışık akısı–aydınlanma karışıklığı.
23. Fotoelektrikte ışık şiddeti ile foton enerjisini karıştırma.
24. Doğrusal ve açısal nicelikleri karıştırma.
25. Torkta kuvvet kolunu yanlış seçme.

```yaml
distractor:
  misconception_id: PHY_MIS_###
  error_type:
  why_plausible:
  why_wrong:
```

---

# 16. TYT Fizik Üretim Standardı

2026 TYT Fen Bilimleri testinde fizik bölümü **7 soru**dur. Uygulamada sayı sabit kodlanmamalı; sınav yılı profiline bağlı tutulmalıdır.

Güncel TYT fizik soru karakterinde şu yapılar öne çıkar:

- kısa ve temiz fiziksel bağlam,
- günlük durumdan model kurma,
- vektör / hareket temsili,
- yoğunluk / akışkan ilişkisi,
- ısıl denge,
- elektriksel kavram,
- dalga,
- ayna / optik,
- “kesinlikle / olabilir” türü fiziksel çıkarım.

## Önerilen TYT üretim merkezi

**IQ150–200**

## MENAR önerilen üretim havuzu

> Resmî ÖSYM yüzdesi değildir.

| IQ bandı | Önerilen ağırlık |
|---|---:|
| IQ50–100 | %12 |
| IQ125–175 | %38 |
| IQ200–225 | %37 |
| IQ250 | %11 |
| IQ275+ | %2 |

TYT'de yüksek IQ, ileri AYT formülü ekleyerek değil; temel fiziği iyi modellettirerek oluşturulmalıdır.

---

# 17. AYT Fizik Üretim Standardı

2026 AYT Fen Bilimleri testinde fizik bölümü **14 soru**dur. Uygulamada sayı sınav yılına bağlı metadata olmalıdır.

Güncel AYT fizik soru karakterinde:

- kuvvet / hareket sistemleri,
- atış / göreli hareket,
- iş–enerji,
- tork,
- elektrik alan / deney düzeneği,
- manyetik akı,
- AC devre,
- çembersel hareket,
- doğrusal / açısal momentum,
- salınım,
- Doppler,
- atom modelleri,
- fotoelektrik,
- dalga uygulamaları

gibi geniş konu kapsaması; şekil, yön, nicelik ilişkisi ve model seçimi birlikte görülür.

## Önerilen AYT üretim merkezi

**IQ175–225**

## MENAR önerilen üretim havuzu

> Resmî ÖSYM yüzdesi değildir.

| IQ bandı | Önerilen ağırlık |
|---|---:|
| IQ50–100 | %5 |
| IQ125–175 | %24 |
| IQ200–225 | %39 |
| IQ250–275 | %25 |
| IQ300 | %6 |
| IQ325–350 | %1 |

---

# 18. Sınıf Bazlı Önerilen Üretim Bantları

| Hedef | Normal merkez | Seçici bant | İstisnai üst bant |
|---|---|---|---|
| 9. sınıf | IQ100–175 | IQ200–225 | IQ250–300 |
| 10. sınıf | IQ125–200 | IQ225–250 | IQ275–300 |
| 11. sınıf | IQ150–225 | IQ250–275 | IQ300–325 |
| 12. sınıf | IQ150–225 | IQ250–275 | IQ300–325 |
| TYT | IQ150–200 | IQ225–250 | IQ275 |
| AYT | IQ175–225 | IQ250–275 | IQ300–325 |

Bu değerler tavan değildir.

---

# 19. ÖSYM Stilinden Çıkarılan Fizik Üretim İlkeleri

1. **Kısa soru zor olabilir.**  
   Doğru fiziksel modeli seçtirmek, uzun hesap yapmaktan daha seçici olabilir.

2. **Şekil çözümün parçasıdır.**  
   Dekoratif şema yerine yön, konum, bağlantı veya ölçüm bilgisi taşır.

3. **Formül seçimi önemlidir.**  
   Formülü soru kökünde doğrudan vermek, modelleme yükünü düşürür.

4. **Nitel akıl yürütme gerçek zorluktur.**  
   Parametre artarsa ne olur, yön ne olur, hangi ifade zorunludur gibi sorular yüksek bilişsel değer taşıyabilir.

5. **Hesap + kavram dengesi korunur.**  
   AYT’de hesap olabilir; fakat hesap mekanik uzatılmaz.

6. **Doğal çeldirici kullanılır.**  
   Yanlış seçenekler yanlış fizik modelinden doğar.

---

# 20. Bilimsel Doğruluk Standardı

Her soru için:

1. Tek doğru cevap bulunmalı.
2. Kullanılan idealizasyon açık veya hedef düzeyde makul olmalı.
3. İşaret ve yön tanımları tutarlı olmalı.
4. Şekil ile metin çelişmemeli.
5. Birimler doğru olmalı.
6. Grafik eksenleri ve ölçekleri anlamlı olmalı.
7. Korunum ilkeleri yalnız geçerli sistemlerde uygulanmalı.
8. Devre bağlantıları fiziksel olarak mümkün olmalı.
9. Optik ışınları modelle uyumlu olmalı.
10. Deney düzeneği hedef değişkeni gerçekten ölçebilmelidir.

---

# 21. Görsel Fizik Tutarlılık Kontrolü

```yaml
visual_audit:
  labels_consistent: true
  vector_directions_consistent: true
  circuit_connections_valid: true
  graph_axes_valid: true
  scale_required: false
  answer_leak: false
  decorative_only: false
  ambiguous_geometry: false
```

Özel kontroller:

- Vektör ok yönü ve başlangıç noktası.
- Devrede bağlantı düğümleri.
- Ampul / direnç / kaynak polaritesi gerektiğinde.
- Ayna / mercek ana ekseni.
- Gelen / yansıyan / kırılan ışın yönleri.
- Grafik eğim/alanının ölçekten dolayı yanlış algılanmaması.
- Serbest cisim diyagramında yalnız ilgili cisme etkiyen kuvvetler.

---

# 22. Minimum IQ DNA Tablosu

| IQ | Yaklaşık gerçek karar | Minimum karakter |
|---:|---:|---|
| 50 | 0 | doğrudan bilgi / tek kural |
| 75 | 1 küçük | basit eşleme / yön |
| 100 | 1–2 | temel ilişki |
| 125 | 2–3 | kısa analiz / temsil |
| 150 | 2–3 anlamlı | veri + model |
| 175 | 3–4 | yöntem / sistem seçimi |
| 200 | 3–5 | ≥2 işlevsel fiziksel eksen |
| 225 | 4–5 | örtük koşul / tersine / kontrol |
| 250 | 5–6 | çoklu koşul + doğrulama |
| 275 | 5–7 | alternatif model / transfer |
| 300 | ≥6 | çoklu temsil + strateji |
| 325 | ≥7 | model değişimi / sınır testi |
| 350 | ≥8 | genelleme + bağımsız kanıt |

---

# 23. Uygulama Metadata Şeması

```yaml
subject: fizik
curriculum_profile: TYMM_2026
grade: 11
exam_profile: SCHOOL   # SCHOOL | TYT | AYT

unit: ELEKTRIK_VE_MANYETIZMA
learning_outcome_code: "FİZ.11.X.X"

target_iq: 250
estimated_iq_after_audit: 250

question_archetype:
  - field_model
  - diagram
  - reasoning

representation:
  - text
  - diagram

cognitive_operations:
  - system_modeling
  - direction_reasoning
  - data_selection
  - validation

independent_decision_count: 6

physics_principles:
  - magnetic_flux
  - induction

distractor_sources:
  - direction_error
  - flux_field_confusion
  - lenz_misconception

requires_external_knowledge: false
curriculum_out_of_scope: false
single_correct_answer: true
visual_required: true
final_lock: PASS
```

---

# 24. Soru Üretim Pipeline'ı

```text
1. CURRICULUM_LOCK
   ↓
2. Sınıf / sınav profilini seç
   ↓
3. Öğrenme çıktısını seç
   ↓
4. TARGET_IQ belirle
   ↓
5. Fiziksel çekirdek modeli belirle
   ↓
6. Arketipi seç
   ↓
7. İşlevsel bağlam / veri / görsel oluştur
   ↓
8. Soruyu önce kendin çöz
   ↓
9. Doğal fizik yanılgılarından çeldirici üret
   ↓
10. Bağımsız ikinci çözüm yap
   ↓
11. PHYSICS_IQ_AUDIT
   ↓
12. Bilimsel ve görsel doğruluk kontrolü
   ↓
13. Müfredat kontrolü
   ↓
14. Tek doğru kontrolü
   ↓
15. FINAL_KİLİDİ
```

---

# 25. TARGET_IQ Prompt Kuralı

Örnek IQ250 sistem talimatı:

```text
Hedef IQ = 250.

Soruyu zorlaştırmak için:
- müfredat dışı formül kullanma,
- işlemi gereksiz uzatma,
- çirkin sayılar kullanma,
- metni yapay biçimde uzatma.

Bunun yerine:
- yaklaşık 5–6 anlamlı fiziksel karar oluştur,
- öğrencinin fiziksel modeli kendisinin kurmasını sağla,
- en az iki işlevsel bilişsel ekseni birleştir,
- veri / yön / temsil seçimi yaptır,
- çözüm yolunu doğrudan verme,
- doğal bir örtük koşul veya sınır kontrolü ekle,
- sonucu ikinci fiziksel koşulla doğrulat.

Bağımsız çözüm bu DNA'yı taşımıyorsa IQ250 etiketi verme.
```

---

# 26. FINAL_KİLİDİ

## Müfredat kilidi
- [ ] Öğrenme çıktısı belli.
- [ ] Müfredat dışı bilgi gerekmiyor.
- [ ] Sınıf / sınav profiline uygun.

## Fizik kilidi
- [ ] Model fiziksel olarak doğru.
- [ ] Tek doğru cevap var.
- [ ] Birimler / yönler / işaretler doğru.
- [ ] Grafik / devre / şekil tutarlı.
- [ ] İdealizasyonlar makul.

## IQ kilidi
- [ ] Bağımsız çözüm yapıldı.
- [ ] Gerçek kararlar sayıldı.
- [ ] Mekanik cebir ayrı tutuldu.
- [ ] PHYSICS_IQ_AUDIT tamamlandı.
- [ ] Hedef IQ gerçek muhakeme ile doğrulandı.

## Çeldirici kilidi
- [ ] Her yanlış seçenek doğal hata yoluna dayanıyor.
- [ ] Müfredat dışı ayrıntıyla eleme yok.
- [ ] Doğru seçenek biçimsel olarak öne çıkmıyor.

---

# 27. AUTO_REJECT

```yaml
AUTO_REJECT:
  - multiple_correct_answers
  - no_correct_answer
  - curriculum_out_of_scope
  - physically_impossible_setup
  - inconsistent_vector_direction
  - invalid_circuit
  - misleading_graph
  - unit_error
  - ambiguous_reference_frame
  - answer_leak_from_diagram
  - target_iq_inflated_by_arithmetic
  - target_iq_inflated_by_text_length
  - decorative_context_only
  - distractor_requires_out_of_scope_fact
```

---

# 28. IQ Yükseltme / Düşürme Operatörleri

## Gerçek IQ yükseltme

- Formülü vermek yerine modeli seçtir.
- Tek temsil → işlevsel iki temsil.
- Doğrudan yön → bileşen / referans seçimi.
- Tek cisim → etkileşen sistem.
- Tek ilke → iki uyumlu ilke.
- Doğrudan çözüm → tersine başlangıç koşulu.
- Tek grafik → grafik + fiziksel mekanizma.
- Sonuç → bağımsız fiziksel kontrol.
- Standart durum → sınır / eşik durumu.
- Tek olası model → alternatif modellerden seçim.

## IQ düşürme

- Örtük koşulu açıkla.
- Sistem sınırını hazır ver.
- Ara sonucu hazır ver.
- Temsil sayısını azalt.
- Tek fizik ilkesine indir.
- Gereksiz veriyi kaldır.
- Vektör yönünü doğrudan göster.
- Grafik yerine sayısal veriyi ver.

---

# 29. Aynı Kazanımdan Farklı IQ — Hareket Örneği

Konu: **Hız–zaman grafiği**

## IQ75
Grafikten cismin hızının arttığı bölgeyi belirleme.

## IQ125
Grafiğin alanından yer değiştirme hesaplama.

## IQ175
İki hareketlinin v–t grafiklerini karşılaştırıp belirli anda hangisinin önde olduğunu bulma.

## IQ200
Parçalı v–t grafiğinde yön değişimi, yer değiştirme ve alınan yolu birlikte analiz etme.

## IQ250
İki farklı referans noktasına ilişkin grafik / sözel bilgi verilip gerçek hareket modelini seçme, kritik zamanı bulma ve sonucu başka koşulla doğrulama.

## IQ300
Grafik + konum şeması + ölçüm verisini birlikte kullanarak alternatif hareket senaryolarını eleme ve tek tutarlı modeli belirleme.

---

# 30. Aynı Kazanımdan Farklı IQ — Elektrik Örneği

## IQ75
Ohm yasasında verilen iki nicelikten üçüncüyü bulma.

## IQ125
Basit seri/paralel devrede eşdeğer direnci belirleme.

## IQ175
Bir anahtar konumu değişince belirli ampullerin parlaklık değişimini yorumlama.

## IQ200
Devre topolojisini yeniden çizip akım/gerilim dağılımını ilişkilendirme.

## IQ250
İki anahtar, iç direnci ihmal edilen kaynak ve ölçü aletleri içeren devrede farklı konumlarda hangi ölçümlerin zorunlu olarak artıp/azalacağını belirleme ve enerji/güç ile doğrulama.

---

# 31. Aynı Kazanımdan Farklı IQ — Enerji Örneği

## IQ75
Kinetik enerji bağıntısını temel uygulama.

## IQ150
Sürtünmesiz düzende iki konumdaki hızları enerji korunumu ile karşılaştırma.

## IQ200
Sürtünmeli çok aşamalı yolda enerji bilançosu kurma.

## IQ250
Sürtünmenin yalnız belirli bölgede olduğu düzende, bilinmeyen başlangıç koşulunu gözlenen son durumdan tersine çıkarma ve sınır koşuluyla doğrulama.

---

# 32. Psikometrik Kullanım Notu

Teorik IQ etiketi gerçek öğrenci zekâ puanı veya doğrudan madde güçlüğü değildir.

Pilot uygulamada ayrıca ölçülmesi önerilir:

- p-değeri,
- ayırt edicilik,
- madde-toplam korelasyonu,
- seçenek işlevselliği,
- yanıt süresi,
- gerekirse IRT parametreleri.

---

# 33. EVAL Sistemi

```yaml
PHYSICS_EVAL:
  IQ75: 20
  IQ100: 20
  IQ125: 20
  IQ150: 20
  IQ175: 20
  IQ200: 30
  IQ225: 30
  IQ250: 30
  IQ275: 20
  IQ300: 15
  IQ325: 10
  IQ350: 5
```

Her madde için saklanması önerilen uzman etiketleri:

- gerçek IQ,
- sınıf / TYT / AYT,
- ünite / öğrenme çıktısı,
- arketip,
- gerçek karar sayısı,
- temsil sayısı,
- kullanılan fizik ilkeleri,
- çeldirici hata türleri,
- çözüm süresi,
- bilimsel doğruluk.

---

# 34. Önerilen Çıktı JSON'u

```json
{
  "subject": "fizik",
  "grade": 12,
  "exam_profile": "AYT",
  "curriculum_profile": "HYBRID_TRANSITION",
  "unit": "KUVVET_VE_HAREKET",
  "target_iq": 250,
  "audited_iq": 250,
  "archetype": ["momentum", "diagram", "reasoning"],
  "cognitive_decisions": 6,
  "representations": ["text", "diagram"],
  "skills": [
    "system_selection",
    "vector_reasoning",
    "conservation_selection",
    "validation"
  ],
  "distractor_errors": [
    "system_boundary_error",
    "direction_error",
    "momentum_energy_confusion"
  ],
  "curriculum_check": "PASS",
  "physics_check": "PASS",
  "single_answer_check": "PASS",
  "iq_audit": "PASS",
  "final_lock": "PASS"
}
```

---

# 35. Araştırma Dayanağı

Bu standardın hazırlanmasında soru metinleri kopyalanmadan, **program yapısı ve soru DNA'sı** incelenmiştir:

1. MENAR / MAYS — TYT–AYT IQ Bilişsel Zorluk Kalibrasyon Standardı v3.
2. T.C. Millî Eğitim Bakanlığı — Türkiye Yüzyılı Maarif Modeli Fizik Dersi Öğretim Programı (9–12).
3. TYMM 9. sınıf Fizik — Fizik Bilimi ve Kariyer Keşfi, Kuvvet ve Hareket, Akışkanlar, Enerji.
4. TYMM 10. sınıf Fizik — Kuvvet ve Hareket, Enerji, Elektrik, Dalgalar.
5. TYMM 11. sınıf Fizik — Kuvvet ve Hareket, Elektrik ve Manyetizma, Optik.
6. TYMM 12. sınıf Fizik — Kuvvet ve Hareket, Enerji, Dalgalar, Madde ve Doğa.
7. MEB / TYMM bağlam temelli çoktan seçmeli soru yaklaşımı.
8. OGM Materyal fizik soru bankaları ve 3 Adım TYT/AYT kaynakları.
9. ÖSYM 2025 YKS TYT / AYT temel soru kitapçıkları.
10. ÖSYM 2026 YKS TYT / AYT temel soru kitapçıkları.

---

# 36. Nihai Kural

> **Fizikte IQ seviyesini formül sayısı veya işlem uzunluğu değil, öğrencinin kurmak zorunda olduğu fiziksel model ve verdiği bağımsız kararlar belirler.**

**IQ250 soru daha çok işlem yaptıran soru değildir.**  
Öğrenciye doğru sistemi seçtirir, temsilleri ilişkilendirir, fizik ilkesini seçtirir, örtük koşulu fark ettirir ve sonucu fiziksel olarak doğrulatır.
