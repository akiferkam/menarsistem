import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { loadCoreV25Manifest } from "../prompts/load.js";
import { buildMasterPrompt, type PromptMode } from "./02-build-prompt.js";
import { GeneratorOutputSchema, type GeneratorOutput } from "./03-generator-schema.js";
import type { ResolvedJob, RotationLedger } from "./types.js";

/** node "10 - AŞAMA 1: /SORUYU ÜRET/" prompt zarfının HTML/n8n'deki birebir metni. */
const KOMUT_BLOGU = `

=== KOMUT: /SORUYU ÜRET/ ===
Yalnız Structured Output Parser şemasını doldur.

KESİN KURALLAR:
- Ön söz, markdown, kod bloğu veya şema dışı metin yazma.
- Doğrudan tamamlanmış JSON üret; bütün parantezleri kapat.
- Kullanılmayan alanları kısa tut, fakat zorunlu alanları silme.
- Formdaki soru sayısından fazla veya az soru üretme.
- Beş seçenek, doğru seçenek, çözüm, hata yolları, IQ ve manifest alanlarını eksiksiz doldur.
- Revizyon talimatı varsa önceki adayın kazanımını ve matematiksel çekirdeğini koruyup yalnız RED alanlarını düzelt.
- Çıktı sınırına yaklaşırsan açıklamaları kısalt; JSON'u yarım bırakma.


=== OPENAI STRUCTURED OUTPUT ÖNCELİĞİ ===
Parser şemasındaki zorunlu alanlar diğer tüm stil kurallarından önce gelir.
Önce geçerli ve eksiksiz JSON üret; kalite ayrıntılarını zorunlu alanlar tamamlandıktan sonra ekle.
Soru sayısını girdideki sayı ile birebir eşleştir.
Her soruda tam 5 benzersiz seçenek ve A-E arasında tek bir doğru seçenek bulunmalıdır.
JSON dışında açıklama, markdown veya kod bloğu yazma.`;

/** node "10M - OpenAI Soru Üretici Model"in options.systemMessage'ının birebir metni. */
const SYSTEM_MESSAGE =
  "Sen MENAR YAYINCILIK MAYS matematik soru üretim motorusun. MASTER_CORE, kazanım, mikro konu, " +
  "hedef IQ, TYMM ve sıfır güven kurallarını uygula. Bu AŞAMA 1'dir: yalnız metin ve sonraki " +
  "görsel adımlarında kullanılacak veri manifesti hazırlanır; görsel üretilmez. Sayı ve etiketleri " +
  "gorsel_veri_manifesti içinde tek kaynak olarak tut. Bağlam katmanına sayı sızdırma. Fiilen " +
  "yapmadığın denetime PASS yazma. Yanıtın yalnız parser şemasına uyan tamamlanmış JSON olsun. " +
  "Gereksiz tekrar ve uzun açıklama üretme.";

export interface GenerateDeps {
  provider: LlmProvider;
  model: string;
}

export interface GenerateResult {
  masterPrompt: string;
  output: GeneratorOutput;
}

/**
 * node "10"un her zaman uyguladığı zarf (`{{ $json.master_prompt }}` +
 * KOMUT_BLOGU + core-v25-manifest) — master_prompt node 04'ten (ilk üretim)
 * ya da node 26'dan (revizyon) geldiğinde de aynı şekilde sarılır. Bu yüzden
 * `pipeline/12-revize.ts` da bu fonksiyonu kullanır, kendi zarfını yazmaz.
 */
export async function callGenerator(
  masterPrompt: string,
  deps: GenerateDeps,
  reasoningEffort?: "low" | "medium" | "high"
): Promise<GeneratorOutput> {
  const userPrompt = masterPrompt + KOMUT_BLOGU + "\n" + loadCoreV25Manifest();
  return callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: SYSTEM_MESSAGE,
    userPrompt,
    schema: GeneratorOutputSchema,
    schemaName: "GeneratorOutput",
    maxOutputTokens: 16000,
    temperature: 0.2,
    reasoningEffort,
  });
}

/**
 * STANDART_TEST'in kendi tanımı gereği (bkz. 02-build-prompt.ts modeBlock
 * "STANDART" — tek kazanım, belirgin çözüm yolu, model kurma/strateji seçme
 * yok) generator ve kurul için derin muhakeme bütçesi gerekmiyor; BT/BTG gibi
 * bağlam kurma+doğrulama gerektiren modlar bundan ETKİLENMEZ (varsayılan
 * `undefined` — sağlayıcının kendi varsayımı kullanılır). Kullanıcı isteği:
 * "standart test çok uzun sürüyor, kaliteyi düşürmeden yalnız bunun için
 * kısaltalım" — iki ardışık ağır gpt-5.1 çağrısı (generator+board) toplam
 * sürenin büyük kısmıydı (bkz. proje hafızası, canlı ölçüm ~11dk); bu, o
 * ikisini yalnız STANDART modda hızlandıran, mode'a özel tek satırlık kapı.
 */
export function reasoningEffortForMode(mode: string): "low" | "medium" | "high" | undefined {
  return mode === "STANDART" ? "low" : undefined;
}

/**
 * node "10 - AŞAMA 1: /SORUYU ÜRET/"nin portu. Section 4'ün iki aşamalı
 * üretim protokolü: bu çağrıda görsel üretilmez, yalnız metin + sonraki
 * görsel aşamasının okuyacağı gorsel_veri_manifesti üretilir.
 */
export async function generateAday(
  resolved: ResolvedJob,
  ledger: RotationLedger,
  deps: GenerateDeps,
  promptMode?: PromptMode
): Promise<GenerateResult> {
  const masterPrompt = buildMasterPrompt(resolved, ledger, promptMode);
  const output = await callGenerator(masterPrompt, deps, reasoningEffortForMode(resolved.input.mode));
  return { masterPrompt, output };
}
