# MENAR / MAYS — Biyoloji IQ Bilişsel Zorluk Kalibrasyon Standardı

**Sürüm:** v1.0 — Biyolojiye Özel  
**Kapsam:** 9, 10, 11, 12. sınıf • TYT • AYT • Türkiye Yüzyılı Maarif Modeli • soru bankası / deneme üretimi  
**Ölçek:** 13 kademe — IQ50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350  
**Ana çapa noktaları:** **IQ75 = KOLAY** • **IQ200 = ORTA / GENEL AĞIRLIK** • **IQ250 = ZOR / DERECE-SEÇİCİ**

> **Önemli:** Bu dosyadaki “IQ”, gerçek insan zekâ puanı değildir. MENAR/MAYS içinde bir biyoloji sorusunun gerektirdiği **bilişsel yükü, bağımsız karar sayısını, biyolojik model kurma derinliğini, veri/kanıt kullanımını, temsil dönüşümünü ve stratejik muhakemeyi** ifade eden kurum içi bir zorluk indeksidir.

---

# 1. Amaç

Bu standart, biyoloji soru üretim uygulamasında aynı kazanımdan farklı bilişsel seviyelerde fakat **müfredat içinde**, bilimsel olarak doğru ve sınav gerçekliğine uygun sorular üretebilmek için kullanılır.

Temel hedefler:

1. 9–12. sınıf biyoloji sorularını aynı IQ ölçeğinde kalibre etmek.
2. TYT ve AYT için farklı soru DNA'larını ayırmak.
3. Türkiye Yüzyılı Maarif Modeli'nin beceri odaklı yapısını soru üretimine taşımak.
4. “Ezber ayrıntısı = zor soru” hatasını engellemek.
5. Grafik, tablo, deney, soy ağacı, hücresel model, sistem şeması ve ekolojik ağ gibi biyolojiye özgü temsilleri işlevsel kullanmak.
6. Yapay zorluk yerine gerçek biyolojik muhakeme üretmek.
7. Üretilen sorunun hedef IQ seviyesini bağımsız çözüm ve **BIO_IQ_AUDIT** ile doğrulamak.

---

# 2. Kaynak Profili ve Müfredat Sürümleme Kuralı

Biyoloji üretim motoru içerik kapsamı ile soru zorluğunu birbirinden ayırmalıdır.

## 2.1. Zorunlu içerik profili alanı

Her soru aşağıdaki profillerden biriyle üretilmelidir:

```yaml
curriculum_profile:
  - TYMM_2026
  - YKS_2026
  - LEGACY_MEB
  - HYBRID_TRANSITION
```

### TYMM_2026
Türkiye Yüzyılı Maarif Modeli Biyoloji Dersi 9–12 öğretim programında tanımlanan tema, öğrenme çıktısı, süreç bileşeni ve içerik çerçevesi esas alınır.

### YKS_2026
2026 YKS'nin fiilî kapsamı ve ÖSYM soru karakteri esas alınır. TYMM içeriğiyle otomatik olarak eşit kabul edilmez.

### LEGACY_MEB
Kademeli geçiş nedeniyle hâlen önceki öğretim programına göre okutulan sınıf/öğrenci grupları için kullanılır.

### HYBRID_TRANSITION
Yeni programın beceri yaklaşımı ile mevcut YKS içerik kapsamının birlikte hedeflendiği soru bankası / hazırlık ürünlerinde kullanılır.

## 2.2. Kritik geçiş notu

Türkiye Yüzyılı Maarif Modeli kademeli uygulanmaktadır. Bu nedenle uygulama, “MEB sitesinde 11–12. sınıf TYMM programı yayımlanmış olması” ile “o yıl YKS'ye giren adayların tamamının bu programdan sorumlu olması”nı aynı şey kabul etmemelidir.

**Üretim kuralı:**

```text
ÖNCE sınav/müfredat profili seçilir
→ SONRA öğrenme çıktısı seçilir
→ EN SON hedef IQ uygulanır.
```

IQ seviyesi hiçbir zaman müfredat kapsamını belirlemez.

---

# 3. Türkiye Yüzyılı Maarif Modeli — Biyoloji Becerisel Omurgası

TYMM biyoloji programında yalnız bilgi hatırlama değil; bilimsel gözlem, deney, çıkarım, model oluşturma, sınıflandırma, hipotez kurma, kanıt kullanma, tümevarımsal akıl yürütme, problem çözme ve eleştirel düşünme gibi beceriler doğrudan hedeflenmektedir.

Bu nedenle MENAR biyoloji IQ sistemi aşağıdaki eksenleri temel alır.

## 3.1. Biyolojiye özgü ana bilişsel eksenler

1. **Kavramı tanıma**
2. **Yapı–görev ilişkisi kurma**
3. **Sınıflandırma ölçütü seçme**
4. **Biyolojik neden–sonuç zinciri kurma**
5. **Molekül → organel → hücre → doku → organ → sistem → organizma → popülasyon → ekosistem düzeyleri arasında geçiş**
6. **Grafik / tablo / görsel / şema okuma**
7. **Biyolojik modeli yorumlama**
8. **Temsil dönüşümü**
9. **Deney değişkenlerini ayırma**
10. **Kontrol grubu ve karşılaştırma mantığı**
11. **Veriden bilimsel çıkarım yapma**
12. **Hipotez kurma veya hipotezi test etme**
13. **Kanıtın iddiayı destekleyip desteklemediğini değerlendirme**
14. **Örtük biyolojik koşulu fark etme**
15. **Genellemenin kapsamını denetleme**
16. **İstisna / sınır durum fark etme**
17. **Geri bildirim mekanizması çözümleme**
18. **Genetik olasılık ve kalıtım ilişkilerini modelleme**
19. **Birden çok sistem veya süreç arasındaki eş güdümü değerlendirme**
20. **Yeni bağlama biyolojik bilgiyi transfer etme**

---

# 4. Sınıf Bazlı Tema Haritası

Bu bölüm konu listesinden çok, IQ üretiminde hangi tür bilişsel işlemlerin doğal olduğunu belirtir.

## 4.1. 9. Sınıf

### Tema 1 — YAŞAM

Ana içerik ekseni:

- Biyoloji bilimi ve dönüm noktaları
- Bilimin doğası
- Bilimsel araştırma süreçleri
- Bilim etiği
- Canlıların ortak özellikleri
- İnorganik moleküller
- Organik moleküller
- Enzimler
- Besin içeriklerinin belirlenmesi
- pH / sıcaklık ve enzim aktivitesi

Doğal soru becerileri:

- bilgi kaynağını değerlendirme,
- bilimsel çıkarım,
- canlılık ölçütlerini yorumlama,
- molekül özelliklerini karşılaştırma,
- deney düzeneğini çözümleme,
- bağımsız / bağımlı / kontrol değişkenini ayırma,
- sonuç grafiğini yorumlama,
- bilim etiği senaryosunu değerlendirme.

### Tema 2 — ORGANİZASYON

Ana içerik ekseni:

- Hücre alt birimleri
- Organel–işlev ilişkileri
- Hücre zarından madde geçişleri
- Hücresel organizasyon
- Canlıların sınıflandırılması
- Üç domain yaklaşımı
- Biyoçeşitlilik

Doğal soru becerileri:

- yapı–görev çözümlemesi,
- hücre tiplerini karşılaştırma,
- madde geçişini sınıflandırma,
- deney verisini yorumlama,
- gözlemden sınıflandırma ölçütü üretme,
- özellik tablosundan canlı grubunu çıkarma,
- biyoçeşitlilik verisinden çıkarım.

---

## 4.2. 10. Sınıf

### Tema 1 — ENERJİ

Ana içerik ekseni:

- ATP ve enerji aktarımı
- Fotosentez
- Kemosentez
- Hücresel solunum
- Fermantasyon
- Besinlerden enerji eldesi
- Sindirim, emilim ve taşıma
- Metabolik süreçler

Doğal soru becerileri:

- süreç sırası,
- madde / enerji ayrımı,
- reaksiyon konumlarını eşleme,
- fotosentez / solunum modellerini yorumlama,
- çevresel değişkenlerin süreç hızına etkisini değerlendirme,
- deney sonucu grafiği,
- farklı enerji elde etme yollarını karşılaştırma.

### Tema 2 — EKOLOJİ

Ana içerik ekseni:

- Ekosistem bileşenleri
- Tür içi / türler arası etkileşim
- Besin zinciri ve besin ağı
- Enerji akışı
- Madde döngüleri
- Ekolojik sürdürülebilirlik
- Atık yönetimi
- Ekolojik ayak izi
- Biyoçeşitliliğin korunması

Doğal soru becerileri:

- ağ / ilişki modeli çözümleme,
- trofik düzey çıkarımı,
- değişkenlerin popülasyona etkisini tahmin etme,
- enerji ve madde akışını ayırma,
- ekolojik veri tablosunu değerlendirme,
- sürdürülebilirlik çözümü seçme,
- gözleme dayalı tahmin.

---

## 4.3. 11. Sınıf

### Tema 1 — TEPKİ

Ana içerik ekseni:

- Canlıların uyaranlara tepkileri
- Bitkilerde tepki ve hareket
- Hayvanlarda tepki mekanizmaları
- Sinir sistemi
- Refleks
- Bağışıklık
- Alerji

Doğal soru becerileri:

- uyarı → reseptör → kontrol → efektör zinciri,
- sinirsel süreç sırası,
- bitki / hayvan tepki mekanizmalarını karşılaştırma,
- deneysel gözlem,
- bağışıklık senaryosu yorumlama,
- farklı canlılardan genelleme yapma.

### Tema 2 — HOMEOSTAZİ

Ana içerik ekseni:

- Homeostazi
- Pozitif / negatif geri bildirim
- Sinir–endokrin eş güdümü
- Dolaşım
- Solunum
- Boşaltım
- Sistemler arası koordinasyon
- Homeostazinin bozulması ve sağlık problemleri

Doğal soru becerileri:

- çoklu sistem ilişkisi,
- geri bildirim döngüsü,
- değişken artarsa/azalırsa zincirleme etki,
- kanıt temelli hipotez,
- sistemler arası eş güdüm,
- yapı–işlev–sonuç bağlantısı,
- patolojik durumdan mekanizma çıkarımı.

---

## 4.4. 12. Sınıf

### Tema 1 — ÜREME

Ana içerik ekseni:

- Üremenin canlılar için önemi
- Eşeyli / eşeysiz üreme
- Hücre döngüsü
- Mitoz / mayoz
- Üreme hücrelerinin oluşumu
- Bitkilerde üreme
- Çimlenme

Doğal soru becerileri:

- kromozom / DNA miktarı izleme,
- evre / süreç sıralama,
- hücre tipleri arasında karşılaştırma,
- üreme stratejilerini yorumlama,
- grafik ve şema analizi,
- çimlenme deneyi ve değişken kontrolü.

### Tema 2 — GEN

Ana içerik ekseni:

- Nükleik asitler
- DNA replikasyonu
- Gen ifadesi
- Protein sentezi
- Genetik değişiklikler
- Kalıtım
- Eş baskınlık
- Çok alellilik
- Eşeye bağlı kalıtım
- Biyoteknoloji
- Biyoteknoloji etiği

Doğal soru becerileri:

- DNA / RNA yapı karşılaştırması,
- replikasyon modeli,
- DNA → RNA → protein bilgi akışı,
- moleküler model çözümleme,
- soy ağacı,
- çaprazlama,
- olasılık,
- çok kuşaklı kalıtım,
- genotip–fenotip ayrımı,
- biyoteknolojik uygulama / etik kanıt değerlendirmesi.

---

# 5. Nihai 13 Kademeli Biyoloji IQ Skalası

## IQ50 — KOLAY / TABAN

**Bilişsel eksen:** Hatırlama → doğrudan tanıma

**Soru DNA'sı:**

- Tek bir temel biyoloji bilgisi.
- Tek kavram / tek yapı / tek görev.
- Stratejik karar yok.
- Veri eleme yok.
- Görsel varsa yalnız tanıma amacıyla kullanılır.
- Seçenekler temel kavram yanılgılarından oluşabilir.

**Uygun örnek iskeletleri:**

- Bir organelin temel görevi.
- Bir molekülün sınıfı.
- Bir sistemin temel yapısı.
- Bir terimin tanımı.

**IQ yükseltmeyen şey:** Latince ad, uzun terim veya nadir ezber bilgisi eklemek.

---

## IQ75 — KOLAY [ALT ÇAPA]

**Bilişsel eksen:** Anlama / temel uygulama

**Soru DNA'sı:**

- IQ50 + bir kısa ilişkilendirme.
- 1 küçük karar.
- Bir özellikten yapı / grup / süreç çıkarımı.
- Basit görsel eşleme olabilir.
- Öğrenci yöntemi hemen görür.

**Örnek DNA:**

```text
özellik ver → uygun yapı/grubu tanı → seç
```

---

## IQ100 — KOLAY-ORTA

**Bilişsel eksen:** Uygulama

**Soru DNA'sı:**

- 2–3 bilgi parçasından gerekli olanı seçme.
- Temel karşılaştırma.
- Basit neden–sonuç.
- Basit tablo / şema.
- Bir kavramın yeni ama yakın bir örneğe uygulanması.

**Biyoloji örnekleri:**

- İki hücre tipini verilen özelliklere göre karşılaştırma.
- Basit besin zincirinde üreticiyi / tüketiciyi belirleme.
- Bir deneyde bağımlı değişkeni ayırt etme.

---

## IQ125 — ALT-ORTA

**Bilişsel eksen:** Uygulama → analiz

**Soru DNA'sı:**

- 2–3 bilişsel adım.
- İki temel biyolojik ilişki ardışık kullanılır.
- Basit grafik / tablo / hücre şeması okunur.
- Ara sonuç oluşturulur.
- Sonuç doğrudan tek cümlelik bilgiyle bulunamaz.

**Örnek DNA:**

```text
veriyi oku
→ ilgili biyolojik ilkeyi seç
→ kısa çıkarım yap
→ seçeneği doğrula
```

---

## IQ150 — ORTA-ALT

**Bilişsel eksen:** Analiz

**Soru DNA'sı:**

- Veri seçme.
- 2–3 anlamlı muhakeme kararı.
- Temel biyolojik model kurma.
- Deney / grafik / süreç şemasından çıkarım.
- Yeni nesil soru yapısının başlangıcı.

**Tipik yapılar:**

- enzim grafiği,
- hücre zarından madde geçişi,
- ekolojik tablo,
- kromozom / DNA miktarı grafiği,
- basit geri bildirim şeması.

---

## IQ175 — ORTA

**Bilişsel eksen:** Analiz → sentez

**Soru DNA'sı:**

- Yöntem doğrudan verilmez.
- Hangi biyolojik ilişkinin kullanılacağını öğrenci belirler.
- İki süreç aynı anda izlenebilir.
- Bir temsilin doğru yorumlanması tek başına yetmez; ikinci bir kavram gerekir.
- Çeldiriciler gerçek kavram yanılgılarından doğar.

**Örnek DNA:**

```text
verilen durumun biyolojik düzeyini belirle
→ uygun mekanizmayı seç
→ ikinci ilişkiyle birleştir
→ sonucu kontrol et
```

---

## IQ200 — ORTA / GENEL AĞIRLIK / OMURGA [ANA ÇAPA]

**Bilişsel eksen:** Analiz – sentez – değerlendirme

**Biyoloji için ana üretim seviyesi.**

**Zorunlu DNA:**

- Yaklaşık 3–5 anlamlı bilişsel karar.
- En az iki farklı işlem türü:
  - veri seçme,
  - mekanizma kurma,
  - temsil okuma,
  - neden–sonuç zinciri,
  - sistemler arası ilişki,
  - deney yorumu,
  - modelleme.
- Soru sadece “bilgiyi biliyor musun?” diye ölçmez.
- Bağlam veya görsel varsa çözümde işlevseldir.
- Öğrenci bir ara sonuç üretmeden doğru cevaba güvenle ulaşamaz.

**Tipik biyoloji yapıları:**

- deney verisi + enzim / fotosentez / fermantasyon çıkarımı,
- DNA miktarı grafiği + bölünme türü,
- ekolojik ilişki + trofik düzey,
- homeostazi değişkeni + geri bildirim,
- soy ağacı + olası kalıtım biçimi,
- sistem şeması + yapı–görev–sonuç ilişkisi.

---

## IQ225 — ORTA-ZOR / SEÇİCİYE GEÇİŞ

**Bilişsel eksen:** Değerlendirme

**Soru DNA'sı:**

IQ200'e ek olarak en az biri:

- örtük koşul,
- gizli kısıt,
- temsil dönüşümü,
- neden–sonuç yönünü tersine izleme,
- ilk hipotezi kontrol etme,
- bir seçeneği ikinci kanıtla eleme,
- “olabilir / olamaz / kesin / beklenir” ayrımı.

**Çeldiriciler:**

- yarı doğru genelleme,
- doğru mekanizmanın yanlış basamağa uygulanması,
- yapı–görev eşleşmesinin ters kurulması,
- gerekli koşul ile yeterli koşulun karıştırılması.

---

## IQ250 — ZOR / DERECE-SEÇİCİ [ÜST ÇAPA]

**Bilişsel eksen:** Değerlendirme → yaratma sınırı

**Zorunlu DNA:**

- Çoklu koşul.
- Yaklaşık 5–6 gerçek karar.
- Güçlü veri eleme.
- En az iki biyolojik düzey veya süreç arasında ilişki.
- Strateji seçimi.
- Sonucun en az bir ek koşulla doğrulanması.
- Çözüm yolu doğrudan verilmez.

**Tipik biyoloji yapıları:**

- çok değişkenli deney,
- birden fazla sistemin homeostatik eş güdümü,
- soy ağacı + fenotip + olasılık,
- metabolik süreç + hücresel konum + madde/enerji dönüşümü,
- besin ağı + popülasyon değişimi + biyobirikim,
- moleküler biyoloji şeması + enzim / yön / ürün çıkarımı.

---

## IQ275 — ÇOK ZOR

**Bilişsel eksen:** Yaratma

**Soru DNA'sı:**

- Birden fazla biyolojik model birlikte yönetilir.
- Alternatif açıklamalar değerlendirilir.
- İlk görünen açıklama yeterli değildir.
- Tersine akıl yürütme bulunur.
- Bir deney sonucundan mekanizma veya başlangıç koşulu çıkarılabilir.
- Yeni bağlam transferi güçlüdür.

**Örnek DNA:**

```text
gözlenen sonucu analiz et
→ olası 2+ mekanizma üret
→ verilerle mekanizmaları ele
→ kalan modeli başka koşulla doğrula
```

---

## IQ300 — ÜST SEÇİCİ

**Bilişsel eksen:** Yaratma + üst-biliş

**Minimum karakteristik:**

- Yaklaşık 6 veya daha fazla bağlı bilişsel karar.
- Gerektiğinde 3 işlevsel temsil:
  - metin + grafik + şema,
  - tablo + soy ağacı + genetik model,
  - deney düzeneği + veri + süreç modeli.
- Strateji seçimi.
- Ara sonuç yorumlama.
- Varsayım / koşul test etme.
- Bağımsız doğrulama.

**Kural:** Üç temsil sırf zor görünmesi için eklenmez; her biri çözümde işlevsel olmalıdır.

---

## IQ325 — İLERİ ÜST SEÇİCİ

**Bilişsel eksen:** Uzman düzeyi yaratma

**Soru DNA'sı:**

- Çoklu model arasında seçim.
- Bir varsayımın geçerlilik sınırını test etme.
- Çözüm sırasında strateji değiştirme.
- Güçlü tersine muhakeme.
- Biyolojik organizasyon düzeyleri arasında ileri transfer.
- Genelleme başlangıcı.

**Normal TYT–AYT soru havuzunda istisnaidir.**

Müfredat dışı terim kullanmak zorunlu değildir.

---

## IQ350 — BİLİŞSEL ZİRVE / TEORİK TAVAN

**Bilişsel eksen:** Yaratma + genelleme + kanıt

**Minimum karakteristik:**

- Yaklaşık 8 veya daha fazla bağlı muhakeme işlemi.
- Çoklu model / temsil.
- Alternatif hipotezler.
- Varsayım testi.
- Strateji karşılaştırma.
- Tersine akıl yürütme.
- Genelleme.
- Kanıt temelli doğrulama.
- Güçlü uzak transfer.

**Kritik kural:** IQ350 = üniversite biyolojisi veya olimpiyat biyolojisi demek değildir. Soru hâlâ hedef müfredat içinde kalabilir; zorluk içerik yabancılığından değil muhakeme mimarisinden gelir.

---

# 6. BIO_IQ_AUDIT — Biyolojiye Özgü Zorluk Denetimi

Her soru bağımsız çözüldükten sonra aşağıdaki ölçütler işaretlenir.

| Ölçüt | Denetim sorusu |
|---|---|
| Bağımsız karar | Öğrenci hangi biyolojik ilkeyi kullanacağına kendisi karar veriyor mu? |
| Veri seçme | Verilen bilgilerden hangisinin gerekli olduğunu ayırması gerekiyor mu? |
| Biyolojik düzey geçişi | Molekül–hücre–organ–sistem–organizma–ekosistem arasında geçiş gerekiyor mu? |
| Yapı–görev ilişkisi | Bir yapının özelliğinden işlev veya işlevden yapı çıkarılıyor mu? |
| Neden–sonuç zinciri | Bir değişikliğin doğrudan değil, zincirleme biyolojik etkisi izleniyor mu? |
| Süreç sırası | Olayların doğru biyolojik sırası kuruluyor mu? |
| Sınıflandırma | Ezber grup adı yerine ölçüt seçimi gerekiyor mu? |
| Grafik / tablo | Temsilden veri okumak çözüm için zorunlu mu? |
| Görsel model | Şemadaki ilişkiler gerçekten çözüme katılıyor mu? |
| Temsil dönüşümü | Metin ↔ grafik ↔ tablo ↔ şema ↔ biyolojik model dönüşümü var mı? |
| Deney değişkeni | Bağımsız, bağımlı ve kontrol değişkenleri ayrılıyor mu? |
| Kontrol grubu | Deney sonucu uygun karşılaştırmayla yorumlanıyor mu? |
| Kanıt kullanma | İddia, doğrudan verilen kanıtla test ediliyor mu? |
| Hipotez | Veriden olası açıklama üretme veya hipotezi eleme gerekiyor mu? |
| Örtük koşul | Söylenmeyen ama çözüm için zorunlu bir biyolojik koşul var mı? |
| Tersine düşünme | Sonuçtan mekanizmaya / başlangıç koşuluna gidiliyor mu? |
| Strateji seçimi | Birden fazla çözüm yaklaşımından uygun olan seçiliyor mu? |
| Sınır / istisna | “Her zaman, yalnızca, tüm, kesinlikle” gibi genellemelerin kapsamı test ediliyor mu? |
| Doğrulama | Sonuç ikinci bir biyolojik koşulla kontrol ediliyor mu? |
| Genelleme | Birden çok örnekten genel biyolojik sonuç çıkarılıyor mu? |
| Sistem eş güdümü | İki veya daha fazla organ/sistem birlikte takip ediliyor mu? |
| Geri bildirim | Pozitif/negatif geri bildirim döngüsü izleniyor mu? |
| Genetik model | Genotip, fenotip, kuşak, kromozom veya olasılık birlikte modelleniyor mu? |
| Transfer | Bilgi öğrencinin görmediği ama müfredat içinde olan yeni bağlama uygulanıyor mu? |

---

# 7. Karar Sayısı Nasıl Sayılır?

Mekanik okumalar “karar” sayılmaz.

## Karar sayılmayanlar

- soru kökünü okumak,
- seçenekleri sırayla kontrol etmek,
- tek tanımı hatırlamak,
- şeklin üzerinde açıkça yazan etiketi okumak,
- ezberlenmiş bir formülü / kuralı aynen uygulamak.

## Gerçek bilişsel karar örnekleri

- Hangi verinin gerekli olduğunu seçmek.
- Grafikteki değişimin hangi biyolojik mekanizmaya karşılık geldiğini belirlemek.
- Bir hücrenin prokaryot / ökaryot olduğuna hangi özelliğin kanıt olduğunu belirlemek.
- Deneyde hangi değişkenin sabit tutulması gerektiğine karar vermek.
- Soy ağacında hangi kalıtım modellerinin mümkün olduğunu elemek.
- Bir hormon değişiminin hangi organ sistemlerini zincirleme etkileyeceğini izlemek.
- Besin ağında bir tür azalmasının dolaylı etkisini tahmin etmek.
- DNA miktarı grafiğinin mitoz mu mayoz mu olduğunu belirlemek ve ardından evre çıkarımı yapmak.

---

# 8. IQ Seviyesini Tek Başına Yükseltmeyen Unsurlar

Aşağıdakiler **zorluk görünümü** yaratabilir fakat gerçek IQ artışı sayılmaz:

- Çok uzun paragraf.
- Bilinmeyen canlı türü adı kullanmak.
- Latince takson adı eklemek.
- Nadir sağlık / hastalık bilgisi sormak.
- Çok sayıda organel adı vermek.
- Şemaya gereksiz etiket eklemek.
- Seçenekleri aşırı uzun yapmak.
- Görseli kalabalıklaştırmak.
- Çok fazla sayı vermek.
- Uzun hesaplama yaptırmak.
- Genetik soruda gereksiz büyük örneklem sayıları kullanmak.
- Ezberlenmesi güç istisna istemek.
- Müfredat dışı molekül / enzim / hormon adı eklemek.
- Metni bilimsel makale gibi ağırlaştırmak.
- Aynı bilgiyi hem tabloda hem metinde tekrar etmek.
- Bağlamı çözümde kullanmadan yalnız “yeni nesil” görünümü vermek.
- Yanlış seçeneği dil oyunuyla gizlemek.
- “Hangisi değildir?” kökünü arka arkaya kullanmak.
- Sadece seçenekleri birbirine çok benzetmek.

---

# 9. Bağlam Temelli Biyoloji Sorusu Standardı

Bağlam yalnız dekor değildir.

## 9.1. İşlevsel bağlam kuralı

Bir bağlam aşağıdakilerden en az birini sağlamalıdır:

- gerekli veri sunmak,
- biyolojik mekanizmayı gerçek duruma taşımak,
- öğrenciyi karar vermeye zorlamak,
- deney / gözlem sonucu sağlamak,
- grafik veya tabloyu anlamlandırmak,
- iddia–kanıt ilişkisi kurmak.

Bağlam kaldırıldığında soru aynı şekilde çözülebiliyorsa bağlam büyük olasılıkla işlevsizdir.

## 9.2. Uygun biyoloji bağlamları

- laboratuvar gözlemi,
- sağlık verisi,
- beslenme etiketi,
- çevre kirliliği,
- ekosistem izleme,
- tarım / çimlenme,
- enzim deneyi,
- mikroskop gözlemi,
- aile soy ağacı,
- popülasyon verisi,
- bitki büyüme deneyi,
- ışık / sıcaklık / pH değişimi,
- biyoteknolojik uygulama,
- bilim etiği örnek olayı.

## 9.3. Bağlam güvenliği

Tıbbi bağlam kullanıldığında soru tanı veya tedavi tavsiyesi üretmemeli; yalnız müfredattaki biyolojik mekanizmayı ölçmelidir.

---

# 10. Görsel / Grafik / Şema Kullanım Standardı

## IQ50–100

- Görsel opsiyoneldir.
- Tek yapı veya çok basit şema.
- Görsel çoğunlukla tanıma / temel eşleme içindir.

## IQ125–175

- Basit grafik, tablo, hücre şeması veya süreç diyagramı kullanılabilir.
- En az bir veri çözümde kullanılmalıdır.
- Etiketler cevabı doğrudan vermemelidir.

## IQ200–250

- Görsel çoğu soru tipinde bilişsel işlev taşımalıdır.
- Öğrenci görselden ara sonuç üretmelidir.
- Şema → mekanizma veya grafik → biyolojik çıkarım yapılmalıdır.
- Gereksiz dekoratif görsel kullanılmaz.

## IQ275–350

- Birden fazla temsil kullanılabilir.
- Fakat her temsil ayrı bilgi taşımalıdır.
- Aynı verinin farklı görünümü zorluk kabul edilmez.
- Okunabilirlik hiçbir IQ seviyesinde düşürülmez.

---

# 11. Biyoloji Soru Arketipleri

## A. Kavram / özellik arketipi

**Doğal bant:** IQ50–150

Kullanım:

- organel,
- molekül,
- canlıların ortak özellikleri,
- sınıflandırma,
- sistem işlevi.

IQ yükseltmek için ezber ayrıntısı değil, özellikler arası ilişki eklenir.

---

## B. Yapı–görev arketipi

**Doğal bant:** IQ75–225

```text
yapısal özellik
→ fonksiyon
→ biyolojik sonuç
```

Örnek alanlar:

- hücre zarı,
- organeller,
- nefron,
- kalp,
- sinir sistemi,
- kloroplast,
- bitki iletim dokuları.

---

## C. Deney arketipi

**Doğal bant:** IQ100–300

Bilişsel bileşenler:

- hipotez,
- bağımsız değişken,
- bağımlı değişken,
- kontrol değişkeni,
- kontrol grubu,
- veri,
- sonuç,
- hata kaynağı,
- genellenebilirlik.

IQ250+ için deneyde en az iki olası açıklamanın ayrıştırılması tercih edilir.

---

## D. Grafik / tablo arketipi

**Doğal bant:** IQ100–300

Örnek:

- enzim aktivitesi,
- fotosentez hızı,
- popülasyon yoğunluğu,
- DNA miktarı,
- hormon düzeyi,
- solunum / metabolizma verisi,
- ekolojik veri.

Grafik yalnız değer okutuyorsa IQ yükselmez.

---

## E. Süreç / mekanizma arketipi

**Doğal bant:** IQ125–300

Örnek:

- madde geçişi,
- sinir iletimi,
- homeostazi,
- fotosentez,
- solunum,
- replikasyon,
- protein sentezi,
- üreme hücrelerinin oluşumu.

---

## F. Soy ağacı / kalıtım arketipi

**Doğal bant:** IQ125–325

IQ artış kaynakları:

- birden çok olası kalıtım modeli,
- fenotipten genotip çıkarımı,
- kuşaklar arası kısıt,
- eşeye bağlılık,
- çok alellilik,
- olasılık + soy ağacı entegrasyonu.

Yalnız standart monohibrit çaprazlama otomatik olarak yüksek IQ değildir.

---

## G. Ekolojik ağ arketipi

**Doğal bant:** IQ125–300

IQ artış kaynakları:

- doğrudan + dolaylı etki,
- bir türün çıkarılması,
- trofik düzey,
- enerji akışı,
- biyobirikim,
- türler arası etkileşim,
- birden çok popülasyonun eş zamanlı değişimi.

---

## H. Homeostazi / sistem entegrasyonu arketipi

**Doğal bant:** IQ150–325

IQ artış kaynakları:

- sinir + endokrin,
- dolaşım + solunum,
- boşaltım + dolaşım,
- hormon + hedef organ,
- negatif / pozitif geri bildirim,
- bir değişkenin zincirleme etkisi.

---

## I. İddia–kanıt / bilimsel sorgulama arketipi

**Doğal bant:** IQ125–300

Özellikle TYMM için önemlidir.

```text
iddia
+ gözlem/veri
→ kanıtın yeterliliğini değerlendir
→ çıkarım yap
```

---

# 12. Çeldirici Üretim Standardı

Çeldirici “rastgele yanlış bilgi” olmamalıdır.

## 12.1. Tercih edilen doğal hata yolları

1. **Yapı–görev karışıklığı**
2. **Prokaryot–ökaryot özellik karışıklığı**
3. **Madde–enerji karışıklığı**
4. **Fotosentez–solunum süreçlerinin yer / ürün karışıklığı**
5. **Mitoz–mayoz evre karışıklığı**
6. **DNA miktarı–kromozom sayısı karışıklığı**
7. **Genotip–fenotip karışıklığı**
8. **Baskın–yaygın özellik karışıklığı**
9. **Aktif taşıma–pasif taşıma karışıklığı**
10. **Hormonun üretildiği yer–etki ettiği yer karışıklığı**
11. **Sinirsel–hormonal cevap hız / süre karışıklığı**
12. **Pozitif–negatif geri bildirim karışıklığı**
13. **Besin zincirinde enerji–madde döngüsü karışıklığı**
14. **Biyobirikim–biyolojik büyütme karışıklığı**
15. **Adaptasyon–modifikasyon / bireysel değişim karışıklığı**
16. **Kontrol grubu–deney grubu karışıklığı**
17. **Korelasyon–nedensellik karışıklığı**
18. **Gerekli koşul–yeterli koşul karışıklığı**
19. **“Bazı” bilgisini “tüm” olarak genelleme**
20. **Doğru mekanizmayı yanlış organizasyon düzeyinde uygulama**

## 12.2. Çeldirici kalite kuralı

Her yanlış seçeneğin arkasında tanımlanabilir bir öğrenci hata yolu bulunmalıdır.

```yaml
distractor:
  misconception_id: BIO_MIS_###
  error_type:
  why_plausible:
  why_wrong:
```

## 12.3. Yasak çeldiriciler

- anlamsız bilimsel kelime yığını,
- açık dilbilgisel ipucu,
- diğerlerinden belirgin uzun doğru seçenek,
- müfredat dışı ayrıntıyla eleme,
- tek bir kelime oyununa dayalı tuzak,
- tartışmalı / kaynaklara göre değişen bilimsel ifade.

---

# 13. TYT Biyoloji Üretim Standardı

2026 TYT Fen Bilimleri testinde biyoloji bölümü **6 soru** olarak gözlenmektedir. Bu sayı gelecekte değişebileceğinden uygulamada sabit kodlanmamalıdır.

2025–2026 ÖSYM örnekleri incelendiğinde TYT biyolojide şu soru DNA'ları birlikte görülmektedir:

- doğrudan fakat kavramsal bilgi,
- yapı–görev,
- hücresel özellikten sınıflandırma,
- hücre bölünmesi grafiği,
- soy ağacı,
- ekolojik veri / biyobirikim,
- günlük / sağlık bağlamında temel mekanizma,
- şema yorumlama.

## 13.1. TYT bilişsel karakteri

TYT biyoloji yalnız ezber değildir; fakat AYT kadar derin konu zinciri de beklenmemelidir.

**Önerilen merkez:** IQ150–200  
**Kolay çapa:** IQ75  
**Seçici üst bant:** IQ225–250  
**IQ275+:** soru bankasında çok sınırlı

## 13.2. TYT soru üretim havuzu önerisi

> Bunlar resmî ÖSYM yüzdeleri değil, MENAR üretim havuzu önerisidir.

| IQ bandı | TYT üretim ağırlığı |
|---|---:|
| IQ50–100 | %12 |
| IQ125–175 | %38 |
| IQ200–225 | %37 |
| IQ250 | %11 |
| IQ275+ | %2 |

## 13.3. TYT'de kaçınılacak yapı

- 11–12. sınıf ayrıntısını gerektiren derin uzmanlık,
- çok uzun biyokimyasal yolak,
- aşırı çok kuşaklı genetik,
- üniversite düzeyi terminoloji,
- yalnız ezberlenmiş istisna ile çözülen sorular.

---

# 14. AYT Biyoloji Üretim Standardı

2026 AYT Fen Bilimleri testinde biyoloji bölümü **13 soru** olarak gözlenmektedir. Bu sayı gelecekte değişebileceğinden uygulamada sabit kodlanmamalıdır.

2025–2026 AYT biyoloji örneklerinde şu yapılar belirgindir:

- insan fizyolojisi yapı–işlev,
- üreme hücrelerinin oluşumu,
- böbrek / nefron süreçleri,
- hormon ve geri bildirim mantığı,
- kalp ve dolaşım,
- popülasyon / komünite ilişkileri,
- DNA / RNA,
- replikasyon / genetik bilgi akışı,
- kloroplast / fotosentez,
- hücresel solunum,
- bitki fizyolojisi,
- şema ve grafik yorumlama.

## 14.1. AYT bilişsel karakteri

AYT'de konu bilgisi daha ayrıntılıdır fakat yüksek IQ yalnız bilgi yoğunluğundan gelmez.

**Önerilen merkez:** IQ175–225  
**Seçici bant:** IQ250–275  
**Üst seçici:** IQ300  
**IQ325–350:** istisnai üretim

## 14.2. AYT soru üretim havuzu önerisi

> Bunlar resmî ÖSYM yüzdeleri değil, MENAR üretim havuzu önerisidir.

| IQ bandı | AYT üretim ağırlığı |
|---|---:|
| IQ50–100 | %5 |
| IQ125–175 | %25 |
| IQ200–225 | %40 |
| IQ250–275 | %24 |
| IQ300 | %5 |
| IQ325–350 | %1 |

---

# 15. Sınıf Bazlı Önerilen Üretim Bantları

Bu değerler **tavan değildir**. Aynı 9. sınıf kazanımı müfredat dışına çıkmadan IQ300 düzeyinde tasarlanabilir.

| Hedef | Normal üretim merkezi | Seçici bant | İstisnai üst bant |
|---|---|---|---|
| 9. sınıf | IQ100–175 | IQ200–225 | IQ250–300 |
| 10. sınıf | IQ125–200 | IQ225–250 | IQ275–300 |
| 11. sınıf | IQ150–225 | IQ250–275 | IQ300–325 |
| 12. sınıf | IQ150–225 | IQ250–275 | IQ300–325 |
| TYT | IQ150–200 | IQ225–250 | IQ275 |
| AYT | IQ175–225 | IQ250–275 | IQ300–325 |

**Kural:** Sınıf arttıkça bilgi kapsamı artabilir; bu, tek başına IQ seviyesini artırmaz.

---

# 16. ÖSYM Stilinden Çıkarılan Üretim İlkeleri

## 16.1. Bilgi + yorum dengesi

Soru yalnız uzun olduğu için “ÖSYM tipi” değildir.

ÖSYM karakterine yaklaşmak için:

- temel bilgi doğru ve gerekli olmalı,
- soru kökü net olmalı,
- seçenekler aynı kavramsal düzlemde olmalı,
- bir görsel varsa işlevsel olmalı,
- çeldirici doğal öğrenci hatasına dayanmalı,
- gereksiz teknik ayrıntı olmamalı.

## 16.2. Kısa soru da zor olabilir

Özellikle AYT'de kısa bir kök;

- doğru mekanizmayı seçme,
- istisnayı fark etme,
- yapı–işlev ilişkisini kurma

gerektiriyorsa IQ225–250 olabilir.

## 16.3. Uzun soru da kolay olabilir

Uzun bağlamın içindeki tek cümle cevabı doğrudan veriyorsa soru IQ75–100'de kalabilir.

---

# 17. TYMM Bağlam Temelli Soru Kuralı

2026 MEB bağlam temelli soru yaklaşımı açısından MENAR üretim motorunda şu kontrol zorunlu olmalıdır:

```text
BAĞLAM VAR MI?
    ↓
Bağlam çözüm için gerekli mi?
    ├─ HAYIR → bağlamı kaldır veya yeniden tasarla
    └─ EVET
         ↓
Öğrenci bilgiyi yeni/otantik durumda kullanıyor mu?
    ├─ HAYIR → soru hâlâ ezber düzeyinde
    └─ EVET → beceri temelli yapı PASS
```

Bağlam biçimi şunlardan biri olabilir:

- metin,
- problem durumu,
- veri seti,
- görsel,
- deney,
- senaryo,
- tablo,
- grafik.

---

# 18. Bilimsel Doğruluk Standardı

Her biyoloji sorusu için:

1. Tek ve tartışmasız doğru cevap bulunmalıdır.
2. Biyolojik ifade hedef müfredat düzeyinde doğru olmalıdır.
3. Bilimsel genellemenin kapsamı doğru yazılmalıdır.
4. “Tüm canlılar”, “yalnız”, “daima”, “kesinlikle” ifadeleri özel olarak denetlenmelidir.
5. Sağlık bağlamlarında yanlış tıbbi çıkarım üretilmemelidir.
6. Ekoloji sorularında verilen ağ / veri gerçekçi olmalıdır.
7. Genetik sorularda soy ağacı ve genotip koşulları çelişmemelidir.
8. Deneyde bağımsız değişken dışında kontrolsüz fark bırakılmamalıdır; bırakılmışsa bunun soru amacı olması gerekir.
9. Grafik eksenleri, birimler ve eğilimler soru metniyle uyumlu olmalıdır.
10. Şemadaki ok yönleri biyolojik süreçle tutarlı olmalıdır.

---

# 19. Görsel Bilimsel Tutarlılık Kontrolü

Görsel üretim sistemine gönderilecek biyoloji sorularında ayrıca:

```yaml
visual_audit:
  labels_consistent: true
  arrows_biologically_correct: true
  scale_required: false
  decorative_only: false
  answer_leak: false
  ambiguous_structure: false
```

## Özel kontroller

### Hücre görseli
- organel konumları öğretim amacıyla şematize olabilir,
- fakat prokaryot / ökaryot ayrımını bozacak hata olmamalıdır.

### DNA / kromozom
- kromatit, kromozom, homolog çift ve DNA miktarı kavramları karıştırılmamalıdır.

### Soy ağacı
- cinsiyet sembolleri,
- etkilenmiş / etkilenmemiş gösterimi,
- kuşak bağlantıları
tutarlı olmalıdır.

### Ekolojik ağ
- ok yönünün “enerji/besin aktarımı” mı yoksa “etkiler” mi gösterdiği açıkça tanımlanmalıdır.

### Deney grafiği
- bağımsız değişken x ekseninde,
- bağımlı değişken y ekseninde
olması tercih edilir; farklı kullanım varsa açıkça belirtilir.

---

# 20. IQ Seviyesi İçin Minimum DNA Kuralı

Aşağıdaki tablo otomatik audit için referans olarak kullanılabilir.

| IQ | Yaklaşık gerçek karar | Ek zorunlu özellik |
|---:|---:|---|
| 50 | 0 | doğrudan bilgi |
| 75 | 1 küçük | temel eşleme |
| 100 | 1–2 | basit ilişki |
| 125 | 2–3 | kısa analiz / temsil |
| 150 | 2–3 anlamlı | veri veya model |
| 175 | 3–4 | yöntem/ilişki seçimi |
| 200 | 3–5 | en az 2 işlevsel bilişsel eksen |
| 225 | 4–5 | örtük koşul / tersine düşünme / ikinci kontrol |
| 250 | 5–6 | çoklu koşul + doğrulama |
| 275 | 5–7 | alternatif model / güçlü transfer |
| 300 | ≥6 | çoklu temsil + strateji + doğrulama |
| 325 | ≥7 | model seçimi/değişimi + sınır testi |
| 350 | ≥8 | alternatif hipotez + genelleme + bağımsız kanıt |

**Not:** Karar sayısı tek başına yeterli değildir. Kararların birbirine bağlı ve biyolojik olarak anlamlı olması gerekir.

---

# 21. Soru Üretim Motoru İçin Metadata Şeması

Her soru üretiminde aşağıdaki alanların tutulması önerilir:

```yaml
subject: biyoloji

curriculum_profile: TYMM_2026
grade: 10
exam_profile: SCHOOL   # SCHOOL | TYT | AYT
theme: ENERJI
learning_outcome_code: "BİY.10.1.X"

target_iq: 200
estimated_iq_after_audit: 200

question_archetype:
  - experiment
  - graph
  - mechanism

context_type: laboratory
representation:
  - text
  - graph

cognitive_operations:
  - data_selection
  - cause_effect
  - model_interpretation
  - validation

independent_decision_count: 4

biology_levels:
  - cellular
  - molecular

distractor_sources:
  - cause_effect_reversal
  - variable_confusion
  - overgeneralization
  - process_location_confusion

requires_external_knowledge: false
curriculum_out_of_scope: false
single_correct_answer: true
visual_required: true

final_lock: PASS
```

---

# 22. Soru Üretim Pipeline'ı

```text
1. CURRICULUM_LOCK
   ↓
2. Öğrenme çıktısını seç
   ↓
3. Hedef sınıf / TYT / AYT profilini seç
   ↓
4. TARGET_IQ seç
   ↓
5. Biyolojik çekirdek mekanizmayı belirle
   ↓
6. Uygun soru arketipini seç
   ↓
7. Bağlam gerekiyorsa işlevsel bağlam üret
   ↓
8. Veri / grafik / şema gerekiyorsa üret
   ↓
9. Doğru cevabı ÖNCE bilimsel olarak çöz
   ↓
10. Doğal hata yollarından çeldirici üret
   ↓
11. Soruyu bağımsız ikinci kez çöz
   ↓
12. BIO_IQ_AUDIT yap
   ↓
13. Bilimsel doğruluk kontrolü
   ↓
14. Müfredat kontrolü
   ↓
15. Tek doğru kontrolü
   ↓
16. FINAL_KİLİDİ
```

---

# 23. TARGET_IQ Üretim Talimatı

Model yalnız “IQ250 soru üret” komutuna güvenmemelidir.

Örneğin IQ250 için sistem prompt'u aşağıdaki mantığı uygulamalıdır:

```text
Hedef IQ = 250.

Soruyu zorlaştırmak için:
- müfredat dışına çıkma,
- nadir bilgi sorma,
- metni gereksiz uzatma,
- ezber ayrıntısı ekleme.

Bunun yerine:
- en az 5 anlamlı biyolojik karar oluştur,
- en az 2 süreç veya organizasyon düzeyini ilişkilendir,
- verilerden bir kısmının seçilmesini gerektir,
- çözüm yolunu doğrudan verme,
- doğal bir örtük koşul veya ikinci doğrulama ekle,
- çeldiricileri gerçek kavram yanılgılarından üret.

Soru bağımsız çözümde bu bilişsel DNA'yı taşımıyorsa IQ250 etiketi verme.
```

---

# 24. FINAL_KİLİDİ — Nihai Onay

Bir biyoloji sorusu ancak aşağıdaki koşulların tamamında yayın havuzuna girebilir.

## 24.1. Müfredat kilidi

- [ ] Hedef öğrenme çıktısı belli.
- [ ] Sorunun çözümü müfredat dışı bilgi gerektirmiyor.
- [ ] Kullanılan kavram hedef sınıf / sınav profiline uygun.

## 24.2. Bilimsel kilit

- [ ] Bütün biyolojik ifadeler doğru.
- [ ] Tek doğru cevap var.
- [ ] Grafik / şema / soy ağacı tutarlı.
- [ ] Genelleme kapsamı doğru.
- [ ] Deney tasarımı mantıklı.

## 24.3. IQ kilidi

- [ ] Soru bağımsız çözüldü.
- [ ] Gerçek çözüm DNA'sı çıkarıldı.
- [ ] Mekanik adımlar ile bilişsel kararlar ayrıldı.
- [ ] BIO_IQ_AUDIT tamamlandı.
- [ ] Hedef IQ gerçek bilişsel yükle doğrulanıyor.
- [ ] Zorluk ezber ayrıntısından gelmiyor.

## 24.4. Çeldirici kilidi

- [ ] Her çeldiricinin doğal hata yolu var.
- [ ] Hiçbir çeldirici tartışmalı değil.
- [ ] Doğru cevap biçimsel olarak öne çıkmıyor.
- [ ] Seçenekler aynı mantıksal düzeyde.

## 24.5. Dil kilidi

- [ ] Kök açık.
- [ ] Gereksiz bilgi yok.
- [ ] Olumsuz kök gerekiyorsa belirgin.
- [ ] Bilimsel terimler doğru.
- [ ] Yaş düzeyine uygun Türkçe kullanıldı.

---

# 25. AUTO-REJECT Kuralları

Aşağıdaki durumlarda soru otomatik olarak reddedilir:

```yaml
AUTO_REJECT:
  - multiple_correct_answers
  - no_correct_answer
  - curriculum_out_of_scope
  - scientific_error
  - ambiguous_visual
  - misleading_graph
  - invalid_pedigree
  - uncontrolled_experiment_without_purpose
  - distractor_based_on_out_of_scope_fact
  - target_iq_inflated_by_text_length
  - target_iq_inflated_by_obscure_memorization
  - decorative_context_only
  - answer_visible_from_format
  - medically_misleading_context
```

---

# 26. IQ Düşürme / Yükseltme Operatörleri

## 26.1. Gerçek IQ yükseltme operatörleri

Bir soruyu bir üst banda taşımak için:

- tek bilgiden iki ilişkili bilgiye geç,
- doğrudan bilgi yerine veri ver,
- tek temsil yerine işlevsel temsil dönüşümü ekle,
- neden → sonuç yerine sonuç → neden çıkarımı ekle,
- bir süreç yerine iki ilişkili süreç ekle,
- gözlemden hipotez çıkart,
- bir hipotezi ikinci kanıtla test ettir,
- basit yapı–görevden sistem eş güdümüne geç,
- tek kuşak genetikten kısıt içeren çok kuşak modeline geç,
- doğrudan popülasyon etkisinden dolaylı ağ etkisine geç,
- ilk çözümün sınır durumunu doğrulat.

## 26.2. IQ düşürme operatörleri

- gereksiz veriyi kaldır,
- temsil sayısını azalt,
- örtük koşulu açık hâle getir,
- iki süreçten birini çıkar,
- alternatif hipotez sayısını azalt,
- grafik yerine doğrudan veri ver,
- ara sonucu soruda hazır ver,
- sistem entegrasyonunu tek sisteme indir.

---

# 27. Aynı Kazanımdan Farklı IQ Üretme Örneği

Konu: **Enzim aktivitesine sıcaklığın etkisi**

## IQ50
“Enzim aktivitesini etkileyen faktörlerden biri hangisidir?”

→ doğrudan bilgi.

## IQ100
İki sıcaklık koşulu verilir; hangisinde aktivitenin daha düşük olacağı temel bilgiyle belirlenir.

→ 1–2 ilişki.

## IQ150
Sıcaklık–aktivite grafiği verilir; belirli aralıktaki değişim yorumlanır.

→ veri + kavram.

## IQ200
İki deney grubunun grafiği verilir; pH sabitliği, sıcaklık ve enzim aktivitesi birlikte değerlendirilir.

→ veri seçme + deney + neden–sonuç.

## IQ250
İki farklı enzim için sıcaklık–aktivite verisi, denatürasyon bilgisi ve bir kontrol grubu verilir; gözlenen sonucun hangi açıklamayla tutarlı olduğu ve hangi ek verinin bunu doğrulayacağı belirlenir.

→ çoklu koşul + alternatif açıklama + doğrulama.

## IQ300
Birden fazla deney serisi, grafik ve kısa moleküler model verilir; öğrencinin önce olası mekanizmaları ayırması, sonra verilerle elemesi ve sonuç için gerekli kontrol deneyini belirlemesi gerekir.

→ çoklu temsil + hipotez + strateji + doğrulama.

**Sonuç:** Konu aynı kalır; zorluk bilgi yabancılığından değil, bilişsel mimariden yükselir.

---

# 28. Aynı Kazanımdan Farklı IQ — Genetik Örneği

Konu: **Kalıtım / soy ağacı**

## IQ75
Verilen genotipten fenotipi belirleme.

## IQ125
Anne–baba genotiplerinden olası çocuk genotipini bulma.

## IQ175
Basit soy ağacında bireyin olası genotiplerini belirleme.

## IQ200
Soy ağacında birden fazla bireyin fenotipinden kalıtım biçimi ve genotip kısıtlarını birlikte çıkarma.

## IQ250
Birden fazla kalıtım biçimini test edip mümkün olmayanları eleme; ardından belirli bir birey için olasılık hesaplama.

## IQ300
Soy ağacı + moleküler test sonucu + fenotip bilgisi birlikte kullanılarak alternatif kalıtım modelleri karşılaştırılır ve ikinci bir kanıtla doğrulanır.

---

# 29. Aynı Kazanımdan Farklı IQ — Ekoloji Örneği

Konu: **Besin ağı**

## IQ75
Üreticiyi belirleme.

## IQ125
Bir canlı azaldığında doğrudan beslendiği canlı üzerindeki etkiyi belirleme.

## IQ175
İki basamaklı dolaylı etkiyi izleme.

## IQ200
Besin ağı + popülasyon verisinden iki türün değişimini açıklama.

## IQ250
Besin ağı + biyobirikim + popülasyon değişimini birlikte değerlendirme.

## IQ300
Bir müdahale öncesi/sonrası veri setlerinden birden fazla olası ekolojik açıklamayı karşılaştırıp en iyi modeli seçme.

---

# 30. Psikometrik Kullanım Notu

MENAR/MAYS IQ etiketi, öğrencinin gerçek zekâ seviyesini göstermez.

Teorik hedef IQ ile gerçek madde güçlüğü aynı şey değildir.

Gerçek soru performansı pilot uygulamada ayrıca ölçülmelidir:

```text
p-değeri
ayırt edicilik
madde-toplam korelasyonu
seçenek işlevselliği
yanıt süresi
gerekirse IRT parametreleri
```

Örneğin teorik olarak IQ250 tasarlanmış bir soru pilot uygulamada beklenenden kolay çıkabilir. Bu durumda soru bankasındaki gerçek kalibrasyon etiketi pilot veriye göre güncellenmelidir.

---

# 31. EVAL Sistemiyle Birlikte Kullanım

Her IQ kademesi için sabit doğrulama seti oluşturulması önerilir.

Örnek:

```yaml
BIOLOGY_EVAL:
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

Her soru şu açılardan uzman tarafından etiketlenir:

- gerçek IQ,
- sınıf,
- sınav profili,
- kazanım,
- soru arketipi,
- karar sayısı,
- temsil sayısı,
- çeldirici tipi,
- bilimsel doğruluk,
- süre tahmini.

Yeni prompt / model sürümü bu sabit set üzerinde test edilmeden prod'a alınmamalıdır.

---

# 32. Uygulama İçin Önerilen Çıktı JSON'u

```json
{
  "subject": "biyoloji",
  "grade": 12,
  "exam_profile": "AYT",
  "curriculum_profile": "HYBRID_TRANSITION",
  "theme": "GEN",
  "learning_outcome": "selected_outcome",
  "target_iq": 250,
  "audited_iq": 250,
  "archetype": ["pedigree", "data_interpretation"],
  "cognitive_decisions": 6,
  "representations": ["text", "pedigree"],
  "skills": [
    "data_selection",
    "genetic_modeling",
    "constraint_elimination",
    "validation"
  ],
  "distractor_errors": [
    "dominant_common_confusion",
    "genotype_phenotype_confusion",
    "sex_linked_inheritance_error",
    "overgeneralization"
  ],
  "curriculum_check": "PASS",
  "science_check": "PASS",
  "single_answer_check": "PASS",
  "iq_audit": "PASS",
  "final_lock": "PASS"
}
```

---

# 33. Son Üretim Standardı — Kısa Özet

```text
13 sabit kademe:
IQ50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350

Çapalar:
IQ75  = Kolay
IQ200 = Orta / Genel Ağırlık
IQ250 = Zor / Derece-Seçici

Biyoloji zorluğunu yükselten:
karar sayısı
veri seçme
neden–sonuç zinciri
biyolojik düzeyler arası geçiş
deney analizi
grafik / model yorumlama
hipotez
kanıt
temsil dönüşümü
sistem entegrasyonu
tersine düşünme
doğrulama
transfer

Biyoloji zorluğunu yükseltmeyen:
nadir ezber
uzun metin
Latince isim
kalabalık görsel
müfredat dışı terim
gereksiz hesap
yapay çeldirici

Temel üretim ilkesi:
MÜFREDAT İÇİNDE KAL
+
GERÇEK BİYOLOJİK MUHAKEMEYİ ARTIR
+
SORUYU BAĞIMSIZ ÇÖZ
+
BIO_IQ_AUDIT YAP
+
FINAL_KİLİDİ AÇMADAN YAYINLAMA
```

---

# 34. Araştırma Dayanağı / Kaynaklar

Bu standardın hazırlanmasında aşağıdaki kaynakların soru yaklaşımı, müfredat yapısı ve sınav karakteri incelenmiştir. Kaynaklardaki sorular kopyalanmamış; yalnızca yapı ve bilişsel özellikler analiz edilmiştir.

1. **MENAR / MAYS — TYT–AYT IQ Bilişsel Zorluk Kalibrasyon Standardı v3** — kullanıcı tarafından sağlanan matematik/ortak referans dokümanı.
2. **T.C. Millî Eğitim Bakanlığı — Türkiye Yüzyılı Maarif Modeli Biyoloji Dersi Öğretim Programı (9–12), 2026.**
3. **TYMM Biyoloji 9. Sınıf — Yaşam, Organizasyon temaları.**
4. **TYMM Biyoloji 10. Sınıf — Enerji, Ekoloji temaları.**
5. **TYMM Biyoloji 11. Sınıf — Tepki, Homeostazi temaları.**
6. **TYMM Biyoloji 12. Sınıf — Üreme, Gen temaları.**
7. **MEB — Bağlam Temelli Çoktan Seçmeli Soru Yazım Kılavuzu / 2026 ölçme-değerlendirme yaklaşımı.**
8. **OGM Materyal — Biyoloji Soru Bankası.**
9. **OGM Materyal — 3 Adım TYT Biyoloji.**
10. **OGM Materyal — Dört Dörtlük TYT / AYT Biyoloji.**
11. **ÖSYM — 2025 YKS TYT ve AYT Temel Soru Kitapçıkları.**
12. **ÖSYM — 2026 YKS TYT ve AYT Temel Soru Kitapçıkları.**

**Erişim / araştırma tarihi:** 17.08.2026

---

# 35. Nihai Kural

> **Bir biyoloji sorusunun IQ seviyesini konu adı değil, çözüm sırasında öğrencinin yapmak zorunda olduğu gerçek bilişsel işler belirler.**

**IQ250 bir soru, zor bir terim sormaz.  
IQ250 bir soru, öğrenciyi doğru biyolojik modeli kurmaya, veriyi seçmeye, koşulları birleştirmeye ve sonucunu doğrulamaya zorlar.**

**MENAR / MAYS biyoloji üretiminde hedef budur.**
