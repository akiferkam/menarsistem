import { Parser } from "expr-eval";
import type { CheckResult } from "../pipeline/types.js";

/**
 * `verify/solver-v25.ts` — brief Bölüm 5'in "sistemin kalbi" dediği
 * deterministik solver, V25 CORE BUILDER prototipinin (bkz.
 * `packages/core/reference/v25-solver-ui-prototype.html`, fonksiyonlar
 * `safeExpr`/`runFlow`/`runNumeric`/`eq`/`verify`) portu.
 *
 * Tek fark: kaynak `new Function(...)` ile ifadeyi doğrudan JS olarak
 * çalıştırıyordu — brief bunu sunucu tarafında açıkça yasaklıyor (model
 * çıktısı güvenilmez girdidir). Burada onun yerine `expr-eval`in Parser'ı
 * kullanılıyor; ayrıca operatör setini kaynağın karakter beyaz listesiyle
 * aynı kapsamda tutmak için (yalnız + - * / % karşılaştırma ve mantık;
 * fonksiyon çağrısı, atama, koşullu ifade YOK — kaynakta da bunlar zaten
 * çalışmıyordu, çünkü `Function` çağrısına Math enjekte edilmiyordu) ilgili
 * operatörler tek tek kapatılıyor.
 *
 * `power` bu listenin dışında tutulmuştu ama bu yanlıştı: `**` JS'in
 * Math'a ihtiyaç duymayan yerleşik bir operatörü, yani kaynaktaki
 * `new Function` de `Q ** (1/3)` gibi ifadeleri sorunsuz çalıştırıyordu.
 * Bu proje "üslü ve köklü ifadeler" konusuna odaklandığından üretici model
 * `dogrulama_manifesti.expression`e sık sık üs yazıyor (bazen `**`, bazen
 * `^`) — canlı modda ikisi de RED aldı ("unexpected TOP: *" / "Güvensiz/
 * uygunsuz ifade"), yani deterministik solver bu konunun kalbindeki
 * işlemi hiç doğrulayamıyordu. Aşağıda `power: true` açılır, `safeExpr`
 * `**`i expr-eval'in beklediği `^`e çevirir; büyük üsler için de risk yok
 * (float taşması `Infinity` döner, sonsuz döngü/DoS oluşturmaz — aynı risk
 * sınıfı zaten açık olan çarpma/bölme ile aynı).
 */
const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    remainder: true,
    comparison: true,
    logical: true,
    concatenate: false,
    conditional: false,
    factorial: false,
    power: true,
    assignment: false,
    fndef: false,
    random: false,
    min: false,
    max: false,
    sin: false,
    cos: false,
    tan: false,
    asin: false,
    acos: false,
    atan: false,
    sinh: false,
    cosh: false,
    tanh: false,
    asinh: false,
    acosh: false,
    atanh: false,
    sqrt: false,
    log: false,
    ln: false,
    lg: false,
    log10: false,
    log2: false,
    abs: false,
    ceil: false,
    floor: false,
    round: false,
    trunc: false,
    exp: false,
    expm1: false,
    log1p: false,
    length: false,
    in: false,
    cbrt: false,
    sign: false,
  },
  allowMemberAccess: false,
});

/**
 * Kaynaktaki safeExpr() karakter beyaz listesiyle aynı, `^` eklendi —
 * expr-eval'in üs operatörü budur (kaynağın `**`inden farklı, ama aynı
 * matematiksel işlem; üstteki `power` yorumuna bkz.).
 */
const IFADE_KARAKTER_BEYAZ_LISTESI = /^[0-9A-Za-z_+\-*/%^().<>=!&|\s]+$/;

function safeExpr(expr: string, vars: Record<string, number>): number | boolean {
  if (typeof expr !== "string" || !IFADE_KARAKTER_BEYAZ_LISTESI.test(expr)) {
    throw new Error("Güvensiz/uygunsuz ifade: " + expr);
  }
  // expr-eval JS'in ===/!==/&&/||'ını tanımıyor; kaynak manifestler JS
  // sözdizimiyle geldiği için (bkz. HTML'deki loadExample() örneği) eşdeğer
  // expr-eval sözdizimine normalize ediyoruz. Kısa devre yapan yan etki yok
  // (ifadeler saf), bu yüzden normalize etmek anlamı değiştirmez. `**` da
  // aynı şekilde expr-eval'in tek karakterlik `^` üs operatörüne çevrilir.
  const normalized = expr
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/&&/g, " and ")
    .replace(/\|\|/g, " or ")
    .replace(/\*\*/g, "^");
  return parser.evaluate(normalized, vars) as unknown as number | boolean;
}

interface AkisDugumu {
  type: "start" | "assign" | "condition" | "output" | "end";
  next?: string | null;
  var?: string | null;
  expr?: string | null;
  true?: string | null;
  false?: string | null;
  value?: string | number | null;
}

/**
 * Tek düz şekil — pipeline/03-generator-schema.ts'in `dogrulama_manifesti`
 * zod şemasıyla birebir aynı alanlar. Kaynaktaki gibi `options` ve
 * `claimed_answer` de manifestin kendi içinde taşınır (ayrı parametre değil).
 * Opsiyonel alanlar `| null` da kabul eder — OpenAI'nin strict yapılandırılmış
 * çıktı modu opsiyonel alanları `null` olarak döndürür (bkz. `llm/openai-strict-schema.ts`).
 * `variables`/`nodes`/`options` dizi-of-çift olarak taşınır (sözlük değil) —
 * aynı gerekçe: OpenAI strict modu açık uçlu anahtarlı nesneleri
 * desteklemiyor. `runFlow`/`runNumeric`/`runSolverV25` bunları kendi
 * içlerinde Map/Record'a çevirir.
 */
export interface SolverManifestGirdi {
  solver_type: "ALGORITHM_FLOW" | "NUMERIC_EXPRESSION" | "UNSUPPORTED";
  variables?: { ad: string; deger: number }[] | null;
  start?: string | null;
  nodes?: { id: string; dugum: AkisDugumu }[] | null;
  expression?: string | null;
  options?: { harf: string; deger: string | number }[] | null;
  claimed_answer?: string | null;
}

interface SolverIzi {
  value: number | string | boolean | null;
  trace: string[];
}

function runFlow(m: SolverManifestGirdi): SolverIzi {
  const vars: Record<string, number> = Object.fromEntries((m.variables ?? []).map((v) => [v.ad, v.deger]));
  const nodeMap = new Map((m.nodes ?? []).map((n) => [n.id, n.dugum]));
  let id = m.start;
  const trace: string[] = [];
  let out: string | number | null = null;
  let steps = 0;

  while (id && steps++ < 200) {
    const n = nodeMap.get(id);
    if (!n) throw new Error("Düğüm bulunamadı: " + id);
    trace.push(id + ": " + n.type);

    if (n.type === "start") {
      id = n.next;
    } else if (n.type === "assign") {
      if (!n.var || !n.expr) throw new Error("assign düğümünde var/expr eksik: " + id);
      const v = Number(safeExpr(n.expr, vars));
      vars[n.var] = v;
      trace.push(n.var + " = " + v);
      id = n.next;
    } else if (n.type === "condition") {
      if (!n.expr) throw new Error("condition düğümünde expr eksik: " + id);
      const r = Boolean(safeExpr(n.expr, vars));
      trace.push(n.expr + " => " + r);
      id = r ? n.true : n.false;
    } else if (n.type === "output") {
      out = n.value ?? null;
      trace.push("ÇIKTI = " + out);
      id = n.next;
    } else if (n.type === "end") {
      break;
    } else {
      throw new Error("Desteklenmeyen düğüm: " + n.type);
    }
  }
  if (steps >= 200) throw new Error("Akış döngü sınırını aştı");
  return { value: out, trace };
}

function runNumeric(m: SolverManifestGirdi): SolverIzi {
  if (!m.expression) throw new Error("NUMERIC_EXPRESSION manifestinde expression eksik");
  const vars: Record<string, number> = Object.fromEntries((m.variables ?? []).map((v) => [v.ad, v.deger]));
  const v = safeExpr(m.expression, vars);
  return { value: v, trace: ["İfade: " + m.expression, "Sonuç: " + v] };
}

function esit(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") {
    return Math.abs(Number(a) - Number(b)) < 1e-9;
  }
  return String(a).trim().toUpperCase() === String(b).trim().toUpperCase();
}

/**
 * Kaynaktaki verify()'ın portu. Cevap anahtarı her zaman burada hesaplanan
 * sonuçtan türetilir — modelin `claimed_answer` beyanı yalnız çapraz
 * kontrol için kullanılır, asla tek başına PASS üretmez.
 */
export function runSolverV25(manifest: SolverManifestGirdi): CheckResult {
  if (manifest.solver_type !== "ALGORITHM_FLOW" && manifest.solver_type !== "NUMERIC_EXPRESSION") {
    return {
      status: "DOGRULANAMADI",
      why: "Bu solver_type henüz deterministik olarak desteklenmiyor: " + manifest.solver_type,
    };
  }

  let result: SolverIzi;
  try {
    result = manifest.solver_type === "ALGORITHM_FLOW" ? runFlow(manifest) : runNumeric(manifest);
  } catch (err) {
    return { status: "RED", reasons: ["Solver hatası: " + (err as Error).message] };
  }

  const options = manifest.options ?? [];
  let matches = options.filter((o) => esit(o.deger, result.value)).map((o) => o.harf);
  // ALGORITHM_FLOW'un output düğümü de (tıpkı claimed_answer gibi) bazen
  // TALİMATA aykırı biçimde hesaplanan METİN yerine doğrudan bir şık harfi
  // ("B") yazıyor (canlı modda görüldü, aynı FIZ.9.1.1 ailesi — bir turda
  // claimed_answer'a METİN, bir başka turda value'ya HARF yazıldı; ikisi de
  // aynı kavramsal karışıklığın farklı yönleri). Birincil (değer bazlı)
  // eşleşme boşsa VE hesaplanan değer tek başına geçerli bir şık harfiyse,
  // bunu doğrudan o harfe eşleşme say — options[].deger ile karşılaştırma
  // hâlâ "asıl kaynak" kalır, bu yalnız modelin iki alanı karıştırdığı
  // durumda ikinci bir kurtarma yolu.
  if (matches.length === 0) {
    const hamDeger = String(result.value).trim().toUpperCase();
    if (options.some((o) => o.harf === hamDeger)) matches = [hamDeger];
  }
  const claim = (manifest.claimed_answer ?? "").toUpperCase();
  const reasons: string[] = [];
  if (matches.length !== 1) {
    reasons.push("Doğru sonuç seçeneklerde tam bir kez bulunmuyor: " + matches.join(","));
  }
  // ALGORITHM_FLOW çıktısı sayısal değil METİN (ör. bir kategorik genelleme
  // cümlesi) olduğunda, üretici bazen `claimed_answer`a şık harfi ("D")
  // yerine hesapladığı METNİ ("Madde, enerji ve etkileşimleri...") yazıyor
  // (canlı modda görüldü, FIZ.9.1.1 — kavramsal/tanımsal bir kazanım).
  // Bu, TALİMATA aykırı ("claimed_answer'a şıkkı yaz") ama zararsız bir
  // beyan biçimi — asıl cevap anahtarı ZATEN yalnız `result`ten türetiliyor,
  // claim yalnız çapraz kontrol. Harf eşleşmiyorsa METİN eşleşmesini de dene
  // (doğru şıkkın kendi değeriyle) — ikisi de tutmazsa GERÇEK bir uyuşmazlık.
  if (matches.length === 1 && claim && claim !== matches[0]) {
    const dogruSikMetni = String(options.find((o) => o.harf === matches[0])?.deger ?? "").toUpperCase();
    if (claim !== dogruSikMetni) {
      reasons.push(`İddia edilen cevap ${claim}, hesaplanan doğru şık ${matches[0]}`);
    }
  }

  const iz =
    result.trace.join("\n") +
    `\nHesaplanan değer: ${result.value}\nEşleşen şık(lar): ${matches.join(", ") || "yok"}`;

  if (reasons.length) {
    return { status: "RED", reasons: [...reasons, iz] };
  }
  return { status: "PASS", evidence: iz + `\nDoğru şık: ${matches[0]}` };
}
