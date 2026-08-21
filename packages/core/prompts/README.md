# Prompt çekirdekleri — Faz 0 çıkarımı

Bu klasördeki dosyaların hiçbiri elle yeniden yazılmadı. Hepsi
`.scratch/extract.mjs` ve `.scratch/extract-html-templates.mjs` script'leriyle,
`sources/` altındaki iki ham kaynaktan karakter-eşleştirmeli span taramasıyla
(regex + parantez/backtick derinlik takibi, hiçbir `eval`/`new Function` yok)
çıkarıldı. Script'ler tekrar çalıştırılabilir ve aynı sonucu üretir.

## Statik bloklar (placeholder içermez, birebir kullanılır)

| Dosya | Kaynak | node/script | Karakter |
|---|---|---|---|
| `master-core-v15.1.txt` | workflow JSON | node `04`, `const MASTER_CORE` | 46 878 |
| `zero-trust-v20.txt` | workflow JSON | node `04`, `const V20_ZERO_TRUST` | 8 637 |
| `context-diversity-v20.2.txt` | workflow JSON | node `04`, `const V202_CONTEXT` | 5 793 |
| `production-locks-v21.txt` | workflow JSON | node `04`, `const V21_MASTER` | 22 060 |
| `core-v25-manifest.txt` | V25 HTML | `menar-core-v25-script`, `appendProtocol()` | 659 |

Bu beşi, brief'in Bölüm 1'inde verdiği tahmini boyutlarla (47k/8.6k/5.8k/22k)
birebir eşleşiyor — çıkarımın doğruluğunun ikinci bir doğrulaması.

## Şablon bloklar (`${...}` placeholder'ları korunmuş, build.ts render eder)

| Dosya | Placeholder'lar | Not |
|---|---|---|
| `reasoning-engine-v2.template.txt` | `${MARKER}` `${SUBJECT}` `${MODE}` `${DEFAULT_CORE}` `${primary(...)}` `${secondary(...)}` `${n}` `${REPS}` `${removal(...)}` `${err}` `${ERROR_PATHS}` `${twin(...)}` `${lesson?...}` | Lookup tabloları `reasoning-engine-v2.lookup.json` içinde ayrı tutuldu |
| `btg-word-lock-v20.template.txt` | `${MARKER}` `${label}` `${min}` `${max}` | Kaynakta bozuk (bkz. aşağı), onarıldı |

`reasoning-engine-v2.lookup.json`, `block()` fonksiyonunun kullandığı
`primary/secondary/removal/twin` sözlüklerini ve `SUBJECT="Matematik"` gibi
sabit meta değerlerini içerir. **`SUBJECT` şu an derse gömülü sabit** — ikinci
branş eklendiğinde bu dosya branş başına parametrize edilmeli.

## Bilinen kaynak bozukluğu ve onarımı

`menar-btg-word-lock-v20` script'i içindeki `lockBlock()` fonksiyonunun
template literal'ı, **kaynak HTML dosyasının kendisinde** (kopyala-yapıştır
sırasında değil) `menar-core-v25-style`/`#menarCoreV25`/`menar-core-v25-script`
bloğunun ortasına serpiştirilmiş durumda — cümle "...BTG oldu" ile bitip
"ğunda aktiftir..." ile devam ediyor, arada ~12.5k karakterlik ayrı bir özellik
(V25 solver UI prototipi) araya girmiş.

Onarım: `- Bu kilit yalnız ÜRETİM HATTI=BTG oldu` + `ğunda aktiftir. ...`
birleştirildi → `- Bu kilit yalnız ÜRETİM HATTI=BTG olduğunda aktiftir.`
(anlamlı, dilbilgisel olarak doğru Türkçe cümle — onarımın doğru olduğunun
kanıtı). Araya giren gerçek özellik silinmedi;
`packages/core/reference/v25-solver-ui-prototype.html` olarak ayrı saklandı —
bu, Faz 2'nin `verify/solver-v25.ts` portunun referans alacağı tarayıcı-içi
prototip. **Önemli:** o prototip `new Function(...)` ile ifade
değerlendiriyor — brief'in Bölüm 5'i bunu sunucu tarafında kullanmayı açıkça
yasaklıyor; port sırasında güvenli bir ifade değerlendiricisiyle
değiştirilecek.

## Faz 1'de karar bekleyen konu

Brief'in Bölüm 1'i bu blokların **tam metin olarak** her üretimde modele
gönderilmesini varsayıyor. Ancak workflow JSON'ın node `04`'ü (V22.6, HTML'den
daha yeni) bu sabitleri tanımlayıp hiç kullanmıyor — gerçek `master_prompt`
20 satırlık kompakt bir kural listesinden kuruluyor (node yorumunda:
"90k+ karakterlik legacy çekirdeği göndermek yerine..."). Kullanıcıyla
kararlaştırıldığı üzere: dosyalar burada **tam ve değişmemiş** kalıyor (asla
özetlenmeyecek), ama `build.ts`'in varsayılan render modu — Faz 2'nin kod-taraflı
deterministik denetimleri (IQ formülü, kutu taşma, tek doğru, vb.) zaten
bu kuralların hepsini uyguladığı için — kompakt olacak. `PROMPT_MODE=full`
bayrağıyla tam metne geçilebilir.
