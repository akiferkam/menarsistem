import type { GeneratorOutput } from "./03-generator-schema.js";
import { runGorselPromptAjani, type GorselPromptDeps } from "./16-gorsel-prompt.js";
import { duzeltGorsel, uretGorsel, type GorselUretimDeps, type GorselUretimSonucu } from "./17-gorsel-uret.js";
import { denetleGorsel, asama2Satiri, type GorselDenetimDeps } from "./19-gorsel-denetim.js";
import { bindirOverlayMetni } from "../render/gorsel-overlay.js";
import type { BaglamGorseliSonuc, Ders, GorselDenetimi, JobInput, RotationLedger } from "./types.js";

const MAKS_GORSEL_DENEME = 3;
const CONTEXT_IMAGE_FILENAME = "09_Baglam_Sahnesi.png";
const GORSELSIZ_SATIR = "AŞAMA 2 (GÖRSEL-MANİFEST) DENETİMİ: UYGULANMAZ — bağlam görseli kullanılmadı";
/** İlk denemede kaç bağımsız aday üretilip aralarından en iyisi seçilecek (kullanıcı mimarisi madde 19/42). */
const ILK_DENEME_ADAY_SAYISI = 2;

/**
 * Kullanıcı isteği (2026-09-29): `gorselVeriStratejisi=TAM_AI` iken AI kendi
 * çizdiği değeri 3 denemede de doğru veremezse (bkz. `runBaglamGorseli`),
 * bu, işi FAILED'e düşürmesi gereken bir hatadır — "görselsiz devam"
 * güvenlik ağına SESSİZCE düşülmez. `run.ts`/`apps/api/queue/worker.ts`
 * bu hatayı normal bir üretim hatası gibi yakalayıp is_kaydi.status=FAILED
 * yazar (özel bir kod değişikliği GEREKMEZ — zaten her türlü beklenmeyen
 * hatayı böyle işliyorlar).
 */
export class TamAiBasarisizError extends Error {
  constructor(
    public readonly sonNedenler: string[],
    public readonly denemeGecmisi: NonNullable<BaglamGorseliSonuc["denemeGecmisi"]>
  ) {
    super(
      `TAM_AI: görsel ${MAKS_GORSEL_DENEME} denemede de doğrulanamadı — ` +
        (sonNedenler.join("; ") || "neden bildirilmedi")
    );
    this.name = "TamAiBasarisizError";
  }
}

export interface BaglamGorseliDeps {
  prompt: GorselPromptDeps;
  /** Varsayılan/metin-gerektiren adaylarda kullanılır (gpt-image-1) — her zaman zorunlu. */
  uretim: GorselUretimDeps;
  /**
   * `input.gorselKalitesi=YUKSEK` VE aday metin/rakam göstermiyorsa (bkz.
   * `veriGosteriliyor` altta) kullanılan fal.ai/Flux çifti — verilmezse
   * (ör. yayınevinin fal.ai anahtarı yoksa) sessizce `uretim`e düşülür.
   */
  uretimYuksekKalite?: GorselUretimDeps;
  /**
   * `input.ders`e göre `uretimYuksekKalite`nin yerini alan override — "her
   * ders için farklı en-iyi görsel modeli dene" isteği için. Bir ders burada
   * yoksa (ya da `input.ders` boşsa) genel `uretimYuksekKalite`ye düşülür.
   */
  uretimYuksekKaliteDersOverride?: Partial<Record<Ders, GorselUretimDeps>>;
  denetim: GorselDenetimDeps;
}

interface AdayDegerlendirme {
  gorsel: GorselUretimSonucu;
  denetim: GorselDenetimi;
}

/** PASS'ler her zaman RED'lerden önce; eşit statüde kalite_puani yüksek olan kazanır. */
function enIyiAday(adaylar: AdayDegerlendirme[]): AdayDegerlendirme {
  return [...adaylar].sort((a, b) => {
    if (a.denetim.status !== b.denetim.status) return a.denetim.status === "PASS" ? -1 : 1;
    return (b.denetim.kalitePuani ?? 0) - (a.denetim.kalitePuani ?? 0);
  })[0]!;
}

/**
 * node "40" (koşulu `14-veri-katmani.ts`'in `gorselGerekli` alanından
 * gelir) + "50-59"un uçtan uca zinciri. node 58'in "en fazla 3 toplam
 * deneme" kuralı korunur, ama artık iki farkla:
 * (1) İlk denemede tek değil `ILK_DENEME_ADAY_SAYISI` bağımsız aday üretilir,
 *     ikisi de denetlenir, en iyisi (PASS varsa PASS, yoksa yüksek puanlı
 *     RED) seçilir — kullanıcının ilettiği mimari madde 19/42.
 * (2) RED sonrası tam yeniden üretim yerine `duzeltGorsel` (images.edit)
 *     ile yalnız somut hatalar hedeflenir, kompozisyon/stil korunur —
 *     madde 17-18 "regenerate everything yapma".
 * 3. denemede de RED ise (ya da görsel hiç gerekmiyorsa) "görselsiz devam"
 * ile yayına geçilir; bu asla FINAL KİLİDİ'ni tek başına AÇIK bırakmaz —
 * `run.ts`'deki güvenlik ağı bunu UYARILI_AÇIK'a çevirir.
 */
export async function runBaglamGorseli(
  gorselGerekli: boolean,
  aday: GeneratorOutput,
  input: JobInput,
  ledger: RotationLedger,
  deps: BaglamGorseliDeps
): Promise<BaglamGorseliSonuc> {
  if (!gorselGerekli) {
    return {
      kullanildi: false,
      contextImageFilename: null,
      asama2Satiri: GORSELSIZ_SATIR,
      deneme: 0,
      indeksModunaGecildi: false,
      gorselSaglayici: "STANDART",
    };
  }

  // fal.ai/Flux metin/rakam üretiminde gpt-image-1'den belirgin şekilde
  // zayıf (canlı testte doğrulandı, bkz. proje hafızası `menar-mays-gorsel-mimari`)
  // — CIHAZ_EKRANI/TEKNIK_ETIKET gerektiren adaylarda YUKSEK kalite seçili
  // olsa bile sessizce gpt-image-1'e düşülür; yalnız saf atmosfer sahnelerinde
  // (metin/rakam yok) fal.ai'nin üstün fotogerçekçiliği ve seed/img2img
  // kontrolü devreye girer. STANDART üretim modu ayrıca kendi başına hep
  // gpt-image-1'e sabittir — bu mod bilinçli olarak sade/hızlı tutuluyor
  // (bkz. proje hafızası), YUKSEK kalite seçili olsa bile bu mod için
  // atlanır.
  const veriGosteriliyor =
    (aday.baglam_katmani?.gorsel_veri_gosterimi ?? "YOK") !== "YOK" &&
    (aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? []).length > 0;
  const yuksekKaliteIstendi = input.gorselKalitesi === "YUKSEK" && input.mode !== "STANDART" && !veriGosteriliyor;
  const dersOverride = input.ders ? deps.uretimYuksekKaliteDersOverride?.[input.ders] : undefined;
  const yuksekKaliteDeps = dersOverride ?? deps.uretimYuksekKalite;
  const yuksekKaliteKullanildi = Boolean(yuksekKaliteIstendi && yuksekKaliteDeps);
  const uretimDeps: GorselUretimDeps = yuksekKaliteKullanildi ? yuksekKaliteDeps! : deps.uretim;
  const gorselSaglayici: "STANDART" | "YUKSEK" = yuksekKaliteKullanildi ? "YUKSEK" : "STANDART";
  const gorselYuksekKaliteDersAnahtari: Ders | undefined =
    yuksekKaliteKullanildi && dersOverride ? input.ders : undefined;

  const state = await runGorselPromptAjani(aday, input, ledger, deps.prompt);

  // KONUŞMA (veri_katmani.tur=KONUSMA): denetimin de "boş mu"/"değer doğru
  // mu" yerine "her replik doğru mu" sorusunu sorması gerekiyor (bkz.
  // 19-gorsel-denetim.ts). Bu, hibritModuAktif'ten TAMAMEN BAĞIMSIZ bir
  // bayrak — ikisi aynı işte hiç bir arada olamaz (KONUŞMA kendi veri_
  // katmani=KONUSMA yoluna gider, KUVVET_OKU/CIHAZ_EKRANI gibi overlay
  // türleriyle karışmaz). Kullanıcı isteği (2026-09-16): hiçbir JobInput
  // bayrağına bakmaz, üretim standart olarak AI'dır — üreticinin konusma_
  // baloncuklari doldurup doldurmadığına bakar.
  const konusmaCizimModu = (aday.gorsel_veri_manifesti?.konusma_baloncuklari?.length ?? 0) >= 2;

  // İlk deneme gerçek değerleri doğrudan göstermeyi dener (daha zengin bilgi,
  // bazen çalışır) — ama 3'ten fazla değer varsa (bkz. 02-build-prompt.ts
  // "SAYI SINIRI VE YEDEK TABLO") üretici zaten bir YEDEK TABLO (sıra
  // numarası→gerçek değer) hazırlamış olmalı. İlk deneme başarısız olursa
  // tekrar aynı riskli talimatla denemek yerine, sistem BİR KEZ stratejiyi
  // değiştirip etiketleri basit sıra numarasına çevirir — bu, kullanıcının
  // önerdiği "önce zengin dene, olmazsa güvenli yola geç" ilkesi.
  const gosterilecekDegerler = aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? [];
  const zatenIndeksModu = aday.baglam_katmani?.gorsel_veri_gosterimi === "NESNE_INDEKSI";
  // AI'ya artık gerçek değerleri hiç ÇİZDİRMİYORUZ (bkz. 16-gorsel-prompt.ts)
  // — üretici bölgelerin konumunu (overlay_konumlari) önceden bildirdiyse
  // gerçek metin üretim SONRASI deterministik bindirilir (bkz. aşağı, PASS
  // dalı). Bu durumda ">2 değer" sınırı hiç GEÇERLİ DEĞİL (bu sınır yalnız
  // AI'nın KENDİSİ birden fazla değeri güvenilir çizememesinden doğuyordu) —
  // eski NESNE_INDEKSI kaçış yoluna hiç girilmez.
  const overlayKonumlari = aday.baglam_katmani?.overlay_konumlari ?? [];
  const overlayCizgileri = aday.baglam_katmani?.overlay_cizgileri ?? [];
  const overlayKullanilabilir =
    !zatenIndeksModu && overlayKonumlari.length === gosterilecekDegerler.length && overlayKonumlari.length > 0;
  const indeksModunaGecebilir =
    gosterilecekDegerler.length > 2 && !zatenIndeksModu && !overlayKullanilabilir && Boolean(aday.veri_katmani?.gerekli);
  const siraNumaralari = gosterilecekDegerler.map((_, i) => String(i + 1));

  // HİBRİT (kullanıcı isteği, 2026-09-14 — "AI bırakalım AI'ın yazmasını
  // isteyelim bir de bakalım nasıl olacak... olur onu da ekle"): AI'nın
  // KENDİSİ gerçek değeri doğrudan çizmeyi dener (16-gorsel-prompt.ts bu
  // modda "boş bırak" talimatını atlar, bkz. o dosyadaki hibritModu) —
  // yalnız BAŞARISIZ olursa (görsel denetimi RED verirse) sistem OTOMATİK
  // olarak kanıtlanmış deterministik bindirme yoluna döner (aynı
  // FOTOGRAF_UZERINDE mantığı, aşağıdaki PASS dalı). Canlı testte (ham
  // gpt-image-2.5-sunburst denemesi, bkz. proje hafızası) AI tek bir kısa
  // değeri (bir termometre ekranı) doğru yazabildi ama bu garanti değil —
  // bu yüzden hâlâ bir güvenlik ağı gerekiyor, kör güven değil.
  const veriGosterimiTipi = aday.baglam_katmani?.gorsel_veri_gosterimi;
  const hibritUygunTur =
    veriGosterimiTipi === "CIHAZ_EKRANI" ||
    veriGosterimiTipi === "TEKNIK_ETIKET" ||
    veriGosterimiTipi === "OLCUM_CIZGISI" ||
    veriGosterimiTipi === "KUVVET_OKU";
  // KUVVET_OKU veri metin kutusu değil, doğrudan çizgi+etiket taşıyabilir
  // (overlay_cizgileri) — bu durumda overlayKullanilabilir (metin-temelli)
  // FALSE olabilir ama yine de hibrit denemeye değer bir veri vardır.
  const hibritVeriVarMi = overlayKullanilabilir || overlayCizgileri.length > 0;
  const hibritModuAktif =
    input.gorselVeriStratejisi === "FOTOGRAF_UZERINDE_HIBRIT" && hibritVeriVarMi && hibritUygunTur;
  let hibritSwitchYapildi = false;
  // TAM_AI (kullanıcı isteği, 2026-09-29): HİBRİT ile AYNI ilk soruyu sorar
  // ("AI'nın kendi çizdiği değer doğru mu") ve AYNI koşullarda uygundur —
  // ama HİBRİT'in aksine asla deterministik bindirmeye SWITCH ETMEZ. 3
  // denemede de RED ise `TamAiBasarisizError` fırlatılır (bkz. altta) — iş
  // `FAILED` olarak sonlanır, "görselsiz devam" güvenlik ağına DÜŞMEZ. Bu
  // kullanıcının bilinçli tercihi: kör güven burada özellik, hata değil.
  const tamAiModuAktif = input.gorselVeriStratejisi === "TAM_AI" && hibritVeriVarMi && hibritUygunTur;
  const aiKendiCiziyor = hibritModuAktif || tamAiModuAktif;

  // Hibrit modun İLK turunda denetim "bölge boş mu" değil "AI'nın yazdığı
  // değer doğru mu" sorusunu sormalı (bkz. 19-gorsel-denetim.ts'in
  // bosBirakilmisOlmali dalı — bu, aday.baglam_katmani.overlay_konumlari
  // DOLU olduğu sürece hep "boş mu" moduna girer). Bu yüzden denetim için
  // overlay_konumlari/overlay_cizgileri GEÇİCİ olarak boşaltılmış bir kopya
  // kullanılır — gerçek `aday` (ve `state.prompt`) bundan ETKİLENMEZ, yalnız
  // denetimin hangi soruyu soracağını değiştirir. Strateji değiştikten sonra
  // (aşağıda) gerçek `aday`a dönülür — bu da NESNE_INDEKSI'nin kullandığı
  // AYNI `denetimIcinAday` desenidir.
  let denetimIcinAday = aiKendiCiziyor
    ? { ...aday, baglam_katmani: { ...aday.baglam_katmani, overlay_konumlari: [], overlay_cizgileri: [] } }
    : aday;

  const ilkAdaylar = await Promise.all(
    Array.from({ length: ILK_DENEME_ADAY_SAYISI }, async (): Promise<AdayDegerlendirme> => {
      const gorsel = await uretGorsel(state, uretimDeps);
      const denetim = await denetleGorsel(denetimIcinAday, gorsel, deps.denetim, konusmaCizimModu);
      return { gorsel, denetim };
    })
  );

  let secili = enIyiAday(ilkAdaylar);
  let deneme = 1;
  // İlk turda paralel üretilen adayların TÜMÜ "1. deneme" sayılır (ikisi de
  // aynı anda üretildi, sıralı değil) — teşhis için ikisinin de nedenleri saklanır.
  const denemeGecmisi: NonNullable<BaglamGorseliSonuc["denemeGecmisi"]> = ilkAdaylar.map((a) => ({
    deneme: 1,
    status: a.denetim.status,
    nedenler: a.denetim.nedenler,
  }));

  let indeksModunaGecildi = false;

  for (;;) {
    if (secili.denetim.status === "PASS") {
      // HİBRİT ve henüz deterministiğe geçilmediyse, PASS demek "AI'nın
      // KENDİ ÇİZDİĞİ değer doğru/okunaklıydı" demek (bkz. yukarıdaki
      // denetimIcinAday — bu turda "boş mu" değil "değer doğru mu" sorusu
      // soruldu) — hiçbir bindirme gerekmez, AI'nın ürettiği görsel olduğu
      // gibi kullanılır.
      if ((hibritModuAktif || tamAiModuAktif) && !hibritSwitchYapildi) {
        return {
          kullanildi: true,
          contextImageFilename: CONTEXT_IMAGE_FILENAME,
          imageMimeType: secili.gorsel.mimeType,
          imageBase64: secili.gorsel.data,
          gorselDenetimi: secili.denetim,
          asama2Satiri: asama2Satiri(secili.denetim),
          deneme,
          indeksModunaGecildi,
          gorselSaglayici,
          gorselYuksekKaliteDersAnahtari,
          denemeGecmisi,
          gorselPrompt: state.prompt,
        };
      }
      // Görsel denetimi PASS demek burada "AI ilgili bölgeyi doğru şekilde
      // BOŞ bıraktı" demek (bkz. 19-gorsel-denetim.ts) — gerçek metni şimdi,
      // burada, gerçek bir tarayıcı font motoruyla bindiriyoruz. Bindirme
      // kendi başarısızlığında sessizce eski (etiketsiz) görsele düşmez —
      // aksi halde soru çözülemez hâle gelir (bkz. render/gorsel-overlay.ts).
      const veriGosterimi = aday.baglam_katmani?.gorsel_veri_gosterimi;
      // Denetçinin GERÇEK görselde GÖRDÜĞÜ konum (tespitEdilenKonumlar),
      // üreticinin fotoğraf üretilmeden ÖNCE yaptığı tahminden (overlayKonumlari)
      // her zaman daha isabetli — canlı testte görüldü (bkz. proje hafızası):
      // tahmin edilen koordinat gerçek sahnedeki boş bölgeyle tam örtüşmeyebiliyor.
      const tespitEdilen = secili.denetim.tespitEdilenKonumlar ?? [];
      const bindirmeKonumlari = tespitEdilen.length === gosterilecekDegerler.length ? tespitEdilen : overlayKonumlari;
      // OLCUM_CIZGISI da (CIHAZ_EKRANI/TEKNIK_ETIKET gibi) metin bindirmeyi
      // kullanabilir (ör. çizginin ucundaki bir değer), ama çizgiler (aşağıda)
      // veriGosterimi türünden BAĞIMSIZ her zaman bindirilir — bir sahne yalnız
      // çizgi taşıyıp hiç ayrı metin kutusu gerektirmeyebilir (kullanıcı isteği,
      // 2026-09-14: "FOTOGRAF_UZERINDE" stratejisi).
      const gecerliStil =
        veriGosterimi === "CIHAZ_EKRANI" ||
        veriGosterimi === "TEKNIK_ETIKET" ||
        veriGosterimi === "OLCUM_CIZGISI" ||
        veriGosterimi === "KUVVET_OKU"
          ? veriGosterimi
          : "TEKNIK_ETIKET";
      const metinBindirilecek = overlayKullanilabilir && gecerliStil === veriGosterimi;
      const finalGorsel =
        metinBindirilecek || overlayCizgileri.length
          ? await bindirOverlayMetni(
              { mimeType: secili.gorsel.mimeType, data: secili.gorsel.data },
              gecerliStil,
              metinBindirilecek ? bindirmeKonumlari : [],
              metinBindirilecek ? gosterilecekDegerler : [],
              overlayCizgileri
            )
          : secili.gorsel;
      return {
        kullanildi: true,
        contextImageFilename: CONTEXT_IMAGE_FILENAME,
        imageMimeType: finalGorsel.mimeType,
        imageBase64: finalGorsel.data,
        gorselDenetimi: secili.denetim,
        asama2Satiri: asama2Satiri(secili.denetim),
        deneme,
        indeksModunaGecildi,
        gorselSaglayici,
        gorselYuksekKaliteDersAnahtari,
        denemeGecmisi,
        gorselPrompt: state.prompt,
      };
    }

    if (deneme >= MAKS_GORSEL_DENEME) {
      // TAM_AI'da güvenlik ağı YOK (kullanıcı isteği) — HİBRİT'in "3 turda da
      // RED ise deterministik bindirmeye düş" mekanizması burada bilinçli
      // olarak devre dışı; AI kendi çizimini 3 turda da doğru yapamadıysa iş
      // "görselsiz devam" ile sessizce yayınlanmaz, üretim FAILED olarak
      // sonlanır (bkz. TamAiBasarisizError — apps/api/queue/worker.ts'in
      // genel hata yakalayıcısı bunu is_kaydi.status=FAILED'a çevirir).
      if (tamAiModuAktif) {
        throw new TamAiBasarisizError(secili.denetim.nedenler, denemeGecmisi);
      }
      return {
        kullanildi: false,
        contextImageFilename: null,
        asama2Satiri: GORSELSIZ_SATIR,
        deneme,
        indeksModunaGecildi,
        gorselSaglayici,
        gorselYuksekKaliteDersAnahtari,
        denemeGecmisi,
        gorselPrompt: state.prompt,
      };
    }

    deneme += 1;
    let ekTalimat: string | undefined;
    if (hibritModuAktif && !hibritSwitchYapildi) {
      // AI'nın kendi çizdiği değer yanlış/okunaksız çıktı — kanıtlanmış
      // deterministik yola geç: artık bölgeyi BOŞ bırakması istenir, sonraki
      // denetim gerçek `aday`ı (overlay_konumlari dolu) kullandığı için
      // otomatik olarak "boş mu" moduna döner VE tespit_edilen_konumlar
      // raporlar (bkz. 19-gorsel-denetim.ts) — üstteki PASS dalı bunu normal
      // FOTOGRAF_UZERINDE akışıyla (bindirOverlayMetni) tamamlar.
      hibritSwitchYapildi = true;
      denetimIcinAday = aday;
      ekTalimat =
        "Bu bölgeye yazdığın değer(ler) veya çizdiğin ok/çizgi(ler) doğru ya da yeterince net değildi. Artık " +
        "gerçek değeri/oku SEN YAZMA/ÇİZME — o bölgeyi/sahneyi tamamen BOŞ, NÖTR bırak (ör. kapalı/boş bir " +
        "yüzey, ya da FİZİK'te hiçbir ek ok/çizgi eklenmemiş nötr bir fiziksel sahne); gerçek değer/ok ayrıca, " +
        "üretim SONRASI deterministik olarak eklenecek.";
    } else if (indeksModunaGecebilir && !indeksModunaGecildi) {
      indeksModunaGecildi = true;
      denetimIcinAday = {
        ...aday,
        baglam_katmani: { ...aday.baglam_katmani, gorsel_veri_gosterimi: "NESNE_INDEKSI", gorselde_gosterilecek_degerler: siraNumaralari },
      };
      ekTalimat =
        "Gerçek değerleri ayrı ayrı okunaklı çizmek bu sahnede güvenilir olmuyor. Bunun yerine her nesneye " +
        `SIRAYLA, TEK BASAMAKLI/HARFLİ bir sıra numarası ver: ${siraNumaralari.join(", ")} ` +
        `(${gosterilecekDegerler.length} nesne, gösterildiği sırada). Artık gerçek değerleri ÇİZME — yalnız bu sıra ` +
        "numaralarını net ve okunaklı göster; gerçek değerler ayrı bir tabloda bu numaralarla eşleştirilecek.";
    }

    const duzeltilmis = await duzeltGorsel(secili.gorsel, secili.denetim, state, uretimDeps, ekTalimat);
    const yeniDenetim = await denetleGorsel(denetimIcinAday, duzeltilmis, deps.denetim, konusmaCizimModu);
    denemeGecmisi.push({ deneme, status: yeniDenetim.status, nedenler: yeniDenetim.nedenler });
    secili = { gorsel: duzeltilmis, denetim: yeniDenetim };
  }
}
