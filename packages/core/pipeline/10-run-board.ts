import type { LlmProvider } from "../llm/provider.js";
import { callStructured } from "../llm/structured.js";
import { reasoningEffortForMode } from "./04-generate.js";
import { makeSkill, processComponents } from "../curriculum/tymm-skill.js";
import { BoardOutputSchema, type BoardOutput } from "./09-board-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { OtopsiResult, PreflightResult, ResolvedJob } from "./types.js";

const BOARD_SYSTEM =
  "Sen MENAR Yayın Kurulusun: baş editör, alan hakemi (matematik) ve ölçme uzmanı birbirinden " +
  "BAĞIMSIZ karar verir. Baş editör yalnız kanıt varsa EVET der: 'Bu ürün hiçbir dış düzeltme " +
  "yapılmadan baskıya gönderilebilir mi?' Puanlama matrisini üst sınırları aşmadan doldur. " +
  "Fiilen yapılmayan denetime PASS yazmak yasaktır; emin değilsen DOĞRULANAMADI yaz. Yalnız " +
  "şemaya uygun JSON döndür.\n\n" +
  "gorsel_islevsellik/baglam_islevselligi puanlaması: baglam_katmani.gerekli=true ise şu testi uygula — " +
  "'Bu görsel hiç görülmese/kaldırılsa soru yine de metin ve tablo/grafikle eksiksiz çözülebilir mi?' " +
  "Cevap EVET ise görsel/bağlam yalnız dekoratiftir, bu iki puanı düşük ver (üst sınırın yarısından az) " +
  "ve red_nedenleri'ne MUTLAKA 'GÖRSEL DEKORATİF: [neden]' diye ekle — bu artık SERT bir RED nedenidir " +
  "(kullanıcı talebi: 'görsel işlev olmalı, soruda işe yaramalı'), yalnız puan kırma değil, ADAY BU " +
  "GEREKÇEYLE YENİDEN ÜRETİLECEK; bu yüzden [neden] kısmına generator'ın bir sonraki denemede TAM OLARAK " +
  "neyi düzeltmesi gerektiğini (görsele hangi eksik/tekrarsız bilginin taşınması gerektiğini, ya da " +
  "sahnenin neden kavramsal anlayışa somut katkısı olmadığını) yaz — belirsiz bir tekrar yeterli değil. " +
  "Görsel gerçekten çözüm için gerekli bir bilgi taşıyorsa (metinde/tabloda tekrarlanmayan nesne sayısı/" +
  "düzeni, ya da gorsel_veri_gosterimi ile gösterilen bir cihaz okuması/etiket) ya da bağlamı somut " +
  "biçimde anlaşılır kılıyorsa (yalnız 'güzel/atmosferik' değil, öğrencinin zihinsel modelini gerçekten " +
  "değiştiriyorsa) yüksek puan ver.\n\n" +
  "baglam_katmani.gerekli=false ise (soru bilinçli olarak bağlamsız/standart bir soru — kazanımı/formülü/" +
  "bilgiyi doğrudan sorgular, sahne veya görsel İSTENMEMİŞTİR): gorsel_islevsellik ve baglam_islevselligi " +
  "kriterlerine TAM PUAN ver. Ortada değerlendirilecek bir görsel/bağlam yoktur — bu bir eksiklik DEĞİL, " +
  "seçilen soru türünün doğası; düşük puan vermek standart soruları haksız yere cezalandırır.\n\n" +
  "GİRDİ.mode=BTV1 ise yukarıdaki 'GÖRSEL DEKORATİF' testini UYGULAMA: bu modda görsel BİLİNÇLİ OLARAK " +
  "yalnız sahneyi somutlaştırmak içindir (bkz. 02-build-prompt.ts modeBlock case BTV1), çözüm için gerekli " +
  "hiçbir veriyi taşımaması ZATEN İSTENEN tasarımdır — gpt-image-1'in birden fazla nesne/renk sayamama " +
  "riskini bilinçli olarak ortadan kaldırır. baglam_katmani.gerekli=true olduğu sürece (sahne gerçekten " +
  "soru bağlamıyla örtüşüyorsa) gorsel_islevsellik ve baglam_islevselligi kriterlerine TAM PUAN ver, " +
  "red_nedenleri'ne 'GÖRSEL DEKORATİF' YAZMA — bu modda dekoratif olması bir kusur değil, tasarımın ta " +
  "kendisidir.";

export interface BoardDeps {
  provider: LlmProvider;
  model: string;
}

/** node "23 - /YAYINKURULU/ Baş Editör + Hakem Heyeti"nin portu. */
export async function runBoard(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  onDenetim: PreflightResult,
  otopsi: OtopsiResult,
  deps: BoardDeps
): Promise<BoardOutput> {
  const tymm2026 = {
    ogrenim_becerisi: makeSkill(resolved.outcome.outcome),
    surec_bilesenleri: processComponents(resolved.outcome.outcome),
  };
  const userPrompt =
    "/YAYINKURULU/\n\n" +
    `GİRDİ: ${JSON.stringify(resolved.input)}\n` +
    `TYMM 2026: ${JSON.stringify(tymm2026)}\n` +
    `ADAY SORU: ${JSON.stringify(aday)}\n` +
    `ON DENETİM: ${JSON.stringify(onDenetim)}\n` +
    `OTOPSİ DENETİMİ: ${JSON.stringify(otopsi)}`;

  return callStructured(deps.provider, {
    model: deps.model,
    systemPrompt: BOARD_SYSTEM,
    userPrompt,
    schema: BoardOutputSchema,
    schemaName: "BoardOutput",
    reasoningEffort: reasoningEffortForMode(resolved.input.mode),
  });
}
