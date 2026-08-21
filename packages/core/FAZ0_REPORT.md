# Faz 0 raporu — çıkarım ve doğrulama

Durum: **tamamlandı, 37/37 doğrulama kontrolü geçti.**
Yeniden çalıştırmak için: `node tools/extraction/04-validate-faz0.mjs`

## Ne yapıldı

1. İki ham kaynak `Downloads` altında bulundu ve `sources/` içine kopyalandı
   (SHA-256 ile doğrulanmış, konuşmada yapıştırılan içerikle aynı dosyalar):
   - `sources/menar_mays_matematik_v22_6_workflow.json` (357 973 bayt)
   - `sources/menar_mays_matematik_v25_core_builder.html` (230 979 bayt)
2. `MENAR_Tanitim.pdf` de `Downloads` içinde bulundu (44 MB) — kopyalanmadı
   (repo'ya taşımak gereksiz büyük; ihtiyaç anında oradan okunacak). Bu ortamda
   `poppler-utils` kurulu olmadığından sayfaları henüz görsel olarak
   inceleyemedim; Faz 1'in sayfa düzeni işine geçerken bir kez daha denenecek.
3. `packages/core/prompts/*.txt` — dört büyük çekirdek blok (MASTER_CORE,
   V20 sıfır güven, V20.2 bağlam çeşitliliği, V21 üretim kilitleri) ve üç
   HTML-gömülü şablon (core-v25-manifest, reasoning-engine-v2, btg-word-lock)
   **script ile** (regex + parantez/backtick derinlik taraması, `eval` yok)
   kaynaktan çıkarıldı. Ayrıntı: `packages/core/prompts/README.md`.
4. `packages/core/curriculum/matematik.json` — 56 benzersiz kazanımın
   deduplike edilmiş hâli, `packages/core/curriculum/schema.ts` (zod) ile.
5. `assets/indesign/soru_kaliplari_ysyf.indd` — orijinal zip klasöründen
   byte-eşleştirmeli kopyalandı, `__MACOSX` çöpü temizlendi.
6. `tools/extraction/` — dört çıkarım/doğrulama script'i kalıcı olarak repoda;
   tekrar çalıştırılabilir, kaynak değişirse yeniden üretim mümkün.

## Somut bulgular (brief'i düzeltmiş/doğrulamış şeyler)

- **Kazanım sayısı 56, 112 değil.** Brief'in Bölüm 1'indeki "112 resmî
  kazanım" rakamı, TYT/AYT'nin 9./10./11. sınıf kodlarını aynen tekrarladığı
  5 diziyi (9, 10, 11, TYT, AYT) deduplike etmeden saymanın sonucu
  (20+21+15+41+15=112). Gerçek benzersiz kazanım sayısı 56 — ürünün kendi
  adında zaten yazan sayı ("TYMM 56 KAZANIM"). `curriculum/matematik.json`
  56 kaydı, her birinin hangi sınav izlerinde (`exam_tracks`) geçerli
  olduğunu ayrı bir alan olarak tutuyor; script bunu TYT=9.Sınıf++10.Sınıf,
  AYT=11.Sınıf eşleşmesini kod-kod doğrulayarak inşa etti (bkz.
  `tools/extraction/02-build-curriculum.mjs`, satır ~20-35).
- **HTML kaynağında gerçek bir bozulma vardı**, yapıştırma sırasında değil,
  dosyanın kendisinde: `btg-word-lock-v20` script'inin `lockBlock()`
  fonksiyonu, V25 solver UI bloğunun ortasına serpiştirilmiş, cümleyi
  "...BTG oldu" / "ğunda aktiftir..." diye ikiye bölmüştü. Onarıldı;
  onarımın doğruluğu, birleşen cümlenin dilbilgisel olarak tam ve anlamlı
  olmasıyla teyit edildi. Araya giren gerçek özellik (V25 deterministik
  solver prototipi) silinmedi, `packages/core/reference/v25-solver-ui-prototype.html`
  olarak ayrı saklandı — Faz 2'nin `verify/solver-v25.ts` portu için referans.
- Bu prototip `new Function(...)` ile ifade değerlendiriyor; brief'in
  Bölüm 5'i bunu sunucu tarafında yasaklıyor — port sırasında güvenli bir
  ifade değerlendiricisiyle değiştirilecek, kopyalanmayacak.
- **Diğer 7 branşın HTML kaynakları da mevcut** (`Downloads/MENAR_V25_CORE_BUILDER_TUM_HTMLLER/`:
  Biyoloji, Coğrafya, Felsefe, Fizik, Geometri, Kimya, Tarih — Tanıtım
  PDF'indeki 8 branş sayısıyla örtüşüyor). Kapsam kararınız gereği şimdilik
  dokunulmadı, ama Faz 4'te "kazanım verisi hazır mı" sorusunun cevabı artık
  **evet, HTML formunda hazır** — TYMM PDF'lerinden yeniden çıkarmaya gerek
  kalmayabilir.

## Bilinen, blocking olmayan kalite notları

- `content_frame` (tema giriş paragrafları) içinde PDF-çıkarım kaynaklı küçük
  boşluk hataları var (`"İş lemler"`, `"farklışekillerde"`). Bunlar `kod`/
  `outcome`/`mikro` zincirini etkilemiyor (56/56 doğrulandı), sadece
  bağlamsal referans metni bozuyor — geniş bir regex ile "düzeltmeye"
  çalışmak doğru kelimeleri de birleştirme riski taşıdığından şimdilik
  dokunulmadı; gerekirse ileride temayı elle düzeltiriz.
- `menar-btg-word-lock-v20` ve `menar-core-v25-script`, kaynak HTML'de
  `</html>` kapanışından SONRA yer alıyor — tarayıcılar bunu tolere ediyor
  ama teknik olarak geçersiz yerleşim; extraction bundan etkilenmedi.

## Sıradaki adım

Faz 1: `packages/core`'un geri kalanı (pipeline/, verify/, llm/, render/) ve
`pnpm mays generate --config test.json` ile uçtan uca ilk soru üretimi.
Onay verirseniz başlıyorum.
