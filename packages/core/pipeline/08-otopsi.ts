import { runSolverV25 } from "../verify/solver-v25.js";
import { runSolverA, runSolverB, type SolverDeps } from "./07-run-solvers.js";
import type { SolverCozum } from "./06-solver-schema.js";
import type { GeneratorOutput, GeneratorSoru } from "./03-generator-schema.js";
import type { OtopsiResult, OtopsiSoru, ResolvedJob } from "./types.js";

export interface OtopsiDeps {
  solverA: SolverDeps;
  solverB: SolverDeps;
}

const HARFLER = ["A", "B", "C", "D", "E"] as const;
type SecenekDenetimi = NonNullable<SolverCozum["secenek_denetimi"]>[number];

/** node 22'nin A–E kararını A/B arasından birleştirme mantığı: ikisi de aynı fikirde değilse BELİRSİZ. */
function birlesikKarar(secA: SecenekDenetimi | undefined, secB: SecenekDenetimi | undefined): "DOĞRU" | "YANLIŞ" | "BELİRSİZ" {
  const kararA = secA?.karar;
  const kararB = secB?.karar;
  if (kararA === "DOĞRU" || kararB === "DOĞRU") return "DOĞRU";
  if (kararA === "BELİRSİZ" || kararB === "BELİRSİZ" || (kararA && kararB && kararA !== kararB)) return "BELİRSİZ";
  return "YANLIŞ";
}

/** node 22'nin çift-LLM çapraz kontrolü — yalnız dogrulama_manifesti UNSUPPORTED olan sorularda çalışır. */
function ciftLlmCapraz(soru: GeneratorSoru, no: number, a: SolverCozum, b: SolverCozum): OtopsiSoru {
  const key = (soru.dogru_secenek || "").trim();
  const red: string[] = [];

  const uyus = a.dogru_secenek === b.dogru_secenek && String(a.sonuc ?? "").trim() === String(b.sonuc ?? "").trim();
  if (!uyus) {
    red.push(`SORU ${no}: SOLVER A (${a.dogru_secenek}/${a.sonuc}) ile SOLVER B (${b.dogru_secenek}/${b.sonuc}) uyuşmuyor — RED`);
  }
  if (a.dogru_secenek !== key) {
    red.push(`SORU ${no}: cevap anahtarı (${key}) Solver A ile uyuşmuyor (${a.dogru_secenek})`);
  }

  const kayit = HARFLER.map((harf) => {
    const secA = (a.secenek_denetimi ?? []).find((x) => x.harf === harf);
    const secB = (b.secenek_denetimi ?? []).find((x) => x.harf === harf);
    return { harf, karar: birlesikKarar(secA, secB) };
  });
  const dogruSayisi = kayit.filter((x) => x.karar === "DOĞRU").length;
  const belirsiz = kayit.filter((x) => x.karar === "BELİRSİZ");
  if (dogruSayisi !== 1) red.push(`SORU ${no}: TEK_DOĞRU RED — doğru işaretlenen seçenek sayısı ${dogruSayisi}`);
  if (belirsiz.length) red.push(`SORU ${no}: BELİRSİZ seçenek(ler) ${belirsiz.map((x) => x.harf).join(",")} — FINAL KİLİDİ KAPALI`);

  const iz = `Solver A: ${a.dogru_secenek}/${a.sonuc}\nSolver B: ${b.dogru_secenek}/${b.sonuc}\nSeçenek kararları: ${kayit.map((k) => k.harf + "=" + k.karar).join(", ")}`;
  return {
    soruNo: no,
    yontem: "CIFT_LLM",
    cevapKontrolu: red.length ? { status: "RED", reasons: red } : { status: "PASS", evidence: iz },
  };
}

/**
 * node 22'nin sayı çıkarma yardımcısı. `{1,2,3,...,10}` gibi küme gösterimi
 * ÖNCE ayrıca ele alınır — aksi halde ham regex virgülü Türkçe ondalık
 * ayırıcı sanıp ardışık eleman çiftlerini ("1,2", "9,10") tek bir sahte
 * ondalık sayıya birleştiriyordu (canlı modda görüldü: "S={1,2,...,9,10}"
 * içeren bir olasılık sorusunda "1.2, 3.4, ..., 9.10" gibi hiç var olmayan
 * sayılar üretilip MANİFEST ÇAPRAZ RED'e yol açtı — manifestin kendisi
 * 1'den 10'a kadar sayıları AYRI AYRI listelediği için bu sahte birleşik
 * değerler orada hiç bulunamadı). Küme içindeki her eleman ayrı bir tam/
 * ondalık sayı olarak çıkarılır, küme DIŞINDAKİ metinde virgül hâlâ ondalık
 * ayırıcı sayılır (ör. "52,5" doğru şekilde "52.5" kalır).
 */
function sayiCek(s: unknown): string[] {
  const sonuc: string[] = [];
  const kumesiz = String(s ?? "").replace(/\{[^{}]*\}/g, (kume) => {
    for (const parca of kume.slice(1, -1).split(",")) {
      const m = parca.trim().match(/^-?\d+(?:\.\d+)?$/);
      if (m) sonuc.push(m[0]);
    }
    return " ";
  });
  for (const m of kumesiz.match(/-?\d+(?:[.,]\d+)?/g) ?? []) {
    sonuc.push(m.replace(",", "."));
  }
  return sonuc;
}

/**
 * "2^(-3/2)" gibi bileşik üslü ifadeler manifestte TEK bir dize olarak
 * durur, ama soru metnindeki aynı ifade `sayiCek`le tarandığında "2",
 * "-3", "2" gibi ayrı alt-sayılara parçalanır (canlı modda görüldü: manifest
 * "2^(-3/2)" ve "2^(-21/4)" içeriyordu, ama -3/-21/4 alt-parçaları manifestin
 * kendi dize kümesinde birebir bulunmadığı için sahte RED üretti). Manifest
 * tarafı da aynı ayrıştırmadan geçirilip alt-sayılar kümeye eklenir — böylece
 * karşılaştırma simetrik olur, gerçek uydurma sayılar hâlâ yakalanır.
 */
function sayilarVeAltParcalari(x: unknown): string[] {
  const s = String(x ?? "");
  return [s.replace(",", "."), ...sayiCek(s)];
}

/** node 22'nin MANİFEST ÇAPRAZ DENETİMİ'nin portu — soru metnindeki her sayı gorsel_veri_manifesti'nde bulunmalı. */
function manifestCaprazDenetimi(aday: GeneratorOutput): string[] {
  const man = aday.gorsel_veri_manifesti;
  const manSayilar = new Set<string>([
    ...(man.kullanilan_sayilar ?? []).flatMap(sayilarVeAltParcalari),
    ...(man.secenek_degerleri ?? []).flatMap(sayilarVeAltParcalari),
    ...sayiCek(man.dogru_cevap_degeri),
    ...(man.tablo?.rows ?? []).flat().flatMap(sayiCek),
  ]);
  const metinSayilari = new Set<string>(aday.sorular.flatMap((q) => sayiCek(q.kok).concat(q.secenekler.flatMap(sayiCek))));
  const kacak = [...metinSayilari].filter((x) => !manSayilar.has(x) && Math.abs(Number(x)) > 1);
  return kacak.length ? [`MANİFEST ÇAPRAZ RED — metinde manifestte olmayan sayı(lar): ${kacak.join(", ")}`] : [];
}

/**
 * node "20-22 /OTOPSİ/"nin portu. Mimari karar (bkz. proje hafızası):
 * `dogrulama_manifesti.solver_type` desteklenen bir tipse (ALGORITHM_FLOW/
 * NUMERIC_EXPRESSION) cevap anahtarı doğrudan `verify/solver-v25.ts`den
 * gelir, LLM çağrısı yapılmaz. En az bir soru UNSUPPORTED ise, tüm aday
 * soru kümesi node 20/21'in çift-LLM Solver A/B'sine gönderilir (kaynaktaki
 * gibi tek çağrıda tüm sorular) ve yalnız UNSUPPORTED olan sorular için
 * o sonuç kullanılır.
 */
export async function runOtopsi(resolved: ResolvedJob, aday: GeneratorOutput, deps: OtopsiDeps): Promise<OtopsiResult> {
  const sorular: OtopsiSoru[] = new Array(aday.sorular.length);
  const pendingIndexes: number[] = [];

  aday.sorular.forEach((soru, i) => {
    const manifest = soru.dogrulama_manifesti;
    if (manifest.solver_type === "ALGORITHM_FLOW" || manifest.solver_type === "NUMERIC_EXPRESSION") {
      sorular[i] = { soruNo: i + 1, yontem: "DETERMINISTIK", cevapKontrolu: runSolverV25(manifest) };
    } else {
      pendingIndexes.push(i);
    }
  });

  if (pendingIndexes.length) {
    const [solverA, solverB] = await Promise.all([runSolverA(resolved, aday, deps.solverA), runSolverB(aday, deps.solverB)]);
    for (const i of pendingIndexes) {
      const a = solverA.cozumler[i] ?? {};
      const b = solverB.cozumler[i] ?? {};
      sorular[i] = ciftLlmCapraz(aday.sorular[i]!, i + 1, a, b);
    }
  }

  const red: string[] = [];
  sorular.forEach((s, i) => {
    if (s.cevapKontrolu.status !== "RED") return;
    // ciftLlmCapraz reasons zaten "SORU n: ..." ile etiketli; solver-v25 reasons etiketsiz gelir.
    const etiketli = s.yontem === "DETERMINISTIK" ? s.cevapKontrolu.reasons.map((r) => `SORU ${i + 1}: ${r}`) : s.cevapKontrolu.reasons;
    red.push(...etiketli);
  });
  red.push(...manifestCaprazDenetimi(aday));

  return { status: red.length ? "RED" : "PASS", red, sorular };
}
