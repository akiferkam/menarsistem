# Eğitim Soru Görselleri İçin Hibrit AI + SVG Üretim Sistemi

## 1. Amaç

Bu sistemin amacı, Türkiye eğitim sistemi için üretilen soru görsellerini klasik yapay zekâ görsel üretiminden daha kontrollü hâle getirmektir.

Hedef; yapay zekânın sahneyi, nesneleri ve illüstrasyonu üretmesi; fakat soru için kritik olan:

- A, B, C, K, L, M gibi harflerin,
- 1, 2, 3, 4 gibi numaraların,
- `5 km`, `20 N`, `30°`, `2 m/s` gibi sayısal verilerin,
- kuvvet, hız, yer değiştirme gibi okların,
- açıklama kutularının,
- ölçü çizgilerinin,
- grafik eksenlerinin,
- koordinatların,
- tablo ve grid yapılarının

rastgele biçimde image modeline bırakılmamasıdır.

Temel yaklaşım:

> **AI ana görseli üretir. Yazılım kritik eğitim verilerini deterministik olarak SVG/Canvas katmanında yerleştirir.**

Bu sayede görsel daha estetik olurken soru verilerinin yanlış yazılması veya yanlış yere konması engellenir.

---

# 2. Neden Tek Başına Bir Image Model Yetmez?

Image modelleri son yıllarda metin konusunda ciddi biçimde gelişmiş olsa da eğitim sorularında çok küçük bir hata bile sorunun cevabını değiştirebilir.

Örneğin:

- `30°` yerine `80°`,
- `12 N` yerine `21 N`,
- A noktasının B noktasına yazılması,
- K-L-M sırasının bozulması,
- kuvvet okunun ters yöne çizilmesi,
- doğru grafikte yanlış veri etiketinin yer alması

soruyu bilimsel olarak geçersiz hâle getirebilir.

Bu nedenle sistem iki ana katmana ayrılır:

```text
┌───────────────────────────────┐
│       SEMANTİK / AI KATMANI   │
│                               │
│ Sahne, nesneler, arka plan,   │
│ illüstrasyon, gerçekçi/vektör │
│ temel görsel                   │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│   DETERMINİSTİK GRAFİK KATMANI│
│                               │
│ Harf, sayı, ok, ölçü, etiket, │
│ tablo, eksen, açıklama kutusu │
│ SVG/Canvas ile eklenir         │
└───────────────┬───────────────┘
                │
                ▼
          FINAL SORU GÖRSELİ
```

---

# 3. PDF'deki Görsel Tiplerine Göre Sistem İhtiyacı

Referans soru bankasındaki görseller kabaca şu sınıflara ayrılabilir:

## 3.1 Gerçek Nesne + Teknik Callout

Örnek kullanım:

- uçak,
- helikopter,
- araç,
- motor,
- deney düzeneği,
- makine.

Görselde ana nesne AI tarafından oluşturulur.

Ardından:

```text
1 ───────► Ana gövde
2 ───────► Pervane
3 ───────► Motor
```

gibi numaralar ve callout çizgileri yazılım tarafından yerleştirilir.

---

## 3.2 Gerçek Hayat Bağlamı + Sayısal Bilgi

Örnek:

```text
A ● ~~~~~~~~~~~~~~~~~~~~~ ● B
      Gerçek rota
         5 km

A ● --------------------► ● B
     Yer değiştirme
          3 km
```

Harita veya arka plan image modelinden gelebilir.

Ancak:

- A,
- B,
- 5 km,
- 3 km,
- rota çizgisi,
- yön oku

SVG ile eklenmelidir.

---

## 3.3 Teknik Fizik Diyagramı

Örnekler:

- hidrolik lift,
- manometre,
- kaldıraç,
- makara,
- elektrik devresi,
- optik ışın diyagramı,
- yay/sarkaç.

Bunların büyük kısmı image generation yerine doğrudan SVG ile üretilebilir.

AI yalnızca gerekiyorsa arka plan veya stil referansı üretir.

---

## 3.4 Tamamen Matematiksel / Geometrik Görseller

Örnekler:

- koordinat sistemi,
- vektör,
- üçgen,
- çember,
- fonksiyon grafiği,
- kareli düzlem,
- histogram,
- tablo,
- grid.

Bu sınıfta image model kullanmak çoğu zaman gereksizdir.

En doğru çözüm:

```text
Question Spec
     │
     ▼
SVG Renderer
     │
     ▼
PNG / SVG
```

---

## 3.5 Bilimsel İllüstrasyon

Örnek:

- insan vücudu,
- hücre,
- organ,
- bitki,
- hayvan,
- ekosistem,
- kimyasal deney ortamı.

Ana bilimsel illüstrasyonu AI üretebilir.

Etiketler daha sonra eklenir:

```text
          [1]
           │
           ▼
      ┌─────────┐
      │  ORGAN  │
      └─────────┘
           ▲
           │
          [2]
```

---

# 4. Genel Sistem Mimarisi

Önerilen production workflow:

```text
                    QUESTION JSON
                         │
                         ▼
                ┌─────────────────┐
                │ VISUAL PLANNER  │
                │     LLM         │
                └────────┬────────┘
                         │
                         ▼
                VISUAL SPEC JSON
                         │
                         ▼
               ┌──────────────────┐
               │ VISUAL ROUTER    │
               └────────┬─────────┘
                        │
       ┌────────────────┼─────────────────┐
       │                │                 │
       ▼                ▼                 ▼
   IMAGE AI         VECTOR/SVG       HYBRID MODE
       │                │                 │
       ▼                │                 ▼
  BASE IMAGE            │          BASE IMAGE
       │                │                 │
       ▼                │                 ▼
  VISION LOCATOR        │          VISION LOCATOR
       │                │                 │
       └──────────┬─────┴─────────────────┘
                  ▼
           LAYOUT ENGINE
                  │
                  ▼
           SVG OVERLAY
                  │
                  ▼
          VALIDATION ENGINE
                  │
          ┌───────┴────────┐
          │                │
        PASS             REVISE
          │                │
          ▼                └──────► yeniden üret
       EXPORT
          │
       PNG / SVG
```

---

# 5. Sistemin Ana Veri Yapısı

Her soru doğrudan image modele prompt olarak gönderilmemelidir.

Önce standart bir veri formatına dönüştürülmelidir.

Örnek:

```json
{
  "question_id": "FIZ10-VEKTOR-001",
  "subject": "fizik",
  "grade": 10,
  "topic": "hareket",
  "visual_required": true,
  "visual_type": "contextual_diagram",
  "scene": {
    "description": "Şehir haritasında A noktasından B noktasına giden kurye aracı",
    "style": "clean educational illustration",
    "background": "light map interface"
  },
  "objects": [
    {
      "id": "start",
      "type": "location_marker",
      "semantic_name": "başlangıç noktası"
    },
    {
      "id": "finish",
      "type": "location_marker",
      "semantic_name": "bitiş noktası"
    }
  ],
  "overlays": [
    {
      "id": "label_a",
      "type": "label",
      "text": "A",
      "target": "start"
    },
    {
      "id": "label_b",
      "type": "label",
      "text": "B",
      "target": "finish"
    },
    {
      "id": "route_distance",
      "type": "text",
      "text": "5 km",
      "target": "route"
    },
    {
      "id": "displacement",
      "type": "arrow",
      "from": "start",
      "to": "finish",
      "label": "3 km"
    }
  ]
}
```

Bu veri formatına aşağıda **Visual Spec** denilecektir.

---

# 6. Visual Planner

Visual Planner bir LLM'dir.

Görevi görsel çizmek değildir.

Görevi soruyu okuyup hangi görsel bileşenlerinin gerektiğini çıkarmaktır.

Girdi:

```text
Bir araç A noktasından kıvrımlı bir yolu takip ederek
B noktasına gitmektedir.

Alınan yol = 5 km
Yer değiştirme = 3 km
```

Planner çıktısı:

```json
{
  "visual_type": "map_diagram",
  "base_generation": true,
  "objects": [
    "map",
    "road",
    "start_marker",
    "finish_marker"
  ],
  "critical_labels": [
    "A",
    "B",
    "5 km",
    "3 km"
  ],
  "deterministic_elements": [
    "route_line",
    "displacement_arrow",
    "labels"
  ]
}
```

### Kritik kural

Planner şu kararı vermelidir:

> Bir bilgi sorunun cevabını etkiliyorsa mümkün olduğunca AI raster görseline yazdırılmamalıdır.

---

# 7. Visual Router

Visual Router görselin hangi yöntemle üretileceğine karar verir.

Önerilen kategoriler:

| Görsel | Ana yöntem |
|---|---|
| Geometri | SVG |
| Fonksiyon grafiği | SVG |
| Vektör | SVG |
| Tablo | HTML/SVG |
| Devre | SVG |
| Basit fizik diyagramı | SVG |
| İnsan / hayvan | Image AI |
| Gerçekçi günlük hayat sahnesi | Image AI |
| Biyoloji illüstrasyonu | Image AI + SVG |
| Uçak / helikopter callout | Image AI + SVG |
| Deney düzeneği | Recraft/Ideogram veya SVG |
| Infographic | AI + deterministic overlay |

Router çıktısı:

```json
{
  "renderer": "hybrid",
  "base_model": "configured-image-provider",
  "overlay_renderer": "svg"
}
```

Model adı sisteme hard-code edilmemelidir.

Örneğin config:

```yaml
models:
  illustration:
    provider: openai
    model: CURRENT_IMAGE_MODEL

  vector:
    provider: recraft
    model: CURRENT_VECTOR_MODEL

  layout:
    provider: ideogram
    model: CURRENT_LAYOUT_MODEL
```

Böylece ileride daha iyi model çıktığında sistem değiştirilmeden yalnızca config değiştirilir.

---

# 8. İki Farklı Etiket Yerleştirme Stratejisi

Sistemde iki yöntem birlikte kullanılmalıdır.

---

## 8.1 Pre-Planned Layout

Görsel üretilmeden önce etiket bölgeleri belirlenir.

Örneğin:

```json
{
  "canvas": {
    "width": 1200,
    "height": 800
  },
  "reserved_regions": [
    {
      "purpose": "label_A",
      "x": 0.10,
      "y": 0.15,
      "w": 0.12,
      "h": 0.08
    },
    {
      "purpose": "label_B",
      "x": 0.80,
      "y": 0.15,
      "w": 0.12,
      "h": 0.08
    }
  ]
}
```

Image model promptuna:

```text
Keep the upper-left and upper-right annotation zones visually uncluttered.
Do not place important objects in these regions.
```

gibi bilgi verilir.

Avantajı:

Etiketler için daha baştan boş alan bırakılır.

---

# 9. Post-Generation Vision Locator

Ana görsel üretildikten sonra görsel tekrar bir vision modeline gönderilir.

Ama vision modeline:

> Bu görsel güzel mi?

diye sorulmaz.

Çok spesifik koordinat verisi istenir.

Örneğin:

```text
Find:
1. main rotor center
2. engine center
3. tail rotor center

Return normalized coordinates between 0 and 1000.
```

Örnek çıktı:

```json
{
  "targets": [
    {
      "id": "main_rotor",
      "x": 510,
      "y": 190,
      "bbox": [340, 145, 690, 230]
    },
    {
      "id": "engine",
      "x": 570,
      "y": 430,
      "bbox": [490, 380, 670, 480]
    },
    {
      "id": "tail_rotor",
      "x": 890,
      "y": 340,
      "bbox": [840, 285, 940, 395]
    }
  ]
}
```

---

# 10. Normalize Koordinat Sistemi

Pixel koordinatına doğrudan bağımlı kalmamak için sistem 0–1000 koordinat kullanabilir.

```text
0,0 ---------------------- 1000,0
 │                            │
 │                            │
 │                            │
 │                            │
0,1000 ------------------ 1000,1000
```

Örneğin:

```json
{
  "x": 500,
  "y": 250
}
```

görselin:

- yatay olarak ortasında,
- dikey olarak %25 seviyesinde

demektir.

Gerçek pixel:

```javascript
pixelX = x / 1000 * imageWidth;
pixelY = y / 1000 * imageHeight;
```

Bu yöntem farklı çözünürlüklerde aynı layout'u korur.

---

# 11. Label Placement Engine

Vision model hedef nesnenin koordinatını bulur.

Ama doğrudan nesnenin üstüne A yazmak çoğu zaman kötü görünür.

Bu nedenle ayrı bir **Label Placement Engine** gerekir.

Görevi:

1. hedef nesneyi bulmak,
2. etrafındaki boş alanları analiz etmek,
3. en uygun etiket bölgesini seçmek,
4. diğer etiketlerle çakışmayı önlemek,
5. gerekirse callout çizgisi oluşturmaktır.

Örnek:

```text
                 [A]
                  │
                  │
       ───────────●──────────
              PERVANE
```

Burada:

- `●` hedef,
- `[A]` label,
- çizgi callout'tur.

---

# 12. Label Adayları

Her hedef için farklı label pozisyonları denenebilir.

```text
              TOP

               A
               │

 LEFT A ───► TARGET ◄─── A RIGHT

               │
               A

             BOTTOM
```

Örneğin adaylar:

```javascript
candidates = [
  top,
  topRight,
  right,
  bottomRight,
  bottom,
  bottomLeft,
  left,
  topLeft
]
```

Her aday için skor hesaplanır.

---

# 13. Label Skoru

Basit bir skor:

```text
score =
    boş_alan
  - nesne_çakışması
  - diğer_label_çakışması
  - çizgi_uzunluğu
  - canvas_sınır_cezası
```

Daha formel:

```text
Score =
    3 × FreeSpace
  - 5 × ObjectOverlap
  - 8 × LabelOverlap
  - 1 × LeaderLineLength
  - 10 × OutOfBounds
```

En yüksek skorlu bölge kullanılır.

---

# 14. Object Occupancy Map

Daha gelişmiş çözümde vision modeli görselde önemli nesnelerin bounding box'larını verir.

Örneğin:

```json
[
  {
    "object": "helicopter",
    "bbox": [120, 250, 910, 680]
  },
  {
    "object": "rotor",
    "bbox": [290, 120, 720, 250]
  }
]
```

Bu alanlar **occupied** olarak işaretlenir.

Label Engine mümkün olduğunca occupied alanların dışına label koyar.

---

# 15. SVG Overlay

Tüm kritik veriler final aşamada SVG ile eklenir.

Basit örnek:

```html
<svg width="1200" height="800">

  <image
    href="base-image.png"
    width="1200"
    height="800"
  />

  <circle
    cx="610"
    cy="100"
    r="24"
    fill="white"
    stroke="black"
  />

  <text
    x="610"
    y="108"
    text-anchor="middle"
    font-size="24"
  >
    A
  </text>

  <line
    x1="610"
    y1="124"
    x2="610"
    y2="190"
    stroke="black"
    stroke-width="2"
  />

</svg>
```

Bu yöntemde A harfinin yanlış çıkma ihtimali yoktur.

Çünkü AI yazmıyor.

Tarayıcı/font renderer yazıyor.

---

# 16. Text Box Sistemi

Uzun açıklamalar için:

```text
┌────────────────────────────┐
│ 2                          │
│ Motor şaftına bağlı rotor  │
│ sistemi                    │
└─────────────┬──────────────┘
              │
              ▼
            MOTOR
```

Text box otomatik boyutlandırılır.

```javascript
boxWidth = maxTextWidth + padding * 2;
boxHeight = lineCount * lineHeight + padding * 2;
```

---

# 17. Callout Routing

Callout çizgisinin doğrudan başka nesnenin üzerinden geçmemesi gerekir.

Basit sistem:

```text
LABEL ───────── TARGET
```

Daha profesyonel sistem:

```text
LABEL ─────┐
           │
           └──────── TARGET
```

Orthogonal routing kullanılabilir.

Daha ileride:

- A* path finding,
- obstacle avoidance,
- visibility graph

kullanılabilir.

MVP için buna gerek yoktur.

---

# 18. Ok Sistemi

Kuvvet, hız, hareket ve yer değiştirme gibi oklar AI'ya bırakılmamalıdır.

Örnek:

```svg
<defs>
  <marker
    id="arrow"
    markerWidth="10"
    markerHeight="10"
    refX="9"
    refY="3"
    orient="auto"
  >
    <path d="M0,0 L0,6 L9,3 z" />
  </marker>
</defs>

<line
  x1="200"
  y1="400"
  x2="500"
  y2="250"
  stroke="black"
  marker-end="url(#arrow)"
/>
```

Böylece okun yönü matematiksel olarak kesin olur.

---

# 19. Ölçü ve Açı Sistemi

Örneğin:

```text
       ↗ F = 20 N
      /
     / 30°
────●────────────
```

Burada:

- kuvvet oku SVG,
- `F = 20 N` SVG text,
- açı yayı SVG path,
- `30°` SVG text

olmalıdır.

Image model yalnızca bağlamdaki nesneyi üretebilir.

---

# 20. Vision Sonrası Doğrulama

Vision modeli hata yapabileceği için bir verification aşaması olmalıdır.

Örneğin ilk vision:

```json
{
  "main_rotor": [510, 190]
}
```

İkinci kontrol:

```text
The label target marked in red is supposed to be
the main rotor.

Is it pointing to the correct component?
```

Çıktı:

```json
{
  "valid": true,
  "confidence": 0.97
}
```

Confidence düşükse yeniden lokalizasyon yapılır.

---

# 21. Final Validator

Final Validator şu kontrolleri yapar:

## Görsel Kontroller

- hedef nesneler mevcut mu?
- etiketler canvas dışında mı?
- etiketler birbirine çarpıyor mu?
- metin kutuları nesneleri gereksiz kapatıyor mu?
- callout yanlış nesneye mi gidiyor?

## Veri Kontrolleri

Visual Spec'teki bütün kritik textler final SVG içinde bulunmalı.

Örneğin:

```json
requiredTexts = [
  "A",
  "B",
  "5 km",
  "3 km"
]
```

Kontrol:

```javascript
for (const text of requiredTexts) {
  assert(svg.includes(text));
}
```

Burada OCR'ye bile gerek yoktur.

Çünkü text doğrudan SVG DOM'undadır.

---

# 22. Semantic Validator

Bazı problemler yalnızca koordinatla anlaşılmaz.

Örneğin:

- kuvvet oku yanlış yöne bakıyor,
- sıvı seviyesi fiziksel olarak yanlış,
- pervane yerine kuyruk işaretlenmiş.

Bu nedenle final görsel multimodal modele gönderilebilir.

Prompt:

```text
Question specification:

A = main rotor
B = engine
C = tail rotor

Check the image.

Return only:

{
  "A_correct": true/false,
  "B_correct": true/false,
  "C_correct": true/false,
  "scientifically_consistent": true/false,
  "problems": []
}
```

---

# 23. Retry Sistemi

Her hata bütün resmi yeniden üretmeyi gerektirmez.

## Label hatası

Sadece overlay yeniden hesaplanır.

```text
Base Image
   │
   └──── değişmez

SVG Overlay
   │
   └──── yeniden oluşturulur
```

## Ana görsel hatası

Image model yeniden çağrılır.

## Bilimsel sahne hatası

Prompt veya Visual Spec revize edilir.

---

# 24. Önerilen State Machine

```text
QUESTION_READY
      │
      ▼
SPEC_CREATED
      │
      ▼
SPEC_VALIDATED
      │
      ▼
BASE_GENERATING
      │
      ▼
BASE_READY
      │
      ▼
OBJECT_LOCALIZATION
      │
      ▼
LAYOUT_GENERATION
      │
      ▼
COMPOSITING
      │
      ▼
VALIDATION
   ┌──┴──┐
   │     │
 PASS   FAIL
   │     │
   ▼     └────► REVISE
EXPORT
```

Her görselin state'i database'de tutulmalıdır.

---

# 25. Database Modeli

Örneğin PostgreSQL:

```text
questions
---------
id
subject
grade
topic
question_json


visual_jobs
-----------
id
question_id
status
visual_type
renderer
model
attempt


visual_specs
------------
id
visual_job_id
spec_json


visual_assets
-------------
id
visual_job_id
type
path
width
height


visual_validations
------------------
id
visual_job_id
validator
score
result_json
```

---

# 26. Dosya Yapısı

Önerilen proje:

```text
visual-engine/
│
├── src/
│   │
│   ├── planner/
│   │   ├── visualPlanner.ts
│   │   └── schemas.ts
│   │
│   ├── router/
│   │   └── visualRouter.ts
│   │
│   ├── providers/
│   │   ├── imageProvider.ts
│   │   ├── openaiProvider.ts
│   │   ├── recraftProvider.ts
│   │   └── ideogramProvider.ts
│   │
│   ├── vision/
│   │   ├── objectLocator.ts
│   │   └── semanticValidator.ts
│   │
│   ├── layout/
│   │   ├── labelPlacement.ts
│   │   ├── collisionDetection.ts
│   │   └── calloutRouter.ts
│   │
│   ├── svg/
│   │   ├── renderer.ts
│   │   ├── text.ts
│   │   ├── arrows.ts
│   │   ├── geometry.ts
│   │   └── charts.ts
│   │
│   ├── validation/
│   │   ├── deterministicValidator.ts
│   │   └── visualValidator.ts
│   │
│   └── jobs/
│       └── visualPipeline.ts
│
├── prompts/
│   ├── visual-planner.md
│   ├── image-generator.md
│   ├── object-locator.md
│   └── final-validator.md
│
├── tests/
│   └── visual-eval/
│
└── config/
    └── models.yaml
```

---

# 27. TypeScript Interface Örneği

```typescript
interface VisualSpec {
  id: string;
  type:
    | "illustration"
    | "diagram"
    | "geometry"
    | "chart"
    | "map"
    | "hybrid";

  base?: {
    required: boolean;
    prompt: string;
    style: string;
  };

  objects: VisualObject[];
  overlays: Overlay[];
}
```

Object:

```typescript
interface VisualObject {
  id: string;
  semanticName: string;
  required: boolean;
}
```

Overlay:

```typescript
interface Overlay {
  id: string;

  type:
    | "text"
    | "label"
    | "arrow"
    | "callout"
    | "angle"
    | "dimension"
    | "shape";

  target?: string;
  text?: string;
}
```

---

# 28. Pipeline Pseudocode

```typescript
async function generateVisual(question) {

  // 1
  const spec = await visualPlanner.createSpec(question);

  // 2
  validateSpec(spec);

  // 3
  const route = visualRouter.select(spec);

  // 4
  let baseImage = null;

  if (route.requiresBaseImage) {
    baseImage = await imageProvider.generate(
      spec.base.prompt
    );
  }

  // 5
  const targets = baseImage
    ? await visionLocator.locate(
        baseImage,
        spec.objects
      )
    : {};

  // 6
  const layout = labelPlacement.calculate({
    spec,
    targets
  });

  // 7
  const finalSvg = svgRenderer.compose({
    baseImage,
    spec,
    layout
  });

  // 8
  const deterministic =
    deterministicValidator.check(
      finalSvg,
      spec
    );

  if (!deterministic.valid) {
    throw new Error(
      "Deterministic validation failed"
    );
  }

  // 9
  const semantic =
    await semanticValidator.check(
      finalSvg,
      spec
    );

  if (!semantic.valid) {
    return retry(spec, semantic);
  }

  // 10
  return exportImage(finalSvg);
}
```

---

# 29. Kullanılabilecek Teknolojiler

## Backend

Öneri:

```text
Node.js
TypeScript
Fastify / NestJS
```

Neden?

- web uygulamasıyla iyi entegre olur,
- SVG üretimi kolaydır,
- API orchestration için uygundur,
- async image API çağrıları rahattır.

Alternatif:

```text
Python
FastAPI
```

özellikle computer vision tarafı ağır olacaksa avantajlıdır.

---

# 30. SVG / Image İşleme

Node tarafında:

```text
SVG
Sharp
Canvas
Resvg
```

kullanılabilir.

Özellikle:

**Sharp**

final SVG'yi PNG/WebP'ye çevirmek için kullanışlıdır.

Örnek:

```javascript
await sharp(Buffer.from(svg))
  .png()
  .toFile("question.png");
```

---

# 31. Font Yönetimi

Soru bankası genelinde tek tip font kullanılmalıdır.

Örneğin:

```text
Inter
Arial
Roboto
Source Sans
```

veya yayınevinin kendi lisanslı fontu.

Font ölçüsü soru tipine göre sistem tarafından belirlenebilir.

```json
{
  "label": 28,
  "measurement": 24,
  "caption": 20
}
```

---

# 32. Görsel Stil Sistemi

Her model çağrısında tamamen farklı prompt yazmak yerine bir **Visual Style Profile** kullanılmalıdır.

Örneğin:

```yaml
educational_default:

  background:
    clean: true

  realism:
    medium

  lighting:
    soft

  colors:
    restrained

  composition:
    textbook

  prohibited:
    - cinematic lighting
    - dramatic perspective
    - excessive depth of field
    - fantasy
    - artificial AI glow
    - unnecessary text
```

---

# 33. MEB / Soru Bankası Stil Promptu

Ana image promptuna sürekli aşağıdaki stil profili eklenebilir:

```text
Professional Turkish high-school textbook illustration.

Clean educational publishing style.

Visually clear and scientifically readable.

No cinematic scene.
No dramatic lighting.
No fantasy.
No excessive depth of field.
No AI-art aesthetic.
No decorative text.

Leave clean negative space around important objects
for later annotations and labels.

Do not render letters, numbers, measurements,
or educational labels unless explicitly requested.
```

Son satır özellikle önemlidir.

Modelin kendi kafasına göre text üretmesi azaltılır.

---

# 34. Tam Otomatik Workflow Örneği — Helikopter

## Soru

```text
Helikopterin:

1 = ana gövde
2 = ana pervane
3 = motor

bölgeleri gösterilecektir.
```

---

## Aşama 1 — Planner

```json
{
  "visual_type": "hybrid",
  "scene": "side view helicopter",
  "objects": [
    "main_body",
    "main_rotor",
    "engine"
  ],
  "labels": [
    {
      "text": "1",
      "target": "main_body"
    },
    {
      "text": "2",
      "target": "main_rotor"
    },
    {
      "text": "3",
      "target": "engine"
    }
  ]
}
```

---

## Aşama 2 — Base Image

AI'ya:

```text
Generate a professional educational illustration
of a modern helicopter viewed from the side.

Clean neutral background.

The entire helicopter must be visible.

Clearly distinguish:

main body,
main rotor,
engine area.

Leave empty annotation space around the helicopter.

No text.
No numbers.
No labels.
```

---

## Aşama 3 — Vision

```text
Locate:

main_body
main_rotor
engine

Return center coordinates and bounding boxes.
```

---

## Aşama 4 — Layout

Sistem:

```text
2 → üstte
1 → sol-alt
3 → sağ-alt
```

gibi optimum bölgeleri belirler.

---

## Aşama 5 — SVG

- daire içine 1,
- daire içine 2,
- daire içine 3,
- callout çizgileri

eklenir.

---

## Aşama 6 — Validator

Kontrol:

```text
1 → main body?
2 → rotor?
3 → engine?
```

PASS ise export edilir.

---

# 35. Tam Otomatik Workflow — Kuvvet Sorusu

Soru:

```text
K cismine yatayla 30° açı yapan
20 N büyüklüğünde F kuvveti uygulanıyor.
```

AI yalnızca:

```text
masa + cisim
```

üretir.

SVG:

```text
K
F
20 N
30°
kuvvet oku
açı yayı
```

ekler.

Bu sistemde `30°` değerinin yanlış yazılma ihtimali ortadan kalkar.

---

# 36. Tam Otomatik Workflow — Biyoloji

Soru:

```text
Kalbin A ve B ile gösterilen bölümlerini inceleyiniz.
```

AI:

```text
clean anatomical educational heart illustration
no labels
```

üretir.

Vision:

```text
locate left ventricle
locate right atrium
```

çıkarır.

SVG:

```text
[A] ─────►
[B] ─────►
```

ekler.

---

# 37. Tamamen SVG Olması Gereken Görseller

Aşağıdaki görseller mümkün olduğunca image modeline gönderilmemelidir:

- matematik grafikleri,
- koordinat düzlemleri,
- vektörler,
- doğru/parabol,
- tablo,
- sayı doğrusu,
- geometrik şekiller,
- fonksiyon diyagramları,
- basit elektrik devreleri,
- kuvvet diyagramları,
- ölçü çizimleri.

Bunlarda deterministic generation çok daha güvenlidir.

---

# 38. AI Kullanılması Mantıklı Olan Görseller

Image modellerinin güçlü olduğu alanlar:

- günlük hayat bağlamları,
- laboratuvar ortamı,
- araçlar,
- insanlar,
- hayvanlar,
- bitkiler,
- organlar,
- karmaşık makineler,
- şehir/harita arka planı,
- tarihsel veya gerçek yaşam bağlamı.

---

# 39. Hibrit Görsel Sistemi

En kaliteli sonuç genellikle:

```text
AI illustration
     +
SVG educational overlay
     =
FINAL QUESTION VISUAL
```

şeklinde elde edilir.

Bu sistemin temel avantajı budur.

---

# 40. Model Routing

Örnek başlangıç routing mantığı:

```typescript
switch (visual.type) {

  case "geometry":
    return "svg";

  case "chart":
    return "svg";

  case "vector":
    return "svg";

  case "technical_diagram":
    return "vector_model";

  case "scientific_illustration":
    return "image_model";

  case "real_world_context":
    return "image_model";

  case "annotated_object":
    return "hybrid";

}
```

Model seçimi ayrı tutulur:

```text
illustration_model
vector_model
layout_model
vision_model
```

Böylece sistem tek bir vendor'a bağımlı olmaz.

---

# 41. Provider Abstraction

Kodun herhangi bir API'ye kilitlenmemesi gerekir.

```typescript
interface ImageProvider {

  generate(
    prompt: string,
    options: GenerateOptions
  ): Promise<ImageResult>;

}
```

Provider'lar:

```text
OpenAIProvider
GoogleProvider
RecraftProvider
IdeogramProvider
FalProvider
OpenRouterProvider
```

aynı interface'i uygular.

Böylece:

```text
model değiştirmek
=
config değiştirmek
```

olur.

---

# 42. EVAL Sistemi

Production'a geçmeden önce sabit bir test seti oluşturulmalıdır.

Örneğin:

```text
20 Fizik
20 Matematik
20 Kimya
20 Biyoloji
```

Toplam:

```text
80 görsel test vakası
```

Her yeni model aynı testleri üretir.

---

# 43. Görsel EVAL Kriterleri

Her görsel için:

```text
1. Scientific Accuracy
2. Object Accuracy
3. Label Target Accuracy
4. Layout Quality
5. Text Accuracy
6. Visual Quality
7. Textbook Style
8. Prompt Adherence
9. Artifact Rate
10. Cost
11. Latency
```

ölçülür.

---

# 44. Örnek Skor

```json
{
  "scientific_accuracy": 0.98,
  "object_accuracy": 1.0,
  "label_accuracy": 1.0,
  "layout_quality": 0.91,
  "visual_quality": 0.94,
  "textbook_style": 0.96
}
```

Overall:

```text
0.2 scientific
+ 0.2 label
+ 0.15 layout
+ 0.15 visual
+ 0.10 object
+ 0.10 style
+ 0.05 cost
+ 0.05 latency
```

---

# 45. Production Quality Gate

Örnek:

```text
Scientific Accuracy  >= 0.95
Label Accuracy       = 1.00
Required Text        = 1.00
Layout Score         >= 0.85
Visual Score         >= 0.85
```

Bu değerleri karşılamayan görsel final soru bankasına geçmez.

---

# 46. Retry Stratejisi

```text
Attempt 1
   │
   ▼
Validation
   │
   ├── PASS
   │
   └── FAIL
        │
        ▼
Attempt 2
        │
        ▼
Validation
        │
        ├── PASS
        │
        └── FAIL
             │
             ▼
Fallback Model
```

Örneğin:

```text
Primary Illustration Model
        ↓ fail
Secondary Illustration Model
        ↓ fail
Manual Review Queue
```

---

# 47. İnsan Kontrolü

Tam otomatik sistem kurulsa bile başlangıçta insan kontrolü bulunmalıdır.

Önerilen:

```text
AI Production
     ↓
Automatic Validation
     ↓
Confidence > 0.95
     │
     ├── YES → Publish Queue
     │
     └── NO
          ↓
       Human Review
```

Sistem geliştikçe human review oranı azaltılabilir.

---

# 48. MVP Yol Haritası

## Faz 1

Sadece:

```text
AI base image
+
manuel koordinatlı SVG label
```

kur.

Amaç:

Hibrit üretimin kalitesini doğrulamak.

---

## Faz 2

Vision modeli ekle.

```text
base image
↓
object detection
↓
otomatik target coordinate
```

---

## Faz 3

Automatic Label Placement ekle.

```text
target
↓
candidate positions
↓
collision scoring
↓
best label position
```

---

## Faz 4

Semantic Validator ekle.

---

## Faz 5

Model Router + fallback sistemi ekle.

---

## Faz 6

EVAL + maliyet optimizasyonu yap.

---

# 49. İlk MVP İçin Minimum Sistem

İlk sürümde bütün karmaşık sistemi yazmaya gerek yok.

Aşağıdaki 5 modül yeterlidir:

```text
1. Visual Planner
2. Image Generator
3. Vision Locator
4. SVG Composer
5. Validator
```

Akış:

```text
Question
   ↓
Visual Spec
   ↓
AI Image
   ↓
Find Objects
   ↓
Add SVG Labels
   ↓
Validate
   ↓
PNG
```

Bu yapı ilk gerçek test için yeterlidir.

---

# 50. Nihai Hedef

Uzun vadede sistem:

```text
SORU JSON
   │
   ▼
Görsel gerekli mi?
   │
   ├── Hayır → devam
   │
   └── Evet
        │
        ▼
Görsel türünü belirle
        │
        ├── SVG
        ├── AI
        └── Hybrid
             │
             ▼
        Görsel üret
             │
             ▼
       Nesneleri bul
             │
             ▼
       Label konumlandır
             │
             ▼
       SVG compositing
             │
             ▼
        Auto validation
             │
        ┌────┴────┐
        │         │
      PASS      REVISE
        │         │
        ▼         └─────► tekrar
      EXPORT
```

şeklinde çalışmalıdır.

---

# 51. Temel Tasarım Kararları

Sistemin en önemli prensipleri:

1. **AI'ya soru açısından kritik text yazdırma.**
2. **Sayısal değerleri deterministic renderer ile ekle.**
3. **AI'yi sahne ve illüstrasyon için kullan.**
4. **Geometrik ve matematiksel görselleri kodla üret.**
5. **Her görseli Visual Spec üzerinden oluştur.**
6. **Koordinatları normalize tut.**
7. **Image provider'ı değiştirilebilir tasarla.**
8. **Final görseli mutlaka otomatik doğrula.**
9. **Her model değişikliğini sabit EVAL setiyle test et.**
10. **Hibrit sistemin ana hedefi güzellikten önce bilimsel doğruluktur.**

---

# 52. Özet

Bu sistemin özü şudur:

```text
             AI
              │
              ▼
      "Ne çizileceğini"
        ve sahneyi üretir
              │
              ▼
         BASE IMAGE
              │
              ▼
           VISION
              │
              ▼
      Nesnelerin nerede
       olduğunu belirler
              │
              ▼
       LAYOUT ENGINE
              │
              ▼
          SVG LAYER
              │
              ▼
  A / B / C / 20 N / 30°
  oklar / ölçüler / callout
              │
              ▼
         VALIDATION
              │
              ▼
       FINAL QUESTION
          VISUAL
```

Bu mimari sayesinde image modellerinin yaratıcı gücü kullanılırken, eğitim sorularında gereken **veri doğruluğu ve konum kontrolü yazılım tarafında garanti altına alınır.**
