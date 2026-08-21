# Türkiye Yüzyılı Maarif Modeli — 9–12. Sınıf Fizik, Kimya, Biyoloji ve Türk Dili ve Edebiyatı
## TYT–AYT konu/kazanım eşlemeli başvuru dosyası

> **Sürüm tarihi:** 17 Ağustos 2026  
> **Kapsam:** 9, 10, 11 ve 12. sınıf — Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı  
> **Amaç:** Eğitim içeriği / soru üretim sistemi / RAG / kazanım etiketleme / TYT–AYT soru bankası için hiyerarşik başvuru kaynağı.  
> **Terminoloji notu:** Yeni Türkiye Yüzyılı Maarif Modeli'nde eski programlardaki “kazanım” ifadesinin karşılığı ağırlıklı olarak **öğrenme çıktısı**dır.  
> **Türkçe notu:** Ortaöğretim 9–12. sınıfta dersin resmî adı **Türk Dili ve Edebiyatı (TDE)** olduğundan bu dosyada “Türkçe” talebi TDE olarak ele alınmıştır.

---

# 0. Kullanım ve veri güvenilirliği notları

## 0.1 Resmî program ile TYT/AYT etiketi aynı şey değildir

MEB'in Türkiye Yüzyılı Maarif Modeli; sınıf, ünite/tema, öğrenme çıktısı, içerik çerçevesi, anahtar kavramlar ve öğrenme-öğretme süreçlerini tanımlar.

ÖSYM ise YKS'de TYT ve AYT testlerini uygular; ancak her MEB öğrenme çıktısını tek tek “TYT” veya “AYT” etiketiyle yayımlanmış bir resmî tablo hâlinde sunmaz.

Bu nedenle bu dosyadaki:

- `TYT`
- `AYT`
- `TYT+AYT`
- `OKUL/DESTEK`

etiketleri **operasyonel/editoryal eşleme**dir. Soru üretim sistemi, konu filtreleme ve veri organizasyonu için kullanılır; ÖSYM'nin resmî “kazanım etiketi” olduğu anlamına gelmez.

## 0.2 Kademeli uygulama uyarısı

Türkiye Yüzyılı Maarif Modeli ortaöğretimde kademeli uygulanmaktadır. Son açık resmî uygulama duyurularında 2025–2026 eğitim öğretim yılında modelin 9. sınıfta devam ettiği ve 10. sınıfta uygulanmaya başladığı belirtilmiştir. Bu dosya ise MEB tarafından yayımlanmış **9–12 program yapısının tamamını** referans amacıyla içerir.

Bu nedenle özellikle 11–12. sınıflarda belirli bir öğrencinin içinde bulunduğu eğitim yılında **fiilen hangi programla sorumlu olduğunu** ayrıca güncel MEB/okul duyurusuyla kontrol etmek gerekir.

## 0.3 Telif ve özetleme yaklaşımı

Bu dosya resmî program metinlerini uzun uzun kopyalamaz. Öğrenme çıktıları ve içerik çerçeveleri:

- kodları korunarak,
- kısa ve veri işleme dostu biçimde,
- anlamı korunacak şekilde özetlenmiştir.

Tam resmî ifade, süreç bileşenleri ve açıklamalar için MEB Türkiye Yüzyılı Maarif Modeli sayfaları esas alınmalıdır.

## 0.4 Önerilen veri hiyerarşisi

```text
ders
└── sınıf
    └── ünite / tema
        ├── öğrenme çıktısı kodu
        ├── öğrenme çıktısı özeti
        ├── alt konu / içerik çerçevesi
        ├── anahtar kavramlar
        ├── YKS etiketi
        └── soru üretim etiketi
```

Önerilen tekil kimlik örneği:

```text
FIZ-09-U02-FIZ.9.2.4
KIM-10-T02-KIM.10.2.7
BIO-12-T02-BIO.12.2.5
TDE-10-T03-TDE2.3
```

---

# 1. FİZİK

## 1.1 9. Sınıf Fizik

### Ünite 1 — Fizik Bilimi ve Kariyer Keşfi
**YKS eşlemesi:** TYT / temel bilim okuryazarlığı

**İçerik çerçevesi**
- Fizik bilimi
- Fizik biliminin alt dalları
- Fizik bilimine yön veren bilim insanları
- Fizikle ilişkili kariyer ve araştırma merkezleri

**Öğrenme çıktıları**
- `FİZ.9.1.1` — Fizik biliminin neyi incelediğine ilişkin genelleme yapar.
- `FİZ.9.1.2` — Fiziğin alt dallarını özelliklerine göre sınıflandırır.
- `FİZ.9.1.3` — Fiziğe katkı sağlayan bilim insanlarının çalışma deneyimlerinden çıkarım yapar.
- `FİZ.9.1.4` — Bilim ve teknoloji kurumlarındaki fizik ilişkili kariyer olanaklarını araştırır.

**Alt başlıklar / anahtar kavramlar**
- Mekanik
- Elektromanyetizma
- Optik
- Termodinamik
- Atom fiziği
- Nükleer fizik
- Katı hâl fiziği
- Yüksek enerji ve plazma fiziği
- Araştırma merkezi
- Bilimsel çalışma
- Kariyer alanları

---

### Ünite 2 — Kuvvet ve Hareket
**YKS eşlemesi:** TYT çekirdek; AYT için ön koşul

**İçerik çerçevesi**
- Temel ve türetilmiş nicelikler
- Skaler ve vektörel nicelikler
- Vektörler
- Doğadaki temel kuvvetler
- Hareket ve hareket türleri

**Öğrenme çıktıları**
- `FİZ.9.2.1` — SI sistemindeki temel ve türetilmiş nicelikleri ayırt eder.
- `FİZ.9.2.2` — Skaler ve vektörel nicelikleri sınıflandırır.
- `FİZ.9.2.3` — Aynı doğrultudaki vektörleri yön ve büyüklük bakımından inceler.
- `FİZ.9.2.4` — Vektörlerin toplanmasına ilişkin yöntemleri uygular ve çıkarım yapar.
- `FİZ.9.2.5` — Doğadaki temel kuvvetleri karşılaştırır.
- `FİZ.9.2.6` — Hareketin temel kavramlarına ilişkin tanımlar geliştirir.
- `FİZ.9.2.7` — Hareket türlerini sınıflandırır.

**Alt başlıklar / anahtar kavramlar**
- Temel büyüklük
- Türetilmiş büyüklük
- SI birimleri
- Skaler
- Vektör
- Vektör bileşenleri
- Bileşke vektör
- Uç uca ekleme
- Paralelkenar yöntemi
- Kütle çekim kuvveti
- Elektromanyetik kuvvet
- Güçlü nükleer kuvvet
- Zayıf nükleer kuvvet
- Referans noktası
- Konum
- Alınan yol
- Yer değiştirme
- Sürat
- Hız
- İvme
- Öteleme
- Dönme
- Titreşim

---

### Ünite 3 — Akışkanlar
**YKS eşlemesi:** TYT; bazı uygulamalar AYT ön bilgisi

**İçerik çerçevesi**
- Basınç
- Sıvılarda basınç
- Açık hava basıncı
- Kaldırma kuvveti
- Bernoulli ilkesi

**Öğrenme çıktıları**
- `FİZ.9.3.1` — Basınç kavramını kuvvet ve yüzey alanıyla ilişkilendirir.
- `FİZ.9.3.2` — Durgun sıvılarda basıncı etkileyen değişkenleri ilişkilendirir.
- `FİZ.9.3.3` — Sıvı basıncının günlük yaşamdaki kullanım alanlarını analiz eder.
- `FİZ.9.3.4` — Açık hava basıncı ile ilgili çıkarım yapar.
- `FİZ.9.3.5` — Kaldırma kuvvetini etkileyen değişkenleri deneysel olarak inceler.
- `FİZ.9.3.6` — Kaldırma kuvvetini basınç kuvvetleriyle ilişkilendirir.
- `FİZ.9.3.7` — Akışkanlarda kesit, hız ve basınç ilişkisini Bernoulli ilkesi üzerinden açıklar.

**Alt başlıklar**
- Katı basıncı
- Sıvı basıncı
- Basıncın derinlik ve yoğunlukla ilişkisi
- Pascal prensibine dayalı uygulamalar
- Atmosfer basıncı
- Barometre
- Kaldırma kuvveti
- Batan / yüzen / askıda kalan cisim
- Akışkan hızı
- Bernoulli ilkesi
- Günlük yaşam uygulamaları

---

### Ünite 4 — Enerji
**YKS eşlemesi:** TYT; termodinamik için temel

**İçerik çerçevesi**
- İç enerji, ısı ve sıcaklık
- Isı, öz ısı, ısı sığası ve sıcaklık farkı
- Hâl değişimi
- Isıl denge
- Isı aktarım yolları
- Isı iletim hızı

**Öğrenme çıktıları**
- `FİZ.9.4.1` — İç enerji, ısı ve sıcaklık arasındaki ilişkiyi açıklar.
- `FİZ.9.4.2` — Isı miktarı ile öz ısı, ısı sığası ve sıcaklık farkı arasında matematiksel model kurar.
- `FİZ.9.4.3` — Hâl değişiminde alınan/verilen ısıyı etkileyen değişkenleri ilişkilendirir.
- `FİZ.9.4.4` — Isıl dengeyi yorumlar.
- `FİZ.9.4.5` — Isı aktarım yollarını karşılaştırır.
- `FİZ.9.4.6` — Katılarda ısı iletim hızını etkileyen faktörleri inceler.

**Alt başlıklar**
- İç enerji
- Isı
- Sıcaklık
- Termometre
- Öz ısı
- Isı sığası
- Kalorimetri
- Erime / donma
- Buharlaşma / yoğuşma
- Hâl değişim ısısı
- Isıl denge
- İletim
- Taşınım
- Işıma
- Isı yalıtımı

---

## 1.2 10. Sınıf Fizik

### Ünite 1 — Kuvvet ve Hareket
**YKS eşlemesi:** TYT + AYT ön koşulu

**Öğrenme çıktıları**
- `FİZ.10.1.1` — Yatay doğrultudaki sabit hızlı hareketi analiz eder.
- `FİZ.10.1.2` — İvme ile hız değişimi arasındaki ilişkiyi açıklar.
- `FİZ.10.1.3` — Bir boyutta sabit ivmeli harekete ilişkin grafik ve matematiksel modelleri yorumlar.

**Alt başlıklar**
- Sabit hızlı hareket
- Konum-zaman grafiği
- Hız-zaman grafiği
- İvme
- Sabit ivmeli hareket
- Grafik dönüşümleri
- Hareket denklemleri
- Günlük yaşam hareket problemleri

---

### Ünite 2 — Enerji
**YKS eşlemesi:** TYT + AYT

**Öğrenme çıktıları**
- `FİZ.10.2.1` — Kuvvet–yer değiştirme grafiğinden yapılan işi yorumlar.
- `FİZ.10.2.2` — İş, enerji ve güç arasındaki ilişkileri kurar.
- `FİZ.10.2.3` — Enerji biçimlerini sınıflandırır.
- `FİZ.10.2.4` — Mekanik enerjiyi analiz eder.
- `FİZ.10.2.5` — Yenilenebilir ve yenilenemeyen enerji kaynaklarını karşılaştırır.

**Alt başlıklar**
- İş
- Enerji
- Güç
- Kinetik enerji
- Çekim potansiyel enerjisi
- Esneklik potansiyel enerjisi
- Mekanik enerji
- Enerjinin korunumu
- Verim
- Yenilenebilir enerji
- Fosil yakıtlar
- Enerji dönüşümleri

---

### Ünite 3 — Elektrik
**YKS eşlemesi:** TYT çekirdek + AYT altyapısı

**Öğrenme çıktısı kapsamı:** `FİZ.10.3.1–FİZ.10.3.6`

**Özet**
- Basit elektrik devrelerinde potansiyel farkı, akım ve direnç arasındaki ilişkiyi kurar.
- Devre elemanlarının seri/paralel bağlanmasını analiz eder.
- Elektriksel enerji ve güç ilişkilerini yorumlar.
- Günlük yaşamda elektrik kullanımıyla ilgili çıkarımlar yapar.
- Elektrik akımının oluşturabileceği riskleri ve korunma önlemlerini değerlendirir.

**Alt başlıklar**
- Elektrik akımı
- Potansiyel farkı
- Direnç
- Ohm yasası
- Seri devre
- Paralel devre
- Eşdeğer direnç
- Ampermetre
- Voltmetre
- Elektriksel güç
- Elektrik enerjisi
- Elektrik güvenliği
- Topraklama ve koruma

---

### Ünite 4 — Dalgalar
**YKS eşlemesi:** TYT + AYT altyapısı

**Öğrenme çıktısı kapsamı:** `FİZ.10.4.x`

**Özet**
- Periyodik hareket ile dalga hareketi arasındaki ilişkiyi kurar.
- Dalganın temel büyüklüklerini tanımlar ve ilişkilendirir.
- Dalga çeşitlerini ortam ve titreşim doğrultusuna göre sınıflandırır.
- Dalga davranışlarını günlük yaşam örnekleriyle açıklar.
- Deprem dalgaları ve depremle ilgili fiziksel modelleri yorumlar.

**Alt başlıklar**
- Periyodik hareket
- Genlik
- Periyot
- Frekans
- Dalga boyu
- Dalga hızı
- Enine dalga
- Boyuna dalga
- Mekanik dalga
- Ses
- Su dalgaları
- Yay dalgaları
- Deprem dalgaları

---

## 1.3 11. Sınıf Fizik

### Ünite 1 — Kuvvet ve Hareket
**YKS eşlemesi:** AYT ağırlıklı

**İçerik çerçevesi**
- Serbest düşme
- İki boyutta sabit ivmeli hareket
- Newton yasaları
- Sürtünme
- Limit hız
- Çembersel hareket

**Öğrenme çıktıları**
- `FİZ.11.1.1` — Serbest düşmede ivmenin özelliklerini yorumlar.
- `FİZ.11.1.2` — Serbest düşme hareketine ilişkin kanıtları değerlendirir.
- `FİZ.11.1.3` — İki boyutta sabit ivmeli hareketi analiz eder.
- `FİZ.11.1.4` — Newton hareket yasalarına ilişkin çıkarım yapar.
- `FİZ.11.1.5` — Serbest cisim diyagramları kullanarak Newton yasalarını uygular.
- `FİZ.11.1.6` — Statik ve kinetik sürtünmeyi karşılaştırır.
- `FİZ.11.1.7` — Sürtünme kuvvetine ilişkin matematiksel model kurar.
- `FİZ.11.1.8` — Limit hızı etkileyen değişkenleri ilişkilendirir.
- `FİZ.11.1.9` — Düzgün çembersel harekette yörünge ve hız vektörünü yorumlar.
- `FİZ.11.1.10` — Çembersel harekette temel nicelikler arasında matematiksel ilişkiler kurar.

**Alt başlıklar**
- Serbest düşme
- Düşey atış
- Yatay atış
- Eğik atış
- Newton 1–2–3
- Serbest cisim diyagramı
- Statik sürtünme
- Kinetik sürtünme
- Hava direnci
- Limit hız
- Açısal hız
- Çizgisel hız
- Merkezcil ivme
- Merkezcil kuvvet
- Düzgün çembersel hareket

---

### Ünite 2 — Elektrik ve Manyetizma
**YKS eşlemesi:** AYT

**Öğrenme çıktısı kapsamı:** `FİZ.11.2.x`

**Özet**
- Coulomb yasası üzerinden elektriksel kuvveti matematiksel olarak modeller.
- Elektrik alan ve elektriksel potansiyel kavramlarını ilişkilendirir.
- Yüklü parçacıkların elektriksel ortamlardaki davranışlarını analiz eder.
- Akımın oluşturduğu manyetik alanı inceler.
- Manyetik kuvveti ve hareketli yük/iletken ilişkisini yorumlar.
- Elektromanyetik indüksiyonu açıklar.
- Alternatif akımın temel özelliklerini inceler.
- Transformatörlerin çalışma prensibi ve kullanım alanlarını değerlendirir.

**Alt başlıklar**
- Elektrik yükü
- Coulomb kuvveti
- Elektrik alan
- Elektriksel potansiyel
- Potansiyel enerji
- Eş potansiyel
- Manyetik alan
- Akım taşıyan telin manyetik alanı
- Manyetik kuvvet
- Elektromanyetik indüksiyon
- Faraday–Lenz yaklaşımı
- Alternatif akım
- Transformatör

---

### Ünite 3 — Optik
**YKS eşlemesi:** TYT temel + AYT ayrıntı

**Öğrenme çıktıları**
- `FİZ.11.3.1` — Işık şiddeti, ışık akısı ve aydınlanma kavramlarını ilişkilendirir.
- `FİZ.11.3.2` — Düzlem aynalarda görüntü oluşumunu modeller.
- `FİZ.11.3.3` — Küresel aynaları özelliklerine göre karşılaştırır.
- `FİZ.11.3.4` — Küresel aynalarda görüntü oluşumunu deneysel/veriye dayalı inceler.
- `FİZ.11.3.5` — Işığın kırılmasını deneysel olarak analiz eder.
- `FİZ.11.3.6` — Görünür derinlik olgusunu açıklar.
- `FİZ.11.3.7` — Fiber optik teknolojisiyle ilgili bilgi toplar ve yorumlar.
- `FİZ.11.3.8` — Prizmalarda ışık davranışına ilişkin çıkarım yapar.
- `FİZ.11.3.9` — Merceklerin özelliklerini inceler.
- `FİZ.11.3.10` — Merceklerde görüntü oluşumunu analiz eder.

**Alt başlıklar**
- Işık şiddeti
- Işık akısı
- Aydınlanma
- Düzlem ayna
- Çukur ayna
- Tümsek ayna
- Yansıma
- Kırılma
- Snell yasası
- Tam yansıma
- Görünür derinlik
- Fiber optik
- Prizma
- İnce kenarlı mercek
- Kalın kenarlı mercek
- Merceklerde görüntü

---

## 1.4 12. Sınıf Fizik

### Ünite 1 — Kuvvet ve Hareket
**YKS eşlemesi:** AYT

**Öğrenme çıktısı başlangıcı:** `FİZ.12.1.1` tork modeli

**İçerik / alt başlıklar**
- Tork
- Denge
- Kütle merkezi / ağırlık merkezi
- İtme
- Momentum
- Momentumun korunumu
- Çarpışmalar
- Eylemsizlik momenti
- Açısal momentum
- Açısal momentumun korunumu

**Öğrenme çıktısı özeti**
- Torku kuvvet ve kuvvet koluyla ilişkilendirir.
- Denge koşullarını analiz eder.
- İtme–momentum ilişkisini kurar.
- Momentumun korunumunu çarpışma ve etkileşimlerde uygular.
- Dönme hareketinde eylemsizlik momentini yorumlar.
- Açısal momentum ve korunumu üzerinden sistemleri analiz eder.

---

### Ünite 2 — Enerji
**YKS eşlemesi:** AYT

**Öğrenme çıktısı başlangıcı:** `FİZ.12.2.1` yay sabitinin deneysel incelenmesi

**Alt başlıklar**
- Yay kuvveti
- Hooke yasası
- Yay sabiti
- Esneklik potansiyel enerjisi
- Enerji dönüşümleri
- Mekanik sistemlerde enerji
- Verim
- Enerji kayıpları ve gerçek sistemler

**Öğrenme çıktısı özeti**
- Yay sistemlerini deneysel olarak inceler.
- Kuvvet–uzama ilişkisini matematiksel modele dönüştürür.
- Enerji depolama ve dönüşüm süreçlerini analiz eder.
- Mekanik sistemlerin verimini değerlendirir.

---

### Ünite 3 — Dalgalar
**YKS eşlemesi:** AYT

**Öğrenme çıktısı kapsamı**
- Doğrusal su dalgalarında kırınım
- Girişim
- Dalga davranışları
- Elektromanyetik dalgalar
- Elektromanyetik spektrum
- Dalga teknolojileri ve cihazlar

**Alt başlıklar**
- Kırınım
- Girişim
- Faz farkı
- Elektromanyetik dalga
- Elektromanyetik spektrum
- Radyo dalgaları
- Mikrodalga
- Kızılötesi
- Görünür ışık
- Morötesi
- X ışını
- Gama
- Dalga tabanlı teknolojiler

---

### Ünite 4 — Madde ve Doğası
**YKS eşlemesi:** AYT

**Öğrenme çıktısı başlangıcı:** Planck sabiti ve modern fiziğe ilişkin modeller

**Alt başlıklar**
- Modern fiziğin doğuşu
- Kuantum fikri
- Planck yaklaşımı
- Foton
- Fotoelektrik etki
- Atom modelleri ve enerji düzeyleri
- Madde–ışık etkileşimi
- Atom çekirdeği
- Radyoaktivite
- Nükleer tepkimeler
- Nükleer enerji

**Öğrenme çıktısı özeti**
- Klasik fiziğin açıklamakta zorlandığı olayları modern fizik bağlamında değerlendirir.
- Enerjinin kuantalanması fikrini yorumlar.
- Işık–madde etkileşimlerini açıklar.
- Atom ve çekirdek fiziği uygulamalarını analiz eder.
- Nükleer enerjinin bilimsel, teknolojik ve toplumsal boyutlarını değerlendirir.

---

# 2. KİMYA

> Maarif Modeli Kimya programında bütün sınıflarda ana organizasyon üç tema üzerinden ilerler:
>
> 1. **Etkileşim**
> 2. **Çeşitlilik**
> 3. **Sürdürülebilirlik**

## 2.1 9. Sınıf Kimya

### Tema 1 — Etkileşim
**YKS eşlemesi:** TYT temel

**Ana içerik**
- Kimya hayattır
- Atomdan periyodik tabloya

**Öğrenme çıktıları**
- `KİM.9.1.1` — Kimyanın günlük yaşama katkılarını örneklerden hareketle değerlendirir.
- `KİM.9.1.2` — Kimyasal maddelerin güvenli kullanımına ilişkin problem ve önlemleri değerlendirir.
- `KİM.9.1.3` — Atom teorilerinin bilimsel bilgiyle birlikte değişimini yorumlar.
- `KİM.9.1.4` — Atom orbitallerinin bağıl enerjilerini inceler.
- `KİM.9.1.5` — Elektronların orbitallere yerleşimini açıklar.
- `KİM.9.1.6` — Elementlerin periyodik tablodaki yerini elektron dizilimiyle ilişkilendirir.
- `KİM.9.1.7` — İyon oluşumunu açıklar.
- `KİM.9.1.8` — Periyodik özelliklerdeki değişimleri yorumlar.

**Alt başlıklar**
- Kimyanın günlük yaşamla ilişkisi
- Kimya alt disiplinleri
- Kimya laboratuvarında güvenlik
- Tehlike sembolleri
- Atom modelleri
- Bohr atom modeli
- Modern atom teorisi
- Orbital
- Elektron dizilimi
- Aufbau / Pauli / Hund ilkeleri
- Periyodik tablo
- Grup / periyot
- İyon
- Atom yarıçapı
- İyonlaşma enerjisi
- Elektronegatiflik
- Periyodik eğilimler

---

### Tema 2 — Çeşitlilik
**YKS eşlemesi:** TYT

**Öğrenme çıktısı başlangıcı:** Metalik bağın oluşumunun incelenmesi

**Alt başlıklar**
- Kimyasal bağlar
- Metalik bağ
- İyonik bağ
- Kovalent bağ
- Lewis yapıları
- Molekül geometrisiyle ilişkili temel fikirler
- Polar / apolar bağ ve molekül
- Moleküller arası etkileşimler
- London kuvvetleri
- Dipol–dipol etkileşimleri
- Hidrojen bağı
- Maddenin fiziksel özellikleri ile etkileşim türü arasındaki ilişki

**Öğrenme çıktısı özeti**
- Atomlar ve tanecikler arasındaki bağ/etkileşim türlerini ayırt eder.
- Bağ türlerini elektron davranışı üzerinden açıklar.
- Molekül ve bileşiklerin yapısal özelliklerini karşılaştırır.
- Moleküller arası etkileşimlerin gözlenebilir özelliklere etkisini yorumlar.

---

### Tema 3 — Sürdürülebilirlik
**YKS eşlemesi:** TYT destek / okul / yeni nesil bağlam

**Öğrenme çıktıları**
- `KİM.9.3.1` — Evsel atıklardan metal nanoparçacık elde etmeye yönelik deneysel süreç tasarlar/uygular.
- `KİM.9.3.2` — Metaller, alaşımlar ve nanoparçacıkların ekolojik etkilerine yönelik çözüm geliştirir.

**Alt başlıklar**
- Yeşil kimya
- Atıkların değerlendirilmesi
- Metal geri kazanımı
- Nanoparçacıklar
- Ekolojik sürdürülebilirlik
- Çevresel etki
- Atık önleme

---

## 2.2 10. Sınıf Kimya

### Tema 1 — Etkileşim
**YKS eşlemesi:** TYT + AYT altyapısı

**Ana bölümler**
- Kimyasal tepkimeler
- Gazlar

**Öğrenme çıktıları**
- `KİM.10.1.1` — Kimyasal değişimin kanıtlarını belirler.
- `KİM.10.1.2` — Kimyasal tepkimeleri tanecik düzeyinde modeller.
- `KİM.10.1.3` — Tepkimeleri çökelme, redoks ve asit-baz gibi türlere göre sınıflandırır.
- `KİM.10.1.4` — Mol kavramına ilişkin işlemsel anlam geliştirir.
- `KİM.10.1.5` — Atom/molekül sayısı, kütle ve mol arasında ilişki kurar.
- `KİM.10.1.6` — Kimyasal denklemleri denkleştirir.
- `KİM.10.1.7` — Stokiyometrik hesaplamalar yapar.
- `KİM.10.1.8` — Gazların temel özelliklerini açıklar.
- `KİM.10.1.9` — Gaz değişkenleri arasındaki ilişkileri yorumlar.
- `KİM.10.1.10` — İdeal gaz denkleminden yararlanır.
- `KİM.10.1.11` — Difüzyon/efüzyon davranışını deneysel olarak inceler.

**Alt başlıklar**
- Kimyasal değişim belirtileri
- Kimyasal denklem
- Tepkime türleri
- Çökelme
- Asit-baz tepkimesi
- Redoks
- Mol
- Avogadro sayısı
- Mol kütlesi
- Denklem denkleştirme
- Stokiyometri
- Sınırlayıcı bileşen
- Gaz basıncı
- Hacim
- Sıcaklık
- Boyle / Charles / Gay-Lussac ilişkileri
- İdeal gaz denklemi
- Difüzyon
- Efüzyon

---

### Tema 2 — Çeşitlilik
**YKS eşlemesi:** TYT + AYT altyapısı

**Kapsam:** Çözeltiler

**Öğrenme çıktıları**
- `KİM.10.2.1` — Çözünme olayını tanecik düzeyinde modeller.
- `KİM.10.2.2` — Farklı maddelerin çözünürlük davranışlarını karşılaştırır.
- `KİM.10.2.3` — Çözünme süreçlerini etkileşim türlerine göre sınıflandırır.
- `KİM.10.2.4` — Çözünürlük kavramını açıklar.
- `KİM.10.2.5` — Sıcaklık, basınç ve madde türünün çözünürlüğe etkisini inceler.
- `KİM.10.2.6` — Çözeltileri çeşitli ölçütlere göre sınıflandırır.
- `KİM.10.2.7` — Molar derişimle ilgili hesaplamalar yapar.
- `KİM.10.2.8` — Çözünmüş taneciklerin kaynama/donma davranışına etkisini yorumlar.

**Alt başlıklar**
- Çözücü / çözünen
- Çözünme
- Solvatasyon / hidratasyon
- Çözünürlük
- Doymuş / doymamış / aşırı doymuş çözelti
- Derişim
- Molarite
- ppm
- Sıcaklığın çözünürlüğe etkisi
- Basıncın gaz çözünürlüğüne etkisi
- Kaynama noktası yükselmesi
- Donma noktası alçalması
- Koligatif özelliklere giriş

---

### Tema 3 — Sürdürülebilirlik
**YKS eşlemesi:** TYT destek / yeni nesil bağlam

**Öğrenme çıktıları**
- `KİM.10.3.1` — Makro ve mikro ölçekli deneyleri çevresel etkileri bakımından karşılaştırır.
- `KİM.10.3.2` — Atmosferdeki kimyasal süreçlerin ekosistem üzerindeki sorunlarına yönelik çözüm üretir.

**Alt başlıklar**
- Yeşil kimya
- Mikro ölçekli deney
- Atom ekonomisi
- Su ayak izi
- Emisyon / karbon ayak izi
- Hava kirliliği
- Ozon
- Asit yağmurları
- Sera etkisi
- Küresel ısınma
- Atmosfer kimyası

---

## 2.3 11. Sınıf Kimya

### Tema 1 — Etkileşim
**YKS eşlemesi:** AYT

**Ana içerik**
- Enerji
- Tepkime hızı

**Öğrenme çıktıları**
- `KİM.11.1.1` — Fiziksel ve kimyasal süreçlerde enerji değişimini deneysel olarak inceler.
- `KİM.11.1.2` — Enerji kaynaklarının/yanma süreçlerinin enerji potansiyeline ilişkin hipotez geliştirir.
- `KİM.11.1.3` — Bağ enerjileri ile tepkime entalpisi arasında ilişki kurar.
- `KİM.11.1.4` — Oluşum entalpilerinden tepkime entalpisi hesaplar/yorumlar.
- `KİM.11.1.5` — Tepkimelerin gerçekleşmesini çarpışma teorisiyle açıklar.
- `KİM.11.1.6` — Tepkime hızının zamanla değişimini yorumlar.
- `KİM.11.1.7` — Tepkime hızını etkileyen faktörleri analiz eder.
- `KİM.11.1.8` — Deneysel verilerden hız bağıntısına ilişkin çıkarım yapar.

**Alt başlıklar**
- Endotermik / ekzotermik
- Entalpi
- Tepkime entalpisi
- Oluşum entalpisi
- Bağ enerjisi
- Hess yaklaşımı
- Aktivasyon enerjisi
- Çarpışma teorisi
- Tepkime hızı
- Derişim
- Sıcaklık
- Yüzey alanı
- Katalizör
- Hız bağıntısı

---

### Tema 2 — Çeşitlilik
**YKS eşlemesi:** AYT

**Ana içerik**
- Kimyasal denge
- Asit ve baz çözeltilerinde denge
- Çözünürlük dengesi

**Öğrenme çıktısı başlangıcı**
- `KİM.11.2.1` — Tersinir tepkimeleri yorumlar.
- `KİM.11.2.2` — Kimyasal denge sürecini açıklar.

**Alt başlıklar**
- Tersinir tepkime
- Dinamik denge
- Denge sabiti
- Tepkime bölümü
- Dengeye etki eden faktörler
- Le Châtelier ilkesi
- Asit / baz
- Kuvvetli / zayıf asit-baz
- pH / pOH
- Ka / Kb
- Tampon çözeltiler
- Çözünürlük dengesi
- Çözünürlük çarpımı
- Ksp
- Ortak iyon etkisi

---

### Tema 3 — Sürdürülebilirlik
**YKS eşlemesi:** AYT destek / okul / yorum soruları

**Öğrenme çıktıları**
- `KİM.11.3.1` — Evsel atıklardan fermantasyon gibi süreçlerle yeşil hidrojen üretimine yönelik hipotez geliştirir.
- `KİM.11.3.2` — Nanoteknolojik ürünlerin yarar ve olası zararlarını eleştirel değerlendirir.
- `KİM.11.3.3` — Mikro/nanoplastiklerin çevresel ve biyolojik etkilerini değerlendirir.

**Alt başlıklar**
- Yeşil hidrojen
- Fermantasyon
- Alternatif enerji
- Nanoteknoloji
- Nano malzemeler
- Mikroplastik
- Nanoplastik
- Çevresel sürdürülebilirlik

---

## 2.4 12. Sınıf Kimya

### Tema 1 — Etkileşim
**YKS eşlemesi:** AYT

**Ana içerik:** Elektrokimya

**Alt başlıklar**
- İndirgenme–yükseltgenme
- Yükseltgenme basamağı
- Yarı tepkimeler
- Redoks denkleştirme
- Metallerin aktifliği
- Elektrokimyasal hücreler
- Galvanik pil
- Anot / katot
- Hücre potansiyeli
- Standart elektrot potansiyeli
- Elektroliz
- Faraday yaklaşımı
- Korozyon ve korunma

**Öğrenme çıktısı özeti**
- Redoks süreçlerini elektron alışverişi üzerinden açıklar.
- Yarı tepkimeleri kullanarak elektrokimyasal süreçleri analiz eder.
- Metal aktifliğini karşılaştırır.
- Galvanik ve elektrolitik hücreleri inceler.
- Elektrokimyanın teknoloji ve günlük yaşamdaki uygulamalarını değerlendirir.

---

### Tema 2 — Çeşitlilik
**YKS eşlemesi:** AYT

**Ana içerik:** Organik kimya

**Öğrenme çıktısı başlangıcı:** Sigma ve pi bağlarının incelenmesi

**Alt başlıklar**
- Karbonun bağ yapısı
- Hibritleşme
- Sigma bağı
- Pi bağı
- Molekül geometrisi
- VSEPR yaklaşımı
- Organik bileşiklerin gösterimi
- Yapı formülü
- İzomerlik
- Hidrokarbonlar
- Alkan
- Alken
- Alkin
- Aromatik bileşikler
- Fonksiyonel gruplar
- Alkoller
- Eterler
- Aldehitler
- Ketonlar
- Karboksilik asitler
- Esterler
- Aminler ve diğer temel organik sınıflar
- Organik bileşiklerin adlandırılması ve özellikleri

---

### Tema 3 — Sürdürülebilirlik
**YKS eşlemesi:** AYT destek / okul

**Öğrenme çıktısı kapsamı**
- Yeni nesil enerji ve malzeme teknolojileri
- Boya duyarlı güneş pili gibi sürdürülebilir kimya uygulamaları
- Enerji dönüşüm verimi
- Kimyanın sürdürülebilir teknolojiye katkısı

**Alt başlıklar**
- Güneş enerjisi
- Boya duyarlı güneş pili
- Enerji verimi
- Sürdürülebilir malzeme
- Yeşil teknoloji
- Yaşam döngüsü / çevresel etki yaklaşımı

---

# 3. BİYOLOJİ

## 3.1 9. Sınıf Biyoloji

### Tema 1 — Yaşam
**YKS eşlemesi:** TYT

**Öğrenme çıktıları — özet**
- `BİY.9.1.1` — Biyoloji bilimindeki önemli dönüm noktalarını değerlendirir.
- `BİY.9.1.2` — Bilimin doğasına ilişkin çıkarım yapar.
- `BİY.9.1.3` — Bilimsel çalışmalarda etik ilkeleri değerlendirir.
- `BİY.9.1.4` — Canlıların ortak özelliklerini ve virüslerin konumunu inceler.
- `BİY.9.1.5` — Canlı yapısındaki inorganik moleküllerin görevlerini ilişkilendirir.
- `BİY.9.1.6` — Organik moleküllerin yapı ve işlevlerini karşılaştırır.
- `BİY.9.1.7` — Besinlerdeki biyomolekülleri belirlemeye yönelik deney yapar.
- `BİY.9.1.8` — pH ve sıcaklığın enzim etkinliğine etkisini deneysel olarak inceler.

**Alt başlıklar**
- Biyoloji ve yaşam
- Bilimin doğası
- Bilim etiği
- Canlıların ortak özellikleri
- Hücresel yapı
- Organizasyon
- Metabolizma
- Homeostazi
- Büyüme / gelişme
- Üreme
- Uyarılara tepki
- Adaptasyon
- Virüsler
- Su
- Mineraller
- Karbonhidrat
- Lipit
- Protein
- Enzim
- Nükleik asit
- Vitamin
- ATP'ye giriş
- Enzim aktivitesi
- pH
- Sıcaklık

---

### Tema 2 — Organizasyon
**YKS eşlemesi:** TYT

**Öğrenme çıktıları**
- `BİY.9.2.1` — Hücresel alt birimleri ve aralarındaki ilişkileri açıklar.
- `BİY.9.2.2` — Hücre zarından madde geçişlerini sınıflandırır.
- `BİY.9.2.3` — Difüzyon/osmoz gibi süreçleri deneysel olarak inceler.
- `BİY.9.2.4` — Canlıları sınıflandırma ölçütlerini değerlendirir.
- `BİY.9.2.5` — Üç üst âlem/domain yaklaşımında canlı gruplarını karşılaştırır.
- `BİY.9.2.6` — Biyoçeşitliliği ve önemini değerlendirir.

**Alt başlıklar**
- Prokaryot hücre
- Ökaryot hücre
- Hücre zarı
- Sitoplazma
- Ribozom
- Organeller
- Çekirdek
- Pasif taşıma
- Difüzyon
- Osmoz
- Kolaylaştırılmış difüzyon
- Aktif taşıma
- Endositoz
- Ekzositoz
- Sınıflandırma
- Taksonomi
- Linnaeus
- İkili adlandırma
- Taksonomik kategoriler
- Bacteria
- Archaea
- Eukarya
- Protistler
- Mantarlar
- Bitkiler
- Hayvanlar
- Biyoçeşitlilik

---

## 3.2 10. Sınıf Biyoloji

### Tema 1 — Enerji
**YKS eşlemesi:** TYT + AYT altyapısı

**Öğrenme çıktısı özeti**
- Canlılarda enerji gereksinimini ve ATP'nin rolünü açıklar.
- Fotosentezi modelleyerek ışık enerjisinin kimyasal enerjiye dönüşümünü inceler.
- Fotosentez hızını etkileyen faktörleri değerlendirir.
- Kemosentezi fotosentezle karşılaştırır.
- Sindirim olayını ve sindirim sistemlerindeki uyarlanmaları inceler.
- Hücresel solunum ve fermantasyon yoluyla enerji üretimini açıklar.

**Alt başlıklar**
- ATP
- Enerji dönüşümü
- Ototrof / heterotrof
- Fotosentez
- Kloroplast
- Pigment
- Işığa bağımlı reaksiyonlar
- Karbon bağlanması
- Fotosentez hızını etkileyen faktörler
- Kemosentez
- Beslenme
- Sindirim
- Hücre içi / hücre dışı sindirim
- Aerobik solunum
- Glikoliz
- Krebs döngüsü
- ETS
- Fermantasyon
- Enerji verimi

---

### Tema 2 — Ekoloji
**YKS eşlemesi:** TYT ağırlıklı; AYT destek

**Öğrenme çıktıları**
- `BİY.10.2.1` — Ekosistemde biyotik ve abiyotik bileşenlerin ilişkisini değerlendirir.
- `BİY.10.2.2` — Popülasyon ve komünite etkileşimleri ile değişimleri analiz eder.
- `BİY.10.2.3` — Ekosistemde enerji akışına ilişkin çıkarım yapar.
- `BİY.10.2.4` — Madde döngülerini modelleyerek açıklar.
- `BİY.10.2.5` — Ekolojik sürdürülebilirliğin önemini değerlendirir.
- `BİY.10.2.6` — Sürdürülebilirliği sınırlayan çevresel durumları inceler.
- `BİY.10.2.7` — Ekolojik ayak izi üzerinden bireysel/toplumsal etkileri değerlendirir.
- `BİY.10.2.8` — Doğal kaynakların ve biyoçeşitliliğin korunmasına yönelik çözüm geliştirir.
- `BİY.10.2.9` — Atık yönetimine yönelik sürdürülebilir yaklaşımları değerlendirir.

**Alt başlıklar**
- Ekosistem
- Biyotik faktör
- Abiyotik faktör
- Habitat
- Ekolojik niş
- Popülasyon
- Komünite
- Tür içi etkileşimler
- Türler arası etkileşimler
- Rekabet
- Av-avcı
- Mutualizm
- Parazitizm
- Süksesyon
- Popülasyon dinamiği
- Besin zinciri
- Besin ağı
- Ekolojik piramit
- Enerji akışı
- Biyolojik birikim
- Su döngüsü
- Karbon döngüsü
- Azot döngüsü
- Habitat kaybı
- Kirlilik
- Ekolojik ayak izi
- Doğal kaynakların korunması
- Atık yönetimi
- Geri dönüşüm

---

## 3.3 11. Sınıf Biyoloji

### Tema 1 — Tepki
**YKS eşlemesi:** AYT

**Öğrenme çıktıları — özet**
- `BİY.11.1.1` — Canlılarda uyarılara verilen tepkileri karşılaştırır.
- `BİY.11.1.2` — Bitki hormonlarının etkilerini açıklar.
- `BİY.11.1.3` — Bitkilerde tepki mekanizmalarını sınıflandırır.
- `BİY.11.1.4` — Tropizma davranışını deneysel olarak inceler.
- `BİY.11.1.5` — Duyu reseptörleri ve duyu organlarının işleyişini değerlendirir.
- `BİY.11.1.6` — Hayvanlardaki sinir sistemi çeşitliliğini karşılaştırır.
- `BİY.11.1.7` — İnsan sinir sisteminin yapı ve işleyişini açıklar.
- `BİY.11.1.8` — Refleks mekanizmasını analiz eder.
- `BİY.11.1.9` — İskelet, kas ve eklemlerin koordinasyonunu açıklar.
- `BİY.11.1.10` — İskelet kası kasılmasını modelleyerek açıklar.
- `BİY.11.1.11` — Bağışıklığı sınıflandırır.
- `BİY.11.1.12` — Alerjik tepkileri bağışıklık sistemiyle ilişkilendirir.

**Alt başlıklar**
- Bitkisel hormonlar
- Oksin
- Giberellin
- Sitokinin
- Etilen
- ABA
- Tropizma
- Nasti
- Reseptör
- Duyu organları
- Nöron
- Aksiyon potansiyeli
- Sinaps
- Merkezi sinir sistemi
- Çevresel sinir sistemi
- Refleks yayı
- İskelet
- Eklem
- Kas
- Kasılma mekanizması
- Aktin / miyozin
- Doğuştan bağışıklık
- Kazanılmış bağışıklık
- Antijen / antikor
- Alerji

---

### Tema 2 — Homeostazi
**YKS eşlemesi:** AYT

**Öğrenme çıktıları**
- `BİY.11.2.1` — Homeostazinin canlılık için önemini değerlendirir.
- `BİY.11.2.2` — Homeostatik süreçleri açıklar.
- `BİY.11.2.3` — Pozitif ve negatif geri bildirim mekanizmalarını karşılaştırır.
- `BİY.11.2.4` — Sinir sisteminin homeostazideki rolünü analiz eder.
- `BİY.11.2.5` — Endokrin sistemin homeostazideki rolünü analiz eder.
- `BİY.11.2.6` — Dolaşım sisteminin homeostazideki rolünü değerlendirir.
- `BİY.11.2.7` — Solunum sisteminin homeostazideki rolünü değerlendirir.
- `BİY.11.2.8` — Boşaltım sisteminin homeostazideki rolünü değerlendirir.
- `BİY.11.2.9` — Sistemlerin koordinasyonunu bütüncül olarak yorumlar.
- `BİY.11.2.10` — Homeostazi bozuklukları/sağlık sorunlarına yönelik hipotez geliştirir.

**Alt başlıklar**
- Homeostazi
- Negatif geri bildirim
- Pozitif geri bildirim
- Hipotalamus
- Hipofiz
- Endokrin bezler
- Hormonlar
- Kan
- Kalp
- Damarlar
- Lenf
- Solunum
- Gaz alışverişi
- Böbrek
- Nefron
- Su-tuz dengesi
- Kan şekeri
- Diyabet mellitus
- Diyabet insipidus
- Kan basıncı
- Obezite
- Sistemler arası koordinasyon

---

## 3.4 12. Sınıf Biyoloji

### Tema 1 — Üreme
**YKS eşlemesi:** AYT

**Öğrenme çıktıları**
- `BİY.12.1.1` — Hücre bölünmesi ve üremenin canlılık için önemini değerlendirir.
- `BİY.12.1.2` — Genetik materyalin hücredeki organizasyonunu açıklar.
- `BİY.12.1.3` — Hücre döngüsü, mitoz ve mayozu karşılaştırır.
- `BİY.12.1.4` — Ayrılmama olayının sonuçlarını değerlendirir.
- `BİY.12.1.5` — Gamet oluşumunu açıklar.
- `BİY.12.1.6` — Eşeysiz ve eşeyli üremeyi karşılaştırır.
- `BİY.12.1.7` — İnsanda dişi/erkek üreme sistemini inceler.
- `BİY.12.1.8` — Embriyonik gelişim sürecini açıklar.
- `BİY.12.1.9` — Çiçeğin üremeyle ilişkili yapılarını değerlendirir.
- `BİY.12.1.10` — Çimlenmeyi etkileyen faktörleri deneysel olarak inceler.

**Alt başlıklar**
- Hücre döngüsü
- Kromozom
- Mitoz
- Mayoz
- Crossing-over
- Homolog kromozom
- Ayrılmama
- Eşeysiz üreme
- Bölünme
- Tomurcuklanma
- Rejenerasyon
- Vejetatif üreme
- Sporla üreme
- Gametogenez
- Spermatogenez
- Oogenez
- Döllenme
- İnsan üreme sistemi
- Menstrual döngü
- Embriyonik gelişim
- Kısırlık/üreme sağlığına ilişkin temel kavramlar
- Çiçek
- Tozlaşma
- Döllenme
- Tohum
- Meyve
- Çimlenme

---

### Tema 2 — Kalıtım ve Biyoteknoloji
**YKS eşlemesi:** AYT

**Öğrenme çıktıları**
- `BİY.12.2.1` — Nükleik asitlerin yapı ve özelliklerini karşılaştırır.
- `BİY.12.2.2` — DNA replikasyonunu modelleyerek açıklar.
- `BİY.12.2.3` — Gen ifadesi sürecini açıklar.
- `BİY.12.2.4` — Genetik değişimlerin canlılar üzerindeki etkilerini değerlendirir.
- `BİY.12.2.5` — Mendel ilkelerine dayalı kalıtım problemlerini çözer.
- `BİY.12.2.6` — Eş baskınlık ve çok alellilik gibi kalıtım örüntülerini deneysel/veriye dayalı inceler.
- `BİY.12.2.7` — Eşeye bağlı kalıtımı analiz eder.
- `BİY.12.2.8` — Genetik test ve danışmanlık süreçlerini değerlendirir.
- `BİY.12.2.9` — Biyoteknolojinin farklı alanlardaki kullanımını analiz eder.
- `BİY.12.2.10` — Biyoteknolojik uygulamaları etik açıdan değerlendirir.

**Alt başlıklar**
- DNA
- RNA
- Nükleotit
- Replikasyon
- Gen
- Genetik kod
- Transkripsiyon
- Translasyon
- Protein sentezi
- Mutasyon
- Modifikasyon / çevresel etkiler
- Mendel
- Monohibrit
- Dihibrit
- Test çaprazlaması
- Eksik baskınlık
- Eş baskınlık
- Çok alellilik
- Kan grupları
- Eşeye bağlı kalıtım
- Soy ağacı
- Genetik test
- Genetik danışmanlık
- Rekombinant DNA
- Gen aktarımı
- Gen düzenleme kavramına giriş
- Biyoteknoloji
- Tıp biyoteknolojisi
- Tarım biyoteknolojisi
- Endüstriyel biyoteknoloji
- Çevresel biyoteknoloji
- Adli biyoteknoloji
- Biyoetik

---

# 4. TÜRK DİLİ VE EDEBİYATI (TDE)

## 4.0 TDE programının ortak beceri yapısı

TDE temalarında öğrenme çıktıları genel olarak dört ana dil becerisi altında örgütlenir:

- `TDE1.x` — Dinleme / izleme
- `TDE2.x` — Okuma
- `TDE3.x` — Konuşma
- `TDE4.x` — Yazma

**YKS eşlemesi**
- TYT Türkçe: anlam, paragraf, sözcük/cümle, dil bilgisi, metin okuma ve yorumlama becerileriyle güçlü örtüşme
- AYT TDE: edebî türler, dönemler, eser/yazar bağlamı, metin çözümleme ve edebiyat bilgisiyle güçlü örtüşme
- Yeni Maarif Modeli beceri temelli olduğu için birçok tema hem TYT hem AYT'ye dolaylı katkı sağlar.

---

## 4.1 9. Sınıf Türk Dili ve Edebiyatı

### Tema 1 — Sözün İnceliği
**YKS eşlemesi:** TYT ağırlıklı + AYT edebiyat altyapısı

**Metin / etkinlik odağı**
- Şiir
- Deneme
- Söyleşi / mülakat dinleme-izleme
- Betimleyici paragraf
- Sözlü anlatım / ikna

**Öğrenme çıktısı özeti**
- Dinlenen/izlenen içerikte ileti ve anlamı çözümler.
- Şiir ve deneme metinlerini yapı, anlam, dil ve estetik özellikler bakımından inceler.
- Sözlü anlatımda düşünceyi amaca ve dinleyiciye uygun biçimde ifade eder.
- Şiirsel ve betimleyici yazma çalışmaları yapar.

**Alt başlıklar**
- Edebiyat ve güzel sanatlar
- Edebî dil / günlük dil
- Açık ileti / örtük ileti
- Gerçeklik / kurmaca
- Hayal
- İmge
- Simge
- Çağrışım
- Tema
- Konu
- Şiir dili
- Üslup
- Akıcılık
- Yaratıcılık

---

### Tema 2 — Anlam Arayışı
**YKS eşlemesi:** TYT + AYT

**Metin odağı**
- Hikâye
- Anı
- Şiir
- İstiklâl Marşı ara metni/bağlamı
- Karakter sunumu
- Şiir yazma

**Öğrenme çıktısı özeti**
- Metnin konusu, ana duygusu/ana düşüncesi ve iletilerini belirler.
- Anlatıcının/yazarın tutumunu yorumlar.
- Hikâye ve anı türlerinin özelliklerini karşılaştırır.
- Sözlü ve yazılı anlatımda metin çözümleme bulgularını kullanır.

**Alt başlıklar**
- Konu
- Tema
- Ana düşünce
- Ana duygu
- Açık / örtük ileti
- Yazar tutumu
- Hikâye
- Anı
- Karakter
- Bağlam
- Ses bilgisi
- Türkçenin ses özellikleri
- Yazım ve söyleyiş ilişkisi

---

### Tema 3 — Anlamın Yapı Taşları
**YKS eşlemesi:** TYT çok güçlü + AYT metin çözümleme

**Metin odağı**
- Hikâye
- Gezi yazısı
- Şiir ara metni
- Kültürel belgesel
- İnfografik yazma
- Mekân karşılaştırmalı sözlü anlatım

**Öğrenme çıktısı özeti**
- Metnin yapı unsurlarını belirler.
- Olay örgüsü, kişi, zaman ve mekân arasındaki ilişkiyi inceler.
- Anlatıcı ve bakış açısını değerlendirir.
- Bilgiyi görsel/infografik biçimde düzenler.
- Karşılaştırmalı sözlü anlatım yapar.

**Alt başlıklar**
- Olay örgüsü
- Kişi / karakter
- Zaman
- Mekân
- Anlatıcı
- Bakış açısı
- Betimleme
- Öyküleme
- Gezi yazısı
- Görsel okuryazarlık
- Bilgi düzenleme
- İnfografik

---

### Tema 4 — Dilin Zenginliği
**YKS eşlemesi:** TYT + AYT

**Metin odağı**
- Roman
- Tiyatro
- Eleştiri
- Otobiyografi
- Sosyal medya dili ile edebî dil karşılaştırması
- Otobiyografik yazma

**Öğrenme çıktısı özeti**
- Roman ve tiyatro gibi kurmaca türleri yapı ve anlatım bakımından inceler.
- Eleştirel okuma yapar.
- Dilin farklı iletişim ortamlarındaki kullanımını karşılaştırır.
- Kişisel yaşam deneyimini planlı bir metne dönüştürür.

**Alt başlıklar**
- Roman
- Tiyatro
- Eleştiri
- Otobiyografi
- Kurmaca
- Anlatım biçimleri
- Dil ve bağlam
- Sosyal medya dili
- Edebî dil
- Söz varlığı
- Üslup
- Metinler arası ilişki

---

## 4.2 10. Sınıf Türk Dili ve Edebiyatı

### Tema 1 — Sözün Ezgisi
**YKS eşlemesi:** AYT TDE + TYT şiir/metin yorumlama

**Metin odağı**
- Koşuk
- Türkü
- Koşma
- Ninni
- Şiir dinletisi
- Halk anlatısı / masal bağlamı
- Görsel şerit / film şeridi

**Alt başlıklar**
- Sözlü kültür
- Halk edebiyatı
- Anonim ürün
- Nazım
- Ezgi
- Ahenk
- Ölçü
- Kafiye / redif
- Gelenek
- Varyant
- Koşuk
- Koşma
- Türkü
- Ninni

---

### Tema 2 — Kelimelerin Ritmi
**YKS eşlemesi:** AYT TDE

**Metin odağı**
- Gazel
- Saf şiir örnekleri
- Kaside ara metni
- Söyleşi dinleme/izleme
- Edebî şahsiyet podcast/sunum
- Bilgilendirici metni edebî metne dönüştürme

**Öğrenme çıktısı özeti**
- Şiirde ritim ve ahenk unsurlarını çözümler.
- Farklı şiir geleneklerini karşılaştırır.
- Edebî şahsiyet/şiir hakkında sözlü içerik üretir.
- Metin türleri arasında dönüştürme yapar.

**Alt başlıklar**
- Gazel
- Kaside
- Divan şiiri
- Saf şiir
- Aruz
- Ölçü
- Kafiye
- Redif
- Nazım birimi
- Ahenk
- İmge
- Mazmun kavramına giriş
- Şiir geleneği

---

### Tema 3 — Dünden Bugüne
**YKS eşlemesi:** AYT TDE

**Metin odağı**
- Destan
- Mesnevi
- Halk hikâyesi
- Fabl
- Türk destanları
- Fabl yazma

**Öğrenme çıktısı özeti**
- Edebî türlerin tarihsel değişim ve dönüşümünü yorumlar.
- Sözlü ve yazılı kültür ürünlerini karşılaştırır.
- Motif ve anlatı yapısını inceler.
- Öğretici/alegorik anlatım özelliklerini değerlendirir.

**Alt başlıklar**
- Destan
- Doğal / yapma destan
- Motif
- Sözlü gelenek
- Mesnevi
- Halk hikâyesi
- Fabl
- Didaktik anlatım
- Kültürel aktarım
- Edebî değişim / dönüşüm

---

### Tema 4 — Nesillerin Mirası
**YKS eşlemesi:** AYT TDE çok güçlü

**Metin odağı**
- Dede Korkut Hikâyeleri
- Tanzimat dönemi şiiri
- Servetifünun romanı
- Fecriati şiiri
- Millî Edebiyat hikâyesi
- Dramatizasyon
- Tür dönüştürme

**Öğrenme çıktısı özeti**
- Edebî metni oluştuğu dönemin sosyal ve kültürel özellikleriyle ilişkilendirir.
- Türk edebiyatındaki dönemler arası değişimi karşılaştırır.
- Kültürel mirasın metinler aracılığıyla aktarımını değerlendirir.
- Metinleri farklı tür ve anlatım ortamlarına dönüştürür.

**Alt başlıklar**
- Dede Korkut
- Geçiş dönemi anlatıları
- Tanzimat
- Servetifünun
- Fecriati
- Millî Edebiyat
- Dönem
- Zihniyet
- Gelenek
- Değişim
- Kültürel miras
- Edebiyat-toplum ilişkisi

---

## 4.3 11. Sınıf Türk Dili ve Edebiyatı

### Tema 1 — Bir Diyeceğim Var!
**YKS eşlemesi:** TYT dil/iletişim + AYT tür bilgisi

**Metin odağı**
- Karagöz
- Mektup
- Dilekçe ara metni
- Çok modlu iletişim
- İletişim engelleri üzerine drama
- E-posta yazma

**Alt başlıklar**
- İletişim
- Gönderici / alıcı
- İleti
- Bağlam
- Kanal
- Sözlü / yazılı / görsel iletişim
- Karagöz
- Geleneksel Türk tiyatrosu
- Mektup
- Dilekçe
- E-posta
- Resmî / özel anlatım
- Fiilimsi ve dil bilgisi uygulamaları

---

### Tema 2 — Kültür Yolculuğu
**YKS eşlemesi:** AYT TDE

**Metin odağı**
- Türk dünyası hikâyesi
- Orhun Yazıtları
- Anı
- Dîvânu Lugâti't-Türk
- Âşık atışması
- Türk dünyası kültürü sunumu
- Sanal/çevrim içi müze deneyimi yazısı

**Alt başlıklar**
- Türk dünyası
- Orhun Yazıtları
- Dîvânu Lugâti't-Türk
- İlk Türkçe eserler
- Kültür
- Dil-kültür ilişkisi
- Âşıklık geleneği
- Anı
- Tarihî metin
- Sözlü kültür
- Kip / çatı gibi dil bilgisi uygulamaları

---

### Tema 3 — Yaşamın İzinde
**YKS eşlemesi:** TYT + AYT

**Genel odak**
- Yaşam deneyimlerini yansıtan edebî ve öğretici metinler
- Birey, çevre ve toplumsal yaşam ilişkisi
- Okuma, dinleme/izleme, konuşma ve yazma becerilerinin bütünleştirilmesi

**Alt başlıklar**
- Ana düşünce / tema
- Metin yapısı
- Birey ve toplum
- Yaşam deneyimi
- Anlatıcı / bakış açısı
- Üslup
- Metin karşılaştırma
- Kanıt kullanma
- Sözlü sunum
- Planlı yazma

---

### Tema 4 — Hayatın Aynası
**YKS eşlemesi:** AYT TDE + TYT yorum

**Genel odak**
- Günlük hayatı ve toplumsal ilişkileri yansıtan edebî metinler
- Tiyatro ve dramatik anlatım
- Edebiyatın yaşamı yansıtma ve dönüştürme işlevi

**Alt başlıklar**
- Tiyatro
- Dramatik yapı
- Çatışma
- Kişi
- Diyalog
- Sahne
- Toplum
- Gerçeklik / kurmaca
- Edebiyat-hayat ilişkisi
- Eleştirel yorum

---

## 4.4 12. Sınıf Türk Dili ve Edebiyatı

### Tema 1 — Benim Yolculuğum
**YKS eşlemesi:** TYT + AYT

**Metin odağı**
- Günlük
- Şiir
- Blog
- Hikâye
- Kişisel gelişim söyleşisi
- Kişisel gelişim sunumu
- Gelecek planı / forum yazısı

**Alt başlıklar**
- Günlük
- Blog
- Otobiyografik anlatım
- Kişisel anlatım
- İçtenlik
- Üslup
- Ton
- Bağdaşıklık
- Tutarlılık
- Öz değerlendirme
- Gelecek planı

---

### Tema 2 — Toplumun Ahengi
**YKS eşlemesi:** AYT TDE + TYT eleştirel okuma

**Metin odağı**
- Roman
- Makale
- Hak ve özgürlükler konulu haber
- Haber sunumu
- Roman eleştirisi

**Öğrenme çıktısı özeti**
- Edebî ve öğretici metinleri toplumsal bağlamlarıyla analiz eder.
- Bilgi, görüş ve kanıt arasındaki farkı değerlendirir.
- Haber sunumu gibi sözlü anlatım türlerinde nesnellik ve kaynak kullanımını gözetir.
- Okuduğu eser üzerine eleştirel metin yazar.

**Alt başlıklar**
- Roman
- Makale
- Haber
- Eleştiri
- Toplum
- Hak ve özgürlük
- Nesnellik / öznellik
- Kanıt
- Kaynak gösterme
- Özgünlük
- İntihalden kaçınma
- Eleştirel okuma

---

### Tema 3 — Hayatın Dengesi
**YKS eşlemesi:** TYT yorum + AYT edebiyat

**Genel odak**
- Yaşam kalitesi
- Birey-toplum dengesi
- İnsan ve diğer canlılarla ilişkiler
- Edebî metinler üzerinden değer, sorumluluk ve yaşamın çok yönlülüğü

**Alt başlıklar**
- Yaşam kalitesi
- İnsan ve toplum
- Doğa ve canlılar
- Değerler
- Sorumluluk
- Empati
- Metin analizi
- Karşılaştırma
- Eleştirel değerlendirme
- Sözlü/yazılı ifade

---

### Tema 4 — Hayalimdeki Yarın
**YKS eşlemesi:** TYT + AYT destek

**Metin odağı**
- Bilimsel makale
- Hikâye
- Öz geçmiş
- Mülakat
- Meslek profesyonelleriyle görüşme/sunum
- İdeal meslek / gelecek yazısı

**Alt başlıklar**
- Bilimsel metin
- Bilimsel makale
- Hikâye
- Öz geçmiş / CV
- Mülakat
- Kariyer
- Gelecek tasarımı
- Bilgi doğrulama
- Kaynak kullanımı
- Sunum
- Planlı yazma

---

# 5. TYT–AYT OPERASYONEL KONU HARİTASI

> Bu bölüm soru üretme / etiketleme sistemi için pratik eşlemedir. ÖSYM'nin resmî kazanım tablosu değildir.

## 5.1 Fizik

### TYT çekirdek
- Fizik bilimine giriş
- Nicelikler ve birimler
- Skaler / vektörel büyüklükler
- Hareketin temel kavramları
- Basınç
- Kaldırma kuvveti
- Isı / sıcaklık / genleşme ve enerji temelleri
- İş / güç / enerji
- Basit elektrik devreleri
- Dalgaların temel kavramları
- Temel optik

### AYT ağırlıklı
- İleri hareket ve atışlar
- Newton yasaları
- Sürtünme
- Limit hız
- Düzgün çembersel hareket
- Elektrik alan / potansiyel
- Manyetizma
- İndüksiyon / alternatif akım / transformatör
- Aynalar / kırılma / mercekler ayrıntısı
- Tork / denge
- İtme / momentum
- Açısal momentum
- İleri enerji sistemleri
- Kırınım / girişim / elektromanyetik dalgalar
- Modern fizik
- Atom / çekirdek / nükleer fizik

---

## 5.2 Kimya

### TYT çekirdek
- Kimya bilimi ve güvenlik
- Atom modelleri
- Elektron dizilimi
- Periyodik sistem
- Kimyasal bağlar / etkileşimler
- Mol
- Kimyasal tepkimeler
- Stokiyometri temelleri
- Gazların temel özellikleri
- Çözeltiler / derişim
- Çevre ve sürdürülebilir kimya bağlamları

### AYT ağırlıklı
- Gaz hesapları ileri düzey
- Çözelti ve koligatif özellikler
- Termokimya
- Tepkime hızı
- Kimyasal denge
- Asit-baz dengesi
- Çözünürlük dengesi
- Elektrokimya
- Organik kimya
- Sürdürülebilir enerji/malzeme uygulamaları

---

## 5.3 Biyoloji

### TYT çekirdek
- Biyoloji ve canlıların ortak özellikleri
- Temel bileşikler
- Enzimler
- Hücre ve organeller
- Hücre zarından madde geçişleri
- Canlıların sınıflandırılması
- Biyoçeşitlilik
- Enerji dönüşümlerine giriş
- Fotosentez / solunum temelleri
- Ekoloji
- Madde döngüleri
- Çevre / sürdürülebilirlik

### AYT ağırlıklı
- Fotosentez ve solunum ayrıntısı
- Bitki hareketleri ve hormonlar
- Sinir sistemi
- Duyu organları
- Destek-hareket sistemi
- Bağışıklık
- Endokrin sistem
- Dolaşım / solunum / boşaltım ve homeostazi
- Hücre bölünmeleri
- Üreme / gelişme
- Bitkilerde üreme
- DNA / RNA
- Protein sentezi
- Mendel genetiği
- Modern kalıtım örüntüleri
- Biyoteknoloji / biyoetik

---

## 5.4 Türkçe / Türk Dili ve Edebiyatı

### TYT Türkçe odakları
- Sözcükte anlam
- Cümlede anlam
- Paragraf
- Ana düşünce / yardımcı düşünce
- Konu / tema
- Çıkarım
- Metin yapısı
- Anlatım biçimleri
- Düşünceyi geliştirme yolları
- Sözel mantık / bilgi düzenleme
- Yazım
- Noktalama
- Ses bilgisi
- Sözcük türleri ve yapı bilgisi
- Fiilimsi
- Cümle bilgisi
- Anlatım bozukluğu
- Metin türleri
- Görsel / çok modlu okuma
- Eleştirel okuma

### AYT Türk Dili ve Edebiyatı odakları
- Şiir bilgisi
- Nazım biçimleri
- Ölçü / kafiye / redif
- Halk edebiyatı
- Divan edebiyatı
- Destan / halk hikâyesi / mesnevi
- Geçiş dönemi ve ilk Türkçe eserler
- Tanzimat edebiyatı
- Servetifünun
- Fecriati
- Millî Edebiyat
- Cumhuriyet dönemi bağlamları
- Roman / hikâye / tiyatro / şiir / öğretici metinler
- Edebiyat-toplum ilişkisi
- Metin çözümleme
- Yazar-eser-dönem ilişkisi
- Edebî akım / anlayış / gelenek bağlamları

---

# 6. SORU ÜRETİM SİSTEMİ İÇİN ETİKET ÖNERİLERİ

Her soru kaydı için aşağıdaki alanlar önerilir:

```yaml
id: FIZ-11-U03-FIZ.11.3.10-0001
ders: Fizik
sinif: 11
unite_tema: Optik
ogrenme_ciktisi: FİZ.11.3.10
alt_konu: Merceklerde görüntü
yks:
  oturum: AYT
  onem: yuksek
zorluk: orta
soru_tipi: coktan_secmeli
beceriler:
  - modelleme
  - grafik_yorumlama
  - nicel_akil_yurutme
baglam: saf_geometri_optik
gorsel_gerekli: true
```

Kimya örneği:

```yaml
id: KIM-10-T02-KIM.10.2.7-0001
ders: Kimya
sinif: 10
tema: Çeşitlilik
ogrenme_ciktisi: KİM.10.2.7
alt_konu: Molarite
yks:
  oturum: TYT+AYT
soru_tipi: coktan_secmeli
beceriler:
  - matematiksel_islem
  - oran_oranti
```

Biyoloji örneği:

```yaml
id: BIO-12-T02-BIY.12.2.5-0001
ders: Biyoloji
sinif: 12
tema: Kalıtım ve Biyoteknoloji
ogrenme_ciktisi: BİY.12.2.5
alt_konu: Mendel genetiği
yks:
  oturum: AYT
beceriler:
  - kalitim_tablosu
  - olasilik
  - veri_yorumlama
```

TDE örneği:

```yaml
id: TDE-10-T03-TDE2.3-0001
ders: Türk Dili ve Edebiyatı
sinif: 10
tema: Dünden Bugüne
beceri_alani: Okuma
alt_konu: Destan
yks:
  oturum: AYT
beceriler:
  - metin_cozumleme
  - tur_bilgisi
  - baglam_kurma
```

---

# 7. ÖNERİLEN ZORLUK VE SORU TİPİ TAKSONOMİSİ

## Zorluk
- `1_temel_bilgi`
- `2_dogrudan_uygulama`
- `3_cok_adimli`
- `4_yeni_nesil_baglam`
- `5_ileri_akil_yurutme`

## Soru tipi
- `kavram`
- `islem`
- `grafik`
- `tablo`
- `deney`
- `gorsel`
- `metin_yorum`
- `cikarim`
- `modelleme`
- `karsilastirma`
- `hata_bulma`
- `gunluk_yasam`
- `disiplinlerarasi`

## Görsel etiketi
- `gorselsiz`
- `sema`
- `grafik`
- `tablo`
- `geometri`
- `deney_duzenegi`
- `biyolojik_sekil`
- `kimyasal_yapi`
- `harita_infografik`
- `metin_gorseli`

---

# 8. RESMÎ KAYNAK DİZİNİ

## MEB — Türkiye Yüzyılı Maarif Modeli
- Ana portal: https://tymm.meb.gov.tr/
- Ortaöğretim öğretim programları: https://mufredat.meb.gov.tr/
- Fizik programı: Türkiye Yüzyılı Maarif Modeli / Fizik dersi 9–12 sınıf sayfaları
- Kimya programı: Türkiye Yüzyılı Maarif Modeli / Kimya dersi 9–12 sınıf sayfaları
- Biyoloji programı: Türkiye Yüzyılı Maarif Modeli / Biyoloji dersi 9–12 sınıf sayfaları
- Türk Dili ve Edebiyatı programı: Türkiye Yüzyılı Maarif Modeli / TDE 9–12 sınıf sayfaları

## ÖSYM — YKS
- 2026 YKS kılavuzu ve sınav duyuruları: https://www.osym.gov.tr/
- TYT, AYT ve YDT soru kitapçıkları/cevap anahtarları: ÖSYM YKS duyuruları

---

# 9. HIZLI İNDEKS

## Fizik
- 9: Fizik Bilimi ve Kariyer Keşfi / Kuvvet ve Hareket / Akışkanlar / Enerji
- 10: Kuvvet ve Hareket / Enerji / Elektrik / Dalgalar
- 11: Kuvvet ve Hareket / Elektrik ve Manyetizma / Optik
- 12: Kuvvet ve Hareket / Enerji / Dalgalar / Madde ve Doğası

## Kimya
- 9: Etkileşim / Çeşitlilik / Sürdürülebilirlik
- 10: Etkileşim / Çeşitlilik / Sürdürülebilirlik
- 11: Etkileşim / Çeşitlilik / Sürdürülebilirlik
- 12: Etkileşim / Çeşitlilik / Sürdürülebilirlik

## Biyoloji
- 9: Yaşam / Organizasyon
- 10: Enerji / Ekoloji
- 11: Tepki / Homeostazi
- 12: Üreme / Kalıtım ve Biyoteknoloji

## Türk Dili ve Edebiyatı
- 9: Sözün İnceliği / Anlam Arayışı / Anlamın Yapı Taşları / Dilin Zenginliği
- 10: Sözün Ezgisi / Kelimelerin Ritmi / Dünden Bugüne / Nesillerin Mirası
- 11: Bir Diyeceğim Var! / Kültür Yolculuğu / Yaşamın İzinde / Hayatın Aynası
- 12: Benim Yolculuğum / Toplumun Ahengi / Hayatın Dengesi / Hayalimdeki Yarın

---

# 10. VERİYİ GELİŞTİRMEK İÇİN SONRAKİ AŞAMALAR

Bu dosya bir soru üretim / RAG sistemine dönüştürülecekse her öğrenme çıktısı için ayrıca şu alanların tutulması önerilir:

```yaml
resmi_kod:
resmi_sinif:
resmi_unite_tema:
resmi_icerik_cercevesi:
alt_konular:
anahtar_kavramlar:
on_kosul_konular:
sonraki_konular:
tyt_ayt_etiketi:
osym_soru_stili:
beklenen_bilissel_duzey:
tipik_yanilgi:
soru_uretme_kisitlari:
gorsel_sablonu:
cozum_sablonu:
kaynak_url:
program_surumu:
```

Bu yapı sayesinde sistemde örneğin:

```text
"11. sınıf Fizik → Optik → FİZ.11.3.10 → AYT → orta zorluk →
mercek görselli → 5 seçenekli → tek doğru → MEB dili"
```

gibi doğrudan hedefli soru üretimi yapılabilir.

---

## Son not

Bu dosya **müfredat indeksi + soru üretim taksonomisi** olarak tasarlanmıştır. Resmî programın her cümlesini birebir çoğaltmak yerine, yapay zekâ/RAG ve soru bankası sisteminde işe yarayacak biçimde ünite–tema–öğrenme çıktısı–alt konu–YKS ilişkisini tek yerde toplar.
