import { createProvider, loadStageModels, type Ders, type GorselUretimDeps, type PipelineDeps } from "@menar/core";
import { decryptApiKey } from "../auth/crypto.js";
import type { Repository } from "../db/repository.js";

/**
 * `apps/cli/lib/providers.ts`'in çok-kiracılı karşılığı: aynı sağlayıcı/
 * model kablolaması, ama anahtarlar `.env`'ten değil yayınevinin kendi
 * (Section 13 #3, BYOK) `publisher_api_key` satırlarından çözülür. Solver A/B
 * farklı sağlayıcılarda çalışma zorunluluğu (Section 9) burada da aynı:
 * solverA hep anthropic, solverB hep openai.
 */
export function buildTenantProviderDeps(
  yayineviId: string,
  repo: Repository,
  encryptionSecret: string,
  gorselModeli?: "gpt-image-1" | "gpt-image-2.5-sunburst"
): Pick<PipelineDeps, "generator" | "solverA" | "solverB" | "board" | "gorsel"> {
  const encOpenai = repo.yayinevi.getApiKey(yayineviId, "openai");
  const encAnthropic = repo.yayinevi.getApiKey(yayineviId, "anthropic");
  if (!encOpenai || !encAnthropic) {
    throw new Error(
      `Yayinevi ${yayineviId} için hem openai hem anthropic API anahtarı tanımlı olmalı (BYOK, Section 13 #3)`
    );
  }
  const openaiKey = decryptApiKey(encOpenai, encryptionSecret);
  const anthropicKey = decryptApiKey(encAnthropic, encryptionSecret);

  // "fal" opsiyonel — yalnız `JobInput.gorselKalitesi=YUKSEK` seçili işlerde
  // (bkz. proje hafızası `menar-mays-gorsel-mimari`). Yayınevi henüz bir
  // fal.ai anahtarı eklemediyse `uretimYuksekKalite` boş kalır, YUKSEK
  // seçilse bile `20-baglam-gorseli.ts` sessizce gpt-image-1'e düşer.
  //
  // 2026-08-18: fal.ai (flux-pro/v1.1-ultra + flux/dev) canlı modda 5/5
  // testte şiddetli sahne sapması gösterdi, gpt-image-1 2/2 sorunsuzdu (bkz.
  // proje hafızası, yirmiyedi/yirmisekizinci tur). Kısa süreliğine YUKSEK
  // kalite gpt-image-1'e sabitlenmişti (yirmidokuzuncu tur) — kullanıcı
  // "yok yüksek kalite fal.ai'a düşsün yine, sıkıntı yok, onu sonra düzeltiriz,
  // ben standart seçerim" dedi (otuzuncu tur), yönlendirme GERİ AÇILDI. fal.ai
  // sorununu ayrıca çözmek yerine kullanıcı kendisi şimdilik STANDART (gpt-
  // image-1) seçerek bundan kaçınacak.
  const encFal = repo.yayinevi.getApiKey(yayineviId, "fal");
  const falKey = encFal ? decryptApiKey(encFal, encryptionSecret) : null;

  const models = loadStageModels();
  const gorselModel = gorselModeli ?? models.image;

  // Ders bazlı YUKSEK-kalite override — her ders için "en iyi" fal.ai
  // model id'sini ayrı denemek isteyen kullanıcı isteği. Aynı fal.ai
  // anahtarı/provider örneği tüm derslerde paylaşılır (FalProvider herhangi
  // bir fal.ai model id'sini çağırabilir — yalnız model id'si değişir, bkz.
  // `fal.ts`), yalnız hangi model id'sinin çağrılacağı derse göre değişir.
  const falProvider = falKey ? createProvider("fal", falKey) : null;
  const dersler: Ders[] = ["MATEMATIK", "GEOMETRI", "FIZIK", "KIMYA", "BIYOLOJI", "TDE"];
  const uretimYuksekKaliteDersOverride: Partial<Record<Ders, GorselUretimDeps>> = {};
  if (falProvider) {
    for (const ders of dersler) {
      const model = models.imageHighQualityByDers[ders];
      if (!model) continue;
      uretimYuksekKaliteDersOverride[ders] = {
        provider: falProvider,
        model,
        editModel: models.imageHighQualityEditByDers[ders] ?? models.imageHighQualityEdit,
      };
    }
  }

  return {
    generator: { provider: createProvider("openai", openaiKey), model: models.generator },
    solverA: { provider: createProvider("anthropic", anthropicKey), model: models.solverA },
    solverB: { provider: createProvider("openai", openaiKey), model: models.solverB },
    board: { provider: createProvider("openai", openaiKey), model: models.board },
    gorsel: {
      // "prompt" (içerik yazımı) ve "denetim" (vision QA) her zaman OpenAI/
      // Anthropic'te kalır — fal.ai yapılandırılmış JSON/vision-QA çıktısı
      // sağlamıyor (bkz. `FalProvider`). "uretim" (varsayılan/metin-gerekli
      // adaylar) her zaman gpt-image-1 — Flux'un metin/rakam üretimindeki
      // güvenilmezliği yüzünden CIHAZ_EKRANI/TEKNIK_ETIKET için hâlâ zorunlu.
      prompt: { provider: createProvider("openai", openaiKey), model: models.contextImagePrompt },
      uretim: { provider: createProvider("openai", openaiKey), model: gorselModel },
      uretimYuksekKalite: falProvider
        ? { provider: falProvider, model: models.imageHighQuality, editModel: models.imageHighQualityEdit }
        : undefined,
      uretimYuksekKaliteDersOverride,
      // "denetim" (AŞAMA 2 vision-QA) 2026-08-23'te Anthropic/Claude Opus'a
      // geçirildi (bkz. llm/config.ts visionCheck yorumu) — gpt-5.1 canlı
      // testte gerçek bir nesne-sayım hatasını (2 yeşil+2 kırmızı+1 siyahı
      // "her renkten birer tane" diye) yanlışlıkla PASS vermişti.
      denetim: { provider: createProvider("anthropic", anthropicKey), model: models.visionCheck },
    },
  };
}
