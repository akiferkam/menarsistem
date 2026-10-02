import type { GeneratorOutput } from "./03-generator-schema.js";
import { genislikSinifi } from "./types.js";
import type { HedefIQ, IqKriterleri, PreflightResult, ResolvedJob, RotationLedger, SoruIqHesaplanan } from "./types.js";

/**
 * 2026-09-16: 13 bantlık eşik tablosu 5 banda İNDİRGENDİ (bkz. types.ts
 * HedefIQ yorumu — kullanıcı: "IQ için çok fazla hata gördük"). Eski 13
 * bandın ÇAPA noktaları (IQ50, IQ75, IQ200, IQ250, IQ300) yeni bantlara
 * birebir taşındı, ara bantlar (IQ100/125/150/175, IQ225, IQ275/325/350)
 * en yakın çapaya toplandı — altyapı (bagimsiz_karar_sayisi + 9 audit
 * kriteri) DEĞİŞMEDİ, yalnız hedeflenen bant sayısı azaldı. Tüm derslerde
 * ORTAK — yalnız bu ölçütlerin PROMPT'TA nasıl açıklandığı (02-build-
 * prompt.ts IQ_KURALI) derse göre değişir.
 */
const BAND_SIRASI: HedefIQ[] = ["COK_KOLAY", "KOLAY", "ORTA", "ZOR", "COK_ZOR"];

interface BandEsigi {
  karar: number;
  hepsi?: (keyof IqKriterleri)[];
  enAz1?: (keyof IqKriterleri)[];
}

const BAND_ESIK: Record<HedefIQ, BandEsigi> = {
  COK_KOLAY: { karar: 1 },
  KOLAY: { karar: 2 },
  ORTA: { karar: 3, hepsi: ["veriSecmeEleme"], enAz1: ["modelKurma", "stratejiSecimi"] },
  ZOR: { karar: 5, hepsi: ["sinirDurumu", "stratejiSecimi", "dogrulama"] },
  COK_ZOR: { karar: 7, hepsi: ["stratejiSecimi", "tersineDusunme", "dogrulama"], enAz1: ["genellemeIspat", "temsilDonusumu"] },
};

function bandKarsilaniyorMu(esik: BandEsigi, karar: number, kriterler: IqKriterleri): boolean {
  if (karar < esik.karar) return false;
  if (esik.hepsi && !esik.hepsi.every((k) => kriterler[k])) return false;
  if (esik.enAz1 && !esik.enAz1.some((k) => kriterler[k])) return false;
  return true;
}

/** En yüksek bandı (ÇOK_ZOR'dan aşağı doğru tarayarak) bu karar/kriter bileşimine gerçekten uyanı bulur. */
function ulasilanSeviyeyiBul(karar: number, kriterler: IqKriterleri): HedefIQ {
  for (let i = BAND_SIRASI.length - 1; i >= 0; i--) {
    const band = BAND_SIRASI[i]!;
    if (bandKarsilaniyorMu(BAND_ESIK[band], karar, kriterler)) return band;
  }
  return "COK_KOLAY";
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
// 2026-09-14 (KUVVET_OKU'nun ikinci canlı testi): yukarıdaki dar kalıp yeni
// bir sızıntı türünü YAKALAMADI — üretici stimulus.notes'a "Görsel üretim
// talimatı: ... eklenmelidir. Ayrı şema oluşturulmamalıdır." ve "Metin ve
// cevap aritmetik olarak kontrol edilmiştir. Görsel henüz üretilmemiş ve
// denetlenmemiştir." gibi kendi üretim SÜRECİNİ anlatan iki paragraf yazdı
// — bunlar "PASS/RED" veya "btg" kelimelerini içermediği için eski kalıptan
// kaçtı. Genel örüntü: modelin kendi görevini/durumunu üçüncü şahıs gibi
// raporladığı cümleler ("... talimatı", "henüz üretilmemiş", "denetlenmemiş",
// "kontrol edilmiştir") — bunlar ekleniyor.
const SELF_AUDIT_LEAK =
  /\bbtg[_ ](seçilen|gerçek|metin)|final[_ ]kilidi|:\s*(pass|red)\b|üretim talimatı|henüz üretilmemiş|denetlenmemiştir|kontrol edilmiştir/;

// Canlı modda görüldü (2026-09-14, KUVVET_OKU'nun ilk canlı testi): üretici
// overlay_cizgileri[].etiket alanına gerçek değeri ("İtme = 30 N") yazmak
// yerine "{{gorsel_veri_manifesti.degiskenler[0]}}" gibi bir ŞABLON
// REFERANSI yazdı — bu, öğrenciye görünen görselde literal metin olarak
// çıkıyor ("harfiyen düz metin yaz" talimatına rağmen model bazen JSON'un
// kendi şablon-doldurma sistemi olduğunu VARSAYIYOR). Prompt düzeltmesi tek
// başına yeterli değil (soft kural) — bu, ucuz/deterministik bir kapıyla da
// yakalanmalı, aksi halde pahalı bir görsel üretimi tamamen boşa gider.
const SABLON_REFERANSI = /\{\{[^}]*\}\}/;

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
    const dar = genislikSinifi(input.genislik) === "DAR";
    if (dar && govde > 120) uyari.push(`SORU ${no}: ${input.genislik} için gövde uzun (${govde} kelime)`);
    if (!dar && govde > 220) uyari.push(`SORU ${no}: ${input.genislik} için gövde uzun (${govde} kelime)`);

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

  // CIHAZ_EKRANI/TEKNIK_ETIKET: gerçek değerler `render/gorsel-overlay.ts`
  // tarafından fotoğrafın ÜZERİNE, `overlay_konumlari`nin işaret ettiği DAR
  // bir bölgeye (bir cihaz ekranı, bir ölçü etiketi) bindirilir — o render
  // katmanının satır kaydırma/taşma koruması yoktur (kasıtlı: gerçek cihaz
  // okumaları zaten kısadır). Canlı modda görüldü (2026-09-26, TAR.9.1.1):
  // 02-build-prompt.ts'in "istediğin kadar değeri, istediğin karmaşıklıkta
  // güvenle kullanabilirsin" serbestliği üretici tarafından YANLIŞ yorumlanıp
  // bir "belge özeti" PARAGRAFI CIHAZ_EKRANI'na yazdırıldı — bindirilen metin
  // fotoğrafın kenarından taştı, okunaksız/kırık bir görsel üretildi. Bu artık
  // sert (kritik) bir kapı: bir cihaz ekranı/etiket KISA bir okuma taşır,
  // paragraf/cümle taşımaz.
  const CIHAZ_EKRANI_SINIRI = 40;
  const TEKNIK_ETIKET_SINIRI = 60;
  const gosterim = output.baglam_katmani?.gorsel_veri_gosterimi;
  if (gosterim === "CIHAZ_EKRANI" || gosterim === "TEKNIK_ETIKET") {
    const sinir = gosterim === "CIHAZ_EKRANI" ? CIHAZ_EKRANI_SINIRI : TEKNIK_ETIKET_SINIRI;
    (output.baglam_katmani?.gorselde_gosterilecek_degerler ?? []).forEach((deger, i) => {
      if (deger.length > sinir) {
        kritik.push(
          `BAĞLAM KATMANI: gorselde_gosterilecek_degerler[${i}] (${gosterim}) çok uzun (${deger.length} karakter, ` +
            `azami ${sinir}) — "${deger.slice(0, 50)}...". Bu bir cihaz ekranı/etiket okumasıdır, paragraf/cümle DEĞİLDİR; ` +
            `kısa bir değere indirin ya da bu veriyi soru metnine/veri_katmani'na taşıyın.`
        );
      }
    });
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
  const GERCEK_GORSEL_TURLERI = new Set(["GEOMETRI", "CIZGI", "SUTUN", "FONKSIYON", "NESNE_SEMASI", "KONUSMA"]);
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
  // KUVVET_OKU (2026-09-14) BU KONTROLDEN MUAF: onun değerleri
  // gorselde_gosterilecek_degerler'de DEĞİL, her overlay_cizgileri kaydının
  // kendi `etiket` alanında taşınır (bkz. altta "KUVVET_OKU VERİ TEKRARI"
  // kontrolü — bu ikisi birbirinin AYNASI, KUVVET_OKU için tam tersi kural
  // geçerli: gorselde_gosterilecek_degerler BOŞ olmalı).
  if (
    gorselGerekli &&
    bk?.gorsel_veri_gosterimi &&
    bk.gorsel_veri_gosterimi !== "YOK" &&
    bk.gorsel_veri_gosterimi !== "KUVVET_OKU" &&
    !(bk.gorselde_gosterilecek_degerler ?? []).length
  ) {
    kritik.push(
      `GÖRSEL VERİ TUTARSIZLIĞI: gorsel_veri_gosterimi=${bk.gorsel_veri_gosterimi} seçilmiş ama gorselde_gosterilecek_degerler boş — görselde hangi değerlerin çizileceği belirsiz, sonuç boş/okunaksız ekran olur`
    );
  }

  // CIHAZ_EKRANI/TEKNIK_ETIKET artık AI'ya çizdirilmiyor — gerçek değerler
  // üretim SONRASI deterministik bindiriliyor (bkz. render/gorsel-overlay.ts,
  // 20-baglam-gorseli.ts). Bunun çalışabilmesi için üreticinin HER değere bir
  // konum (overlay_konumlari, yüzde cinsinden) atamış olması ZORUNLU — aksi
  // halde bindirilecek metin nereye çizileceğini bilemez.
  const gosterilecekSayisi = (bk?.gorselde_gosterilecek_degerler ?? []).length;
  const gosterimTuru = bk?.gorsel_veri_gosterimi;
  const overlayKonumSayisi = (bk?.overlay_konumlari ?? []).length;
  if (
    gorselGerekli &&
    (gosterimTuru === "CIHAZ_EKRANI" ||
      gosterimTuru === "TEKNIK_ETIKET" ||
      gosterimTuru === "OLCUM_CIZGISI" ||
      gosterimTuru === "KUVVET_OKU") &&
    gosterilecekSayisi > 0 &&
    overlayKonumSayisi !== gosterilecekSayisi
  ) {
    kritik.push(
      `OVERLAY KONUMU EKSİK/UYUŞMUYOR: gorselde_gosterilecek_degerler'de ${gosterilecekSayisi} değer var ama ` +
        `overlay_konumlari'nde ${overlayKonumSayisi} konum var — her değere BİREBİR karşılık gelen bir konum ` +
        `(x_yuzde, y_yuzde) atanmalı, aksi halde bindirilecek metin görselde nereye çizileceği belirsiz kalır.`
    );
  }

  // KULLANICI KARARI (2026-09-27): "SAF ATMOSFER" (bkz. 02-build-prompt.ts,
  // önceden 2026-08-17'de bilinçli bir varsayılan olarak eklenmişti) artık
  // YASAK — bağlam fotoğrafı ya soru çözümü için GERÇEKTEN gerekli bir bilgi/
  // görev taşır (bir cihaz okuması/etiket/ölçüm çizgisi/kuvvet oku İÇİN
  // gorsel_veri_gosterimi + gorselde_gosterilecek_degerler/overlay_cizgileri
  // dolu, YA DA güvenilir tek-grup bir sayım görevi için renk_miktar_
  // sayimlari dolu) ya da baglam_katmani.gerekli=false kalıp hiç üretilmez.
  // Salt atmosfer/dekor amaçlı bir fotoğraf (gorsel_veri_gosterimi=YOK VE
  // sayım görevi yok) artık kritik RED — üretici düzeltme turunda ya işlev
  // yükler ya görseli tamamen kaldırır.
  const renkMiktarVarMi = (output.gorsel_veri_manifesti?.renk_miktar_sayimlari ?? []).length > 0;
  const gorselIslevselMi = (gosterimTuru && gosterimTuru !== "YOK") || renkMiktarVarMi;
  if (bk?.gerekli === true && !gorselIslevselMi) {
    kritik.push(
      "BAĞLAM GÖRSELİ İŞLEVSİZ (SAF ATMOSFER YASAK): baglam_katmani.gerekli=true ama görsel hiçbir çözüm " +
        "verisi/görevi taşımıyor (gorsel_veri_gosterimi=YOK VE renk_miktar_sayimlari boş) — salt dekoratif/" +
        "atmosferik bir fotoğraf artık üretilemez. Ya görsele gerçek bir işlev yükle (gorsel_veri_gosterimi " +
        "seç ve gorselde_gosterilecek_degerler/overlay_cizgileri'ni doldur, YA DA güvenilir tek-grup bir " +
        "sayım görevi için gorsel_veri_manifesti.renk_miktar_sayimlari'nı doldur) YA DA baglam_katmani." +
        "gerekli=false yap (bu senaryoda hiç fotoğraf üretilmesin)."
    );
  }

  // OLCUM_CIZGISI/KUVVET_OKU'nda çizgi(ler) overlay_cizgileri ile ayrıca
  // tanımlanır — bu, overlay_konumlari'ndan (metin) BAĞIMSIZ bir gerekliliktir:
  // bir sahne yalnız çizgi taşıyıp hiç metin kutusu gerektirmeyebilir (bkz.
  // 16-gorsel-prompt.ts), ama bu türler seçiliyken en az BİR çizgi
  // tanımlanmamışsa (üretici yalnız türü seçip koordinat vermeyi unuttuysa)
  // sahnede bindirilecek hiçbir şey kalmaz, görsel işlevsiz olur.
  if (
    gorselGerekli &&
    (gosterimTuru === "OLCUM_CIZGISI" || gosterimTuru === "KUVVET_OKU") &&
    !(bk?.overlay_cizgileri ?? []).length
  ) {
    kritik.push(
      `${gosterimTuru} ÇİZGİ EKSİK: baglam_katmani.gorsel_veri_gosterimi=${gosterimTuru} seçilmiş ama ` +
        "overlay_cizgileri boş — en az bir ölçüm/kılavuz/vektör çizgisi (x1_yuzde/y1_yuzde/x2_yuzde/y2_yuzde) " +
        "tanımlanmalı, aksi halde görselde bindirilecek hiçbir çizgi kalmaz."
    );
  }

  // Şablon referansı sızıntısı (bkz. SABLON_REFERANSI yorumu) — hem çizgi
  // etiketlerinde hem metin değerlerinde, hem KUVVET_OKU'nun aynı değeri
  // İKİ yerde (overlay_cizgileri VE gorselde_gosterilecek_degerler) tekrar
  // etme hatası aynı anda taranır.
  const gosterilecekDegerler = bk?.gorselde_gosterilecek_degerler ?? [];
  const cizgiEtiketleri = (bk?.overlay_cizgileri ?? []).map((c) => c.etiket ?? "").filter(Boolean);
  const sablonSizanlar = [...gosterilecekDegerler, ...cizgiEtiketleri].filter((v) => SABLON_REFERANSI.test(v));
  if (gorselGerekli && sablonSizanlar.length) {
    kritik.push(
      `ŞABLON REFERANSI SIZINTISI: bazı görsel etiket/değerleri gerçek metin yerine bir ŞABLON REFERANSI ` +
        `içeriyor (${sablonSizanlar.join(", ")}) — gorselde_gosterilecek_degerler ve overlay_cizgileri[].etiket ` +
        "alanlarına HER ZAMAN gerçek değerin KENDİSİNİ (düz metin) yaz, '{{...}}' gibi bir değişken/şablon " +
        "referansı ASLA kullanma; bu, öğrenciye görünen NİHAİ metindir."
    );
  }
  if (gorselGerekli && gosterimTuru === "KUVVET_OKU" && gosterilecekDegerler.length) {
    kritik.push(
      "KUVVET_OKU VERİ TEKRARI: gorsel_veri_gosterimi=KUVVET_OKU iken gorselde_gosterilecek_degerler DOLU " +
        "— bu alan KUVVET_OKU'da BOŞ kalmalı, her vektörün değeri YALNIZ kendi overlay_cizgileri kaydının " +
        "`etiket` alanında taşınmalı, aksi halde aynı değer görselde iki kez (bir metin kutusu, bir de ok " +
        "etiketi olarak) belirir."
    );
  }

  // Canlı modda görüldü (2026-09-14, KUVVET_OKU'nun ikinci canlı testi):
  // üretici etiket'e yalnız kuvvetin ADINI yazıp ("Çekme kuvveti") SAYIYI
  // ATLADI ("= 30 N" hiç yoktu) — muhtemelen "aynı veriyi iki yerde tekrar
  // etme" ilkesini yanlış uygulayıp manifestte zaten var diye sayıyı
  // gereksiz sanmış. Sonuç: diyagram büyüklüksüz, soru fiilen çözülemez hâle
  // geliyordu (bu, denetimin GÖREMEYECEĞİ bir hata çünkü metin kalitesi
  // olarak "doğru" görünüyor, yalnız İÇERİK eksik). Ucuz/deterministik kapı:
  // her etikette en az bir rakam olmalı.
  if (gorselGerekli && gosterimTuru === "KUVVET_OKU") {
    const rakamsizEtiketler = (bk?.overlay_cizgileri ?? [])
      .map((c) => c.etiket ?? "")
      .filter((e) => e && !/\d/.test(e));
    if (rakamsizEtiketler.length) {
      kritik.push(
        `KUVVET_OKU BÜYÜKLÜK EKSİK: overlay_cizgileri'nde şu etiket(ler)de hiç rakam yok: ` +
          `${rakamsizEtiketler.join(", ")} — yalnız kuvvetin ADI yazılmış, büyüklüğü (ör. '= 30 N') atlanmış. ` +
          "Her etiket İSİM+SAYI ikisini birden içermeli, aksi halde öğrenci büyüklüğü hiçbir yerde göremez."
      );
    }
  }

  // KONUŞMA (2026-09-14, kullanıcı isteği — özellikle TDE): veri_katmani.
  // tur=KONUSMA seçiliyken en az 2 replik (konusma_baloncuklari) olmalı —
  // aksi halde 14-veri-katmani.ts'in dispatch koşulu (>=2) hiç tetiklenmez,
  // sahne veri_katmani.gerekli=true dediği hâlde HİÇBİR asset üretilmez
  // (GEOMETRI'nin >=3 nokta koşuluyla AYNI sınıf risk).
  if (output.veri_katmani?.tur === "KONUSMA" && (output.gorsel_veri_manifesti.konusma_baloncuklari ?? []).length < 2) {
    kritik.push(
      "KONUŞMA REPLİK EKSİK: veri_katmani.tur=KONUSMA seçilmiş ama gorsel_veri_manifesti.konusma_baloncuklari'nde " +
        "2'den az replik var — en az 2 konuşmacı/replik olmalı, aksi halde hiçbir görsel üretilmez (sahne " +
        "gereksiz yere görselsiz kalır)."
    );
  }
  // Aynı şablon-referansı riski (SABLON_REFERANSI) konuşma metinlerinde de
  // geçerli — üretici burada da '{{...}}' gibi bir kod referansı yazabilir.
  const konusmaMetinleri = (output.gorsel_veri_manifesti.konusma_baloncuklari ?? []).map((k) => k.metin ?? "");
  const konusmaSablonSizanlar = konusmaMetinleri.filter((v) => SABLON_REFERANSI.test(v));
  if (konusmaSablonSizanlar.length) {
    kritik.push(
      `ŞABLON REFERANSI SIZINTISI (konuşma): konusma_baloncuklari'ndeki bazı replikler bir ŞABLON REFERANSI ` +
        `içeriyor (${konusmaSablonSizanlar.join(", ")}) — her repliğin metnini düz metin olarak, harfi harfine yaz.`
    );
  }

  // KONUŞMA (2026-09-14/16): üretim her zaman önce AI'yı dener (kullanıcı
  // isteği — hiçbir JobInput seçimine bağlı değil), bu yüzden iki alan da
  // ZORUNLU, salt prompt uyumuna güvenilmiyor (kurulan desen — bkz. ŞABLON
  // REFERANSI/KUVVET_OKU kapıları). baglam_katmani.gerekli=false kalırsa
  // illüstrasyon HİÇ denenmez (sahne görselsiz kalır); yalnizca_gorsel_
  // yedegi=false kalırsa illüstrasyon başarılı olsa BİLE SVG yedeği de
  // sayfada kalır, aynı diyalog İKİ KEZ görünür.
  if (output.veri_katmani?.tur === "KONUSMA") {
    if (!output.baglam_katmani?.gerekli) {
      kritik.push(
        "KONUŞMA BAĞLAM EKSİK: veri_katmani.tur=KONUSMA seçilmiş ama baglam_katmani.gerekli=true " +
          "değil — bu olmadan AI illüstrasyonu hiç denenmez, sahne görselsiz kalır. baglam_katmani.gerekli=true " +
          "yap (sahne alanına konuşmacıların ortamını kısaca betimle)."
      );
    }
    if (output.veri_katmani?.yalnizca_gorsel_yedegi !== true) {
      kritik.push(
        "KONUŞMA YEDEK İŞARETİ EKSİK: veri_katmani.tur=KONUSMA iken veri_katmani." +
          "yalnizca_gorsel_yedegi=true OLMALI — aksi halde AI illüstrasyonu başarılı olsa bile deterministik " +
          "SVG de sayfada kalır, aynı diyalog iki kez görünür."
      );
    }
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
