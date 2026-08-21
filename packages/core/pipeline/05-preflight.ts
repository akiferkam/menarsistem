import type { GeneratorOutput } from "./03-generator-schema.js";
import type { HedefIQ, IqKriterleri, PreflightResult, ResolvedJob, RotationLedger, SoruIqHesaplanan } from "./types.js";

/**
 * 2026-08-17'de eski "puan aralığı" (A×40+B×15+...) formülü tamamen kaldırıldı
 * — kaynak: kılavuz/iqmatematik/IQ_SORU_Standartlar_Matematik.docx'in 13
 * kademeli standardı bir toplamalı puan formülü VERMİYOR, bunun yerine her
 * bandı nitel biçimde (bağımsız karar sayısı + hangi audit ölçütlerinin
 * zorunlu olduğu) tarif ediyor. BAND_ESIK bu nitel tarifin benim (Claude)
 * yaptığım sayısal yorumu — kaynağın kendi "en az yaklaşık N karar" ifadeleri
 * (ör. IQ300: "en az yaklaşık 6 bağlı karar", IQ350: "en az yaklaşık 8") ve
 * "X + Y + Z" (hepsi zorunlu) / "X veya Y" (en az biri) kalıplarına göre
 * türetildi. Kullanıcı gerçek üretim sonuçlarına göre bu eşikleri
 * değiştirebileceğini belirtti — bu tablo KESİN değil, ilk kalibrasyon.
 * Tüm derslerde ORTAK (bkz. proje hafızası) — yalnız bu ölçütlerin PROMPT'TA
 * nasıl açıklandığı (02-build-prompt.ts IQ_KURALI) derse göre değişir.
 */
const BAND_SIRASI: HedefIQ[] = [
  "IQ50", "IQ75", "IQ100", "IQ125", "IQ150", "IQ175", "IQ200",
  "IQ225", "IQ250", "IQ275", "IQ300", "IQ325", "IQ350",
];

interface BandEsigi {
  karar: number;
  hepsi?: (keyof IqKriterleri)[];
  enAz1?: (keyof IqKriterleri)[];
}

const BAND_ESIK: Record<HedefIQ, BandEsigi> = {
  IQ50: { karar: 1 },
  IQ75: { karar: 2 },
  IQ100: { karar: 2, hepsi: ["veriSecmeEleme"] },
  IQ125: { karar: 3, hepsi: ["temsilDonusumu"] },
  IQ150: { karar: 3, hepsi: ["veriSecmeEleme"], enAz1: ["modelKurma", "temsilDonusumu"] },
  IQ175: { karar: 3, hepsi: ["stratejiSecimi"] },
  IQ200: { karar: 3, hepsi: ["veriSecmeEleme", "modelKurma", "stratejiSecimi"] },
  IQ225: { karar: 4, enAz1: ["ortukKosul", "tersineDusunme", "dogrulama"] },
  IQ250: { karar: 5, hepsi: ["sinirDurumu", "stratejiSecimi", "dogrulama"] },
  IQ275: { karar: 6, hepsi: ["stratejiSecimi"], enAz1: ["tersineDusunme", "modelKurma"] },
  IQ300: { karar: 6, hepsi: ["stratejiSecimi", "dogrulama"], enAz1: ["temsilDonusumu"] },
  IQ325: { karar: 7, hepsi: ["stratejiSecimi", "tersineDusunme"], enAz1: ["genellemeIspat"] },
  IQ350: { karar: 8, hepsi: ["stratejiSecimi", "tersineDusunme", "genellemeIspat", "dogrulama"] },
};

function bandKarsilaniyorMu(esik: BandEsigi, karar: number, kriterler: IqKriterleri): boolean {
  if (karar < esik.karar) return false;
  if (esik.hepsi && !esik.hepsi.every((k) => kriterler[k])) return false;
  if (esik.enAz1 && !esik.enAz1.some((k) => kriterler[k])) return false;
  return true;
}

/** En yüksek bandı (IQ350'den aşağı doğru tarayarak) bu karar/kriter bileşimine gerçekten uyanı bulur. */
function ulasilanSeviyeyiBul(karar: number, kriterler: IqKriterleri): HedefIQ {
  for (let i = BAND_SIRASI.length - 1; i >= 0; i--) {
    const band = BAND_SIRASI[i]!;
    if (bandKarsilaniyorMu(BAND_ESIK[band], karar, kriterler)) return band;
  }
  return "IQ50";
}

function bandIndex(b: HedefIQ): number {
  return BAND_SIRASI.indexOf(b);
}

const KLISE_ISIM = /(Ali|Ayşe|Ahmet|Mehmet)\b/;
const ONDALIK_NOKTA = /\d+\.\d+/;
/** TYMM Bağlam Temelli Soru Yazım Kılavuzu (MEB, Mart 2026) §2.5.3 — "Hepsi/Hiçbiri" türü seçenekler şans başarısını artırdığı için yasak. */
const HEPSI_HICBIRI = /\b(hepsi|hiçbiri)\b/i;
/**
 * Üretici modelin kendi iç öz-kontrol satırlarını (BTG kelime kilidi vb.)
 * öğrenciye görünen stimulus alanlarına sızdırmasını yakalar — bkz.
 * 02-build-prompt.ts'in btgWordLock() yorumu, gerçek bir üretimde bulunup
 * düzeltilen kalite hatası.
 */
// Not /i bayrağı: Türkçe "İ" JS'in varsayılan case-fold tablosunda düz "i"ye
// eşlenmez (SEÇİLEN.test("seçilen") sessizce false döner) — bunun yerine
// örnek metin toLocaleLowerCase("tr-TR") ile küçültülüp bu düz-küçük harfli
// kalıba karşı test edilir (bkz. kullanım yeri).
const SELF_AUDIT_LEAK = /\bbtg[_ ](seçilen|gerçek|metin)|final[_ ]kilidi|:\s*(pass|red)\b/;

function kelimeSayisi(s: string | undefined): number {
  return String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * node "11 - Deterministik Ön Denetim" (V22.4 kademeli denetim) portu.
 * Yalnız teknik bütünlük ihlalleri `kritik`tir ve FINAL'i kapatır; IQ bandı,
 * dizgi sınırı, rotasyon tekrarı gibi sorunlar `uyari`dır ve OTOPSİ/YAYIN
 * KURULU aşamalarına aktarılır — bkz. types.ts PreflightResult dokümantasyonu.
 */
export function runPreflight(
  resolved: ResolvedJob,
  output: GeneratorOutput,
  ledger: RotationLedger,
  opts?: { atlaBaglamRotasyonu?: boolean }
): PreflightResult {
  const { input } = resolved;
  const kritik: string[] = [];
  const uyari: string[] = [];
  const sorular = output.sorular;
  const soruPuanlari: SoruIqHesaplanan[] = [];

  if (!sorular.length) kritik.push("SORU ÜRETİLMEDİ");

  sorular.forEach((soru, i) => {
    const no = i + 1;
    const secenekler = soru.secenekler;
    const dogru = soru.dogru_secenek.trim().toUpperCase();

    if (!soru.kok.trim()) kritik.push(`SORU ${no}: soru kökü boş`);
    if (secenekler.length !== 5) kritik.push(`SORU ${no}: seçenek sayısı 5 değil`);
    if (!["A", "B", "C", "D", "E"].includes(dogru)) kritik.push(`SORU ${no}: doğru seçenek harfi geçersiz`);

    const norm = secenekler.map((x) => x.trim().toLocaleLowerCase("tr-TR"));
    if (norm.length === 5 && new Set(norm).size !== 5) kritik.push(`SORU ${no}: tekrar eden seçenek var`);

    if (!soru.dogru_cevap.trim()) uyari.push(`SORU ${no}: doğru cevap açıklaması eksik`);
    if (!soru.cozum_adimlari.length) uyari.push(`SORU ${no}: çözüm adımları eksik`);
    if (!soru.ogrenme_becerisi.trim()) uyari.push(`SORU ${no}: öğrenme becerisi eksik`);

    const kriterler: IqKriterleri = {
      veriSecmeEleme: soru.iq.veri_secme_eleme,
      modelKurma: soru.iq.model_kurma,
      temsilDonusumu: soru.iq.temsil_donusumu,
      ortukKosul: soru.iq.ortuk_kosul,
      tersineDusunme: soru.iq.tersine_dusunme,
      stratejiSecimi: soru.iq.strateji_secimi,
      sinirDurumu: soru.iq.sinir_durumu,
      dogrulama: soru.iq.dogrulama,
      genellemeIspat: soru.iq.genelleme_ispat,
    };
    const karar = soru.iq.bagimsiz_karar_sayisi;
    const ulasilanSeviye = ulasilanSeviyeyiBul(karar, kriterler);
    const hedefKarsilandi = bandIndex(ulasilanSeviye) >= bandIndex(input.iq);
    soruPuanlari.push({ bagimsizKararSayisi: karar, kriterler, hedef: input.iq, ulasilanSeviye, hedefKarsilandi });
    if (!hedefKarsilandi) {
      const esik = BAND_ESIK[input.iq];
      const eksikler: string[] = [];
      if (karar < esik.karar) eksikler.push(`bağımsız karar sayısı=${karar} (asgari ${esik.karar})`);
      (esik.hepsi ?? []).forEach((k) => {
        if (!kriterler[k]) eksikler.push(`${k}=yok (zorunlu)`);
      });
      if (esik.enAz1 && !esik.enAz1.some((k) => kriterler[k])) {
        eksikler.push(`[${esik.enAz1.join(" veya ")}] kriterlerinden en az biri yok`);
      }
      uyari.push(
        `SORU ${no}: hedef ${input.iq} karşılanmıyor, gerçek ulaşılan seviye ${ulasilanSeviye} — ${eksikler.join(", ")}.`
      );
    }

    const govde = kelimeSayisi(soru.kok);
    if (input.genislik === "85_MM" && govde > 120) uyari.push(`SORU ${no}: 85 mm için gövde uzun (${govde} kelime)`);
    if (input.genislik !== "85_MM" && govde > 220) uyari.push(`SORU ${no}: 185 mm için gövde uzun (${govde} kelime)`);

    const metin = [soru.kok, ...secenekler].join(" ");
    if (ONDALIK_NOKTA.test(metin)) uyari.push(`SORU ${no}: Türkçe ondalık ayırıcı kontrolü gerekli`);
    if (KLISE_ISIM.test(metin)) uyari.push(`SORU ${no}: klişe isim kullanımı`);
    if (secenekler.some((s) => HEPSI_HICBIRI.test(s))) {
      uyari.push(`SORU ${no}: "Hepsi/Hiçbiri" türü seçenek kullanılmış (Maarif kılavuzu §2.5.3 — yasak)`);
    }
  });

  // stimulus'a sızmış iç öz-kontrol satırları (bkz. SELF_AUDIT_LEAK) —
  // öğrenciye asla görünmemesi gereken üretim-süreci artığı, teknik RED.
  [...(output.stimulus?.paragraphs ?? []), ...(output.stimulus?.notes ?? [])].forEach((s, i) => {
    if (SELF_AUDIT_LEAK.test(s.toLocaleLowerCase("tr-TR"))) {
      kritik.push(`STIMULUS: iç öz-kontrol/denetim metni sızmış (satır ${i + 1}: "${s.slice(0, 60)}")`);
    }
  });

  // Görsel manifesti yalnız görsel gerçekten gerekliyse teknik zorunluluktur.
  const gorselGerekli = input.gorselKarari === "ISLEVSEL_GORSEL_ZORUNLU" || input.gorselKarari === "AI_OTOMATIK";
  if (gorselGerekli && !output.gorsel_veri_manifesti.manifest_id) {
    uyari.push("Görsel manifesti eksik; görsel aşamasından önce tamamlanmalı");
  }

  // Kullanıcı geri bildirimi (2026-08-17): "görsel zorunlu seçiyorum, tablo
  // değil GERÇEK görsel istiyorum." ISLEVSEL_GORSEL_ZORUNLU seçiliyken üretici
  // baglam_katmani.gerekli=false yapıp yalnız veri_katmani.tur=TABLO (sayısal
  // veri listesi — bir RESİM/DİYAGRAM değil) kurabiliyordu; teknik olarak
  // "görsel katmanı doluydu" ama öğretmenin istediği gerçek bir görsel hiç
  // yoktu (canlı modda görüldü — dolap ölçüleri sorusunda yalnız tablo vardı).
  // TABLO tek başına bu seçimi KARŞILAMAZ — yalnız gerçek bir fotoğraf
  // (baglam_katmani) veya gerçek bir diyagram (GEOMETRI/CIZGI/SUTUN/
  // FONKSIYON/NESNE_SEMASI) sayılır. Bu yalnız ISLEVSEL_GORSEL_ZORUNLU'da
  // zorunlu — AI_OTOMATIK'te modelin "görsele hiç gerek yok" kararı meşrudur.
  const GERCEK_GORSEL_TURLERI = new Set(["GEOMETRI", "CIZGI", "SUTUN", "FONKSIYON", "NESNE_SEMASI"]);
  const bk = output.baglam_katmani;
  if (input.gorselKarari === "ISLEVSEL_GORSEL_ZORUNLU") {
    const vk = output.veri_katmani;
    const gercekGorselVarMi =
      bk?.gerekli === true || (vk?.gerekli === true && Boolean(vk.tur) && GERCEK_GORSEL_TURLERI.has(vk.tur as string));
    if (!gercekGorselVarMi) {
      kritik.push(
        "GERÇEK GÖRSEL EKSİK: Görsel kararı=ISLEVSEL_GORSEL_ZORUNLU seçili ama ne baglam_katmani.gerekli=true " +
          "(fotoğraf) ne gerçek bir diyagram (veri_katmani.tur=GEOMETRI/CIZGI/SUTUN/FONKSIYON/NESNE_SEMASI) var " +
          "— yalnız TABLO (sayısal veri listesi) bu seçimi KARŞILAMAZ, tablo resim değildir. baglam_katmani." +
          "gerekli=true yap (gerçekten fotoğrafik bir sahne varsa) VEYA veri_katmani'ni gerçek bir diyagrama " +
          "dönüştür (uygun geometrik/sayısal veri varsa)."
      );
    }
  }

  // Üretici gorsel_veri_gosterimi=CIHAZ_EKRANI/TEKNIK_ETIKET seçip
  // gorselde_gosterilecek_degerler'i boş bırakabiliyor (canlı modda görüldü)
  // — bu durumda 16-gorsel-prompt.ts'in "veriGosteriliyor" koşulu false'a
  // düşer, görsel modeline HİÇBİR değer çizmesi söylenmez, sonuç boş/okunaksız
  // ekranlı bir görsel olur. Aynı anda veri_katmani=YOK ise (bu örnekte
  // olduğu gibi) öğrencinin çözüm için gereken P/Q/S gibi değerleri görebileceği
  // HİÇBİR yer kalmaz — soru teknik olarak çözülemez hâle gelir. Bu, görsel
  // denetiminin (19-gorsel-denetim.ts) yakalayamadığı bir tutarsızlık çünkü
  // orada da karşılaştırılacak bir değer listesi yok; kritik RED ile en baştan,
  // üretici düzeltme fırsatı bulacak şekilde yakalanması gerekiyor.
  if (
    gorselGerekli &&
    bk?.gorsel_veri_gosterimi &&
    bk.gorsel_veri_gosterimi !== "YOK" &&
    !(bk.gorselde_gosterilecek_degerler ?? []).length
  ) {
    kritik.push(
      `GÖRSEL VERİ TUTARSIZLIĞI: gorsel_veri_gosterimi=${bk.gorsel_veri_gosterimi} seçilmiş ama gorselde_gosterilecek_degerler boş — görselde hangi değerlerin çizileceği belirsiz, sonuç boş/okunaksız ekran olur`
    );
  }

  // Görsel modeli BİRDEN FAZLA ayrı okunaklı GERÇEK DEĞERİ güvenilir
  // çizemiyor — canlı modda tekrar tekrar (fosil odası 6 değer, su arıtma
  // 4 kartuş, akort modülleri 6, zar deneyi 9 değer — HEPSİ 3/3 RED)
  // doğrulandı (bkz. proje hafızası `menar-mays-gorsel-mimari`). Kullanıcı
  // talebi (2026-08-18): birden fazla değer gerekiyorsa görsele hiç
  // yazdırmaya çalışma — NESNE_SEMASI (deterministik indeks diyagramı) +
  // SORU METNİNDE doğrudan değer cümlesi kullan (bkz. 02-build-prompt.ts).
  // Sınır 2'ye ayarlı — kullanıcının kendi arşivindeki job `69c23e99`
  // (2026-08-15, gpt-image-1) iki ayrı ekranda İKİ kısa değeri ('2¹⁸','8⁸')
  // temiz çizip PASS almıştı, bu kanıtlanmış güvenli üst sınır; NESNE_INDEKSI
  // zaten aşağıda ayrıca ve tamamen yasak.
  const gosterilecekSayisi = (bk?.gorselde_gosterilecek_degerler ?? []).length;
  const gosterimTuru = bk?.gorsel_veri_gosterimi;
  const GOSTERILECEK_MUTLAK_LIMIT = 2;
  if (
    gorselGerekli &&
    (gosterimTuru === "CIHAZ_EKRANI" || gosterimTuru === "TEKNIK_ETIKET") &&
    gosterilecekSayisi > GOSTERILECEK_MUTLAK_LIMIT
  ) {
    kritik.push(
      `GÖRSEL AŞIRI YÜKLÜ: gorselde_gosterilecek_degerler'de ${gosterilecekSayisi} değer var (en fazla ` +
        `${GOSTERILECEK_MUTLAK_LIMIT} olmalı) — görsel modeli birden fazla ayrı okunaklı gerçek değeri hiç ` +
        `güvenilir çizemez, 3 denemede de RED alıp görsel tamamen kaybolur. Birden fazla değer gerekiyorsa ` +
        `gorsel_veri_gosterimi=YOK yap, veri_katmani.tur=NESNE_SEMASI seç, gerçek değerleri SORU METNİNDE ` +
        `(stimulus paragraflarında) doğrudan bir cümleyle ver — ayrı bir tablo/görsel yedeği kurma.`
    );
  }

  // Üretici NESNE_INDEKSI'yi (AI fotoğrafına indeks numarası yazdırma)
  // PROAKTİF olarak seçmemeli — canlı modda tekrar tekrar (fosil odası, su
  // arıtma tesisi, akort modülleri...) 3 denemenin 3'ünde de eksik/tekrarlı/
  // uydurma-sembollü çıktı, sağlayıcıdan bağımsız bir zaaf, her seferinde
  // 1$+ boşa gitti (bkz. proje hafızası). Bunun yerine deterministik
  // veri_katmani.tur=NESNE_SEMASI kullanılmalı (14-veri-katmani.ts,
  // buildNesneSemasiSvg — indeks eksikliği/tekrarı YAPISAL OLARAK imkansız).
  // NESNE_INDEKSI hâlâ sistemin kendi iç retry-fallback'inde var (20-baglam-
  // gorseli.ts) — bu preflight yalnız ÜRETİCİNİN kendi ilk JSON seçimini
  // engeller, runtime fallback'e karışmaz (preflight ondan önce çalışır).
  if (gorselGerekli && gosterimTuru === "NESNE_INDEKSI") {
    kritik.push(
      "NESNE_INDEKSI YASAK: baglam_katmani.gorsel_veri_gosterimi=NESNE_INDEKSI seçilmiş — AI fotoğrafına " +
        "indeks numarası yazdırmak (1,2,3...) bile güvenilir değil (canlı modda tekrarlı RED). Bunun yerine " +
        "baglam_katmani.gorsel_veri_gosterimi=YOK yap, veri_katmani.tur=NESNE_SEMASI seç ve gorsel_veri_" +
        "manifesti.nesne_semasi'yi (toplam_sayi, varsa isaretli_indeksler/isaret_aciklamasi) doldur."
    );
  }

  // Açı etiketleri (∠BAD=38° gibi) fotogerçekçi görsel modeline YAZDIRILMAYA
  // çalışıldığında güvenilmez — canlı modda görüldü: 3 denemenin 3'ünde de
  // model ya açı isimlerini bozdu (∠BAD yerine ∠AD), ya manifestte olmayan
  // uydurma bir açı etiketi ekledi (∠FG=45°), ya da izin verilmeyen fazladan
  // harf etiketleri (A, B, C...) çizdi (bkz. proje hafızası
  // `menar-mays-gorsel-mimari`, onbirinci tur). Bu, hangi görsel sağlayıcı
  // kullanılırsa kullanılsın (fal.ai, gpt-image-1, ...) tekrar edecek yapısal
  // bir zaaf — çünkü açı verisi zaten deterministik `veri_katmani.tur=GEOMETRI`
  // SVG'sinin (14-veri-katmani.ts, `geometrik_acilar`) TAM OLARAK çözdüğü bir
  // problem. Bu yüzden açı etiketi varsa GEOMETRI SVG ZORUNLU kılınır —
  // fotoğrafa hiç yazdırılmasına izin verilmez.
  // Genelleştirilmiş kural (bkz. proje hafızası, "VERİ GÖSTERİM HİYERARŞİSİ" —
  // yalnız Geometri'ye özel değil): veri_katmani.tur=GEOMETRI zaten aktifken
  // (yapısal veri deterministik SVG'de var) baglam_katmani AYNI ANDA fotoğrafa
  // değer/etiket yazdırmaya çalışıyorsa bu, canlı modda iki kez görülen "aynı
  // yapısal veri iki kanalda birden, fotoğraf kanalı güvenilmez" hatasının
  // TAM önkoşuludur — açı-notasyonuna (∠) özel olmayan, daha geniş bir kapı.
  const geometriAktif =
    output.veri_katmani?.tur === "GEOMETRI" && (output.gorsel_veri_manifesti.geometrik_noktalar ?? []).length >= 3;
  if (gorselGerekli && geometriAktif && gosterimTuru && gosterimTuru !== "YOK") {
    kritik.push(
      `VERİ TEK KAYNAK İHLALİ: veri_katmani.tur=GEOMETRI zaten aktifken baglam_katmani.gorsel_veri_gosterimi=` +
        `${gosterimTuru} ile fotoğrafa da değer/etiket yazdırılmaya çalışılıyor — aynı yapısal veri iki ` +
        `kanalda birden gösterilemez (fotoğraf kanalı güvenilmez + gereksiz tekrar). baglam_katmani.` +
        `gorsel_veri_gosterimi=YOK yap, fotoğrafı yalnız atmosfer işlevine indir.`
    );
  }

  // GENİŞLETME (canlı modda görüldü — dar ∠-only kapı YETERSİZ kaldı): model
  // açı İSMİNİ (∠BAD gibi) hiç kullanmadan salt derece DEĞERİNİ ("35°")
  // baglam_katmani.gorselde_gosterilecek_degerler'e yazdırıp, açı isimlerini
  // (∠BAD, ∠DAC...) yalnız "yedek" bir TABLO'ya gizleyerek eski ∠-only
  // kontrolünü atlatabiliyordu — üstelik veri_katmani.tur=GEOMETRI'yi hiç
  // seçmeden, geometrik_noktalar dolu olsa bile. Açı/derece sinyali HANGİ
  // KANALDA olursa olsun (fotoğraf değerleri VEYA tablo başlık/satırları)
  // GEOMETRI SVG dışında görünüyorsa engellenir — açılar hiçbir zaman tabloya
  // yazılmaz veya fotoğrafa çizilmez, her zaman şeklin ÜZERİNDE gösterilir.
  // Kullanıcı isteği (2026-08-17): "Geometride veriler asla tabloda
  // gösterilmeyecek, bunu bir istisna olarak Geometri'ye ekleyelim." — bu,
  // aşağıdaki açı/derece-özel kapıdan DAHA GENİŞ, blanket bir kural: Ders=
  // Geometri olan hiçbir işte veri_katmani.tur=TABLO kullanılamaz (açı/nokta
  // içerip içermediğine bakılmaksızın) — GEOMETRI SVG deterministik ve hiç
  // başarısız olmadığı için "yedek tablo" kavramına zaten ihtiyaç yok.
  if (input.ders === "GEOMETRI" && output.veri_katmani?.tur === "TABLO") {
    kritik.push(
      "GEOMETRİ DERSİNDE TABLO YASAK: Ders=Geometri işlerinde veri_katmani.tur=TABLO kullanılamaz " +
        "(kullanıcı kararı) — geometrik veri HER ZAMAN veri_katmani.tur=GEOMETRI ile şeklin üzerinde " +
        "gösterilir. Görsel gerekmiyorsa veri_katmani.gerekli=false yap; gerekiyorsa tur=GEOMETRI seç."
    );
  }

  const tab = output.gorsel_veri_manifesti.tablo;
  const tabloMetni = [...(tab?.headers ?? []), ...(tab?.rows ?? []).flat()].join(" ");
  const bkDegerMetni = (bk?.gorselde_gosterilecek_degerler ?? []).join(" ");
  const aciAdiVarMi = /∠/.test(bkDegerMetni) || /∠/.test(tabloMetni);
  const dereceVarMi = input.ders === "GEOMETRI" && (/°/.test(bkDegerMetni) || /°/.test(tabloMetni));
  if (gorselGerekli && (aciAdiVarMi || dereceVarMi) && output.veri_katmani?.tur !== "GEOMETRI") {
    kritik.push(
      "AÇI VERİSİ SVG DIŞINDA: açı/derece verisi (∠ işareti veya derece değeri) fotoğrafta veya tabloda " +
        "gösteriliyor ama veri_katmani.tur=GEOMETRI değil — açılar HİÇBİR ZAMAN tabloya yazılmaz veya " +
        "fotoğrafa çizilmez (ikisi de görsel modeli güvenilmezliğinin ya da gereksiz dolaylamanın farklı " +
        "biçimleri), HER ZAMAN şeklin ÜZERİNDE, veri_katmani.tur=GEOMETRI + gorsel_veri_manifesti." +
        "geometrik_acilar (kose/kenar1/kenar2/deger) ile çizilir. veri_katmani.tur=GEOMETRI yap, tüm " +
        "açıları geometrik_acilar'a taşı, baglam_katmani.gorsel_veri_gosterimi=YOK yap (islev artık açı " +
        "eşleşmesini gerekçe gösteremez, SVG zaten taşıyor)."
    );
  }

  // Bağlam/rotasyon sorunları üretimi başa döndürmez, uyarıdır. Bir "Soruyu
  // Düzelt" (reviseJob, bkz. run.ts) turunda aynı bağlam ailesinin korunması
  // KASITLIDIR — düzeltme sıfırdan üretim değil, aynı sorunun onarımıdır —
  // bu yüzden atlaBaglamRotasyonu=true iken bu kontrol tamamen atlanır.
  const aile = (output.baglam_ailesi_kodu || output.baglam_ailesi_ad || "").trim();
  if (!aile) {
    uyari.push("Bağlam ailesi kodu eksik");
  } else if (!opts?.atlaBaglamRotasyonu) {
    const norm = aile.toLocaleLowerCase("tr-TR");
    if (ledger.son100BaglamAilesi.some((x) => x.toLocaleLowerCase("tr-TR") === norm)) {
      uyari.push(`Bağlam ailesi son 100 üretimde kullanılmış: ${aile}`);
    }
  }

  // İstenen soru sayısı ile gelen sayı uyuşmuyorsa teknik RED.
  if (input.soruSayisi > 0 && sorular.length !== input.soruSayisi) {
    kritik.push(`İstenen soru sayısı ${input.soruSayisi}, üretilen ${sorular.length}`);
  }

  return {
    status: kritik.length ? "RED" : "PASS",
    kritik,
    uyari,
    kaliteDurumu: uyari.length ? "UYARILI_PASS" : "TEMİZ_PASS",
    soruPuanlari,
  };
}
