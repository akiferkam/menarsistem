# MENAR / MAYS — Kimya IQ Bilişsel Zorluk Kalibrasyon Standardı

**Sürüm:** v1.0 — Kimyaya Özel  
**Araştırma tarihi:** 17.08.2026  
**Kapsam:** 9, 10, 11, 12. sınıf • TYT • AYT • Türkiye Yüzyılı Maarif Modeli • soru bankası / deneme üretimi  
**Ölçek:** 13 kademe — IQ50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350  
**Ana çapa noktaları:** **IQ75 = KOLAY** • **IQ200 = ORTA / GENEL AĞIRLIK** • **IQ250 = ZOR / DERECE-SEÇİCİ**

> **Önemli:** Bu dosyadaki “IQ”, gerçek insan zekâ puanı değildir. MENAR/MAYS içinde bir kimya sorusunun çözümünde gereken **bilişsel yükü, bağımsız karar sayısını, kimyasal modelleme derinliğini, makroskobik–tanecik–sembolik temsil dönüşümünü, veri/kanıt kullanımını, strateji seçimini ve doğrulamayı** ifade eden kurum içi zorluk indeksidir.

---

# 1. Amaç

Bu standart, kimya soru üretim uygulamasında aynı öğrenme çıktısından farklı bilişsel seviyelerde fakat **müfredat içinde**, bilimsel olarak doğru ve Türkiye’deki okul/TYT/AYT soru karakterine uygun maddeler üretmek için kullanılır.

Temel hedefler:

1. 9–12. sınıf kimya sorularını tek IQ ölçeğinde kalibre etmek.
2. TYT ve AYT kimya soru DNA’larını ayırmak.
3. Türkiye Yüzyılı Maarif Modeli’nin deney, veri, kanıt, model, sürdürülebilirlik ve problem çözme yaklaşımını üretime taşımak.
4. “Uzun işlem / çok formül = zor kimya” hatasını engellemek.
5. Makroskobik gözlem, tanecik modeli ve sembolik kimya arasında işlevsel geçiş yaptırmak.
6. Müfredat dışı reaksiyon / istisna ezberiyle yapay seçiciliği engellemek.
7. Hedef IQ’yu bağımsız çözüm ve **CHEMISTRY_IQ_AUDIT** ile doğrulamak.

---

# 2. Müfredat / Sınav Profili Sürümleme Kuralı

```yaml
curriculum_profile:
  - TYMM_2026
  - YKS_2026
  - LEGACY_MEB
  - HYBRID_TRANSITION
```

## TYMM_2026
Türkiye Yüzyılı Maarif Modeli Kimya Dersi 9–12 öğretim programı esas alınır.

## YKS_2026
2026 YKS fiilî kapsamı ve ÖSYM soru karakteri esas alınır.

## LEGACY_MEB
Kademeli geçişte önceki öğretim programını kullanan gruplar için.

## HYBRID_TRANSITION
Yeni programın beceri yaklaşımı ile mevcut YKS kapsamının birlikte hedeflendiği ürünler için.

## Üretim sırası

```text
SINAV / MÜFREDAT PROFİLİ
→ SINIF / TEMA / ÖĞRENME ÇIKTISI
→ KİMYASAL ÇEKİRDEK MODEL
→ HEDEF IQ
```

IQ seviyesi konu kapsamını genişletmez.

---

# 3. Kimyada Bilişsel Omurga

Kimyada yüksek kaliteli soru üretiminin merkezinde üç temsil düzeyi vardır:

1. **Makroskobik düzey:** gözlenen renk, çökelti, gaz çıkışı, sıcaklık değişimi, madde hâli, ölçüm.
2. **Tanecik / alt mikroskobik düzey:** atom, iyon, molekül, elektron, bağ, tanecik hareketi.
3. **Sembolik düzey:** formül, denklem, katsayı, mol, grafik, matematiksel bağıntı, yapı formülü.

Gerçek kimya muhakemesi bu düzeyler arasında doğru geçiş yaptırır.

## 3.1. Ana bilişsel eksenler

1. Madde / tanecik / tür tanıma.
2. Sınıflandırma.
3. Periyodik ilişki kurma.
4. Yapı–özellik ilişkisi.
5. Makro ↔ tanecik ↔ sembolik temsil dönüşümü.
6. Kimyasal denklem kurma / yorumlama.
7. Atom / kütle / yük / elektron korunumu.
8. Mol köprüsü kurma.
9. Stoikiyometrik oran seçimi.
10. Sınırlayıcı bileşen / artan madde analizi.
11. Gazlarda değişken ilişkileri.
12. Çözelti derişimi ve karışım modeli.
13. Enerji / entalpi analizi.
14. Tepkime hızı / çarpışma modeli.
15. Denge / Q / K / Le Chatelier analizi.
16. Asit–baz / pH / nötralleşme modeli.
17. Redoks / elektron akışı.
18. Elektrokimyasal hücre modeli.
19. Organik yapı / adlandırma / izomerlik.
20. Deney değişkenlerini ayırma.
21. Veriden hipotez / sonuç çıkarma.
22. Kanıtın iddiayı destekleyip desteklemediğini değerlendirme.
23. Sürdürülebilirlik verisini kimyasal gerekçeyle değerlendirme.
24. Alternatif kimyasal açıklamalar arasında seçim.
25. Sonucu madde / yük / birim / sınır durumu ile doğrulama.

---

# 4. 9. Sınıf — TYMM Kimya Haritası

TYMM 9. sınıfta ana temalar: **Etkileşim, Çeşitlilik, Sürdürülebilirlik**.

## Tema — ETKİLEŞİM

### Kimya Hayattır
- Günlük yaşamda kimya
- Kimyasal maddelerin kullanımı
- Güvenlik
- Kimyanın alt disiplinleri ve kariyerler

### Atomdan Periyodik Tabloya
- Atom teorileri
- Bohr ve modern atom yaklaşımı
- Atom yapısı
- Orbitaller
- Elektron dizilimi
- Periyodik sistemde konum
- Periyodik özellikler
- Aufbau, Hund, Pauli
- İyonlaşma enerjisi
- Elektronegatiflik

Doğal beceriler:

- bilimsel model karşılaştırma,
- elektron diziliminden konum çıkarma,
- periyodik eğilimleri gerekçelendirme,
- veriden element özelliklerini karşılaştırma.

## Tema — ÇEŞİTLİLİK

Ana içerik:

- Metalik bağ
- İyonik bağ
- Kovalent bağ
- Lewis gösterimi
- Polarlık
- Bileşiklerin adlandırılması
- Moleküller arası etkileşimler
- Katı türleri
- Sıvı özellikleri
- Kaynama / buhar basıncı
- Viskozite
- Adezyon / kohezyon
- Yüzey gerilimi

Doğal beceriler:

- yapı–özellik,
- Lewis modelinden bağ / polarlık,
- tanecikler arası etkileşimden makroskobik özellik,
- farklı maddeleri verilen verilere göre karşılaştırma.

## Tema — SÜRDÜRÜLEBİLİRLİK

Ana içerik:

- Nanoparçacıklar
- Metal nanoparçacıkları
- Çevresel etkiler
- Yeşil kimya
- Atık önleme

Doğal beceriler:

- veri / kanıt değerlendirme,
- fayda–risk,
- sürdürülebilir çözüm seçme,
- deney sonucu yorumlama.

---

# 5. 10. Sınıf — TYMM Kimya Haritası

## Tema — ETKİLEŞİM

Ana içerik:

- Kimyasal tepkime belirtileri
- Tepkime oluşumu
- Tepkime türleri
- Mol
- Denklem denkleştirme
- Stokiyometri
- Gazlar
- Kinetik moleküler teori
- Gaz yasaları
- İdeal gaz
- Graham difüzyon / efüzyon ilişkisi

Doğal beceriler:

- makro gözlemden tepkime çıkarımı,
- tanecik modelinden denklem,
- mol / kütle / tanecik dönüşümü,
- stokiyometrik oran,
- gaz değişkenleri ilişkisi,
- model / grafik karşılaştırması.

## Tema — ÇEŞİTLİLİK

Ana içerik:

- Çözeltiler
- Çözünme
- Çözünürlüğü etkileyen faktörler
- Çözelti sınıflandırması
- Molarite
- ppm
- Koligatif özellikler
- Kaynama noktası yükselmesi
- Donma noktası düşmesi

Doğal beceriler:

- çözücü–çözünen modeli,
- derişim hesap / karşılaştırma,
- deney değişkenleri,
- çözünürlük grafiği,
- nicel veri + tanecik açıklaması.

## Tema — SÜRDÜRÜLEBİLİRLİK

Ana içerik:

- Yeşil kimya
- Makro / mikro ölçek deney
- Atmosferik tepkimeler
- Hava kirliliği
- Ozon tabakası
- Asit yağmurları
- Sera etkisi
- Küresel ısınma

Doğal beceriler:

- kimyasal süreç + çevresel sonuç,
- veri / grafik değerlendirme,
- çözüm önerilerini bilimsel gerekçeyle karşılaştırma.

---

# 6. 11. Sınıf — TYMM Kimya Haritası

## Tema — ETKİLEŞİM

Ana içerik:

- Tepkime enerjisi
- Entalpi
- Bağ entalpileri
- Standart oluşum entalpisi
- Tepkime hızı
- Çarpışma teorisi
- Ortalama hız
- Hıza etki eden faktörler
- Veriden basit hız bağıntısı

Doğal beceriler:

- enerji diyagramı,
- Hess / bağ enerjisi mantığı,
- deneysel hız verisi,
- değişken kontrolü,
- çarpışma modelinden makro hız değişimi,
- grafikten çıkarım.

## Tema — ÇEŞİTLİLİK

Ana içerik:

- Kimyasal denge
- Denge sabiti K
- Tepkime bölümü Q
- Le Chatelier
- Asit–baz dengesi
- Suyun otoiyonizasyonu
- Arrhenius / Brønsted yaklaşımı
- pH / pOH
- Kuvvetli / zayıf asit–baz
- Nötralleşme
- Kuvvetli asit–baz titrasyonu
- Çözünürlük dengesi
- Ksp
- Ortak iyon
- Sıcaklık etkisi

Doğal beceriler:

- başlangıç–değişim–denge modeli,
- K / Q karşılaştırması,
- denge yönü,
- pH’den tür / derişim,
- titrasyon verisi,
- çözünürlük / ortak iyon analizi.

## Tema — SÜRDÜRÜLEBİLİRLİK

Ana içerik:

- Fermantasyon ile yeşil hidrojen
- Nanoteknoloji ürünleri
- Fayda / risk
- Mikroplastik / nanoplastik

Doğal beceriler:

- kanıt değerlendirme,
- süreç verimliliği,
- çevresel risk / yarar kararı,
- deneysel veriden çıkarım.

---

# 7. 12. Sınıf — TYMM Kimya Haritası

## Tema — ETKİLEŞİM

Ana içerik:

- Redoks tepkimeleri
- Elektrokimyasal hücreler
- Metal aktifliği
- Galvanik hücreler
- Standart hidrojen elektrodu
- Standart indirgenme potansiyelleri
- Hücre potansiyeli
- Derişim / koşul etkileri
- Elektrolitik hücre
- Faraday ilişkisi
- Elektrokaplama
- Korozyon ve önleme

Doğal beceriler:

- yükseltgenme / indirgenme,
- anot / katot,
- elektron / iyon akış yönü,
- hücre şeması,
- potansiyel hesabı ve işaret kontrolü,
- elektroliz / galvanik karşılaştırma.

## Tema — ÇEŞİTLİLİK

Ana içerik:

- Sigma / pi bağları
- Hibritleşme
- Molekül geometrisi / VSEPR
- Organik bileşik yapıları
- Alifatik / aromatik hidrokarbonlar
- Sınıflandırma
- Adlandırma
- İzomerlik
- Fiziksel / kimyasal özellikler
- Fonksiyonel gruplar
- Fonksiyonel izomerlik
- Karbon temelli enerji kaynakları

Doğal beceriler:

- yapı formülü ↔ ad,
- yapı ↔ hibritleşme ↔ geometri,
- izomer üretme / eleme,
- fonksiyonel grup–özellik ilişkisi,
- moleküler temsil dönüşümü.

## Tema — SÜRDÜRÜLEBİLİRLİK

Ana içerik:

- Boya duyarlı güneş hücreleri
- Biyobozunur polimerler
- Yapay zekâ ve sürdürülebilirlik

Doğal beceriler:

- teknoloji verisi,
- kimyasal yapı / işlev,
- avantaj–sınırlılık,
- kanıt temelli karar verme.

---

# 8. Nihai 13 Kademeli Kimya IQ Skalası

## IQ50 — KOLAY / TABAN

**Bilişsel eksen:** Hatırlama → temel uygulama

- Tek kavram / tek bilgi.
- Bir element / bağ / tanım / temel kural.
- Stratejik karar yok.
- İşlem varsa doğrudan.

---

## IQ75 — KOLAY [ALT ÇAPA]

**Bilişsel eksen:** Anlama / uygulama

- IQ50 + 1 küçük eşleme / karşılaştırma.
- Basit sembolik gösterim.
- Yöntem hemen fark edilir.

Örnek: elektron diziliminden son katman elektron sayısını belirleme.

---

## IQ100 — KOLAY-ORTA

**Bilişsel eksen:** Uygulama

- 1–2 gerçek karar.
- Birkaç veriden gerekli olanı seçme.
- Basit sınıflandırma.
- Temel tanecik / sembol dönüşümü.
- Standart algoritma baskın.

---

## IQ125 — ALT-ORTA

**Bilişsel eksen:** Uygulama → analiz

- 2–3 bilişsel adım.
- İki temel kimya ilişkisi ardışık.
- Basit tablo, Lewis gösterimi, tanecik modeli veya grafik.
- Ara sonuç gerekir.

---

## IQ150 — ORTA-ALT

**Bilişsel eksen:** Analiz

- 2–3 anlamlı karar.
- Veri seçme.
- Temel kimyasal model.
- Makro ↔ tanecik veya tanecik ↔ sembolik geçiş.
- Deney / grafik / denklem işlevsel.

---

## IQ175 — ORTA

**Bilişsel eksen:** Analiz → sentez

- Yöntem doğrudan verilmez.
- Hangi ilişki / oran / modelin kullanılacağını öğrenci belirler.
- İki temsil birlikte kullanılabilir.
- Çeldiriciler gerçek kimya kavram yanılgılarından doğar.

---

## IQ200 — ORTA / GENEL AĞIRLIK / OMURGA [ANA ÇAPA]

**Bilişsel eksen:** Analiz–sentez–değerlendirme

Minimum karakteristik:

- Yaklaşık 3–5 anlamlı karar.
- En az iki işlevsel kimya ekseni:
  - temsil dönüşümü,
  - veri seçme,
  - stokiyometrik model,
  - yapı–özellik,
  - deney analizi,
  - denge / enerji / hız mantığı,
  - kimyasal kanıt.
- Bir ara sonuç gerekir.
- Yalnız formül yerine koyma değildir.

---

## IQ225 — ORTA-ZOR / SEÇİCİYE GEÇİŞ

IQ200 + en az biri:

- örtük kimyasal koşul,
- gereksiz veriyi eleme,
- tersine çıkarım,
- makro veriden tanecik modeli,
- ikinci kimyasal kısıtla eleme,
- “kesin / mümkün / mümkün değil” analizi,
- alternatif tepkime / yapı olasılıklarını test etme.

---

## IQ250 — ZOR / DERECE-SEÇİCİ [ÜST ÇAPA]

**Bilişsel eksen:** Değerlendirme → yaratma sınırı

- Yaklaşık 5–6 gerçek karar.
- Çoklu koşul.
- En az iki temsil düzeyi; çoğu durumda üçlü temsil güçlü tercih.
- Veri eleme.
- Kimyasal model seçimi.
- Strateji seçimi.
- Madde / yük / elektron / mol / denge gibi ikinci bir kısıtla doğrulama.
- Çözüm yolu açık verilmez.

---

## IQ275 — ÇOK ZOR

**Bilişsel eksen:** Yaratma

- Birden fazla olası kimyasal model.
- Alternatif açıklamaları eleme.
- Tersine çözüm.
- Yeni bağlama güçlü transfer.
- Bir verinin tek başına yeterli olmadığını fark etme.
- Deneysel veya sembolik kanıtları birleştirme.

---

## IQ300 — ÜST SEÇİCİ

**Bilişsel eksen:** Yaratma + üst-biliş

- Yaklaşık ≥6 bağlı karar.
- Gerektiğinde 3 işlevsel temsil:
  - makro gözlem + tanecik modeli + denklem,
  - grafik + tablo + kimyasal denklem,
  - hücre şeması + potansiyel verisi + tepkime.
- Strateji seçimi.
- Varsayım / koşul testi.
- Bağımsız doğrulama.

---

## IQ325 — İLERİ ÜST SEÇİCİ

- Çoklu model arasında seçim.
- Kimyasal varsayımın geçerlilik sınırını test etme.
- Strateji değiştirme.
- Güçlü tersine muhakeme.
- Temsil seviyeleri arasında ileri transfer.
- Genelleme başlangıcı.

Normal TYT–AYT havuzunda istisnaidir.

---

## IQ350 — BİLİŞSEL ZİRVE / TEORİK TAVAN

- Yaklaşık ≥8 bağlı muhakeme kararı.
- Çoklu model / temsil.
- Alternatif hipotezler.
- Strateji karşılaştırma.
- Varsayım testi.
- Sınır durum analizi.
- Genelleme.
- Bağımsız kimyasal doğrulama.

**IQ350 = üniversite kimyası demek değildir.** Müfredat içi kavramlar daha derin bir muhakeme mimarisiyle birleştirilebilir.

---

# 9. CHEMISTRY_IQ_AUDIT

| Ölçüt | Denetim sorusu |
|---|---|
| Bağımsız karar | Hangi kimya ilkesinin kullanılacağını öğrenci seçiyor mu? |
| Veri seçme | Gereksiz / ikincil veriyi elemesi gerekiyor mu? |
| Makro → tanecik | Gözlenen olayı tanecik düzeyinde açıklamalı mı? |
| Tanecik → sembol | Modelden formül / denklem / oran kurmalı mı? |
| Sembolik → makro | Denklemden gözlenebilir sonuç çıkarmalı mı? |
| Yapı–özellik | Bağ / geometri / etkileşimden özellik çıkarıyor mu? |
| Korunum | Atom, kütle, yük veya elektron dengesi kritik mi? |
| Mol köprüsü | Kütle / tanecik / hacim / mol arasında uygun geçiş seçiliyor mu? |
| Stokiyometrik model | Katsayı oranı doğru bağlama uygulanıyor mu? |
| Sınırlayıcı bileşen | Hangi reaktifin sınırlayıcı olduğunu belirlemek gerekiyor mu? |
| Gaz modeli | Basınç, hacim, sıcaklık, mol ilişkisi yorumlanıyor mu? |
| Çözelti modeli | Derişim, çözünürlük veya seyreltme doğru modelleniyor mu? |
| Enerji | Entalpi / bağ enerjisi / enerji profili yorumlanıyor mu? |
| Hız | Çarpışma modeli veya deneysel hız verisi kullanılıyor mu? |
| Denge | K, Q, Le Chatelier veya tür dağılımı birlikte değerlendiriliyor mu? |
| Asit–baz | Tür, kuvvet, pH/pOH ve nötralleşme ayrımları yapılıyor mu? |
| Redoks | Elektron alışverişi ve yükseltgenme basamağı doğru izleniyor mu? |
| Elektrokimya | Anot/katot, elektron/iyon akışı ve potansiyel birlikte modelleniyor mu? |
| Organik yapı | Yapı, ad, hibritleşme, izomerlik veya fonksiyonel grup arasında geçiş var mı? |
| Deney değişkeni | Bağımsız / bağımlı / kontrol değişkenleri ayrılıyor mu? |
| Kanıt | Veri iddiayı desteklemek için gerçekten yeterli mi? |
| Örtük koşul | Standart koşul, tam tepkime, denge, çökelme vb. fark edilmeli mi? |
| Tersine düşünme | Son üründen başlangıç bileşimi / yapı / koşul çıkarılıyor mu? |
| Strateji seçimi | Alternatif hesap/model yollarından biri seçiliyor mu? |
| Doğrulama | Sonuç madde, yük, birim veya ikinci temsil ile kontrol ediliyor mu? |
| Transfer | Bilgi yeni fakat müfredat içi kimyasal bağlama uygulanıyor mu? |

---

# 10. Gerçek Karar Sayısı

## Karar sayılmayanlar

- molar kütleyi mekanik toplama,
- denklem zaten dengelenmişken katsayıyı okumak,
- uzun dört işlem,
- tek formülde sayı yerine koymak,
- tabloda açıkça verilen değeri okumak,
- basit birim dönüşümü,
- aynı oranı art arda tekrar etmek.

## Gerçek kimyasal karar örnekleri

- Hangi tanecik modelinin gözlemi açıkladığını seçmek.
- Denklemde sınırlayıcı bileşeni belirlemek.
- Hangi verinin K hesabında kullanılacağını seçmek.
- Zayıf asitte tam iyonlaşma varsayımının geçersiz olduğunu fark etmek.
- Elektrokimyasal hücrede anot/katodu potansiyelden belirlemek.
- Organik yapıda doğru ana zinciri seçmek.
- Bir deneyde sıcaklık etkisi ile derişim etkisini ayırmak.
- Sonucun yük / atom / elektron korunumu ile tutarlı olup olmadığını kontrol etmek.

---

# 11. IQ'yu Tek Başına Yükseltmeyen Unsurlar

- Çok büyük mol sayıları.
- Uzun ondalık hesaplar.
- Gereksiz molar kütle hesabı.
- Ezberlenmesi güç reaksiyonlar.
- Müfredat dışı bileşik adı.
- Çok karmaşık organik yapı çizimi.
- Uzun paragraf.
- Çok sayıda gereksiz deney verisi.
- Yalnız seçenekleri sayısal olarak yakınlaştırmak.
- Denklemi uzun denkleştirmek.
- Nadir istisna sormak.
- Latince / ileri teknik isim kullanmak.
- Aynı veriyi tablo ve grafikte tekrar etmek.
- Bağlamı yalnız “yeni nesil” görünümü için eklemek.

---

# 12. Bağlam Temelli Kimya Sorusu Standardı

İşlevsel bağlam en az birini sağlamalıdır:

- deney / gözlem verisi sunma,
- kimyasal güvenlik kararı,
- çözünürlük / derişim bağlamı,
- çevresel / sürdürülebilirlik verisi,
- enerji / yakıt karşılaştırması,
- malzeme özelliği,
- elektrokimyasal teknoloji,
- günlük bir kimyasal süreç,
- öğrenciyi tanecik modeli kurmaya zorlama.

Bağlam kaldırılınca çözüm değişmiyorsa bağlam dekoratiftir.

---

# 13. Görsel / Tanecik Modeli / Grafik Standardı

## IQ50–100
- Görsel opsiyonel.
- Basit Lewis / tanecik / kap modeli.

## IQ125–175
- En az bir görsel bilgi çözümde işlevsel olabilir.
- Basit enerji grafiği / çözünürlük grafiği / yapı formülü.

## IQ200–250
- Görselden ara sonuç üretilmelidir.
- Tanecik sayıları / türleri tutarlı olmalıdır.
- Kimyasal denklemle görsel arasında gerçek dönüşüm bulunabilir.

## IQ275–350
- Makro + tanecik + sembolik üçlü temsil kullanılabilir.
- Her temsil farklı bir bilgi taşımalıdır.

---

# 14. Kimya Soru Arketipleri

## A. Atom / periyodik sistem
**Doğal bant:** IQ50–225

## B. Bağ / Lewis / yapı–özellik
**Doğal bant:** IQ75–275

## C. Tanecik modeli
**Doğal bant:** IQ75–275

## D. Tepkime / denklem / stokiyometri
**Doğal bant:** IQ100–300

## E. Gazlar
**Doğal bant:** IQ100–275

## F. Çözelti / çözünürlük / derişim
**Doğal bant:** IQ100–300

## G. Termokimya
**Doğal bant:** IQ125–300

## H. Tepkime hızı
**Doğal bant:** IQ125–300

## I. Kimyasal denge
**Doğal bant:** IQ150–325

## J. Asit–baz
**Doğal bant:** IQ125–325

## K. Çözünürlük dengesi
**Doğal bant:** IQ150–325

## L. Elektrokimya
**Doğal bant:** IQ150–325

## M. Organik yapı / adlandırma / izomerlik
**Doğal bant:** IQ100–300

## N. Deney / veri / hipotez
**Doğal bant:** IQ125–325

## O. Sürdürülebilirlik / karar verme
**Doğal bant:** IQ100–275

---

# 15. Çeldirici Üretim Standardı

Doğal hata yolları:

1. Atom numarası–kütle numarası karışıklığı.
2. İzotop–izobar–izoton karışıklığı.
3. Elektron dizilimi / orbital dolum hatası.
4. Periyodik trend yönü hatası.
5. İyonik–kovalent–metalik bağ karışıklığı.
6. Molekül içi bağ ile moleküller arası etkileşimi karıştırma.
7. Polar bağ ile polar molekülü aynı sanma.
8. Buhar basıncı–kaynama noktası ilişkisini ters kurma.
9. Adezyon–kohezyon karışıklığı.
10. Katsayı–alt indis karışıklığı.
11. Mol–kütle–tanecik sayısını yanlış eşleme.
12. Sınırlayıcı bileşeni başlangıç miktarı en az olan sanma.
13. Gaz yasalarında sıcaklığı °C ile doğrudan kullanma.
14. Basınç / hacim değişiminde molü yanlış sabit kabul etme.
15. Derişim–çözünürlük karışıklığı.
16. Molarite–mol karışıklığı.
17. Ekzotermik–endotermik işaret karışıklığı.
18. Katalizörün denge sabitini değiştirdiğini sanma.
19. Hız ile dengeyi karıştırma.
20. Q–K karşılaştırmasını ters yorumlama.
21. Le Chatelier’de katı / sıvı etkisini yanlış genelleme.
22. Kuvvetli asit ile derişik asidi aynı sanma.
23. pH / pOH yönünü ters kurma.
24. Tam iyonlaşma varsayımını zayıf türlere uygulama.
25. Ksp ile çözünürlüğü aynı nicelik sanma.
26. Anot–katot işaretlerini galvanik ve elektrolitik hücrede mekanik ezberleme.
27. Elektron ve iyon akış yönünü karıştırma.
28. Yükseltgenme / indirgenmeyi yük artışı ile yanlış eşleme.
29. Hücre potansiyeli işaret hatası.
30. Sigma–pi bağ sayısı hatası.
31. Hibritleşme–geometri karışıklığı.
32. Ana zincir / numaralandırma hatası.
33. Yapı izomeri–fonksiyonel izomer karışıklığı.
34. Makroskobik gözlemden yanlış tanecik modeli çıkarma.

```yaml
distractor:
  misconception_id: CHEM_MIS_###
  error_type:
  why_plausible:
  why_wrong:
```

---

# 16. TYT Kimya Üretim Standardı

2026 TYT Fen Bilimleri testinde kimya bölümü **7 soru**dur. Soru sayısı uygulamada sınav yılı metadata’sı olarak tutulmalıdır.

Güncel TYT kimya soru karakterinde:

- tanecik modeli,
- atom / izotop türleri,
- Lewis gösterimi,
- sıvı / buhar basıncı düzenekleri,
- temel stokiyometri,
- çözelti derişimi,
- metal / kimyasal özellik sınıflandırması

gibi kompakt ama kavramsal yapılar görülür.

## Önerilen merkez

**IQ150–200**

## MENAR üretim havuzu

> Resmî ÖSYM yüzdesi değildir.

| IQ bandı | Önerilen ağırlık |
|---|---:|
| IQ50–100 | %12 |
| IQ125–175 | %39 |
| IQ200–225 | %36 |
| IQ250 | %11 |
| IQ275+ | %2 |

TYT kimyada yüksek IQ, AYT konusu eklemekle değil; temel kimyayı tanecik / sembol / veri arasında doğru dönüştürmekle üretilmelidir.

---

# 17. AYT Kimya Üretim Standardı

2026 AYT Fen Bilimleri testinde kimya bölümü **13 soru**dur. Soru sayısı sınav yılına bağlı tutulmalıdır.

Güncel AYT kimya soru karakterinde:

- kuantum sayıları / elektron yapısı,
- gazlar,
- gaz stokiyometrisi,
- çözelti karışımı,
- entalpi,
- tepkime enerji grafiği,
- zayıf asit / pH,
- gaz dengesi,
- elektrokimyasal hücre,
- hibritleşme / sigma–pi,
- inorganik sınıflandırma,
- organik adlandırma / reaksiyon

gibi çok farklı temsil ve işlem türleri görülür.

## Önerilen merkez

**IQ175–225**

## MENAR üretim havuzu

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

---

# 19. ÖSYM Stilinden Çıkarılan Kimya İlkeleri

1. **Tanecik temsili önemlidir.**  
   Basit bir görsel, doğru yorum gerektiriyorsa uzun metinden daha seçici olabilir.

2. **Hesap tek başına zorluk değildir.**  
   AYT’de nicel işlem vardır ancak asıl yük, doğru oran / model / tür seçimindedir.

3. **Sembolik dil işlevseldir.**  
   Formül, denklem ve yapı gösterimi soru çözümünün gerçek parçasıdır.

4. **Kavramsal kontrol yapılır.**  
   Sayısal sonuç kimyasal olarak makul değilse öğrenci bunu fark edebilmelidir.

5. **Çeldirici doğal kimya hatasından doğar.**

6. **Kısa bir soru IQ250 olabilir.**  
   Örneğin bir denge / elektrokimya / organik yapı sorusu az metinle çoklu kısıt yönetebilir.

---

# 20. Bilimsel Doğruluk Standardı

1. Tek doğru cevap.
2. Kimyasal formüller doğru.
3. Denklem atom / yük açısından tutarlı.
4. Tanecik modeli verilen miktar ve türlerle uyumlu.
5. İyon yükleri doğru.
6. Periyodik eğilim ifadeleri hedef düzeyde doğru.
7. Gaz koşulları ve birimler tutarlı.
8. Çözelti / derişim verileri fiziksel olarak mümkün.
9. Denge ifadesi doğru türleri içerir.
10. pH / pOH koşulları doğru.
11. Elektrokimyasal hücrede anot/katot ve elektron akışı tutarlı.
12. Organik yapı valans kurallarına uygun.
13. Deney düzeneğinde yalnız hedef değişken değiştirilmiş olmalı; aksi soru amacıysa açık olmalı.
14. Sürdürülebilirlik bağlamında bilimsel iddialar veriyle desteklenmeli.

---

# 21. Görsel / Kimyasal Temsil Audit

```yaml
visual_audit:
  particle_counts_consistent: true
  atom_types_consistent: true
  charges_consistent: true
  equation_balanced_if_required: true
  molecular_structure_valid: true
  graph_axes_valid: true
  cell_electrodes_consistent: true
  answer_leak: false
  decorative_only: false
```

Özel kontroller:

### Tanecik modeli
- aynı tür aynı sembol/renkle,
- atom sayıları korunmalı,
- tanecik modeli soru metniyle çelişmemeli.

### Lewis / yapı
- değerlik elektronları,
- bağ sayıları,
- yükler
uyumlu olmalı.

### Elektrokimya
- anot / katot,
- tuz köprüsü,
- elektron yönü,
- iyon göçü
fiziksel olarak tutarlı olmalı.

### Organik
- karbon değerliği,
- bağ türleri,
- numaralandırma
doğru olmalı.

---

# 22. Minimum IQ DNA

| IQ | Yaklaşık gerçek karar | Minimum karakter |
|---:|---:|---|
| 50 | 0 | doğrudan bilgi |
| 75 | 1 küçük | temel eşleme |
| 100 | 1–2 | basit ilişki / temsil |
| 125 | 2–3 | kısa analiz |
| 150 | 2–3 anlamlı | veri + kimyasal model |
| 175 | 3–4 | yöntem / temsil seçimi |
| 200 | 3–5 | ≥2 işlevsel kimya ekseni |
| 225 | 4–5 | örtük koşul / tersine / ikinci kontrol |
| 250 | 5–6 | çoklu koşul + doğrulama |
| 275 | 5–7 | alternatif model / güçlü transfer |
| 300 | ≥6 | çoklu temsil + strateji |
| 325 | ≥7 | model değişimi / sınır testi |
| 350 | ≥8 | alternatif hipotez + genelleme |

---

# 23. Uygulama Metadata Şeması

```yaml
subject: kimya
curriculum_profile: TYMM_2026
grade: 11
exam_profile: SCHOOL   # SCHOOL | TYT | AYT

theme: CESITLILIK
topic: KIMYASAL_DENGE
learning_outcome_code: "KİM.11.X.X"

target_iq: 250
estimated_iq_after_audit: 250

question_archetype:
  - equilibrium
  - graph
  - reasoning

representation:
  - text
  - table
  - symbolic

cognitive_operations:
  - data_selection
  - equilibrium_modeling
  - q_k_comparison
  - validation

independent_decision_count: 6

distractor_sources:
  - rate_equilibrium_confusion
  - q_k_direction_error
  - le_chatelier_overgeneralization

requires_external_knowledge: false
curriculum_out_of_scope: false
single_correct_answer: true
visual_required: false
final_lock: PASS
```

---

# 24. Soru Üretim Pipeline'ı

```text
1. CURRICULUM_LOCK
   ↓
2. Sınıf / TYT / AYT profilini seç
   ↓
3. Öğrenme çıktısını seç
   ↓
4. TARGET_IQ
   ↓
5. Kimyasal çekirdek modeli belirle
   ↓
6. Makro / tanecik / sembolik temsil ihtiyacını seç
   ↓
7. Soru arketipini seç
   ↓
8. İşlevsel bağlam / deney / veri oluştur
   ↓
9. Soruyu bağımsız çöz
   ↓
10. Doğal kavram yanılgılarından çeldirici üret
   ↓
11. İkinci bağımsız çözüm
   ↓
12. CHEMISTRY_IQ_AUDIT
   ↓
13. Kimyasal doğruluk / temsil kontrolü
   ↓
14. Müfredat kontrolü
   ↓
15. Tek doğru kontrolü
   ↓
16. FINAL_KİLİDİ
```

---

# 25. TARGET_IQ Prompt Kuralı

```text
Hedef IQ = 250.

Soruyu zorlaştırmak için:
- müfredat dışı reaksiyon ekleme,
- nadir bileşik ezberi isteme,
- hesaplamayı gereksiz uzatma,
- çirkin sayılar kullanma,
- metni gereksiz uzatma.

Bunun yerine:
- yaklaşık 5–6 anlamlı kimyasal karar oluştur,
- en az iki temsil düzeyi kullandır,
- öğrencinin gerekli modeli / oranı kendisinin seçmesini sağla,
- veri eleme veya örtük koşul ekle,
- doğal kavram yanılgılarından çeldirici üret,
- sonucu atom / yük / mol / denge / ikinci temsil ile doğrulat.

Bağımsız çözüm bu DNA'yı taşımıyorsa IQ250 etiketi verme.
```

---

# 26. FINAL_KİLİDİ

## Müfredat
- [ ] Öğrenme çıktısı belli.
- [ ] Müfredat dışı bilgi gerekmiyor.
- [ ] Sınıf / sınav profili doğru.

## Kimya
- [ ] Formüller / yapılar doğru.
- [ ] Tek doğru cevap.
- [ ] Atom / yük / elektron korunumu tutarlı.
- [ ] Grafik / tanecik / deney modeli doğru.
- [ ] Koşullar fiziksel olarak mümkün.

## IQ
- [ ] Bağımsız çözüm yapıldı.
- [ ] Gerçek bilişsel kararlar sayıldı.
- [ ] Mekanik hesap ayrı tutuldu.
- [ ] CHEMISTRY_IQ_AUDIT tamamlandı.
- [ ] Hedef IQ gerçek muhakeme ile doğrulandı.

## Çeldirici
- [ ] Her yanlış seçenek doğal hata yoluna dayanıyor.
- [ ] Müfredat dışı bilgiyle eleme yok.
- [ ] Doğru seçenek biçimsel olarak öne çıkmıyor.

---

# 27. AUTO_REJECT

```yaml
AUTO_REJECT:
  - multiple_correct_answers
  - no_correct_answer
  - curriculum_out_of_scope
  - chemically_invalid_formula
  - unbalanced_required_equation
  - charge_conservation_error
  - invalid_particle_model
  - impossible_solution_data
  - invalid_electrochemical_cell
  - invalid_organic_valence
  - misleading_graph
  - uncontrolled_experiment_without_purpose
  - target_iq_inflated_by_arithmetic
  - target_iq_inflated_by_obscure_memorization
  - decorative_context_only
  - distractor_requires_out_of_scope_fact
```

---

# 28. IQ Yükseltme / Düşürme Operatörleri

## Gerçek IQ yükseltme

- Tek temsil → makro + tanecik.
- Makro + tanecik → makro + tanecik + sembolik.
- Doğrudan formül → modeli seçtir.
- Tek oran → sınırlayıcı bileşen / ikinci kısıt.
- Tek grafik → grafik + mekanizma.
- Direkt denge sorusu → Q/K + değişiklik + doğrulama.
- Direkt pH → tür / kuvvet / denge ile birleştir.
- Basit hücre → potansiyel + yön + derişim etkisi.
- Basit yapı adı → yapı + hibritleşme + izomer kısıtı.
- Sonuç → atom / yük / mol bilançosuyla doğrulama.
- Tek açıklama → alternatif açıklamalardan seçim.

## IQ düşürme

- Ara sonucu hazır ver.
- Denklem / oranı hazır ver.
- Örtük koşulu açıklaştır.
- Temsil sayısını azalt.
- İkinci kimya ilkesini kaldır.
- Gereksiz veriyi kaldır.
- Alternatif modelleri azalt.
- Doğrudan tanecik sayısını ver.

---

# 29. Aynı Kazanımdan Farklı IQ — Stokiyometri

## IQ75
Dengelenmiş denklemde katsayı oranını okuma.

## IQ125
Verilen molden ürün molünü bulma.

## IQ175
Kütle verisinden mol → oran → ürün kütlesi.

## IQ200
İki reaktif miktarından sınırlayıcı bileşeni seçip ürün miktarını bulma.

## IQ250
Reaksiyon öncesi ve sonrası tanecik / kütle verilerinden sınırlayıcı bileşeni, artan miktarı ve bilinmeyen bileşiğin oranını birlikte çıkarma; sonucu atom korunumu ile doğrulama.

## IQ300
Makroskobik ölçüm + tanecik modeli + denklem kısıtlarından alternatif reaksiyon modellerini eleme ve tek uyumlu modeli belirleme.

---

# 30. Aynı Kazanımdan Farklı IQ — Denge

## IQ75
Denge kavramının temel özelliğini tanıma.

## IQ125
Denge sabiti ifadesini yazma.

## IQ175
K / Q verilince tepkimenin hangi yöne ilerleyeceğini belirleme.

## IQ200
Denge derişimleri / başlangıç verilerinden eksik türü belirleyip K ile ilişkilendirme.

## IQ250
Denge karışımına yapılan değişiklik sonrası Q/K, Le Chatelier ve tür derişimlerini birlikte değerlendirme; hangi ifadelerin zorunlu olduğunu ayırma.

## IQ300
Birden fazla deney koşulundaki denge verilerinden tepkimenin enerji karakteri ve olası denge modelini çıkarıp ikinci veri setiyle doğrulama.

---

# 31. Aynı Kazanımdan Farklı IQ — Elektrokimya

## IQ75
Yükseltgenme / indirgenmeyi tanıma.

## IQ125
Standart potansiyellerden anot / katodu seçme.

## IQ175
Hücre potansiyelini hesaplama ve elektron yönünü belirleme.

## IQ200
Hücre şeması + potansiyel verisi + iyon hareketini birlikte yorumlama.

## IQ250
Derişim değişikliği / elektrot değişimi gibi bir müdahalenin hücre potansiyeli, elektron akışı ve iyon dengesine etkisini çoklu koşulla değerlendirme.

---

# 32. Psikometrik Kullanım Notu

Teorik IQ etiketi gerçek öğrenci zekâ puanı değildir ve doğrudan madde güçlüğüne eşit değildir.

Pilot uygulamada:

- p-değeri,
- ayırt edicilik,
- madde-toplam korelasyonu,
- seçenek işlevselliği,
- yanıt süresi,
- gerekirse IRT parametreleri

ayrıca ölçülmelidir.

---

# 33. EVAL Sistemi

```yaml
CHEMISTRY_EVAL:
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

Uzman etiketleri:

- gerçek IQ,
- sınıf / TYT / AYT,
- tema / konu,
- öğrenme çıktısı,
- arketip,
- karar sayısı,
- temsil düzeyleri,
- kavram yanılgısı türleri,
- çözüm süresi,
- kimyasal doğruluk.

---

# 34. Önerilen Çıktı JSON'u

```json
{
  "subject": "kimya",
  "grade": 12,
  "exam_profile": "AYT",
  "curriculum_profile": "HYBRID_TRANSITION",
  "theme": "ETKILESIM",
  "topic": "ELEKTROKIMYA",
  "target_iq": 250,
  "audited_iq": 250,
  "archetype": ["electrochemistry", "diagram", "data"],
  "cognitive_decisions": 6,
  "representations": ["text", "cell_diagram", "symbolic"],
  "skills": [
    "redox_modeling",
    "potential_comparison",
    "direction_reasoning",
    "validation"
  ],
  "distractor_errors": [
    "anode_cathode_confusion",
    "electron_ion_flow_confusion",
    "potential_sign_error"
  ],
  "curriculum_check": "PASS",
  "chemistry_check": "PASS",
  "single_answer_check": "PASS",
  "iq_audit": "PASS",
  "final_lock": "PASS"
}
```

---

# 35. Araştırma Dayanağı

Bu standardın hazırlanmasında soru metinleri kopyalanmadan **program yapısı ve soru DNA'sı** incelenmiştir:

1. MENAR / MAYS — TYT–AYT IQ Bilişsel Zorluk Kalibrasyon Standardı v3.
2. T.C. Millî Eğitim Bakanlığı — Türkiye Yüzyılı Maarif Modeli Kimya Dersi Öğretim Programı (9–12).
3. TYMM 9. sınıf Kimya — Etkileşim, Çeşitlilik, Sürdürülebilirlik.
4. TYMM 10. sınıf Kimya — Etkileşim, Çeşitlilik, Sürdürülebilirlik.
5. TYMM 11. sınıf Kimya — Etkileşim, Çeşitlilik, Sürdürülebilirlik.
6. TYMM 12. sınıf Kimya — Etkileşim, Çeşitlilik, Sürdürülebilirlik.
7. MEB / TYMM bağlam temelli çoktan seçmeli soru yaklaşımı.
8. OGM Materyal kimya soru bankaları ve 3 Adım TYT/AYT kaynakları.
9. ÖSYM 2025 YKS TYT / AYT temel soru kitapçıkları.
10. ÖSYM 2026 YKS TYT / AYT temel soru kitapçıkları.

---

# 36. Nihai Kural

> **Kimyada IQ seviyesini işlem uzunluğu veya ezberlenen bileşik sayısı değil; öğrencinin makroskobik, tanecik ve sembolik düzeyler arasında kurduğu doğru kimyasal model ve verdiği bağımsız kararlar belirler.**

**IQ250 bir kimya sorusu daha fazla hesap yaptırmak zorunda değildir.**  
Öğrenciye doğru modeli seçtirir, temsilleri dönüştürtür, veriyi eleyip koşulları birleştirtir ve sonucu atom/yük/mol/denge gibi bağımsız bir kimyasal kısıtla doğrulatır.
