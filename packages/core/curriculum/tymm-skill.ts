/**
 * node "02 - TYMM Kazanım Kilidi + Girdi Doğrulama"'nın makeSkill()/
 * processComponents() fonksiyonlarının birebir portu. Kazanım metninden
 * TYMM 2026 öğrenim becerisi cümlesini ve süreç bileşenlerini türetir.
 */
const SKILL_RULES: [string, string][] = [
  ["ispatlayabil", "Verilen ilişkileri uygun temsil ve gerekçelerle doğrulayıp ispatlayabilme."],
  ["doğrulayabil", "Verilen ilişkileri farklı temsil ve örneklerle doğrulayabilme."],
  ["muhakeme yapabil", "Veriler ve ilişkiler arasında bağlantı kurarak muhakeme yapabilme."],
  ["çıkarım", "Veri, kanıt ve temsillerden gerekçeli çıkarım yapabilme."],
  ["çözümleyebil", "Bileşenleri ve aralarındaki ilişkileri belirleyerek çözümleyebilme."],
  ["yorumlayabil", "Veri ve temsilleri ilişkilendirerek tutarlı sonuçlar yorumlayabilme."],
  ["karşılaştırabil", "Ölçütlere göre benzerlik ve farklılıkları karşılaştırabilme."],
  ["sorgulayabil", "Kanıt ve kaynaklara dayalı sorular oluşturarak sonuçları sorgulayabilme."],
  ["değerlendirebil", "Bilgi, kanıt ve ölçütleri kullanarak değerlendirme yapabilme."],
  ["sınıflandırabil", "Özellik ve ölçütlere göre sınıflandırma yapabilme."],
  ["bilgi toplayabil", "Güvenilir kaynaklardan bilgi toplayıp doğrulayarak kaydedebilme."],
  ["tahmin", "Gözlem ve verilere dayanarak gerekçeli tahminde bulunabilme."],
  ["algılayabil", "Değişim, süreklilik ve ilişkileri örüntüler üzerinden algılayabilme."],
  ["oluşturabil", "Amaca uygun veri, yöntem ve temsil kullanarak ürün oluşturabilme."],
  ["geliştirebil", "Belirlenen probleme kanıta dayalı çözüm önerisi geliştirebilme."],
  ["karar verebil", "Veri ve ölçütleri değerlendirerek gerekçeli karar verebilme."],
];

export function makeSkill(outcome: string): string {
  const s = outcome.toLocaleLowerCase("tr-TR");
  for (const [key, value] of SKILL_RULES) {
    if (s.includes(key)) return value;
  }
  return outcome
    ? outcome.replace(/\.$/, "") + " ile ilgili bilgi, temsil ve kanıtları amaca uygun kullanabilme."
    : "";
}

export function processComponents(outcome: string): string[] {
  const s = outcome.toLocaleLowerCase("tr-TR");
  const a: string[] = [];
  if (/veri|kanıt|kaynak|gözlem/.test(s)) a.push("Veri ve kanıtları belirleme");
  if (/tablo|grafik|harita|şekil|diyagram|temsil|fonksiyon/.test(s)) a.push("Temsilleri okuma ve ilişkilendirme");
  if (/ilişki|etkileşim|bağlantı|bağıntı/.test(s)) a.push("Bileşenler arası ilişkileri çözümleme");
  if (/değişim|süreklilik|zaman|periyod/.test(s)) a.push("Değişim ve sürekliliği inceleme");
  if (/çıkarım|yorum|değerlendir|sorgula|karar|tahmin|muhakeme/.test(s)) a.push("Kanıta dayalı sonuç üretme");
  if (a.length === 0) a.push("Bilgiyi belirleme", "İlişkileri çözümleme", "Sonuç üretme");
  return [...new Set(a)];
}
