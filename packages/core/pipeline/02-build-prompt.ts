import { makeSkill, processComponents } from "../curriculum/tymm-skill.js";
import { loadLegacyCore } from "../prompts/load.js";
import type { PromptMode } from "../llm/config.js";
import type { Ders, ResolvedJob, RotationLedger, HedefIQ } from "./types.js";

export type { PromptMode };

const DERS_ETIKET: Record<Ders, string> = {
  MATEMATIK: "Matematik",
  GEOMETRI: "Geometri",
  FIZIK: "Fizik",
  KIMYA: "Kimya",
  BIYOLOJI: "Biyoloji",
  TDE: "Türk Dili ve Edebiyatı",
  COGRAFYA: "Coğrafya",
  TARIH: "Tarih",
  FELSEFE: "Felsefe",
  DKAB: "Din Kültürü ve Ahlak Bilgisi",
};

/**
 * 2026-09-16: 13 kademeli sistem (IQ50..IQ350) 5 kademeye İNDİRGENDİ —
 * kullanıcı geri bildirimi: "Hedef IQ için çok fazla hata gördüğümüz için"
 * yalnız ÇOK_KOLAY/KOLAY/ORTA/ZOR/ÇOK_ZOR istendi (bkz. types.ts HedefIQ,
 * 05-preflight.ts BAND_ESIK). Altyapı (bagimsiz_karar_sayisi + 9 audit
 * kriteri) DEĞİŞMEDİ — yalnız hedeflenen bant SAYISI azaldı ve metin buna
 * göre kısaltıldı (eski 13 bantlık epik metin muhtemelen kalibrasyon
 * hatasının bir parçasıydı — çok fazla ince ayrım, hem seçim hem üretim
 * belirsizliğine yol açıyordu). Ortak kısım (temel eksen + 9 kriter tanımı)
 * TÜM derslerde birebir aynı ve ders-agnostik yazıldı (`ORTAK_IQ_TEMEL`) —
 * yalnız her dersin 5 KADEME paragrafı kendi somut örnekleriyle ayrı yazılır
 * (`dersIqMetni` yardımcı fonksiyonu ile birleştirilir). COĞRAFYA/TARİH/
 * FELSEFE/DKAB 2026-09-16'da İLK KEZ eklendi — hiç canlı testsiz, yalnız
 * MATEMATİK/FİZİK gibi zaten kalibre edilmiş derslerin deseni uyarlanarak.
 */
const ORTAK_IQ_TEMEL =
  "IQ KALİBRASYONU — 5 kademe (ÇOK KOLAY / KOLAY / ORTA / ZOR / ÇOK ZOR). IQ düzeyi bir puan formülüyle " +
  "DEĞİL, sorunun gerçekten talep ettiği bilişsel yükle belirlenir.\n" +
  "TEMEL EKSEN — iq.bagimsiz_karar_sayisi: öğrencinin hangi adımı/ilişkiyi/yorumu kullanacağına KENDİSİ " +
  "karar vermesini gerektiren adım sayısı (minimum 1, üst sınır yok — gerçek sayıyı yaz). SAYILMAZ: mekanik " +
  "işlem/okuma tekrarı, büyük/çirkin sayı kullanımı, gösterim değişikliği, uzun bağlam/metin eklemek, aynı " +
  "veriyi birden fazla yerde tekrarlamak, yapay veri eklemek, müfredat dışı terim eklemek, yalnız seçenekleri " +
  "birbirine yaklaştırmak, aynı yapıyı farklı bağlam/sayılarla tekrarlamak. BAĞLAMI OKUYUP TEK BİR İFADE/ " +
  "CÜMLE/YORUM KURMAK (salt çeviri) TEK BAŞINA karar SAYILMAZ (canlı modda tekrar tekrar görülen bir " +
  "undershoot kaynağı) — bu yalnız okumadır; gerçek bir karar, birden fazla olası okuma/yol/değer arasından " +
  "SEÇİM, ELEME veya KARŞILAŞTIRMA içerir.\n" +
  "DİĞER 9 AUDIT KRİTERİ (her biri true/false, iq şemasındaki alan adıyla):\n" +
  "  veri_secme_eleme: Hangi bilginin gerekli olduğunu ayırt etmesi veya yanıltıcı/gereksiz bilgiyi elemesi gerekiyor mu?\n" +
  "  model_kurma: Sözel/görsel/tablosal bilgiyi bir ilişkiye veya modele dönüştürmesi gerekiyor mu?\n" +
  "  temsil_donusumu: Bir temsil biçiminden diğerine (metin↔tablo↔grafik↔şekil↔denklem) işlevsel geçiş yapıyor mu?\n" +
  "  ortuk_kosul: Doğrudan söylenmeyen ama çözüm için zorunlu bir koşulu/ipucunu fark etmesi gerekiyor mu?\n" +
  "  tersine_dusunme: Sonuçtan başlangıca, çıktıdan girdiye doğru akıl yürütme var mı?\n" +
  "  strateji_secimi: Birden fazla olası yöntem/okumadan uygun olanı seçmesi veya ilkini değiştirmesi gerekiyor mu?\n" +
  "  sinir_durumu: Uç değer, özel durum, istisna veya sınır koşulu ayrıca denetleniyor mu?\n" +
  "  dogrulama: Bulunan sonucun başka bir koşul veya ikinci bir temsille kontrolü gerekiyor mu?\n" +
  "  genelleme_ispat: Özel örnekten genel bir sonuca geçme, gerekçelendirme veya ispat benzeri bir yapı var mı?\n";

const IQ_FINAL_KURALI =
  "FINAL: sistem karar sayısı + karşılanan kriterlere göre GERÇEK ulaşılan bandı ayrıca hesaplar; bu hedef " +
  "bandın ALTINDAYSA soru o IQ etiketiyle yayınlanamaz — çözüm DNA'sını yapıca yeniden kurgula, yalnız " +
  "sayıları/bağlamı büyütüp zorlama.";

function dersIqMetni(besKademe: string): string {
  return ORTAK_IQ_TEMEL + besKademe + "\n" + IQ_FINAL_KURALI;
}

const IQ_KURALI: Record<Ders, string> = {
  MATEMATIK: dersIqMetni(
    "5 KADEME (Matematik'te): ÇOK KOLAY (doğrudan bilgi/tek kural tanı-uygula, karar yok denecek kadar az) " +
      "• KOLAY (bağlamdan/tablodan/grafikten yalnız 1 işlevsel veri seçilir, YÖNTEM HAZIR — öğrenci kendi " +
      "model KURMAZ) • ORTA (öğrenci gerekli ilişkiyi/modeli KENDİSİ kurar; en az 2 işlevsel veri birlikte " +
      "kullanılır, veri seçme+model kurma+strateji seçimi bir arada — TYT-AYT üretiminin merkezi ağırlığı) " +
      "• ZOR (çoklu koşul, sınır durum/parametre, güçlü modelleme, strateji seçimi VE doğrulama bir arada, " +
      "çözüm yolu açık verilmez) • ÇOK ZOR (birden fazla model/temsil, strateji karşılaştırma, tersine " +
      "muhakeme, genelleme/ispat, bağımsız doğrulama — TYT-AYT'de istisnai)."
  ),
  GEOMETRI: dersIqMetni(
    "5 KADEME (Geometri'de): ÇOK KOLAY (bir tanım/formülü doğrudan uygulama) • KOLAY (şekilden yalnız 1 " +
      "işlevsel veri — bir açı/uzunluk — okunur, YÖNTEM HAZIR) • ORTA (öğrenci gerekli geometrik ilişkiyi " +
      "KENDİSİ kurar — açı/kenar/benzerlik/dönüşüm; en az 2 işlevsel veri ilişkilendirilir) • ZOR (çoklu " +
      "koşul, sınır/dejenere konfigürasyon, güçlü modelleme, strateji seçimi VE doğrulama bir arada) • ÇOK " +
      "ZOR (çoklu temsil — şekil↔cebir↔koordinat↔ispat, tersine düşünme, genel bir teoreme çıkarım)."
  ),
  FIZIK: dersIqMetni(
    "5 KADEME (Fizik'te): ÇOK KOLAY (bir formülü doğrudan uygulama) • KOLAY (senaryodan yalnız 1 işlevsel " +
      "büyüklük seçilir, YÖNTEM HAZIR — öğrenci kendi fiziksel model KURMAZ) • ORTA (öğrenci gerekli fiziksel " +
      "ilişkiyi/modeli KENDİSİ kurar; en az 2 işlevsel büyüklük/veri birlikte kullanılır, veri seçme+model " +
      "kurma+strateji seçimi bir arada) • ZOR (çoklu koşul/sınır durum — ör. denge, süreklilik —, güçlü " +
      "modelleme, strateji seçimi VE doğrulama bir arada) • ÇOK ZOR (birden fazla fiziksel model/temsil, " +
      "tersine muhakeme — sonuçtan koşula —, genelleme, bağımsız doğrulama)."
  ),
  KIMYA: dersIqMetni(
    "5 KADEME (Kimya'da): ÇOK KOLAY (bir tanım/kuralı doğrudan uygulama) • KOLAY (senaryodan yalnız 1 " +
      "işlevsel veri — bir derişim/miktar/formül — seçilir, YÖNTEM HAZIR) • ORTA (öğrenci gerekli kimyasal " +
      "ilişkiyi/modeli KENDİSİ kurar; en az 2 işlevsel veri birlikte kullanılır — ör. mol hesabı + tepkime " +
      "denklemi) • ZOR (çoklu koşul, sınır durum — ör. sınırlayıcı bileşen, denge kayması —, güçlü modelleme, " +
      "strateji seçimi VE doğrulama bir arada) • ÇOK ZOR (birden fazla model/temsil, tersine muhakeme, " +
      "genelleme, bağımsız doğrulama)."
  ),
  BIYOLOJI: dersIqMetni(
    "5 KADEME (Biyoloji'de): ÇOK KOLAY (bir tanım/olguyu doğrudan hatırlama) • KOLAY (senaryodan/şemadan " +
      "yalnız 1 işlevsel veri seçilir, YÖNTEM HAZIR) • ORTA (öğrenci gerekli biyolojik ilişkiyi/modeli " +
      "KENDİSİ kurar; en az 2 işlevsel veri/kanıt birlikte kullanılır) • ZOR (çoklu koşul, sınır durum, " +
      "güçlü modelleme, strateji seçimi VE doğrulama bir arada) • ÇOK ZOR (birden fazla model/temsil, " +
      "tersine muhakeme, genelleme, bağımsız doğrulama)."
  ),
  TDE: dersIqMetni(
    "5 KADEME (TDE'de): ÇOK KOLAY (metinden doğrudan/açık bir bilgiyi bulma) • KOLAY (metinden/tablodan " +
      "yalnız 1 işlevsel ipucu seçilir, YORUM YÖNTEMİ HAZIR — öğrenci kendi yorum modeli KURMAZ) • ORTA " +
      "(öğrenci gerekli yorum ilişkisini KENDİSİ kurar; en az 2 işlevsel ipucu/kanıt birlikte kullanılır) " +
      "• ZOR (çok anlamlılık, örtük ileti, güçlü ipucu eleme, strateji seçimi VE doğrulama bir arada — " +
      "yorum yolu açık verilmez) • ÇOK ZOR (birden fazla yorumu/temsili birlikte yönetme, alternatif " +
      "okumaları değerlendirme, tersine çözüm, bağımsız doğrulama)."
  ),
  COGRAFYA: dersIqMetni(
    "5 KADEME (Coğrafya'da): ÇOK KOLAY (bir tanım/olguyu doğrudan hatırlama) • KOLAY (haritadan/tablodan/ " +
      "grafikten yalnız 1 işlevsel veri okunur, YÖNTEM HAZIR — öğrenci kendi model KURMAZ) • ORTA (öğrenci " +
      "gerekli coğrafi ilişkiyi KENDİSİ kurar — ör. konum+iklim+nüfus arasında; en az 2 işlevsel veri/temsil " +
      "birlikte kullanılır) • ZOR (çoklu koşul, sınır durum — ör. eşik değer, istisnai bölge —, güçlü " +
      "modelleme, strateji seçimi VE doğrulama bir arada) • ÇOK ZOR (birden fazla temsil — harita+grafik+ " +
      "tablo, tersine muhakeme, genelleme, bağımsız doğrulama)."
  ),
  TARIH: dersIqMetni(
    "5 KADEME (Tarih'te): ÇOK KOLAY (bir olguyu/tarihi doğrudan hatırlama) • KOLAY (kaynaktan/metinden " +
      "yalnız 1 işlevsel bilgi seçilir, YORUM YÖNTEMİ HAZIR — öğrenci kendi yorum modeli KURMAZ) • ORTA " +
      "(öğrenci gerekli neden-sonuç veya karşılaştırma ilişkisini KENDİSİ kurar; en az 2 işlevsel kaynak/ " +
      "bilgi birlikte kullanılır) • ZOR (çok kaynaklılık, çelişen bilgi, güçlü çıkarım, strateji seçimi VE " +
      "doğrulama bir arada — yorum yolu açık verilmez) • ÇOK ZOR (birden fazla dönem/kaynağı birlikte " +
      "değerlendirme, tersine muhakeme — sonuçtan nedene —, genelleme, bağımsız doğrulama)."
  ),
  FELSEFE: dersIqMetni(
    "5 KADEME (Felsefe'de): ÇOK KOLAY (bir kavram/tanımı doğrudan hatırlama) • KOLAY (metinden yalnız 1 " +
      "işlevsel argüman/öncül seçilir, YÖNTEM HAZIR — öğrenci kendi argüman modeli KURMAZ) • ORTA (öğrenci " +
      "gerekli mantıksal ilişkiyi/argümanı KENDİSİ kurar; en az 2 öncül/kavram birlikte kullanılır) • ZOR " +
      "(çoklu görüş/akım karşılaştırması, örtük varsayım, güçlü çıkarım, strateji seçimi VE doğrulama bir " +
      "arada) • ÇOK ZOR (birden fazla felsefi konum/argümanı birlikte değerlendirme, tersine muhakeme, " +
      "genelleme, bağımsız doğrulama)."
  ),
  DKAB: dersIqMetni(
    "5 KADEME (Din Kültürü ve Ahlak Bilgisi'nde): ÇOK KOLAY (bir bilgiyi/kavramı doğrudan hatırlama) • " +
      "KOLAY (ayet/hadis/metinden yalnız 1 işlevsel mesaj/ipucu seçilir, YÖNTEM HAZIR — öğrenci kendi yorum " +
      "modeli KURMAZ) • ORTA (öğrenci gerekli ilişkiyi/yorumu KENDİSİ kurar; en az 2 işlevsel kaynak/ipucu " +
      "birlikte kullanılır) • ZOR (çok anlamlılık, örtük mesaj, güçlü çıkarım, strateji seçimi VE doğrulama " +
      "bir arada — yorum yolu açık verilmez) • ÇOK ZOR (birden fazla kaynağı/bağlamı birlikte değerlendirme, " +
      "tersine muhakeme, genelleme, bağımsız doğrulama)."
  ),
};

const HEDEF_BANT: Record<HedefIQ, string> = {
  COK_KOLAY: "ÇOK KOLAY / TABAN",
  KOLAY: "KOLAY",
  ORTA: "ORTA / GENEL AĞIRLIK / OMURGA",
  ZOR: "ZOR / DERECE-SEÇİCİ",
  COK_ZOR: "ÇOK ZOR / ÜST SEÇİCİ",
};

const BOS_LEDGER: RotationLedger = {
  son100BaglamAilesi: [],
  son200AileDna: [],
  son15GorselAilesi: [],
};

/** node "04 - MASTER PROMPT Derleyici"nin modeBlock() portu. */
function modeBlock(resolved: ResolvedJob): string {
  const { input } = resolved;
  switch (input.mode) {
    case "BTG": {
      const btg = input.btg;
      if (!btg) return "MOD: " + input.mode;
      return [
        "MOD: BTG – BAĞLAMA TEMELLİ GELİŞİM",
        "BİLİMSEL METİN UZUNLUĞU: " + input.metinUzunlugu,
        "BTG SORU SAYISI: " + input.soruSayisi,
        "BTG KAYNAK AİLESİ: " + btg.kaynak,
        "BELGE / VERİ TÜRÜ: " + btg.belge,
        "KAYNAK KULLANIM BİÇİMİ: " + btg.kullanim,
        "KAYNAK DOĞRULAMA DÜZEYİ: " + btg.dogrulama,
        "VERİ GÜNCELLİĞİ: " + btg.guncellik,
        "DESTEKLEYİCİ MATERYAL: " + btg.materyal,
        "ÖZEL KAYNAK / BELGE İSTEĞİ: " + btg.kaynakNotu,
        "",
        "/BTG_BİLİMSEL_KAYNAK_HAVUZU_V1/",
        "- Kaynak seçimi prestije göre değil; kazanıma uyum, veri açıklığı, yaş düzeyi, matematiksel işlenebilirlik ve doğrulanabilirlik ölçütlerine göre yapılır.",
        "- Popüler bilim yazısı kullanıldığında anlatım kopyalanmaz; bilimsel çekirdek özgün ve sade ortak metne dönüştürülür.",
        "- Başlık, yazar, tarih, dergi, DOI, rapor numarası, tablo numarası veya veri değeri uydurulamaz.",
        "- Ortak metindeki bilimsel bilgi ya da veri en az bir sorunun çözümünde zorunlu görev taşır.",
        "- Her alt soru ortak metinden bağımsız çözülebilir; başka alt sorunun cevabına bağlı olamaz.",
        "- Kaynak doğrulanamazsa AKADEMİK_KAYNAK=RED ver; final üretme veya GERÇEKÇİ_BİLİMSEL_KURGU olarak yeniden sınıflandır.",
        "- Senaryo gerçek bir laboratuvar/ölçüm cihazı okuması veya teknik ölçü etiketi gerektiriyorsa " +
          "(gorsel_veri_gosterimi=CIHAZ_EKRANI/TEKNIK_ETIKET) bunu KULLANMAKTAN ÇEKİNME — bu artık AI'ya " +
          "değil deterministik bindirmeye dayanıyor (bkz. yukarıdaki 'ZORUNLU — overlay_konumlari'), sayı/ " +
          "karmaşıklık sınırı yok, güvenilir.",
        "",
        "ZORUNLU BTG KAYNAK MANİFESTİ:",
        "KAYNAK_AİLESİ=[...]",
        "KURUM / YAYIN=[...]",
        "BELGE_TÜRÜ=[...]",
        "BAŞLIK=[DOĞRULANMIŞ BAŞLIK / KÜNYE VERİLMEDİ]",
        "YIL / VERİ DÖNEMİ=[...]",
        "DOI / RESMÎ KAYIT / URL=[DOĞRULANDI / UYGULANMAZ / VERİLMEDİ]",
        "KULLANILAN BİLİMSEL ÇEKİRDEK=[...]",
        "KULLANILAN VERİ VE BİRİM=[...]",
        "EĞİTİM AMAÇLI SADELEŞTİRME=[YOK / AÇIKLAMA]",
        "KAYNAK–SORU İŞLEVİ=[PASS / RED]",
        "TELİF VE ÖZGÜNLÜK=[PASS / RED]",
        "AKADEMİK_KAYNAK_DOĞRULAMASI=[PASS / RED]",
      ].join("\n");
    }
    case "BT":
      return [
        "MOD: KLASİK BAĞLAM TEMELLİ (BT)",
        "BAĞLAM UZUNLUĞU: " + input.metinUzunlugu,
        "SORU SAYISI: " + input.soruSayisi,
        "- Senaryo gerçek bir cihaz okuması veya boyutlandırılmış teknik ölçü etiketi gerektiriyorsa " +
          "(gorsel_veri_gosterimi=CIHAZ_EKRANI/TEKNIK_ETIKET) bunu KULLANMAKTAN ÇEKİNME — bu artık AI'ya " +
          "değil deterministik bindirmeye dayanıyor (bkz. yukarıdaki 'ZORUNLU — overlay_konumlari'), sayı/ " +
          "karmaşıklık sınırı yok, güvenilir.",
      ].join("\n");
    case "BTV1":
      return [
        "MOD: BAĞLAM TEMELLİ v1 (BTV1) — BT ile AYNI bağlam kurgusu, GÖRSELİN ROLÜ FARKLI",
        "BAĞLAM UZUNLUĞU: " + input.metinUzunlugu,
        "SORU SAYISI: " + input.soruSayisi,
        "- Bu modda görsel yalnız sahneyi SOMUTLAŞTIRMAK içindir — yukarıdaki MAARİF GÖRSEL İŞLEVSELLİK " +
          "TESTİ'nin YALNIZ (b) seçeneği (bağlamı somutlaştırma) bu modda geçerlidir; (a) seçeneği (görselden " +
          "okunması/SAYILMASI gereken bir sayı, düzen veya konum verisi taşıması) BU MODDA HİÇBİR ZAMAN " +
          "KULLANILMAZ.",
        "- Görselde ASLA sayılması gereken kesin bir nesne miktarı, okunması gereken bir rakam/etiket/yazı " +
          "veya renk-grubu sayımı OLMASIN: baglam_katmani.gorsel_veri_gosterimi HER ZAMAN YOK kalır, " +
          "renk_miktar_sayimlari kullanılmaz, gorselde_gosterilecek_degerler doldurulmaz. Sorunun çözümü " +
          "için gereken TÜM sayısal/kesin veriler SORU METNİNDE (stimulus) doğrudan cümleyle verilir — " +
          "görsel yalnız o metnin anlattığı sahneyi göze getirir, öğrencinin görselden herhangi bir şey " +
          "SAYMASI veya OKUMASI hiçbir zaman gerekmez. (Amaç: gpt-image-1'in birden fazla nesneyi/rengi " +
          "güvenilir sayamaması riskini bu modda TAMAMEN ortadan kaldırmak.)",
        "- Buna rağmen görsel yine ZORUNLUDUR (görsel kararı ISLEVSEL_GORSEL_ZORUNLU ise preflight bunu sert " +
          "kapıyla denetler): baglam_katmani.gerekli=true kalmalı ve sahne soru bağlamıyla GERÇEKTEN " +
          "örtüşmeli (rastgele/jenerik bir stok-fotoğraf sahnesi değil) — yalnız veri taşıma yükümlülüğünden " +
          "muaftır.",
        "- baglam_katmani.islev alanına görselin HANGİ zihinsel modeli/somutlaştırmayı sağladığını yaz (ör. " +
          "'sahneyi öğrencinin tanıdık bir fiziksel ortamda hayal etmesini sağlar') — bir sayım/okuma işlevi " +
          "ASLA yazma.",
        "- KENDİ KENDİNİ AÇIK EDEN DESEN YASAĞI (canlı modda görüldü, KRİTİK — job MENAR-MAT911-20260831111724: " +
          "üslü sayı sorusunda 'kare mozaik pano' sahnesi seçildi, ama panonun bir kenarındaki taş SAYISI " +
          "zaten sorunun cevabıydı; görsel modeli kusursuz çizse BİLE öğrenci yalnızca sayarak cevaba " +
          "ulaşabilirdi — üstelik kusursuz çizemedi, taş sayısını 3 denemede 3 kez de yanlış/tutarsız çizip " +
          "cevapla çelişti). Sahne seçerken eş birimlerin tekrarlandığı bir ızgara/dizi/istif (mozaik, tuğla " +
          "duvarı, kutu istifi, hücre ızgarası...) kurma EĞER o tekrar SAYISI zaten sorunun cevabı veya ara " +
          "adımlarından biriyle (kenar uzunluğu, üs, kök, alan/hacim birimi vb.) birebir örtüşüyorsa — bu " +
          "veri görsele hiç yazılmasa bile YAPININ KENDİSİ veriyi taşımış olur, BTV1'in 'görsel veri " +
          "taşımaz' ilkesini bozar. Böyle konularda (üs/kök/alan/hacim gibi sayının kendisinin geometrik " +
          "tekrar sayısı olduğu konular) sahneyi TEKİL bir nesne/malzeme/doku üzerinden kur (ör. tek bir " +
          "kalıp, tek bir kap, tek bir yüzeyin dokusu) — sayılabilir, cevabı ele veren bir birim dizisi asla " +
          "kurma.",
      ].join("\n");
    case "BTP":
      return "MOD: BAĞLAM TEMELLİ PROBLEM (BTP)\nSENARYO UZUNLUĞU: " + input.metinUzunlugu + "\nPROBLEM SAYISI: " + input.soruSayisi;
    case "ACIK_UCLU":
      return (
        "MOD: AÇIK UÇLU\nSORU SAYISI: " +
        input.soruSayisi +
        "\n- Örnek cevap, puanlama ölçütleri ve kabul edilebilir cevap sınırları ayrı ayrı doğrulanır."
      );
    case "DENEME":
      return [
        "MOD: DENEME SORUSU (kapsam genişliği modu — bu bir zorluk değişkeni DEĞİLDİR, zorluk yine hedef IQ tarafından belirlenir)",
        "SORU SAYISI: " + input.soruSayisi,
        "- Üretime başlamadan önce seçilen kazanımın TAM kapsam haritasını (o kazanımla doğal olarak " +
          "ilişkili alt beceri/temsil/ilişki bileşenlerini) kendi içinde çıkar.",
        "- Soruyu TEK küçük bir özellik/işlem/dönüşümün uzatılmış/süslenmiş biçimine indirgeme — bu " +
          "DENEME'nin amacını (kapsam genişliği) karşılamaz, yalnız STANDART bir soruyu şişirmiş olur.",
        "- Çözümde GERÇEKTEN en az iki, mümkünse üç kapsam bileşeni birlikte kullanılsın: gösterim " +
          "dönüşümü, işlem özelliği, eşdeğerlik, karşılaştırma-sıralama, koşul çıkarımı, temsil okuma, " +
          "tersine muhakeme veya karar verme — bunlar süs değil, çözümün gerçek, zorunlu adımları olmalı.",
        "- SORU SAYISI>1 ise kapsamı sorular arasında dağıt; her soru farklı bileşen kombinasyonunu " +
          "ölçsün, aynı kombinasyonu tekrar etme.",
      ].join("\n");
    case "STANDART":
      return [
        "MOD: STANDART TEST SORUSU",
        "SORU SAYISI: " + input.soruSayisi,
        "",
        "STANDART SORU TANIMI: Bu 'kolay soru' DEĞİLDİR — Bağlam Temelli/BTG/Zincir'in basitleştirilmiş " +
          "hâli de değildir, ayrı bir soru ailesidir. Belirlenen TEK öğrenme çıktısının temel bilgisini, " +
          "kuralını, formülünü veya doğrudan uygulanışını; gereksiz bağlam/senaryo ve çoklu muhakeme " +
          "olmadan ölçer. Amaç: öğrenci bu kazanımın temel yeterliğine gerçekten sahip mi?",
        "- TEK kazanım, TEK matematiksel çekirdek — ikinci bir konuyu ana rolde kullanma (yalnız temel ön " +
          "bilgi, ayrı bir öğrenme çıktısı gerektirmeden, kabul edilir).",
        "- Çözüm yolu baştan belirgin olsun: öğrenci strateji seçmez, model kurmaz, veri elemez. En fazla " +
          "2-3 kısa işlem adımı; uzun işlem yükü de bir 'zorluk' sayılmaz, gereksiz aritmetik kalabalığı ekleme.",
        "- Uydurma sahne/hikâye/kurum/kişi anlatısı YASAK ('Ali markete gitti...' türü). Kısa bir durum " +
          "cümlesi gerekiyorsa bile birkaç kelimeyle sınırlı tut; çözüme katkısı olmayan hiçbir cümle yazma.",
        "- Görsel/bağlam fotoğrafı varsayılan olarak GEREKSİZ (baglam_katmani.gerekli=false bırak) — yalnız " +
          "kazanımın kendisi bir temsili (grafik/tablo/sayı doğrusu/koordinat düzlemi) zorunlu kılıyorsa aç, " +
          "o durumda da TEK bir temsil türü yeterli.",
        "- Sayısal veriyi rastgele üretme: önce hedef çözüm ilişkisini kur, sonra sayıları seç. Kazanım " +
          "özellikle gerektirmiyorsa çirkin kesir/kök/büyük sayı ekleme. 0, 1, -1 gibi özel değerler test " +
          "edilen kuralı atlayıp öğrenciyi başka bir yoldan doğru cevaba götürüyorsa o veriyi kullanma.",
        "- Çeldiriciler rastgele değil, bu kuralın gerçek/tipik öğrenci hatalarından türesin (işaret hatası, " +
          "işlem sırası hatası, kuralı ters uygulama, yarım bırakılmış işlem gibi). Beş seçenek aynı " +
          "matematiksel aileden olsun (hepsi sayı, hepsi ifade, hepsi aralık vb.) — biçim farkı doğru " +
          "cevabı ele vermesin.",
      ].join("\n");
    default:
      return "MOD: " + input.mode;
  }
}

/** HTML `menar-btg-word-lock-v20` script'inin lockBlock() portu — bkz. prompts/README.md onarım notu. */
function btgWordLock(resolved: ResolvedJob): string {
  const { input } = resolved;
  if (input.mode !== "BTG") return "";
  const match = String(input.metinUzunlugu || "").match(/(\d{2,4})\s*[–-]\s*(\d{2,4})/);
  const min = match ? match[1] : "SEÇİLEN ALT SINIR";
  const max = match ? match[2] : "SEÇİLEN ÜST SINIR";
  return (
    "\n\n/BTG_METIN_UZUNLUK_KILIDI_V20/\n" +
    "- Kullanıcının seçtiği bilimsel/teknik ortak metin uzunluğu kesin üretim aralığıdır: " +
    input.metinUzunlugu +
    "\n" +
    "- Yalnız ORTAK ÖĞRETİCİ BAĞLAM METNİ sayılır; soru kökleri, seçenekler, tablo hücreleri, başlıklar, kaynak künyesi, cevap ve denetim satırları sayıma katılmaz.\n" +
    "- Gerçek sözcük sayısı " +
    min +
    " değerinden az veya " +
    max +
    " değerinden fazla ise bu adayı kullanma, ortak metni bilimsel neden-sonuç ve problem çekirdeğiyle yeniden üret.\n" +
    "- Alt sınırı tamamlamak için soru kökünü, seçenekleri veya tabloyu uzatma.\n" +
    "- BU KİLİDİN KONTROLÜ TAMAMEN SENİN İÇ MUHAKEMENE AİTTİR — sözcük sayısını, seçilen aralığı veya " +
    "PASS/RED sonucunu ASLA çıktı JSON'unun HİÇBİR alanına yazma (stimulus.notes, stimulus.paragraphs, " +
    "soru kökü, kaynak künyesi dahil hiçbir yere). Öğrenci veya öğretmen bu kilidin var olduğunu bilmemeli; " +
    "nihai JSON yalnız sorunun kendisini içerir, üretim sürecine dair hiçbir iz taşımaz."
  );
}

/** node 04'ün gerçekte gönderdiği kompakt çekirdek (20 satırlık kural listesi). */
function buildCompactPrompt(resolved: ResolvedJob, ledger: RotationLedger): string {
  const { input, outcome } = resolved;
  const ogrenimBecerisi = makeSkill(outcome.outcome);
  const surecBilesenleri = processComponents(outcome.outcome);
  const hedefBant = HEDEF_BANT[input.iq] ?? "hedef forma göre";
  const compactMode = modeBlock(resolved);
  const btgLock = input.mode === "BTG" ? btgWordLock(resolved) : "";

  return [
    "MENAR YAYINCILIK / MAYS " + DERS_ETIKET[input.ders ?? "MATEMATIK"].toLocaleUpperCase("tr-TR") + " V22.3 — KONTROLLÜ ÜRETİM",
    "",
    "ÜRETİM GİRDİSİ",
    "Ders: " + DERS_ETIKET[input.ders ?? "MATEMATIK"],
    "Sınıf / sınav: " + input.sinifVeyaSinav,
    "Tema / ünite: " + outcome.theme,
    "Kazanım kodu: " + input.kod,
    "Kazanım: " + outcome.outcome,
    "Alt konu / mikro: " + resolved.micro,
    "Üretim modu: " + input.mode,
    "Hedef IQ: " + input.iq + " (" + hedefBant + ")",
    "Soru sayısı: " + input.soruSayisi,
    "Çıktı genişliği: " + input.genislik,
    "Çıktı türü: " + input.cikti,
    "Çıktı modu: " + input.ciktiModu,
    "Cevap görünürlüğü: " + input.cevapGorunurlugu,
    "Görsel kararı: " + input.gorselKarari,
    "Görsel veri stratejisi: " + (input.gorselVeriStratejisi ?? "DETERMINISTIK_SVG"),
    "Seçenek yapısı: " + input.secenekYapisi,
    "TYMM alan becerisi: " + input.tymmAlanBecerisi,
    "TYMM eğilim / okuryazarlık: " + input.tymmEgilim,
    "Öğrenim becerisi: " + ogrenimBecerisi,
    "Süreç bileşenleri: " + surecBilesenleri.join(" | "),
    "Ek istek: " + (input.ekIstek || "YOK"),
    "",
    "MOD KURALLARI",
    compactMode,
    btgLock,
    "",
    "ZORUNLU KALİTE KİLİTLERİ",
    "1. Seçilen kazanım ve mikro başlığın dışına çıkma. Kazanımı değiştirme veya genişletme.",
    "2. Formdaki soru sayısı kadar soru üret. Her soruda tam 5 seçenek ve yalnız 1 doğru cevap bulunmalı.",
    "3. Doğru seçenek A–E harflerinden biri olmalı. Beş seçeneğin metni ve çözüm sonucu birbirinden farklı olmalı.",
    "4. Her yanlış seçenek için farklı, gerçekçi ve dersin kendi mantığıyla (matematiksel/fiziksel/kimyasal/" +
      "biyolojik/metinsel-yorumsal) açıklanabilir bir hata yolu yaz.",
    "5. Soruyu bağımsız çöz; çözüm adımlarını kısa fakat doğrulanabilir yaz. Cevap anahtarı çözümle birebir uyuşmalı.",
    "6. " + IQ_KURALI[input.ders ?? "MATEMATIK"],
    "7. IQ300 ve IQ350 için ikinci konu/kazanım bütünleştirmesi zorunludur; yapay veya süs amaçlı olmamalıdır.",
    "8. Dar çıktıda (85_MM/90_MM) soru kökü en fazla 120 kelime, seçenek başına en fazla 6 kelime; geniş çıktıda (185_MM/180_MM) kök en fazla 220 kelime.",
    "9. Türkçe ondalık ayırıcı virgüldür. Birimler tutarlı olmalı. Ali/Ayşe/Ahmet/Mehmet ve havuz-musluk gibi klişeleri kullanma.",
    "10. Bağlam çıkarıldığında karar veya bilgi kaybı oluşmalı; dekoratif bağlam kurma.",
    "11. VERİ GÖSTERİM HİYERARŞİSİ (ÖNCELİK SIRASI — TÜM DERSLER İÇİN GEÇERLİ, yalnız Geometri'ye özel " +
      "değil, kullanıcı talebiyle 2026-08-18'de YENİDEN düzenlendi): baglam_katmani (fotogerçekçi AI görseli) " +
      "HER ZAMAN riskli/güvenilmez bir kanaldır — 3 denemelik pahalı bir üretim+denetim döngüsünden geçer ve " +
      "başarısız olabilir. veri_katmani (TABLO/GRAFİK/FONKSIYON/GEOMETRI) kod tarafında deterministik üretilir, " +
      "ASLA başarısız olmaz — AMA yine de fazladan bir GÖRSEL ASSET'İdir; kullanıcı, iyi bir bağlam fotoğrafının " +
      "yanında sürekli ayrı bir grafik/tablo GÖRÜNMESİNİ istemiyor ('yine sürekli grafik tablo istemiyorum'). " +
      "Bu yüzden ÜÇÜNCÜ, EN ÖNCELİKLİ bir seçenek var: veri metne yazılabiliyorsa SORU METNİNE (stimulus " +
      "paragrafları) doğrudan cümle/liste olarak yaz — bu HİÇ görsel asset üretmez, %100 güvenilir, ve " +
      "sayfada yalnız fotoğraf + düz metin kalır (kullanıcının istediği görünüm).\n" +
      "YENİ ÖNCELİK SIRASI: (1) ÖNCE SORU METNİ — veri sayısal/kategorik/listelenebilir bir yapıdaysa " +
      "(deney sonuç sayıları, ölçüm kayıtları, kaç adet/hangi kategoriden gibi), bunu 'Güneşli havada mavi " +
      "24, mor 12, sarı 14...' gibi doğrudan bir cümleyle veya kısa bir listeyle stimulus paragrafına yaz; " +
      "veri_katmani.gerekli=false, tur=YOK kalır — bu ARTIK VARSAYILANDIR, önceki turlarda varsayılan olan " +
      "TABLO/GRAFİK DEĞİL. (2) veri_katmani GÖRSEL bir asset olarak YALNIZ şu iki durumda GERÇEKTEN gerekli: " +
      "(a) veri GEOMETRİK/UZAMSAL (nokta/kenar/açı, bir şeklin biçimi) — metne yazmak anlamı kaybettirir, " +
      "GEOMETRI SVG kullan; (b) sorunun ÖLÇME AMACI bizzat 'bir grafiği/tabloyu OKUMA' becerisidir (temsil " +
      "geçişi kasıtlı hedefleniyor, ör. bir FONKSİYON grafiğinin artan/azalan aralığını okuma) VE bu beceri " +
      "metne çevrilirse kaybolur — bu durumda CIZGI/SUTUN/FONKSIYON/TABLO bilinçli bir seçim olarak kalabilir, " +
      "ama bu bir İSTİSNA olarak GEREKÇELENDİRİLMELİ, 'veri 2'den fazla sayı içeriyor' gibi otomatik bir " +
      "varsayılan OLMAMALI. (3) baglam_katmani (fotoğraf) yalnız gerçek bir fiziksel nesnenin/cihazın KENDİ " +
      "EKRANINDAN okunan TEK bir basit değer varsa veri taşıyabilir (bkz. SAYI SINIRI altta, en fazla 1) — " +
      "bu da bir istisna, varsayılan değil.\n" +
      "CIHAZ_EKRANI/TEKNIK_ETIKET/NESNE_INDEKSI'nin aşağıdaki güvenlik ağı mekanizması YALNIZ gerçekten " +
      "fiziksel/fotoğrafik bir okuma metne/deterministik katmana taşınamadığında vardır — çoğu durumda hiç " +
      "gerekmez, çünkü veri artık doğrudan metinde.\n" +
      "ÇOK ÖNEMLİ YANLIŞ ANLAMA UYARISI (kullanıcı geri bildirimi, 2026-08-17): 'veri veri_katmani'ne gider, " +
      "baglam_katmani.gorsel_veri_gosterimi=YOK kalır' cümlesi 'baglam_katmani.gerekli=false yap' ANLAMINA " +
      "GELMEZ — bu sistem ZATEN bağlam temelli soru üretmek için var, bağlam görseli (fotogerçekçi sahne) " +
      "sorunun BÜTÜNSEL kalitesinin önemli bir parçasıdır ve VARSAYILAN olarak İSTENİR. Bu hiyerarşi kuralı " +
      "yalnız SAYININ/DEĞERİN NEREDE gösterileceğini belirler (fotoğrafta mı, deterministik katmanda mı) — " +
      "sahnenin KENDİSİNİN olup olmayacağını değil. Somut kural: senaryonun gerçek bir fiziksel bağlamı/ " +
      "nesnesi/mekânı VARSA (bağlam temelli sorularda neredeyse HER ZAMAN vardır), baglam_katmani.gerekli=true " +
      "kalmalı ve sahne SAF ATMOSFER olarak (gorsel_veri_gosterimi=YOK, hiç sayı/etiket yazdırmadan) " +
      "canlandırılmalı — veri ise (yukarıdaki YENİ öncelik sırasına göre) genellikle SORU METNİNDE, ayrı bir " +
      "görsel katman OLMADAN durur; yalnız gerçekten geometrik/uzamsal ya da grafik-okuma-becerisi hedeflenen " +
      "istisnai durumlarda veri_katmani GÖRSEL bir asset olarak fotoğrafın YANINA eklenir. " +
      "baglam_katmani.gerekli=false YALNIZ senaryonun gerçekten hiç fiziksel/görsel bir sahnesi yoksa (ör. " +
      "tamamen soyut cebirsel/fonksiyonel bir ifade, somutlaştırılacak bir nesne/mekân YOK) kullanılır.\n" +
      "AMA resmî MEB örneklerinde (bkz. kılavuz) bağlam görseli GERÇEKTEN birinci durumu (fiziksel okuma) " +
      "temsil ettiğinde çoğu zaman bir ölçüm cihazının ekranındaki okumayı (gorsel_veri_gosterimi=CIHAZ_EKRANI) " +
      "veya boyutlandırılmış bir teknik çizimi (gorsel_veri_gosterimi=TEKNIK_ETIKET) gösterir — bu durumda " +
      "uygunsa bu türlerden birini seç ve gorselde_gosterilecek_degerler'e TAM OLARAK görünmesi gereken " +
      "değerleri yaz (gorsel_veri_manifesti'nden birebir, uydurma değer ekleme). Cevabı doğrudan ele veren " +
      "bir değer asla gösterilmez.\n" +
      // ESKİ SINIR (KALDIRILDI): "görsel modeli yalnız kısa/yalın rakam
      // çizebilir, en fazla 2 değer" kısıtı AI'nın KENDİSİNİN metin çizme
      // güvenilirliğine dayanıyordu. Artık AI'dan gorsel_veri_gosterimi!=YOK
      // olduğunda değerleri KENDİSİ ÇİZMESİ hiç istenmiyor (bkz. altta
      // ZORUNLU: overlay_konumlari) — AI yalnız o bölgeyi BOŞ/NÖTR (kapalı
      // ekran, boş etiket yüzeyi) bırakır, gerçek metin (kök işareti, kesir,
      // çok satırlı ifade dahil — GERÇEK bir tarayıcı font motoruyla, sınırsız
      // karmaşıklıkta) üretim SONRASI deterministik bindirilir (bkz.
      // render/gorsel-overlay.ts, 20-baglam-gorseli.ts). Bu yüzden ne uzunluk/ ` +
      "sembol kısıtı ne de '2 değer' sayı sınırı artık geçerli — istediğin kadar değeri, istediğin " +
      "karmaşıklıkta (√, kesir, ℝ gibi semboller dahil) güvenle kullanabilirsin.\n" +
      "ZORUNLU — overlay_konumlari: gorsel_veri_gosterimi CIHAZ_EKRANI veya TEKNIK_ETIKET olduğunda, " +
      "gorselde_gosterilecek_degerler'deki HER değere BİREBİR karşılık gelen (aynı sırada, aynı uzunlukta) " +
      "bir overlay_konumlari girdisi {x_yuzde, y_yuzde} doldurulmalı — bu, o değerin görselde YÜZDE " +
      "cinsinden (sol-üst köşe 0,0; sağ-alt köşe 100,100) nereye bindirileceğini belirler. Konumu sahnenin " +
      "kompozisyonuna göre GERÇEKÇİ seç (ör. bir masaüstü cihazın ekranı genelde orta-üst/orta-alt bölgede " +
      "olur, bir kumpasın dijital göstergesi kendi gövdesinin üstünde durur) — bu koordinat hem AI'ya 'bu " +
      "bölgeyi boş bırak' talimatının hem de bindirmenin dayanağı, boş/yanlış bırakılırsa preflight sert " +
      "kapıyla RED verir.\n" +
      "GÖRSEL KİMLİK KODLAMASI (kullanıcı isteği, ÇOK ÖNEMLİ — NESNE_SEMASI'dan ÖNCE denenmesi gereken bir " +
      "seçenek, ondan sonraki paragrafla KARIŞTIRMA: bu, 'cihaz farklı sayısal değerler gösteriyor' " +
      "durumundan farklı bir senaryo — burada tek ihtiyaç, aynı türden birden fazla nesneyi (araba, kutu, " +
      "dolap, bardak, top...) birbirinden AYIRT ETMEK). Bunları harf/numara ile ADLANDIRMA ('A arabası', " +
      "'1 numaralı kutu', 'X dolabı') — bu isim fotoğrafa geçtiğinde görsel modeli okunaklı harf/rakam " +
      "YAZAMADIĞI için başarısız olur (tam olarak NESNE_INDEKSI'nin yasaklanma nedeni, canlı modda kanıtlı: " +
      "harf/numara denemesi araba/kutu gövdesine anlamsız/bozuk yazı olarak çıkıyor). Bunun yerine, nesne " +
      "türü gerçekçi biçimde bunu taşıyabiliyorsa (araba/kutu/bardak/top/kalem/dolap kapağı gibi farklı " +
      "renkte üretilebilen nesneler), nesneleri GERÇEK bir görsel nitelikle adlandır — öncelik sırası: " +
      "(1) RENK ('sarı araba', 'mavi araba', 'yeşil araba' — en güvenilir, görsel modeller rengi harf/ " +
      "rakamdan çok daha tutarlı çizer), (2) renk uygun değilse BOYUT ('büyük kutu', 'küçük kutu'), " +
      "(3) o da uygun değilse belirgin bir FİZİKSEL ÖZELLİK ('çizgili kutu', 'düz kutu'). Bu nitelik HEM " +
      "soru metninde (kök, seçenekler, stimulus — 'sarı araba', 'A arabası' değil) HEM baglam_katmani." +
      "nesneler/on_plan/orta_plan/arka_plan içinde TUTARLI şekilde aynı kelimeyle geçmeli — ikisi arasında " +
      "uyuşmazlık (metinde 'sarı', görselde farklı bir renk) görsel denetiminde RED nedenidir. Bu kodlama " +
      "gerçekçi biçimde uygulanamıyorsa (nesne türü doğası gereği hep aynı renk/boyutta üretilir, ayırt " +
      "edici bir görsel fark uydurmak sahneyi gerçek-dışı yapar) ancak O ZAMAN aşağıdaki NESNE_SEMASI'ya " +
      "düşülür — NESNE_SEMASI bir ilk tercih/kolay yol DEĞİL, gerçek görsel ayırt edicilik mümkün " +
      "olmadığında başvurulan bir SON ÇAREDİR.\n" +
      "GÖRSEL MİKTAR KODLAMASI (kullanıcı isteği): sorunun ihtiyacı yalnız bir SAYIM/ADET bilgisiyse (ör. " +
      "'kutuda kaç şeker var', 'kaç araba var'), bunu görsele bir RAKAM olarak yazdırmaya ÇALIŞMA (bu, " +
      "yukarıdaki CIHAZ_EKRANI/TEKNIK_ETIKET mekanizmasıyla KARIŞTIRILMAMALI — o cihaz okumaları içindir, " +
      "bu SAYIM içindir). Bunun yerine sahnede o nesneden TAM OLARAK istenen sayıda GERÇEK, AYRI AYRI " +
      "SAYILABİLİR kopya bulunsun (ör. baglam_katmani.islev/nesneler'e 'kutunun içinde 3 ayrı şeker, her " +
      "biri net görünür ve sayılabilir' gibi somutça yaz) — görsel modelin sahneye doğru SAYIDA nesne " +
      "yerleştirmesi, okunaklı bir rakam/etiket yazmasından çok daha güvenilirdir. Sayı 6-7'yi aşarsa " +
      "(sahnede tek tek sayılması gerçekçi olmaktan çıkarsa) bu senaryoda da doğrudan SORU METNİNDE sayıyı " +
      "belirtmek (gerekirse veri_katmani) tercih edilir — büyük sayılar için sahneye o kadar nesne " +
      "sıkıştırmak ASIRI_KARMASA denetim kriterine takılır.\n" +
      "DÜZ/İSTİFLENEBİLİR NESNE UYARISI (canlı modda görüldü, KRİTİK — job MENAR-MAT972-20260825193841, " +
      "6-7 eşiğinin İÇİNDE kalan 6 ve 4 adetlik gruplar bile 3 denemenin 3'ünde de RED aldı): RENK/MİKTAR " +
      "kodlaması için nesne türü seçerken KART, FİŞ, SAYFA, JETON gibi DÜZ ve istiflenebilir nesnelerden " +
      "KAÇIN — bunlar top/küp/meyve/blok gibi doğal 3 boyutlu, birbirinden uzamsal olarak ayrık nesnelere " +
      "göre görsel modelde çok daha sık üst üste biniyor VE yanlış sayılıyor, sayı 6-7 eşiğinin altında " +
      "olsa bile. Bağlam doğası gereği kart/fiş/sayfa gerektiriyorsa (ör. çekiliş, kart oyunu), o nesneyi " +
      "RENK/MİKTAR kodlamasının SAYILAN öznesi yapma — bunun yerine gerçek adedi SORU METNİNDE doğrudan " +
      "belirt (ör. 'torbada 6 yeşil, 4 turuncu kart bulunuyor') ve sahneyi yalnız SAF ATMOSFER olarak " +
      "(kartların kesin sayısı görselde belirleyici olmadan) canlandır.\n" +
      "ÇOK GRUPLU RENK/MİKTAR YASAĞI (canlı modda görüldü, KRİTİK — job MENAR-MAT972-20260825200252, DÜZ/ " +
      "İSTİFLENEBİLİR düzeltmesinden SONRA bile: doğal 3 boyutlu nesne — antrenman konisi — seçilmesine " +
      "rağmen 3 renk grubu (3 mavi + 2 sarı + 1 yeşil) aynı sahnede 3 denemenin 3'ünde de yanlış sayıldı, " +
      "çoğunlukla iki grup arasında sayı karışması şeklinde): RENK/MİKTAR kodlaması SADECE TEK bir renk/ " +
      "kategori grubunun sayıldığı sahnelerde güvenilir — sahnede AYNI ANDA 2 VEYA DAHA FAZLA farklı renk/ " +
      "kategoriden nesnenin HER BİRİNİN kesin adedinin ayrı ayrı doğru olması gerekiyorsa (ör. '3 mavi + 2 " +
      "sarı + 1 yeşil koni') bunu ASLA görsele bırakma — görsel modeli birden fazla grubu eş zamanlı doğru " +
      "sayamıyor, tek grup sayarken güvenilir olsa bile. Çok gruplu durumda: TÜM grupların gerçek adetlerini " +
      "doğrudan SORU METNİNDE ver (ör. 'sahada 3 mavi, 2 sarı ve 1 yeşil antrenman konisi bulunuyor') ve " +
      "baglam_katmani'nı yalnız SAF ATMOSFER olarak kur (gorsel_veri_gosterimi=YOK, renk_miktar_sayimlari " +
      "boş/gereksiz) — nesneler var olabilir ama kesin adetleri görselden OKUNMASI gereken veri OLMASIN.\n" +
      "ZORUNLU KAYIT (canlı modda görüldü, KRİTİK — bu olmadan görsel denetimi sayıyı KENDİ KENDİNE " +
      "doğrulamış gibi yapıp, gerçekte yanlış sayıda nesne olsa bile yanlışlıkla PASS verebiliyor): RENK/ " +
      "MİKTAR kodlamasıyla ayırt ettiğin HER nesne grubu için `gorsel_veri_manifesti.renk_miktar_" +
      "sayimlari`'na TAM OLARAK beklenen adedi yaz — ör. `[{\"nesne\":\"yeşil kare ped\",\"beklenen_adet\":4}," +
      "{\"nesne\":\"turuncu yuvarlak numune\",\"beklenen_adet\":2}]`. Bu alan doldurulmazsa görsel denetimi " +
      "bu nesne grubu için sayı doğrulamasını HİÇ yapamaz.\n" +
      "TEK KAYNAK KURALI (canlı modda görüldü — RENK/MİKTAR kodlaması bir sayıyı/kimliği görselde " +
      "TAŞIYORSA, o bilgi SADECE görselden okunabilmeli; soru metni bunu (dolaylı yoldan bile) bağımsız " +
      "olarak türetilebilir kılmamalı. Örnek İHLAL: metin 'filtrelerin TAMAMI sırayla takıldığında' derken " +
      "aynı zamanda görselde 'kaç filtre olduğunu göster' istemek — 'tamamı' ifadesi zaten dolaylı bir " +
      "sayı ipucu taşıdığı için görsel artık gereksiz/dekoratif olur (board bunu GÖRSEL DEKORATİF diye " +
      "RED eder). Bunun yerine ya metni 'bazı filtreler takıldığında' gibi sayıyı belirsiz bırakacak " +
      "şekilde yaz (gerçek sayı yalnız görselden okunur) ya da bu bilgiyi zaten metinde açıkça veriyorsan " +
      "görsele o bilgiyi TEKRAR yükleme, işlev başka bir gerçekten görsel-bağımlı bilgiye dayansın.\n" +
      "KAÇIŞ SIRASI (kullanıcı isteği, ÇOK ÖNEMLİ): yukarıdaki RENK/MİKTAR kodlaması, NESNE_SEMASI/TABLO " +
      "gibi deterministik katmanlardan ÖNCE denenmesi gereken varsayılan yoldur — bunlar 'basit ve garantili' " +
      "olduğu için doğrudan atlanacak bir kolay çıkış DEĞİLDİR. Deterministik katmana YALNIZ RENK/MİKTAR " +
      "kodlaması yukarıdaki nedenlerle gerçekten uygulanamadığında geçilir.\n" +
      "İstisna — NESNE_INDEKSI ARTIK YASAK, ONUN YERİNE NESNE_SEMASI (canlı modda ÇOK KEZ görüldü, KRİTİK — " +
      "preflight bunu sert kapıyla da engelliyor): bağlamda görselin sayı GÖSTERMESİ değil yalnız hangi " +
      "nesnenin hangi sırada/rafta/indekste olduğunu GÖSTERMESİ yeterliyse, bunu ASLA baglam_katmani." +
      "gorsel_veri_gosterimi=NESNE_INDEKSI ile fotoğrafa AI'ya indeks numarası yazdırarak ÇÖZME — basit " +
      "ardışık 1,2,3... etiketleri bile 3 denemenin 3'ünde eksik/tekrarlı/uydurma-sembollü çıkıyor (fosil " +
      "odası, su arıtma tesisi, akort modülleri — hepsi bu yüzden RED aldı, sağlayıcıdan bağımsız bir zaaf, " +
      "her seferinde 1+ dolarlık boşa giden görsel denemesi). Bunun yerine: baglam_katmani.gorsel_veri_" +
      "gosterimi=YOK bırak (fotoğraf yalnız atmosfer), veri_katmani.tur=NESNE_SEMASI seç ve gorsel_veri_" +
      "manifesti.nesne_semasi'yi doldur (toplam_sayi, varsa isaretli_indeksler + isaret_aciklamasi — ör. " +
      "'sarı uyarı ışığı yanan modül' gibi TEK bir nesneyi öne çıkarman gerekiyorsa). Bu SVG'ye kod " +
      "seviyesinde çizilir, indeks eksikliği/tekrarı YAPISAL OLARAK imkansızdır. Gerçek değerler (varsa) " +
      "ayrı bir TABLO KURULMADAN, aynı indekslerle SORU METNİNDE (stimulus paragraflarında) açık bir " +
      "cümleyle verilir (ör. '1 numaralı modülün değeri 70, 2 numaralı modülün değeri 105...') — verinin " +
      "TEK kaynağı bu cümledir, her durumda öğrenciye gösterilir.\n" +
      "DALLANMA/YÖN KISITI (canlı modda görüldü, ÇOK ÖNEMLİ): tıpkı yukarıdaki gibi, görsel modeli " +
      "nesneleri BİRDEN FAZLA DAL/KOL/YOL arasında (ör. 'ana hat' vs 'yan kol', 'A yolu' vs 'B yolu') " +
      "DOĞRU konuma güvenilir yerleştiremiyor — 3 denemede de yanlış dala/sıraya yerleştirdi. HANGİ " +
      "NESNENİN HANGİ DALDA/KOLDA olduğu çözüm için gerekliyse bu bilgiyi SADECE görselin konumsal " +
      "düzenine bırakma: veri_katmani.tur=TABLO'ya bir 'Konum/Dal' sütunu ekleyip (ör. '1: ana hat', " +
      "'2: yan kol'...) bu bilgiyi AÇIKÇA yaz — görsel yalnız genel/atmosferik sahneyi göstersin, " +
      "dal/konum bilgisi görselden OKUNMASI gereken kritik veri OLMASIN.\n" +
      "EK GRAFİK YASAĞI (canlı modda görüldü): 'akış hattı'/'bağlantı'/'yönlendirme' gibi bir bağlamda " +
      "görsel modeli izin verilmeyen ok/yön işareti gibi EK GRAFİK SEMBOLLER ekleme eğilimindedir (3 " +
      "denemede de görüldü, hepsi bu yüzden RED aldı) — bu tür bağlamları özellikle seçtiysen, prompt " +
      "yazarına (16-gorsel-prompt.ts) sahneyi STATİK/DURAĞAN betimlemesini gerektirecek şekilde " +
      "kurgula (ör. akış oku yerine sadece 'birbirine bağlı borular', yön belirtmeden).\n" +
      "GEOMETRİK/YAPISAL BİLGİ TEK KAYNAK KURALI (canlı modda görüldü, ÇOK ÖNEMLİ — DALLANMA/YÖN " +
      "KISITI'nın genellemesi): veri_katmani.tur=GEOMETRI veya TABLO ile bağlam görselindeki nesneler " +
      "AYNI yapısal bilgiyi (kaç tane nesne var, hangi sırada, hangi açı/uzunluk/işaret değeri taşıyor) " +
      "taşıyorsa, bu bilgi YALNIZ veri_katmani'nde gösterilir. Fotogerçekçi görsel modeli BİRDEN FAZLA " +
      "benzer nesneyi (ör. birden fazla üçgen panel, her biri farklı köşe açısı/damga taşıyan) doğru " +
      "SAYIP DOĞRU SIRAYLA çizmekte GÜVENİLMEZ — canlı testte 3 denemenin 3'ünde de görsel modeli " +
      "istenen sahne yerine TAMAMEN ALAKASIZ, uydurma bir sahne üretti (ör. 'üçgen cam panel montaj " +
      "maketi' istenirken 'iç mekanda dikdörtgen panel taşıyan kişi' + manifestte hiç olmayan uydurma " +
      "nesneler/marka logoları çizdi) — bu, metin/rakam okunaksızlığından FARKLI ve DAHA AĞIR bir " +
      "başarısızlık modu: modelin karmaşık/çok-nesneli kompozisyonu yorumlayamayıp konudan tamamen " +
      "sapması. Bu nedenle: (a) baglam_katmani.islev, veri_katmani'nin ZATEN taşıdığı bir yapısal " +
      "bilgiyi 'görsel kaldırılırsa kaybolur' diye GEREKÇE GÖSTEREMEZ — islev yalnız ATMOSFER/BAĞLAMSAL " +
      "İNANDIRICILIK işlevi tanımlamalı (ör. 'gerçekçi ortam olmadan öğrenci senaryoyu somutlaştıramaz'); " +
      "(b) nesneler/on_plan/orta_plan/arka_plan GENEL nesne isimleri kullanmalı (ör. 'üçgen cam paneller', " +
      "'saçak çerçevesi') — kaç tane olduğunu, hangi sırada olduğunu, hangi açı/damga/etiket taşıdığını " +
      "SAYARAK veya SIRALAYARAK betimleme, bu tam liste zaten geometrik_noktalar/geometrik_kenarlar/ " +
      "geometrik_acilar'da var; (c) yasaklar listesine bu tür sorularda 'nesne sayısını/sırasını/açı " +
      "veya damga değerlerini gösterme' eklenmeli.\n" +
      "AÇI VERİSİ ASLA FOTOĞRAFA VEYA TABLOYA YAZILMAZ, HER ZAMAN ŞEKLİN ÜZERİNDE (canlı modda ÜÇ KEZ " +
      "görüldü, KRİTİK — preflight bunu sert kapıyla da engelliyor, kapı hem ∠ işaretini HEM salt derece " +
      "değerini ('35°') HEM tabloya gizlenmiş açı verisini yakalar, kaçış yok): '∠BAD=38°' gibi açı " +
      "İSİMLERİ gorselde_gosterilecek_degerler'e (baglam_katmani/TEKNIK_ETIKET veya CIHAZ_EKRANI) ASLA " +
      "konmaz — görsel modeli açı isimlerini bozuyor (∠BAD yerine ∠AD gibi) veya uydurma etiket ekliyor. " +
      "AMA salt derece DEĞERİNİ ('35°', '(2x+5)°') isim olmadan fotoğrafa yazdırmak da, ya da açı verisini " +
      "bir 'yedek tablo'ya (ör. 'Sıra/Açı/Değer' sütunlu) gizleyip veri_katmani.tur=TABLO seçmek de AYNI " +
      "İHLALDİR — geometrik_noktalar/geometrik_kenarlar dolu olsa bile bu kaçışlar preflight'ta yakalanır. " +
      "Açı verisi VARSA (soru gerçekten açı ölçüsü kullanıyorsa) TEK doğru yol: veri_katmani.tur=GEOMETRI " +
      "seç, açıları gorsel_veri_manifesti.geometrik_acilar (kose/kenar1/kenar2/deger) ile tanımla — bu " +
      "SVG'ye kod seviyesinde, şeklin ÜZERİNDE çizilir, hiç görsel-model riski taşımaz. baglam_katmani bu " +
      "durumda gorsel_veri_gosterimi=YOK kalır, islev açı eşleşmesini gerekçe gösteremez (SVG zaten taşıyor), " +
      "veri_katmani.tur asla TABLO olamaz (açı içeren bir 'yedek tablo' fikri baştan yanlış — GEOMETRI SVG " +
      "zaten deterministik, hiç başarısız olmaz, yedeğe ihtiyacı yok).\n" +
      // 2026-09-05: canlı testte görüldü (job MENAR-FIZ924-20260905125513) —
      // bir kuvvet şeması yalnız düz bir çizgi + nokta harfleriyle (O, K, L)
      // çizildi, kuvvetlerin YÖNÜ görselde hiç işaretlenmedi ve büyüklükleri
      // (4 N, 10 N) yalnız paragraf metninde geçti, diyagramın kendisi hiçbir
      // sayı taşımıyordu — kullanıcı geri bildirimi: "görsel üzerine işaret/
      // ok/yazı yazması lazım, özellikle fizikte". geometrik_kenarlar'a bu
      // yüzden ok/etiket alanları eklendi (bkz. 03-generator-schema.ts).
      "VEKTÖR/KUVVET OKU VE ETİKETİ (özellikle FİZİK — kuvvet/hız/ivme/alan şemaları, ama herhangi bir " +
      "ders yönlü bir büyüklük çizmek istiyorsa geçerli). GÖRSEL VERİ STRATEJİSİ=DETERMINISTIK_SVG İSE " +
      "(varsayılan): bir kenar bir VEKTÖRÜ (yönlü büyüklüğü) temsil ediyorsa bunu düz bir çizgi olarak " +
      "bırakma — geometrik_kenarlar'daki o girdiye `ok` alanını doldur ('NOKTA1'/'NOKTA2'/'IKI_UC', hangi " +
      "ucun ok başı taşıyacağını belirler) VE `etiket` alanına kısa bir isim+değer yaz (ör. 'F₁ = 4 N', " +
      "'v = 12 m/s') — bu, SVG'ye kod seviyesinde çizilir (AI çizmez), hiç görsel-model riski taşımaz, " +
      "istediğin kadar sembol/birim kullanabilirsin. GÖRSEL VERİ STRATEJİSİ=FOTOGRAF_UZERINDE veya " +
      "FOTOGRAF_UZERINDE_HIBRIT İSE (kullanıcı isteği, 2026-09-14 — 'üstte grafik şeklinde kuvvet gösterimi " +
      "istemiyorum, seçime bırak'): vektörü AYRI bir GEOMETRI şeması olarak KURMA — bunun yerine " +
      "baglam_katmani.gorsel_veri_gosterimi=KUVVET_OKU seç, her vektörü baglam_katmani.overlay_cizgileri'ne " +
      "bir kayıt olarak ekle (x1_yuzde/y1_yuzde/x2_yuzde/y2_yuzde ile fotoğrafta YAKLAŞIK nereye düşeceğini, " +
      "`ok` alanına 'UC1'/'UC2'/'IKI_UC' yaz. `etiket` alanı İSİM+SAYI İKİSİNİ BİRDEN içermeli — ÖRNEK: " +
      "gorsel_veri_manifesti.degiskenler'de 'Çekme kuvveti = 30 N; sağa' varsa, o vektörün `etiket` alanına " +
      "TAM OLARAK 'Çekme kuvveti = 30 N' yaz (yön kısmı hariç, o zaten okun yönüyle gösteriliyor). ÇOK ÖNEMLİ " +
      "— ÜÇ HATA SIK GÖRÜLÜYOR: (1) `etiket` alanına ASLA '{{gorsel_veri_manifesti.degiskenler[0]}}' gibi bir " +
      "ŞABLON/DEĞİŞKEN REFERANSI yazma — bu bir kod değil, öğrenciye GÖRÜNECEK düz metindir, gerçek değeri " +
      "doğrudan, harfi harfine yaz. (2) `etiket`e YALNIZ kuvvetin ADINI yazıp SAYIYI ATLAMA (ör. yalnız " +
      "'Çekme kuvveti' yazıp '= 30 N' kısmını unutma) — sayı yoksa öğrenci soruyu ÇÖZEMEZ, bu KRİTİK bir " +
      "hata, 'aynı veriyi manifestte zaten var, tekrar etmeyeyim' diye düşünüp sayıyı atlama; overlay_ " +
      "cizgileri BAŞLI BAŞINA öğrencinin sayıyı GÖRECEĞİ TEK yerdir, atlarsan hiçbir yerde görünmez. " +
      "(3) KUVVET_OKU'da aynı değeri baglam_katmani.gorselde_gosterilecek_degerler/overlay_konumlari'na " +
      "AYRICA EKLEME — bu iki alan yalnız CIHAZ_EKRANI/TEKNIK_ETIKET/OLCUM_CIZGISI için, KUVVET_OKU'da BOŞ " +
      "kalmalı, her vektörün değeri YALNIZ kendi overlay_cizgileri kaydının `etiket` alanında taşınır, aksi " +
      "halde aynı değer görselde İKİ KEZ (bir kez metin kutusu, bir kez ok etiketi olarak) belirir. Bu " +
      "maddeyle ilgili stimulus.notes'a (veya başka bir öğrenci-görünür alana) ÜRETİM SÜRECİYLE İLGİLİ " +
      "HİÇBİR AÇIKLAMA/NOT EKLEME (ör. 'görsel üretim talimatı', 'henüz üretilmemiş', 'kontrol edilmiştir' " +
      "gibi) — bunlar öğrenciye ASLA görünmemeli, yalnız JSON alanlarını (overlay_cizgileri vb.) doldur. " +
      "FOTOGRAF_UZERINDE'de üretim SONRASI koddan bindirilir (AI çizmez), FOTOGRAF_UZERINDE_HIBRIT'te ÖNCE " +
      "AI'nın kendisi çizmesi denenir, başarısız olursa OTOMATİK olarak aynı deterministik yola döner — " +
      "ikisinde de senin dolduracağın alanlar AYNIDIR, veri_katmani.gerekli=false KALIR. Her iki stratejide " +
      "de: kuvvet/hız/ivme büyüklüğünü YALNIZ paragraf metninde bırakıp diyagramı sayısız/yönsüz bir çizgi " +
      "olarak bırakma — öğrenci diyagrama baktığında yön VE büyüklüğü ORADA görmeli, metne geri dönüp " +
      "aramak zorunda kalmamalı.\n" +
      "BAĞLAMSAL GEOMETRİ SAHNESİ (kullanıcı kararı, 2026-08-23, YALNIZ Ders=Geometri için — ÇOK ÖNEMLİ): " +
      "GEOMETRİ sorusunun bağlamı gerçek yaşamdan geliyor olması ('bir itfaiyeci merdiveni binaya dayıyor', " +
      "'bir direğin gölgesi', 'bir rampanın eğimi', 'bir binaya bakış açısı', 'bir köprü/çatı/halat/tekerlek/ " +
      "ağaç/saat bağlamı') TEK BAŞINA baglam_katmani.gerekli=true (fotogerçekçi AI görseli) GEREKTİRMEZ. " +
      "'Bağlam gerçek hayat' olması ile 'görselin fotogerçekçi olması gerekir' olması AYNI ŞEY DEĞİLDİR: " +
      "öğrencinin gerçekte çözdüğü şey her zaman bir dik üçgen/açı/uzunluk ilişkisidir, sahne yalnız bu " +
      "ilişkiyi somutlaştıran bir İSKELETTİR. Sahne aşağıdaki basit öğelerin (duvar, zemin, merdiven, direk, " +
      "gölge, rampa, bina, köprü, çatı, halat/kablo, tekerlek, ağaç, kişi silueti, saat kadranı) bir veya " +
      "birkaçıyla TEMSİL EDİLEBİLİYORSA, fotogerçekçi görsel yerine bu YOL tercih edilir: geometrik_noktalar/ " +
      "geometrik_kenarlar/geometrik_acilar'ı normal şekilde doldur (dik üçgen/açı/uzunluk gerçeği burada " +
      "kalır, değişmez), sonra gorsel_veri_manifesti.baglam_sahnesi_elemanlari'na HANGİ kenarın/noktanın " +
      "hangi gerçek-dünya öğesiyle 'giydirileceğini' yaz — ör. merdiven-duvar sorusunda A=zemin-duvar köşesi, " +
      "B=duvarın tepesi, C=merdivenin zemine değdiği nokta ise: " +
      "`[{\"tur\":\"DUVAR\",\"kenar\":{\"nokta1\":\"A\",\"nokta2\":\"B\"}},{\"tur\":\"ZEMIN\",\"kenar\":" +
      "{\"nokta1\":\"A\",\"nokta2\":\"C\"}},{\"tur\":\"MERDIVEN\",\"kenar\":{\"nokta1\":\"B\",\"nokta2\":" +
      "\"C\"}}]`. Bu durumda baglam_katmani.gerekli=false KALIR — sahne bütünüyle 14-veri-katmani.ts'te SVG " +
      "olarak, geometrik gerçeğin ÜSTÜNE (açı yayı/eşitlik işareti dahil) tek bir görselde birleşik çizilir; " +
      "iki ayrı, birbiriyle görsel olarak bağlantısız görsel (bir fotoğraf + ayrıca soyut bir üçgen şeması) " +
      "ORTAYA ÇIKMAZ, ve açı/uzunluk verisi hiçbir zaman AI görsel modelinden geçmediği için hata riski " +
      "SIFIRDIR. baglam_katmani (fotogerçekçi AI görseli) GEOMETRİ dersinde YALNIZ sahnenin KENDİSİ (gerçek " +
      "bir fotoğrafın dokusu/gerçekçiliği) sorunun anlaşılırlığı için VAZGEÇİLMEZSE ve yukarıdaki basit " +
      "öğe listesiyle temsil edilemeyecek kadar özgülse (ör. belirli bir gerçek nesnenin/aracın kendisi " +
      "tanınmalı) kullanılır — bu istisna, varsayılan değildir. baglam_sahnesi_elemanlari YENİ bir sayısal " +
      "veri TAŞIMAZ, yalnız var olan geometrik_noktalar'ı hangi görsel kimlikle çizeceğini eşler; nokta " +
      "adları geometrik_noktalar'daki 'ad' değerleriyle BİREBİR eşleşmeli, aksi halde o öğe sessizce atlanır.",
    "12. Tüm sayısal verilerin tek kaynağı gorsel_veri_manifesti olmalı. Metin, seçenekler, tablo, grafik ve " +
      "(varsa) gorselde_gosterilecek_degerler bu manifestle uyuşmalı. gorsel_veri_manifesti.kullanilan_sayilar " +
      "dizisi soru kökünde VE her şıkta geçen HER SAYIYI eksiksiz içermeli — NEGATİF sayılar dahil (ör. metinde " +
      "'-3°C' veya '-3' geçiyorsa kullanilan_sayilar'a '-3' MUTLAKA eklenmeli, yalnız pozitif değerleri listelemek " +
      "yetmez). Bu liste soru metniyle DETERMİNİSTİK/otomatik olarak çapraz karşılaştırılır (kod tarafında, LLM " +
      "yorumuna bağlı değil); listede eksik kalan tek bir sayı bile MANİFEST ÇAPRAZ RED'e ve pahalı bir yeniden " +
      "üretim denemesine yol açar — bu yüzden kullanilan_sayilar'ı 'görselde gösterilecek değerler' gibi dar " +
      "değil, metinde geçen TÜM sayıların tam listesi olarak doldur. grafik_serisi.tur=CIZGI ise noktalar[]." +
      "etiket alanını BOŞ BIRAK veya x ile AYNI değeri yaz — asla o noktanın y-okumasını veya farklı bir sayıyı " +
      "etiket'e yazma (canlı modda görüldü: x ekseni deney sayısı olması gerekirken etiket'e y-değerleri " +
      "yazılıp x-ekseni yanlış render edildi). etiket yalnız tur=SUTUN'da kategorik bir eksen adı (ör. ay " +
      "adı) gerekiyorsa anlamlıdır.",
    "13. Görsel gerekmiyorsa baglam_katmani.gerekli=false ve veri_katmani.gerekli=false kullan; yine de benzersiz manifest_id üret. " +
      "GÖRSEL KARARI=ISLEVSEL_GORSEL_ZORUNLU İSE (kullanıcı geri bildirimi, ÇOK ÖNEMLİ — preflight bunu sert " +
      "kapıyla da engelliyor): öğrenciye GERÇEK bir görsel/diyagram sunulmalı — baglam_katmani.gerekli=true " +
      "(gerçekten fotoğrafik bir sahne varsa) VEYA veri_katmani.tur∈{GEOMETRI,CIZGI,SUTUN,FONKSIYON," +
      "NESNE_SEMASI} (gerçek bir çizim/grafik/şema) ZORUNLUDUR. veri_katmani.tur=TABLO TEK BAŞINA bu kararı " +
      "KARŞILAMAZ — tablo salt sayısal veri listesidir, bir resim/diyagram değildir; baglam_katmani.gerekli=" +
      "false yapıp yalnız TABLO kurmak 'görsel zorunlu' seçimini boşa çıkarır.",
    "13a. GÖRSEL VERİ STRATEJİSİ=FOTOGRAF_UZERINDE VEYA FOTOGRAF_UZERINDE_HIBRIT İSE (kullanıcı isteği, " +
      "2026-09-14 — 'sorunun üstünde ayrı " +
      "bir grafik görmek istemiyorum, çizgi/rakam/yazı görselin İÇİNDE olsun'): görsel gerekiyorsa (görsel " +
      "kararı ISLEVSEL_GORSEL_ZORUNLU veya AI_OTOMATIK'in kendi kararıyla evet) sayısal veriyi veri_katmani " +
      "(TABLO/CIZGI/SUTUN/FONKSIYON — bunlar bağlam fotoğrafından AYRI bir SVG bloğu olarak sayfada görünür) " +
      "yerine baglam_katmani ÜZERİNDE göster: baglam_katmani.gerekli=true, gorsel_veri_gosterimi=CIHAZ_EKRANI " +
      "(bir ölçüm cihazının ekranı) / TEKNIK_ETIKET (yapıştırılmış bir ölçü etiketi) / OLCUM_CIZGISI (bir " +
      "cetvel/mezür üzerinde ölçülen bir uzunluk/miktar) / KUVVET_OKU (bir vektör/kuvvet oku+büyüklüğü, " +
      "bkz. VEKTÖR/KUVVET OKU maddesi) — hangisi sahneye en doğal oturuyorsa. " +
      "gorselde_gosterilecek_degerler'e gösterilecek TÜM değerleri, overlay_konumlari'na (veya OLCUM_CIZGISI " +
      "için ayrıca overlay_cizgileri'ne) bu değerlerin fotoğrafta YAKLAŞIK nereye düşeceğini (yüzde, sol-üst " +
      "0,0) doldur — gerçek metin/çizgi üretim SONRASI koddan bindirilir, sen yalnız KONUM tahmin edersin. Bu " +
      "modda veri_katmani.gerekli=false KALIR (TABLO/CIZGI/SUTUN/FONKSIYON kurma) — GERÇEK GEOMETRİK ŞEKİL " +
      "ÇİZİMİ (üçgen/açı gibi asıl konusu geometri olan bir soru, vektör/kuvvet DEĞİL) bu kısıttan MUAF, " +
      "gerekiyorsa yine tur=GEOMETRI kurulabilir — ama salt bir VEKTÖR/KUVVET OKU gösterimi ASLA GEOMETRI'ye " +
      "kurulmaz, yukarıdaki KUVVET_OKU yoluna gider. Görsel gerekmiyorsa (GORSEL_YOK " +
      "veya AI_OTOMATIK'in kendi kararı) bu madde hiç uygulanmaz, madde 13'teki normal kural geçerlidir. " +
      "FOTOGRAF_UZERINDE ile FOTOGRAF_UZERINDE_HIBRIT arasındaki fark senin (üreticinin) ürettiğin JSON'da " +
      "DEĞİL, görsel üretim/denetim aşamasında (kod tarafında) yönetilir — HIBRIT'te AI önce gerçek değeri " +
      "kendisi çizmeyi dener, başarısız olursa otomatik olarak aynı overlay_konumlari/overlay_cizgileri ile " +
      "deterministik bindirmeye döner; senin dolduracağın alanlar ikisinde de AYNIDIR.",
    "14. Görsel gerekiyorsa bağlam görseli ile veri görselini ayır. Veri katmanı SVG/tablo/grafik için açık veri tanımı taşımalı. " +
      "veri_katmani.tur=GEOMETRI SEÇME (gorsel_veri_manifesti.geometrik_noktalar boşsa hiçbir şey çizilmez, " +
      "veri tamamen kaybolur) — gerçek x/y koordinat noktalarıyla çizilen bir şekil değilse. Kart/etiket " +
      "eşleştirme, sınıflandırma, kategorik liste gibi satır-sütun veriyi ARTIK OTOMATİK OLARAK tur=TABLO'ya " +
      "koyma (madde 11'deki YENİ öncelik sırası) — önce bunu SORU METNİNDE cümle/liste olarak yazmayı dene, " +
      "yalnız metne yazmak GERÇEKTEN anlamı/okunabilirliği ciddi ölçüde kaybettiriyorsa (çok sayıda satır×sütun " +
      "kombinasyonu, karşılaştırmalı okuma gerektiren yoğun veri) tur=TABLO'ya düş. " +
      "İSTİSNA — GEOMETRİ DERSİNDE TABLO YASAK (kullanıcı kararı, preflight bunu sert kapıyla da engelliyor): " +
      "Ders=Geometri olan işlerde veri_katmani.tur ASLA TABLO olamaz — kart/etiket eşleştirme gibi görünen bir " +
      "veri bile olsa, Geometri dersinde görsel gerekiyorsa tek seçenek tur=GEOMETRI'dir (uygun noktalar/ " +
      "kenarlarla yeniden kurgula); hiç uymuyorsa veri_katmani.gerekli=false yap, TABLO'ya asla düşme. " +
      "14a. tur=GEOMETRI ise (özellikle Ders=Geometri sorularında) geometrik_noktalar YALNIZ köşe koordinatları " +
      "değildir — şeklin GERÇEK çizim bilgisini de doldur: geometrik_kenarlar (hangi iki nokta segmentle bağlı; " +
      "ana çokgenin kenarları ZORUNLU, yardımcı doğrular — yükseklik/kenarortay/açıortay/paralel kesit gibi " +
      "iç çizgiler de VARSA burada ayrıca listelenmeli, aksi halde poligon varsayımına düşülür ve o doğru hiç " +
      "çizilmez), geometrik_esit_kenar_gruplari (soru kökünde 'AB=AC' gibi eşitlik iddia edilen HER kenar grubu " +
      "— çentik işaretiyle gösterilir, aksi halde eşitlik görselde hiç görünmez), geometrik_acilar (soru kökünde " +
      "değeri verilen veya dik olduğu belirtilen HER açı için kose/kenar1/kenar2 + varsa deger/dik_aci=true — " +
      "aksi halde açı değeri görselde hiç görünmez). Kenar/açı adları geometrik_noktalar'daki 'ad' değerleriyle " +
      "BİREBİR eşleşmeli (harf/büyük-küçük dahil), yoksa o çizgi/açı sessizce atlanır. " +
      "gorsel_veri_manifesti.tablo'yu (headers/rows) doldur. tablo.footnotes'u yalnız gerçekten gerekli, " +
      "tablonun kendisinden veya soru kökünden ANLAŞILMAYAN bir bilgi için kullan (ör. birim, yuvarlama kuralı, " +
      "istisna). 'Hücrelerde X verilmiştir' gibi tablonun zaten gösterdiği veya soru kökünde zaten söylenmiş " +
      "bir şeyi yeniden yazan dipnot EKLEME — gereksiz, öğrenciye hiçbir yeni bilgi katmıyor (canlı modda görüldü).",
    "14b. KONUŞMA BALONCUKLARI (kullanıcı isteği, 2026-09-14/16 — özellikle TDE'de, ileride Tarih/Coğrafya/ " +
      "Din/Felsefe'de de kullanılacak; HER SORUDA ZORUNLU DEĞİL, yalnız senaryoya GERÇEKTEN uyuyorsa kullan): " +
      "bağlamda iki+ kişi arasında GERÇEK bir diyalog/tartışma/karşılıklı görüş geçiyorsa (ör. 'Ayşe ve Mehmet " +
      "bir şiiri tartışıyor', 'iki öğrenci bir problemde farklı yöntem savunuyor') bu konuşmayı DÜZ PARAGRAF " +
      "içine gömme — veri_katmani.tur=KONUSMA seç, her replik için gorsel_veri_manifesti.konusma_baloncuklari'na " +
      "`{konusmaci, metin}` ekle (en az 2 replik; `yon` alanı boş bırakılabilir). Bu yalnız GERÇEKTEN birden " +
      "fazla konuşmacı arasında geçen bir alışverişte kullanılır — tek kişinin anlatımı, bir metin alıntısı " +
      "veya BTG kaynağı bu maddeye girmez (o durumlarda normal stimulus paragrafı kullan). ÜRETİM HER ZAMAN " +
      "AYNI ŞEKİLDE ÇALIŞIR (seçtiğin bir 'stil' yok, tek davranış var — kullanıcı isteği: 'stilin hepsi aynı " +
      "olsun, üretim standart olarak AI olsun'): AI ÖNCE kendisi tüm illüstrasyonu (karakterler+balonlar+metin, " +
      "ham canlı testte kanıtlandı — doğru Türkçe karakterlerle okunaklı bir panel çizebiliyor) çizmeyi dener; " +
      "başarısız olursa sistem OTOMATİK olarak deterministik bir SVG yedeğine düşer. Bunun çalışabilmesi için " +
      "İKİ alan da ZORUNLU: baglam_katmani.gerekli=true YAP (false kalırsa illüstrasyon hiç denenmez) VE " +
      "veri_katmani.yalnizca_gorsel_yedegi=true YAZ (false kalırsa illüstrasyon başarılı olsa BİLE SVG yedeği " +
      "de sayfada kalır, aynı diyalog İKİ KEZ görünür). baglam_katmani.sahne alanına konuşmacıların bulunduğu " +
      "ortamı kısaca betimle (görsel prompt yazıcısı repliklerin kendisini zaten gorsel_veri_manifesti'nden " +
      "okuyor, sen yalnız SAHNE/ortamı anlat).",
    "15. Fiilen doğrulamadığın kaynak veya denetime PASS yazma. BTG değilse kaynak doğrulamasını UYGULANMAZ olarak kısa tut.",
    "16. Öğrenme Becerisi tek, ölçülebilir ve en fazla 18 kelimelik bir cümle olmalı.",
    "17. Son kullanılan bağlam ailelerinden kaçın: " + (ledger.son100BaglamAilesi.join(" | ") || "kayıt yok"),
    "18. Son aile::DNA eşleşmelerinden kaçın: " + (ledger.son200AileDna.slice(-40).join(" | ") || "kayıt yok"),
    "19. Son görsel ailelerinden kaçın: " + (ledger.son15GorselAilesi.join(" | ") || "kayıt yok"),
    "20. Aynı bilgiyi farklı alanlarda gereksiz biçimde tekrar etme; JSON alanlarını kısa ve işlevsel doldur.",
    "21. YAPAY/UYDURMA TEKNİK ÇATI YASAĞI: matematiği/bilimi gizlemek veya 'ilginç' göstermek amacıyla " +
      "gerçek karşılığı olmayan bir sensör türü, yazılım/algoritma adı, ölçüm cihazı, laboratuvar tekniği, " +
      "puanlama/katsayı sistemi, indeks veya formül İCAT ETME — bunlar öğrenciye 'bu gerçek bir şey, " +
      "bilgim yetersiz' hissi vererek konudan kopma veya yanlış varsayım riski yaratır. KURGUSAL kaynak " +
      "modunda (bkz. KAYNAK: KURGUSAL) hikâye/sahne kurgusal olabilir (kurgusal bir şirket, kurgusal bir " +
      "yarışma vb.) — ama sahnenin İÇİNDEKİ ölçüm/hesap MEKANİZMASI (bir formülün nasıl çalıştığı, bir " +
      "cihazın neyi ölçtüğü) gerçek matematiksel/bilimsel bir ilkeye dayanmalı, sahte-bilimsel görünen " +
      "icat edilmiş bir mekanizma OLMAMALI. BİLİMSEL KAYNAKLI modda gerçek/doğrulanabilir kaynak dışında " +
      "hiçbir veri, kaynak adı, DOI veya bağlantı uydurulamaz (bkz. madde 15 ve BTG kaynak manifesti).",
    "22. BİLİŞSEL YÜK ÖZ-DENETİMİ (tüm derslerde madde 6'daki IQ kalibrasyonuna ek zorunlu kontrol, " +
      "Geometri/TDE dahil): finalden önce kendine sor — 'Öğrencinin burada kendisinin vermesi gereken " +
      "gerçek bilişsel karar nedir?' Cevap 'hiçbiri; öğrenci yalnız verilen kuralı/formülü sırayla " +
      "uygular' ise bu soru ZOR/ÇOK ZOR etiketiyle YAYINLANAMAZ — hedef IQ ZOR/ÇOK ZOR ise çözüm DNA'sını " +
      "yapıca (yeni bir karar/temsil gerektirecek şekilde) yeniden kurgula, yalnız sayıları büyütme veya " +
      "işlem adımı ekleme. Uzun işlem, büyük/çirkin sayı, sembol yoğunluğu veya uzun metin TEK BAŞINA " +
      "bilişsel yük KANITI DEĞİLDİR — hedefe uymuyorsa etiketi değiştirme, soruyu yeniden kurgula.",
    "23. ÇÖZÜM YOLU KARŞILAŞTIRMASI (yayın kalitesi): finali yazmadan önce kendi içinde en az iki, " +
      "mümkünse üç GERÇEKTEN farklı soru/çözüm yaklaşımı düşün (farklı bağlam, farklı veri yapısı veya " +
      "farklı çözüm stratejisi) — kapsam uygunluğu, matematiksel/bilimsel doğruluk, özgünlük (son bağlam/" +
      "DNA kayıtlarıyla çakışma yok), hedef zorluğa tam uyum, işlevsellik ve çeldirici gücüne göre en " +
      "iyisini seç. Bu iç karşılaştırmayı veya elenen adayları ASLA çıktı JSON'una yazma; final yalnız " +
      "seçilen sonucu içerir.",
    "",
    // `dogrulama_manifesti` node 10P'nin orijinal şemasında yok (bkz. 03-generator-schema.ts'in
    // dosya başı yorumu) — 1-20 kaynaktaki node 04'ün gerçekte gönderdiği liste, bu blok değil.
    // Model şemayı (strict mode) doldurmak zorunda ama hangi ifadelerin deterministik solver'da
    // çalışacağını bilmiyorsa `a^2` gibi desteklenmeyen sözdizimine yöneliyor (canlı modda
    // görüldü, bkz. proje hafızası) — bu blok o boşluğu kapatıyor.
    "DOĞRULAMA MANİFESTİ KURALLARI (dogrulama_manifesti)",
    "- solver_type yalnız ALGORITHM_FLOW, NUMERIC_EXPRESSION veya UNSUPPORTED olabilir.",
    "- ALGORITHM_FLOW/NUMERIC_EXPRESSION yalnız TAMAMEN SAYISAL ifadeler içindir: expression/expr " +
      "yalnız + - * / % karşılaştırma (< > <= >= == !=) ve mantıksal (&& ||) operatörleri içerebilir. " +
      "Üs (^), fonksiyon çağrısı (sqrt/max/min/sin vb.), atama ve koşullu ifade DESTEKLENMEZ. " +
      "Kullanılan her değişken variables dizisinde somut bir sayıya bağlanmalıdır.",
    "- Simgesel/cebirsel ifadeler (harfli değişkenli üs/kök gösterimi, genel formül, somut sayıya " +
      "bağlanamayan değişken) için solver_type=UNSUPPORTED yaz. Bu bir hata değildir — UNSUPPORTED " +
      "işaretlenen sorular bağımsız çift-LLM ile ayrıca doğrulanır, üretim durmaz. claimed_answer'ı " +
      "yine de doldur.",
    "- options[].deger ve variables[].deger DAİMA ondalık sayı olmalı (ör. 0.45), asla kesir " +
      "string'i (\"9/20\") veya ifade olmamalı — eşleşme yalnız sayısal karşılaştırmayla yapılır, " +
      "kesir metni sayı olarak ayrıştırılmaz ve doğru seçenek bulunamaz.",
    "- ALGORITHM_FLOW'un output düğümündeki value alanı DOĞRU CEVABIN GERÇEK DEĞERİ olmalı — " +
      "options[].deger içindeki değerlerden biriyle BİREBİR AYNI (aynı sayı, ya da options[].deger'de " +
      "yazılı olduğu gibi aynı metin/kategori adı). value alanına ASLA şık harfi ('A','B','C','D','E') " +
      "yazma — solver, hesaplanan value'yu options[].deger ile eşleştirip şıkkı KENDİSİ bulur; value " +
      "zaten bir harf olursa hiçbir options[].deger ile eşleşmez ve 'Eşleşen şık(lar): yok' RED'i " +
      "üretir (canlı modda görülen gerçek bir hata — claimed_answer alanına şıkkı yazman zaten yeterli, " +
      "output value'ya tekrar yazma).",
    "- claimed_answer HER ZAMAN yalnız şık harfidir ('A'-'E'), value'nun KENDİSİ (sayı ya da metin fark " +
      "etmez) DEĞİL — bu özellikle ALGORITHM_FLOW'un çıktısı METİN/kategori olduğunda (ör. bir genelleme " +
      "cümlesi) unutuluyor (canlı modda görüldü: claimed_answer'a hesaplanan cümlenin TAMAMI yazılınca " +
      "solver bunu bir şık harfiyle karşılaştıramayıp yanlışlıkla RED üretiyordu). Sayısal olsun metinsel " +
      "olsun, claimed_answer daima tek bir harf.",
    "",
    // Aynı boşluk kategorisi: soru/seçenek metninin nasıl yazılacağı da orijinal
    // node 04 çıktısında yok, çünkü kaynak sistemde LaTeX hiç kullanılmıyordu.
    // node 70'in (bkz. 21-dizgi.ts) düz-metin kalıpları arayan dizgi() fonksiyonu
    // LaTeX tanımıyor — canlı modda görüldü (bkz. proje hafızası): model LaTeX'e
    // kaydığında kesir/kök hiç etiketlenmeden \frac{...} olarak sızıyor.
    "SORU/SEÇENEK METNİ DİZGİ BİÇİMİ",
    "- LaTeX YAZMA (\\frac, \\sqrt, \\cdot, \\left/\\right, $...$, \\[...\\] gibi hiçbir LaTeX komutu kullanma).",
    "- Kesir için düz metin: 3/4 veya (pay)/(payda). Kök için: √16, küpkök için: ∛8.",
    "- Üs için: x^2 veya x² (yalnız kare/küp için ² ³ kısayolu var, diğerlerinde ^ kullan, ör. x^5).",
    "- İndis için: x_1 veya x_{ab}.",
    "- Eksi/negatif işareti için HER ZAMAN düz tire (-) kullan (ör. x^(n-1), f(x-3)) — matematiksel eksi " +
      "sembolü (−) veya farklı genişlikte tire KULLANMA; aksi hâlde aynı testteki sorular farklı " +
      "karakterlerle görsel olarak tutarsız görünür.",
    "- Küme/liste gösteriminde HER virgülden SONRA boşluk bırak: 'S={1, 2, 3, 4, 5, 6, 7, 8, 9, 10}', " +
      "ASLA 'S={1,2,3,4,5,6,7,8,9,10}' gibi boşluksuz yazma — hem standart matematik yazım kuralı hem " +
      "de canlı modda görülen gerçek bir hatayı önler: boşluksuz ardışık elemanlar ('...,9,10') otomatik " +
      "denetim tarafından yanlışlıkla TEK bir ondalık sayı ('9.10') sanılıp sahte MANİFEST ÇAPRAZ RED " +
      "üretebiliyordu. 5'ten fazla ardışık elemanlı kümelerde '{1, 2, 3, ..., 10}' gibi üç-nokta " +
      "kısaltması kullan — tüm elemanları tek tek yazmak zorunlu değil.",
    "- Aynı seçenekte hem küme/liste virgülü hem Türkçe ondalık virgülü ('52,5' gibi) birlikte " +
      "geçiyorsa, ondalık sayıyı yanına bir birim/etiket ekleyerek (ör. '≈52,5' veya '52,5 adet') ayırt " +
      "edilebilir kıl — salt bir küme listesinin hemen ardına virgülle eklenmiş çıplak bir ondalık sayı, " +
      "listenin son elemanıyla karışacak şekilde okunmamalı.",
    "- secenekler[] dizisindeki metinlerin BAŞINA kendi harf önekini (A)/B)/C)... ) yazma — sistem " +
      "bu öneki otomatik ekler, tekrar yazarsan çift önek oluşur.",
    "",
    // Kaynak: kılavuz/baglamtemelli-maarif-coktan-secmeli-soru-yazim-kilavuzu.pdf —
    // T.C. Millî Eğitim Bakanlığı'nın resmi "Türkiye Yüzyılı Maarif Modeli Bağlam
    // Temelli Çoktan Seçmeli Soru Yazım Kılavuzu"(Mart 2026, ISBN 978-975-11-9562-3).
    // §2.4-2.5'in (yazım süreci, kontrol listesi, sık yapılan hatalar) özeti — kullanıcı
    // bu belgeyi ekledikten sonra istendi; amaç revizyon döngüsünü azaltmak.
    "MAARİF MODELİ BAĞLAM TEMELLİ SORU İLKELERİ (MEB resmi kılavuz, Mart 2026)",
    "- İşlevsellik testi: 'Öğrenci bu bağlamı hiç okumadan, yalnız ön bilgisiyle veya seçeneklerden " +
      "giderek cevaba ulaşabilir mi?' Cevap evetse bağlam işlevsizdir, yeniden kurgula.",
    "- GÖRSEL İŞLEVSELLİK TESTİ (bağlam görseli varsa zorunlu): 'Bu görsel hiç görülmese/kaldırılsa " +
      "soru yine de metin ve tablo/grafikle eksiksiz çözülebilir mi?' Cevap evetse görsel dekoratiftir " +
      "— YENİDEN KURGULA. Görsel ya (a) çözüm için gerekli, metinde/tabloda TEKRARLANMAYAN bir bilgiyi " +
      "taşımalı (ör. nesnelerin sayısı/düzeni/konumu görselden okunmalı, ya da gorsel_veri_gosterimi ile " +
      "bir cihaz okuması/teknik etiket göstermeli), ya da (b) bağlamı somutlaştırarak öğrencinin metni " +
      "doğru zihinsel modele oturtmasını gerçekten kolaylaştırmalı — yalnız 'güzel görünsün' diye " +
      "eklenmemeli. baglam_katmani.islev alanına görsel kaldırılırsa TAM OLARAK hangi bilginin veya " +
      "anlaşılırlığın kaybolacağını yaz; belirsiz/genel bir açıklama ('bağlamı somutlaştırır' gibi) yeterli " +
      "değildir. EKRAN/GÖSTERGE TUZAĞI (canlı modda görüldü, KRİTİK): gorsel_veri_gosterimi=YOK iken islev'i " +
      "'bu ölçüm/puanlanmış bir değer, ham bir okuma değil' türünden bir ayrımı GÖRSEL OLARAK göstermeye " +
      "dayandırma — bu seni bir cihaza ekran/gösterge ışığı/panel eklemeye iter, 'etiketsiz' olsa bile görsel " +
      "model bunu gerçek bir ekran/TV sahnesi olarak yorumlayıp konudan tamamen sapıyor (canlı testte " +
      "görüldü). Bu tür bir ayrım zaten veri_katmani'nin (grafik/tablo) işidir; islev yalnız SAHNENİN " +
      "FİZİKSEL/BAĞLAMSAL somutlaştırma rolünü tanımlamalı (ör. 'bu ölçümlerin gerçek bir saha " +
      "koşulunda toplandığını gösterir'), asla bir ekran/gösterge/panel unsuruna dayanmamalı.",
    // Canlı testte görüldü (job MENAR-MAT1011-20260905110057): "turuncu ahşap
    // küre" sayım için gerekli bir tanımlayıcıydı ama metin ayrıca "mahalle
    // kitabevi", "istenen renkteki" gibi süsleyici ayrıntılarla doldurulmuştu —
    // hiçbiri silindiğinde hangi verinin nereden okunacağı değişmiyordu.
    "- GÖRSELİN SAYIM İÇİN GEREKTİRDİĞİ nesne tanımlayıcısı (renk/malzeme, ör. 'turuncu ahşap küre') " +
      "yalnızca görsel-manifest tutarlılığı İÇİNDİR — metinde/bağlamda bunu ayrıca 'istenen renkteki' " +
      "gibi tekrarlarla veya dükkân/mekân türü (ör. 'mahalle kitabevi') gibi süsleyici ayrıntılarla " +
      "büyütme. Bir sıfat/mekân detayını sildiğinde hangi verinin nereden okunacağı DEĞİŞMİYORSA o " +
      "detay fuzuli/dekoratiftir. Nesnenin kimliğini kuran sıfat/malzeme adı metinde bir kez geçsin, " +
      "sonrasında nesneye kısaca (ör. 'küreler') atıfta bulun.",
    "- Bağlam kaynağı: gerçekçi kanıta dayalı veri (NASA/FAO/Dünya Bankası tarzı küresel veri, " +
      "TÜİK/MGM/AFAD tarzı resmî istatistik, e-ticaret/navigasyon verisi) veya herkesin erişebileceği " +
      "ortak günlük yaşam bağlamı (okul, park, doğa, alışveriş) kullan. Golf, borsa/VİOP gibi dar bir " +
      "sosyoekonomik gruba özgü, fırsat eşitliğini zedeleyen bağlamlardan kaçın.",
    "- baglam_katmani SOMUT, FİZİKSEL bir sahne olmalı — raf, laboratuvar, atölye, tezgâh, doğa, pazar, " +
      "şantiye, ofis masası gibi elle tutulur nesne ve mekânlar kullan. Dijital ekran/panel/dashboard " +
      "(bir ölçüm cihazının LCD'si, bir kontrol panelinin ekranı, bir yazılım arayüzü) da bağlama gerçekten " +
      "uyuyorsa kullanılabilir — bu ZORUNLU değil, yalnız bağlam bunu gerektiriyorsa (ör. bir cihazın " +
      "okuma değerini göstermek) tercih et; bağlama uymuyorsa zorlama, dekoratif/gereksiz dijital öğe " +
      "eklemekten kaçın.",
    "- boyut SEÇİMİ (kullanıcı düzeltmesi, ÇOK ÖNEMLİ — YANLIŞ ANLAMA RİSKİ): boyut=2D 'illüstrasyon/" +
      "vektör çizim' ANLAMINA GELMEZ — 2D ve 3D İKİSİ DE HER ZAMAN GERÇEK BİR FOTOĞRAFTIR (bkz. 16-gorsel-" +
      "prompt.ts stil profili), aralarındaki TEK fark KAMERA AÇISI/DERİNLİK hissidir: 3D = doğal açı, " +
      "nesnelerin hacmi/yanları görünür (ör. bir cihazın üç boyutu da hissedilir); 2D = düz/cepheden veya " +
      "kuş bakışı çekim, derinlik bilinçli olarak minimumda (ör. bir masanın yalnız üstü görünür, arka " +
      "ayakları kadraja girmez — yine gerçek bir fotoğraf, yalnız düz açıdan). boyut=3D VARSAYILANDIR; " +
      "2D yalnız sahnenin kendisi doğal olarak düz/cepheden bir çekimle daha iyi anlaşılıyorsa (ör. bir " +
      "ekran okuması, bir masa üstü düzeni, dikey derinliğin çözüm için önemsiz olduğu bir kompozisyon) " +
      "tercih edilir. 'Nesneler teknik/az bilinen' olması TEK BAŞINA ne 2D ne 3D seçme gerekçesidir.",
    "- baglam_katmani.nesneler'i tek düz liste bırakma — aynı nesneleri on_plan (kompozisyonun ön/alt " +
      "kısmında, en büyük/net görünen 1-3 nesne), orta_plan (asıl konuyu oluşturan 2-4 nesne) ve arka_plan " +
      "(sahneyi tamamlayan, daha küçük/bulanık görünebilecek 1-3 nesne) olarak ayır. Bu, görsel modeline " +
      "rastgele/simetrik bir yerleşim yerine gerçek bir fotoğraf kompozisyonu iskeleti verir. Her katmanda " +
      "en fazla birkaç nesne say — 'bir sürü X' yazma, görsel modeli anlamsız tekrarla doldurur.",
    // Canlı testte görüldü (job MENAR-MAT1011-20260905110057): dolu bir
    // kitaplık arka planı "hafif derinlik" katsa da ön plandaki sayılacak
    // kürelerden dikkat çeken görsel gürültü olarak değerlendirildi.
    "- ARKA_PLAN SEÇİMİ — SAYIM GEREKTİREN SAHNELERDE (renk_miktar_sayimlari doluyken): arka_plan'a " +
      "kalabalık/çok-nesneli, iç detayı zengin bir öğe (ör. dolu bir kitaplık, raflarla dolu bir vitrin) " +
      "KOYMA — bu, sayılacak ön plan nesnesinden dikkat çeken görsel gürültü oluşturur. Bu tür " +
      "sahnelerde arka_plan TEK bir sade/nötr yüzey veya birkaç belirsiz-şekilli öğeyle sınırlı kalmalı " +
      "— bağlamı desteklesin ama kendi başına dikkat çekmesin.",
    "- Çeldiriciler rastgele değil, konuyu eksik öğrenen/yanlış yapılandıran öğrencinin düşeceği gerçek " +
      "kavram yanılgısından türetilir. Yalnızca seçenek sayısını tamamlamak için bariz/çekiciliği olmayan " +
      "bir yanlış şık YAZMA — her çeldiricinin gerçek bir yanılgıyı temsil etmesi gerekir. KAÇIŞ ŞIKLARI " +
      "('Hepsi', 'Hiçbiri', 'Yukarıdakilerin hepsi/hiçbiri', 'Seçim yapılamaz', 'Belirlenemez', 'Yetersiz " +
      "bilgi', 'Karar verilemez' ve benzerleri) HER ZAMAN YASAK — bunlar öğrenciye gerçek bir muhakeme " +
      "yapmadan kaçış yolu sunar. AYNI ŞEKİLDE, seçenek listesindeki İKİ AYRI HARFİ birleştiren 'A ve B', " +
      "'A veya B' gibi bileşik şıklar da YASAK (kılavuz/soru_koku_hatalari.md §2.5.2, madde 5) — öğrenci " +
      "harflerden yalnız birinin doğruluğundan emin olunca diğerlerini analiz etmeden eleyebilir/seçebilir. " +
      "Bunun İSTİSNASI, harfleri DEĞİL numaralı önermeleri (I/II/III gibi) değerlendiren 'Yalnız I', 'I ve " +
      "II', 'I, II ve III' formatıdır — bu, birden fazla ayrı önermenin doğruluğunu tek tek sınamayı " +
      "gerektiren, MEB/ÖSYM'de meşru ve farklı bir ölçme mekaniğidir (bkz. yukarıdaki IQ_KURALI 'GERÇEK 1 " +
      "küçük karar' desen (a)); kazanım/soru yapısı gerçekten gerektiriyorsa kullanılabilir, ama yine de " +
      "tek bir savunulabilir doğru üretmeli ve biçimiyle ipucu vermemelidir. Doğru seçenek diğerlerinden " +
      "uzunluk/detay bakımından öne çıkmasın; tüm seçenekler biçim ve uzunlukça benzer olsun.",
    "- Çeldiricinin gerekçesi 'bilgi yanlışlığı' değil 'muhakeme hatası' olmalı: öğrenci seçeneği veriyi " +
      "yanlış yorumlayarak/eksik akıl yürüterek eleyebilmeli, bilgi eksikliğinden değil (bilişsel görüşme " +
      "bulgusu, kılavuz §3.5.2c). Soru, bağlamdaki TEK bir cümle veya veri bulunarak çözülebilir olmamalı " +
      "— en az iki veri/adımın birleştirilmesini gerektirsin.",
    "- Soru kökünde: çift olumsuzluk YASAK ('...olmadığı söylenemez' gibi); öznel ifade YASAK ('sizce' " +
      "gibi) — bunun yerine metne/veriye dayalı, nesnel bir referans kur (ör. 'sizce ana fikir nedir?' " +
      "değil, 'yazarın bu metinde vurguladığı temel düşünce aşağıdakilerden hangisidir?'); konuyu tekrar " +
      "anlatma — bilgi bağlama, yönlendirme köke. Aynı bağlamdaki birden fazla soru birbirinden BAĞIMSIZ " +
      "çözülebilmeli; 'bir önceki soruda bulduğunuz sonuca göre' türü zincirleme ipucu YASAK.",
    // kılavuz/soru_koku_hatalari.md §2.5.2, madde 7 — özellikle TDE ve BTG
    // (ortak bilimsel metin) modlarında geçerli, ama metne dayalı her soruda uygulanır.
    "- Metne/ortak metne dayalı sorularda (TDE, BTG) seçenekler metindeki bir cümleyi/kelime grubunu " +
      "BİREBİR kopyalamamalı — anlamca özdeş ama farklı kelimelerle ifade edilmiş olmalı; aksi halde " +
      "öğrenci metni anlamadan görsel eşleştirmeyle doğru seçeneği bulabilir.",
    "- Görsel, metinde zaten yazılanı birebir resmetmemeli (ör. '3 elma var' yazıp yanına 3 elma çizmek " +
      "işlevsizdir); metinde YER ALMAYAN, çözüm için okunması gereken yeni bir veriyi taşımalı.",
    // Canlı testte görüldü (job MENAR-MAT1011-20260905110057): metin "masadaki
    // turuncu ahşap küreler" diyerek nesneden bahsetti ama adedin YALNIZ
    // görselden okunacağını hiçbir yerde açıkça işaretlemedi.
    "- Bir veri metinde HİÇ verilmeyip yalnız görselden okunacaksa (bkz. baglam_katmani.islev), bu " +
      "durumu bağlam metninde veya soru kökünde 'Görseldeki [nesne]...' biçiminde AÇIK bir ifadeyle " +
      "işaretle (ör. 'Görseldeki masada bulunan küreler...') — veriyi 'masadaki X'ler' gibi dolaylı " +
      "anlatıp görsele bakma gerekliliğini üstü kapalı bırakma; öğrenci metni okur okumaz görsele " +
      "bakması gerektiğini netçe anlamalı.",
    "- Bağlam ve soru; kültür, cinsiyet, coğrafi bölge, din veya ideoloji açısından tarafsız ve kapsayıcı " +
      "olmalı.",
    "- stimulus (bağlam metni/notlar) veya soru kökünde sorunun kendi tasarımına dair ÜST-YORUM YAZMA " +
      "(ör. 'Sorunun çözümü için veri tablosunun okunması zorunludur.', 'Bu görsel çözüm için gereklidir.' " +
      "gibi yönergemsi cümleler). Öğrenci bu tür cümleleri asla görmemeli; bağlamın işlevselliği yalnız " +
      "kurgunun kendisinden gelir, açıklanarak değil.",
    "- baglam_katmani.gerekli=true iken stimulus'ta 'Fotoğraf ... gösterir/gösterilmektedir' gibi görseli " +
      "AÇIKÇA ADLANDIRAN bir cümle YAZMA (canlı modda görüldü: fotoğraf 3 denemede de RED alıp sayfada hiç " +
      "görünmeyince metin var olmayan bir görsele atıf yapıyordu, öğrenci için anlamsız/bozuk okunuyordu) — " +
      "fotoğraf her zaman başarısız olabilir, metin bu ihtimalden BAĞIMSIZ, KENDİ BAŞINA tam ve tutarlı " +
      "olmalı. Sahneyi/durumu doğrudan anlat (ör. 'gözlem alanında oyuncaklar birbirinden ayrı yerleştirilmiştir' " +
      "gibi), 'fotoğraf/görsel şunu gösteriyor' diye görselin kendisine referans verme.",
    "",
    // Kullanıcının ilettiği "bağlam temelli soru üretme kılavuzu"nun özeti —
    // tekrarlayan "GÖRSEL DEKORATİF"/bağlam zayıflığı redlerinin (canlı modda
    // görülen fosil-odası, pompa-modülleri örnekleri) kök nedenini hedefler:
    // bu sorularda matematik bağlama SONRADAN EKLENMİŞTİ, bağlamın kendi iç
    // mantığından DOĞMAMIŞTI. Yukarıdaki işlevsellik testi/çeldirici kuralları
    // bunun bir kısmını zaten karşılıyor; burada eklenmeyen katmanlar var.
    "BAĞLAM TEMELLİ SORU OMURGASI (kullanıcı kılavuzu — kritik)",
    "- SIRA: Kazanım ve mikro beceri ÖNCE sabittir (girdiden gelir); bağlam bu kazanıma UYACAK ŞEKİLDE " +
      "seçilir. Asla tam tersi yapma — önce ilginç/gerçekçi bir sahne seçip sonra matematiği ona " +
      "'giydirmeye' çalışma; bu, dışarıdan tutarlı görünse bile içeriden dekoratif kalır.",
    "- Matematiksel ilişki bağlamın KENDİ İÇ MANTIĞINDAN doğmalı, sahneye sonradan eklenmiş bir süs " +
      "olmamalı. Kötü örnek: 'Ali bir fabrikada çalışmaktadır. 2⁵·2³ işleminin sonucu kaçtır?' — fabrika " +
      "tamamen dekoratif, çıkarılsa soru aynı kalır. İyi yapı: bir üretim sisteminin iki aşamasının " +
      "kapasite veya ölçek ilişkisi üstel biçimde verilip öğrencinin BU İLİŞKİYİ BAĞLAMDAN ÇIKARMASI " +
      "gerekir — üs/kök işlemi bağlamın kendisinin doğal bir sonucu olmalı, rastgele seçilip üstüne " +
      "hikaye yazılmamalı.",
    "- Soru kökü bağlamdaki sayıları BİREBİR TEKRARLAMAMALI. 'Buna göre...' dedikten sonra öğrenci hangi " +
      "verinin gerekli olduğunu KENDİSİ seçebilmeli — bağlamda çözüme dahil edilmeyecek, alakasız bir " +
      "veri de bulunabilir (öğrencinin veri seçme becerisini de ölçer).",
    "- Kullanılan sayılar yalnız 'gerçekçi bir bağlam türü' seçmekle yetinmemeli, o SPESİFİK senaryoyla " +
      "mantıksal olarak da tutarlı olmalı — büyüklük mertebesi (bir fosilin ağırlığı, bir pompanın " +
      "basıncı, bir sınıfın öğrenci sayısı gibi) o alanın gerçek dünyadaki makul aralığına uymalı.",
    "- Kısa öz-test: bağlamı zihninden çıkar — soru hâlâ AYNI ŞEKİLDE, aynı verilerle çözülebiliyor mu? " +
      "Cevap evetse bağlam zayıftır, yeniden kurgula. Öğrenci bağlamdan veri seçmek, ilişki kurmak veya " +
      "model oluşturmak ZORUNDAYSA bağlam güçlüdür.",
    "",
    // Kullanıcının ilettiği ikinci kılavuz — özellikle bağlam GÖRSELİ için.
    // Çoğu madde yukarıdaki GÖRSEL İŞLEVSELLİK TESTİ ile zaten örtüşüyor;
    // burada yalnız gerçekten yeni olan KONUM/SIRA tutarlılığı ekleniyor
    // (görsel denetimi de bunu ayrıca kontrol ediyor, bkz. 19-gorsel-denetim.ts).
    "- Soru metninde bir konumsal referans varsa ('soldaki'/'sağdaki', 'üstteki'/'alttaki', " +
      "'birinci'/'ikinci' modül/kutu/rafa gibi), bu referans baglam_katmani'nın on_plan/orta_plan/" +
      "arka_plan sıralamasıyla VE gorsel_veri_manifesti'ndeki sırayla BİREBİR tutarlı olmalı — görsel " +
      "üretim modeline hangi nesnenin hangi konumda olacağı açıkça, sahne betimlemesinde belirtilmeli.",
    "",
    // Kullanıcının ilettiği "/ÖSYM/" mimarisinin özeti — sınav sistemine
    // değil ÖSYM'nin ÖLÇME MANTIĞINA benzemeyi hedefler: bir sorunun "ÖSYM'ye
    // benziyor" görünmesi yetmez, hangi bilişsel davranışı ölçtüğü de bu
    // mantığa uygun olmalı. Yukarıdaki çeldirici/bağlam/görsel işlevsellik
    // kuralları bunun bir parçası zaten; burada eklenmeyen, yeni katmanlar var.
    "ÖSYM ÖLÇME MİMARİSİ (iç kalite standardı, MEB kılavuzunu tamamlar)",
    "- Dil: kısa, açık, tek anlamlı, ölçmeye dönük — süslü anlatım, yapay teknik jargon, gereksiz " +
      "dolgu cümle YASAK. Zorluk dilden değil matematikten/muhakemeden gelmeli. ('Bir sistemin " +
      "operasyonel çevrim kapasitesinin optimizasyonu...' değil, 'Makine bir saatte 240 parça üretir' " +
      "gibi doğrudan, ölçülebilir anlatım.)",
    // Canlı testte görüldü (job MENAR-MAT1011-20260905110057): asal sayı
    // koşulu "yalnızca tek grup oluşturularak veya her gruba tek küre
    // konularak kurulabilmesi" gibi matematiksel olarak doğru ama uzun/dolaylı
    // bir betimlemeyle anlatıldı.
    "- Bağlamdaki bir matematiksel KOŞUL/ÖZELLİĞİ (asal olma, tam bölünebilme, eşlik/teklik vb.) çok " +
      "maddeli, dolaylı bir betimlemeyle (ör. 'yalnızca X yapılarak veya Y yapılarak kurulabilmesi') " +
      "gizlemeye çalışma — bu kısalık/açıklık ilkesini ihlal eder ve öğrenciyi gereksiz yere yorar. " +
      "Koşulu STANDART matematiksel terimiyle doğrudan ifade et (ör. '...toplam küre sayısının asal " +
      "olması isteniyor'); bağlamın asıl zorluğu zaten HANGİ sayının bu koşulu sağladığını bulmaktır, " +
      "koşulun kendisini çözmek değil.",
    "- Bilgiyi kullanma: 'formül verilmiş, değerleri yerine yaz' türü soru tek başına yetersizdir. " +
      "Öğrenci şu zinciri kurmalı: veriyi oku → gerekeni seç → ilişkiyi fark et → modeli kur → işlemi " +
      "yap → sonucu yorumla. Özellikle TYT düzeyinde asıl güçlük çoğu zaman işlem değil, HANGİ işlemin " +
      "yapılması gerektiğine karar vermektir.",
    "- Uzun işlem/büyük sayı/karmaşık kesir başlı başına zorluk SAYILMAZ — yapay zorluktur, ekleme. " +
      "Değer katan şey karar noktalarıdır: 'bu üç bilgiden hangisi gerekli', 'hangi aralık/model " +
      "geçerli', 'hangi eşitlik kurulmalı' gibi zihinsel kararlar işlem uzunluğundan daha kıymetlidir.",
    "- Mümkünse en az bir TEMSİL GEÇİŞİ kur (metin↔denklem, tablo↔oran, grafik↔fonksiyon, şekil↔cebir " +
      "gibi) — öğrenci bilgiyi doğrudan hazır almasın, bir temsilden diğerine dönüştürsün. Ama eklenen " +
      "her temsil (tablo/grafik/şekil) çözümde gerçek bir görev yapmalı, yalnız görünmek için eklenmemeli.",
    "- Veri yeterliliği: iki farklı makul çözüm yolu farklı sonuca götürüyorsa RED say, yeniden kurgula " +
      "— zor ama açık olmalı, zor VE muğlak olmamalı. Öğrenci, verilmeyen bir bilgiyi varsaymak zorunda " +
      "kalmamalı; hiçbir değer gereksiz yere eksik bırakılmamalı.",
    "- Kazanım bağlamın içinde GİZLENEBİLİR ama KAYBOLAMAZ: soru kökü doğrudan ders kitabı başlığıyla " +
      "açılmasın (ör. 'Üslü sayıların özelliklerinden yararlanarak...' gibi başlamasın), ama çözümün " +
      "merkezinde hedef kazanım gerçekten olmalı — sorunun büyük kısmı salt okuma/genel kültürle " +
      "çözülebiliyorsa kazanımdan sapmış demektir, yeniden kurgula.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * node "04 - MASTER PROMPT Derleyici"nin portu. Varsayılan mod (`compact`)
 * node'un gerçekte gönderdiği çıktıyla birebir eşleşir. `full` modu,
 * node içinde hesaplanıp hiç kullanılmayan 90k+ karakterlik V15.1/V20/V20.2/V21
 * bloklarını kompakt çekirdeğin önüne ekler (bkz. prompts/README.md, "Faz 1'de
 * karar bekleyen konu").
 */
export function buildMasterPrompt(
  resolved: ResolvedJob,
  ledger: RotationLedger = BOS_LEDGER,
  promptMode: PromptMode = process.env.PROMPT_MODE === "full" ? "full" : "compact"
): string {
  const compact = buildCompactPrompt(resolved, ledger);
  if (promptMode === "full") {
    return loadLegacyCore() + "\n\n" + compact;
  }
  return compact;
}
