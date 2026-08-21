import type { GeneratorOutput } from "./03-generator-schema.js";
import { runGorselPromptAjani, type GorselPromptDeps } from "./16-gorsel-prompt.js";
import { duzeltGorsel, uretGorsel, type GorselUretimDeps, type GorselUretimSonucu } from "./17-gorsel-uret.js";
import { denetleGorsel, asama2Satiri, type GorselDenetimDeps } from "./19-gorsel-denetim.js";
import type { BaglamGorseliSonuc, GorselDenetimi, JobInput, RotationLedger } from "./types.js";

const MAKS_GORSEL_DENEME = 3;
const CONTEXT_IMAGE_FILENAME = "09_Baglam_Sahnesi.png";
const GORSELSIZ_SATIR = "AŞAMA 2 (GÖRSEL-MANİFEST) DENETİMİ: UYGULANMAZ — bağlam görseli kullanılmadı";
/** İlk denemede kaç bağımsız aday üretilip aralarından en iyisi seçilecek (kullanıcı mimarisi madde 19/42). */
const ILK_DENEME_ADAY_SAYISI = 2;

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
  // kontrolü devreye girer.
  const veriGosteriliyor =
    (aday.baglam_katmani?.gorsel_veri_gosterimi ?? "YOK") !== "YOK" &&
    (aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? []).length > 0;
  const yuksekKaliteKullanildi = Boolean(
    input.gorselKalitesi === "YUKSEK" && !veriGosteriliyor && deps.uretimYuksekKalite
  );
  const uretimDeps: GorselUretimDeps = yuksekKaliteKullanildi ? deps.uretimYuksekKalite! : deps.uretim;
  const gorselSaglayici: "STANDART" | "YUKSEK" = yuksekKaliteKullanildi ? "YUKSEK" : "STANDART";

  const state = await runGorselPromptAjani(aday, input, ledger, deps.prompt);

  const ilkAdaylar = await Promise.all(
    Array.from({ length: ILK_DENEME_ADAY_SAYISI }, async (): Promise<AdayDegerlendirme> => {
      const gorsel = await uretGorsel(state, uretimDeps);
      const denetim = await denetleGorsel(aday, gorsel, deps.denetim);
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

  // İlk deneme gerçek değerleri doğrudan göstermeyi dener (daha zengin bilgi,
  // bazen çalışır) — ama 3'ten fazla değer varsa (bkz. 02-build-prompt.ts
  // "SAYI SINIRI VE YEDEK TABLO") üretici zaten bir YEDEK TABLO (sıra
  // numarası→gerçek değer) hazırlamış olmalı. İlk deneme başarısız olursa
  // tekrar aynı riskli talimatla denemek yerine, sistem BİR KEZ stratejiyi
  // değiştirip etiketleri basit sıra numarasına çevirir — bu, kullanıcının
  // önerdiği "önce zengin dene, olmazsa güvenli yola geç" ilkesi.
  const gosterilecekDegerler = aday.baglam_katmani?.gorselde_gosterilecek_degerler ?? [];
  const zatenIndeksModu = aday.baglam_katmani?.gorsel_veri_gosterimi === "NESNE_INDEKSI";
  const indeksModunaGecebilir = gosterilecekDegerler.length > 2 && !zatenIndeksModu && Boolean(aday.veri_katmani?.gerekli);
  const siraNumaralari = gosterilecekDegerler.map((_, i) => String(i + 1));
  // Strateji değiştikten sonra denetim de artık GERÇEK değerleri değil, yeni
  // sıra numaralarını arayacak — aksi halde görsel doğru üretilse bile (1,2,3...
  // net görünse bile) denetim hâlâ eski gerçek değerleri arayıp RED üretir.
  let denetimIcinAday = aday;
  let indeksModunaGecildi = false;

  for (;;) {
    if (secili.denetim.status === "PASS") {
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
        denemeGecmisi,
        gorselPrompt: state.prompt,
      };
    }

    if (deneme >= MAKS_GORSEL_DENEME) {
      return {
        kullanildi: false,
        contextImageFilename: null,
        asama2Satiri: GORSELSIZ_SATIR,
        deneme,
        indeksModunaGecildi,
        gorselSaglayici,
        denemeGecmisi,
        gorselPrompt: state.prompt,
      };
    }

    deneme += 1;
    const ekTalimat =
      indeksModunaGecebilir && !indeksModunaGecildi
        ? "Gerçek değerleri ayrı ayrı okunaklı çizmek bu sahnede güvenilir olmuyor. Bunun yerine her nesneye " +
          `SIRAYLA, TEK BASAMAKLI/HARFLİ bir sıra numarası ver: ${siraNumaralari.join(", ")} ` +
          `(${gosterilecekDegerler.length} nesne, gösterildiği sırada). Artık gerçek değerleri ÇİZME — yalnız bu sıra ` +
          "numaralarını net ve okunaklı göster; gerçek değerler ayrı bir tabloda bu numaralarla eşleştirilecek."
        : undefined;
    if (ekTalimat) {
      indeksModunaGecildi = true;
      denetimIcinAday = {
        ...aday,
        baglam_katmani: { ...aday.baglam_katmani, gorsel_veri_gosterimi: "NESNE_INDEKSI", gorselde_gosterilecek_degerler: siraNumaralari },
      };
    }

    const duzeltilmis = await duzeltGorsel(secili.gorsel, secili.denetim, state, uretimDeps, ekTalimat);
    const yeniDenetim = await denetleGorsel(denetimIcinAday, duzeltilmis, deps.denetim);
    denemeGecmisi.push({ deneme, status: yeniDenetim.status, nedenler: yeniDenetim.nedenler });
    secili = { gorsel: duzeltilmis, denetim: yeniDenetim };
  }
}
