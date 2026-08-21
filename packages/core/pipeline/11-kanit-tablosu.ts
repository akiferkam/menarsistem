import type { BoardOutput } from "./09-board-schema.js";
import type { GeneratorOutput } from "./03-generator-schema.js";
import type { KanitTablosu, OtopsiResult, PreflightResult, ResolvedJob } from "./types.js";

const PUAN_AGIRLIKLARI: Array<[keyof BoardOutput["puanlama"], number]> = [
  ["kazanim_uyumu", 1.5],
  ["matematiksel_dogruluk", 2],
  ["gorsel_islevsellik", 1.5],
  ["bilgi_tekrarsizligi", 1],
  ["celdirici_kalitesi", 1.5],
  ["iq_uygunlugu", 1],
  ["baglam_islevselligi", 1],
  ["dil_yayin_duzeni", 0.5],
];

/**
 * node 24'ün "kritik" anahtar kelime listesi — kaynakta iki tanesi hiç
 * eşleşmiyordu (gerçek üretim sisteminde sessizce devre dışıydı):
 * - "SOLVER UYUŞMAZ" ama node 22'nin gerçek metni "...uyuşmuyor — RED"
 *   yazıyordu; iki kelime asla eşleşmiyordu, yani Solver A/B anlaşmazlığı
 *   FINAL KİLİDİ'ni hiç KAPATMIYORDU.
 * - "BELİRSİZ DOĞRU" ama node 22'nin gerçek metni "BELİRSİZ seçenek(ler)
 *   ... — FINAL KİLİDİ KAPALI" yazıyordu (metin kendi iddiasıyla çelişiyordu).
 * Bu port ikisini de gerçek metinle eşleşecek şekilde düzeltiyor — bu,
 * matematiksel doğruluğun kalbindeki iki denetimin sessizce devre dışı
 * kalmasını önlüyor. Diğer altısı kaynakla birebir aynı.
 */
const KRITIK_ANAHTAR_KELIMELER = [
  "SORU ÜRETİLMEDİ",
  "SORU KÖKÜ BOŞ",
  "SEÇENEK SAYISI",
  "DOĞRU SEÇENEK HARFİ GEÇERSİZ",
  "TEKRAR EDEN SEÇENEK",
  "UYUŞMUYOR",
  "TEK_DOĞRU",
  "BELİRSİZ SEÇENEK",
  "MATEMATİKSEL HATA",
];
// GÖRSEL DEKORATİF (2026-08-18): kısa süreliğine buraya (SERT RED) eklenmişti
// — kullanıcı talebi "görsel işlev olmalı" içindi. AMA canlı modda art arda
// iki soruyu (dinamometre/bilim merkezi, kıyı güvenliği envanteri) 2
// revizyonda da düzeltemeyip TAMAMEN FAILED yaptı — üretici her seferinde
// aynı şekilde tıkanıyordu, iş görsele hiç ulaşmadan kayboluyordu. Kullanıcı
// "dekoratif kontrolünü tekrar yumuşat" dedi — YUMUŞAK bulguya (puan kırma +
// UYARILI_AÇIK, iş bitirmez) geri döndü. `10-run-board.ts`'in "artık SERT bir
// RED nedenidir" ifadesi de bu yüzden fiilen artık geçerli değil (kod bunu
// KRITIK saymıyor) — o metin bilinçli olarak güncellenmedi, board'un [neden]
// kısmına HALA somut/uygulanabilir geri bildirim yazmasını istiyoruz, yalnız
// artık bu bulgu işi durdurmuyor.

/**
 * "gorsel_islevsellik" (max 1.5) + "baglam_islevselligi" (max 1) — kullanıcı
 * bilinçli olarak bağlamsız/görselsiz bir "standart soru" istediğinde
 * (gorselGerekli=false) bu iki kriter fiilen DEĞERLENDİRİLEMEZ: ortada
 * puanlanacak bir görsel/bağlam yok. Board LLM'i buna rağmen düşük/boş puan
 * verince (canlı modda görüldü: tumRed=[] olan, hiçbir itirazı olmayan bir
 * standart soru 5,5/10 aldı) 10 üzerinden 2,5 puan yapısal olarak asla
 * kazanılamıyor, standart sorular hep haksız yere UYARILI_AÇIK'a düşüyordu.
 * Bu iki kriter yalnız görsel/bağlam GERÇEKTEN istenmişse (gorselGerekli=true)
 * puanlanır; aksi halde tam puan sayılır (10-run-board.ts'in sistem promptu
 * da aynı ayrımı açıkça yazıyor, burası ona güvenmeyen bir güvenlik ağı).
 */
function puanHesapla(p: BoardOutput["puanlama"], gorselGerekli: boolean): number {
  const ham = PUAN_AGIRLIKLARI.reduce((toplam, [anahtar, max]) => {
    if (!gorselGerekli && (anahtar === "gorsel_islevsellik" || anahtar === "baglam_islevselligi")) {
      return toplam + max;
    }
    const deger = Math.min(Math.max(Number(p[anahtar] ?? 0), 0), max);
    return toplam + deger;
  }, 0);
  return Math.round(ham * 10) / 10;
}

/**
 * node "24 - Kanıt Tablosu + FINAL KİLİDİ"nin portu. FINAL kapısı yalnız
 * gerçekten kritik ve kanıtlanmış hatalarda kapanır (V22.5 notu, brief
 * Bölüm 5 "kritik hata ile editoryal uyarı ayrımı" ile aynı ilke); puan
 * düşüklüğü veya DOĞRULANAMADI tek başına üretimi durdurmaz, `UYARILI_AÇIK`
 * olur.
 */
export function buildKanitTablosu(
  resolved: ResolvedJob,
  aday: GeneratorOutput,
  onDenetim: PreflightResult,
  otopsi: OtopsiResult,
  kurul: BoardOutput
): KanitTablosu {
  const tumRed = [...new Set([...onDenetim.kritik, ...otopsi.red, ...(kurul.red_nedenleri ?? [])])].filter(Boolean);
  const gorselGerekli = Boolean(aday.baglam_katmani?.gerekli || aday.veri_katmani?.gerekli);
  const puan = puanHesapla(kurul.puanlama, gorselGerekli);
  const uyariUpper = onDenetim.uyari.map((x) => x.toLocaleUpperCase("tr-TR"));

  const solverOzeti = otopsi.sorular
    .map((s) => `${s.soruNo}:${s.yontem}/${s.cevapKontrolu.status}`)
    .join(" | ");

  const satirlar: Record<string, string> = {
    "KAZANIM / MİKRO": kurul.kazanim_uyumu ?? "DOĞRULANAMADI",
    MANİFEST: otopsi.red.some((x) => x.includes("MANİFEST")) ? "RED" : "PASS",
    // Kaynakta ayrı "SOLVER A SONUCU"/"SOLVER B SONUCU"/"SOLVER UYUŞMASI" sütunları
    // vardı; bizim mimarimizde her soru deterministik ya da çift-LLM yoldan
    // geçebildiği için (bkz. proje hafızası mimari kararı) tek özet sütuna indirildi.
    "SOLVER SONUÇ ÖZETİ": solverOzeti || "DOĞRULANAMADI",
    "TEK DOĞRU / PUANLANABİLİRLİK": otopsi.red.some((x) => x.includes("TEK_DOĞRU") || x.includes("BELİRSİZ")) ? "RED" : "PASS",
    "IQ GERÇEK SEVİYE": onDenetim.soruPuanlari.map((p) => p.ulasilanSeviye).join(" | "),
    "IQ UYUMU": uyariUpper.some((x) => x.includes("IQ PUANI")) ? "RED" : "PASS",
    "BAĞLAM ROTASYONU": uyariUpper.some((x) => x.includes("SON 100 ÜRETİMDE KULLANILMIŞ")) ? "RED" : "PASS",
    "KUTU TAŞMA": uyariUpper.some((x) => x.includes("GÖVDE UZUN")) ? "RED" : "PASS",
    "TYMM UYUMU": kurul.tymm_uyumu ?? "DOĞRULANAMADI",
    "DERS HAKEMİ": kurul.ders_hakemi ?? "DOĞRULANAMADI",
    "ÖLÇME UZMANI": kurul.olcme_uzmani ?? "DOĞRULANAMADI",
    "GÖRSEL / PNG": gorselGerekli ? "AŞAMA 2 BEKLİYOR" : "UYGULANMAZ",
    "BUILDER / IDML MANİFESTİ": ["MENAR_BUILDER_JSON", "IDML_PAKET", "INDD_PAKET", "INDD_RAW_PRO"].includes(resolved.input.cikti)
      ? "PASS"
      : "UYGULANMAZ",
    "YAYIN PUANI": puan.toFixed(1) + "/10",
    "BAŞ EDİTÖR": kurul.bas_editor,
    "YAYIN KURULU": kurul.yayin_kurulu,
  };

  const kritikRed = tumRed.filter((x) => {
    const s = x.toLocaleUpperCase("tr-TR");
    return KRITIK_ANAHTAR_KELIMELER.some((kelime) => s.includes(kelime));
  });
  const kapali = kritikRed.length > 0;
  // AÇIK_PUAN_ESIGI: gerçek üretim verisiyle kalibre edildi (proje hafızası) —
  // Yayın Kurulu'nun HİÇBİR itirazı olmayan (tumRed=[]) adaylara bile genelde
  // 7-8 bandında puan verdiği görüldü (LLM holistik puanlaması doğası gereği
  // muhafazakâr, 9-10 nadiren veriliyor). Eşik 8.0 iken bu tamamen temiz
  // adaylar salt puan yüzünden gereksiz yere NEEDS_REVIEW'a düşüyordu — halbuki
  // `tumRed.length > 0` şartı zaten gerçek hataları (çözücü uyuşmazlığı,
  // manifest tutarsızlığı vb.) ayrıca ve bağımsız olarak yakalıyor, bu eşiği
  // düşürmek o denetimi ZAYIFLATMAZ, yalnız "hiçbir itirazı olmayan ama
  // mükemmel puanlanmamış" adayları gereksiz incelemeden kurtarır.
  const ACIK_PUAN_ESIGI = 7.0;
  const finalKilidi: KanitTablosu["finalKilidi"] =
    kapali ? "KAPALI" : puan < ACIK_PUAN_ESIGI || tumRed.length > 0 ? "UYARILI_AÇIK" : "AÇIK";
  satirlar["FINAL KİLİDİ"] = finalKilidi;

  const kanitTablosuMetni = Object.entries(satirlar)
    .map(([k, v]) => `${k}=[${v}]`)
    .join("\n");
  const denetimSatiri =
    `Kazanım ${satirlar["KAZANIM / MİKRO"]} · Tek Doğru ${satirlar["TEK DOĞRU / PUANLANABİLİRLİK"]} · ` +
    `IQ ${satirlar["IQ UYUMU"]} · Bağlam ${satirlar["BAĞLAM ROTASYONU"]} · Taşma ${satirlar["KUTU TAŞMA"]} · ` +
    `TYMM ${satirlar["TYMM UYUMU"]} · Puan ${puan.toFixed(1).replace(".", ",")}/10 · Final Kilidi ${finalKilidi}`;

  return {
    satirlar,
    kanitTablosuMetni,
    denetimSatiri,
    yayinPuani: puan,
    finalKilidi,
    redNedenleri: tumRed,
    kritikRedNedenleri: kritikRed,
    yayinUyarilari: [...new Set([...onDenetim.uyari, ...tumRed])],
  };
}
