import { callGenerator, reasoningEffortForMode, type GenerateDeps } from "./04-generate.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { ResolvedJob, UretimDurduruldu } from "./types.js";

/**
 * node "26 - /REVİZE/ Yalnız Yapısal Hata"nın portu. Bu bir yeniden tasarım
 * görevi değildir — mevcut adayın matematiksel çekirdeği ve kazanımı
 * korunur, yalnız listelenen teknik RED nedenleri düzeltilir.
 */
export function buildRevizePrompt(resolved: ResolvedJob, oncekiAday: GeneratorOutput, redNedenleri: string[]): string {
  const { input } = resolved;
  const compactInput = {
    mode: input.mode,
    sinif: input.sinifVeyaSinav,
    tema: resolved.outcome.theme,
    kod: input.kod,
    kazanim: resolved.outcome.outcome,
    mikro: resolved.micro,
    iq: input.iq,
    soru_sayisi: input.soruSayisi,
    genislik: input.genislik,
    cikti: input.cikti,
    gorsel_karari: input.gorselKarari,
  };
  const nedenler = redNedenleri.length ? redNedenleri : ["Çıktının zorunlu JSON alanlarını ve soru bütünlüğünü düzelt."];

  return [
    "MENAR MATEMATİK — KRİTİK JSON ONARIMI",
    "Bu bir yeniden tasarım görevi değildir.",
    "Mevcut adayın matematiksel çekirdeğini, kazanımını ve doğru cevabını mümkün olduğunca koru.",
    "Yalnız aşağıdaki teknik hataları düzelt.",
    "Tam ve geçerli JSON dışında hiçbir şey yazma.",
    "",
    "GİRDİ:",
    JSON.stringify(compactInput),
    "",
    "KRİTİK HATALAR:",
    ...nedenler.map((x, k) => `${k + 1}. ${x}`),
    "",
    "MEVCUT ADAY:",
    JSON.stringify(oncekiAday),
  ].join("\n");
}

/** node 26 + geri dönüp node 10'u yeniden çalıştırma adımının birleştirilmiş portu. */
export async function reviseAday(
  resolved: ResolvedJob,
  oncekiAday: GeneratorOutput,
  redNedenleri: string[],
  deps: GenerateDeps
): Promise<GeneratorOutput> {
  const prompt = buildRevizePrompt(resolved, oncekiAday, redNedenleri);
  return callGenerator(prompt, deps, reasoningEffortForMode(resolved.input.mode));
}

/**
 * node "28 - Üç Kontrollü Revizyon Sonrası Durdur"un portu — node 27'nin
 * `revizyon_turu < 3` kapısı üçüncü turda kapandığında (yani en fazla iki
 * yeniden üretim denendiğinde) çağrılır.
 */
export function buildUretimDurduruldu(
  redNedenleri: string[],
  yayinPuani: number,
  onerilenDegisiklik: string | undefined,
  kanitTablosuMetni: string,
  revizyonSayisi: number
): UretimDurduruldu {
  const sikligi = new Map<string, number>();
  redNedenleri.forEach((x) => {
    const anahtar = String(x).split("—")[0]!.split(":")[0]!.trim();
    sikligi.set(anahtar, (sikligi.get(anahtar) ?? 0) + 1);
  });
  const enSik = [...sikligi.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    baslik: `ÜRETİM DURDURULDU — ${revizyonSayisi} KONTROLLÜ REVİZYON TAMAMLANDI`,
    surekliRedVeren: enSik?.[0] ?? "FINAL KİLİDİ",
    enYakinPuan: yayinPuani.toFixed(1) + "/10",
    onerilenTekDegisiklik: onerilenDegisiklik || "En sık RED veren denetimin koşulunu veya hedef IQ/mikro kapsamını gözden geçirin.",
    kanitTablosuMetni,
    redNedenleri,
    revizyonSayisi,
  };
}
