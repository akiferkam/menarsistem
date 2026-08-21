import type { LlmProvider } from "../llm/provider.js";
import type { GorselIstekState } from "./16-gorsel-prompt.js";
import type { GorselDenetimi } from "./types.js";

export interface GorselUretimDeps {
  provider: LlmProvider;
  model: string;
  /** Yalnız fal.ai gibi generate/edit için farklı endpoint id'si isteyen sağlayıcılarda gerekir; verilmezse `model` kullanılır. */
  editModel?: string;
}

export interface GorselUretimSonucu {
  mimeType: "image/png";
  /** base64, data: öneki olmadan. */
  data: string;
  byteLength: number;
  /** Yalnız seed destekleyen sağlayıcılar (fal.ai) doldurur. */
  seed?: number;
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * node "52 - Görsel Üret (Image API)" + "53 - PNG Binary Oluştur"un portu.
 * Section 15: model çıktısı asla körlemesine güvenilmez — sağlayıcı
 * `image/png` dese bile burada baytlar yeniden çözülüp PNG imzası ve
 * minimum uzunluk koddan doğrulanır.
 */
export async function uretGorsel(state: GorselIstekState, deps: GorselUretimDeps): Promise<GorselUretimSonucu> {
  const res = await deps.provider.generateImage({
    model: deps.model,
    prompt: state.prompt,
    size: state.imageSize,
    quality: "high",
  });

  const stripped = res.data
    .trim()
    .replace(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, "")
    .replace(/\s+/g, "");

  let bytes: Buffer;
  try {
    bytes = Buffer.from(stripped, "base64");
  } catch (err) {
    throw new Error(`Görsel base64 çözülemedi: ${(err as Error).message}`);
  }
  if (!bytes || bytes.length < 100) {
    throw new Error(`Üretilen görsel verisi boş veya aşırı kısa. Byte: ${bytes?.length ?? 0}`);
  }

  const isPng = bytes.length >= 8 && PNG_MAGIC.every((b, i) => bytes[i] === b);
  if (!isPng) {
    const head = bytes.subarray(0, 16).toString("hex");
    throw new Error(`Görsel PNG formatında değil. İlk byte imzası: ${head}`);
  }

  return { mimeType: "image/png", data: bytes.toString("base64"), byteLength: bytes.length, seed: res.seed };
}

const HATA_KODU_TALIMATI: Record<string, string> = {
  METIN_ARTEFAKTI:
    "Görselden izin verilmeyen tüm yazı/rakam/logo/filigranı kaldır. Ok, yön işareti, çizgi ucu gibi " +
    "ek grafik semboller de dahil — SADECE izin verilen etiketler kalsın, akış/yön göstermeye çalışan " +
    "hiçbir ek işaret olmasın.",
  NESNE_UYUMSUZLUGU:
    "Nesne sayılarını, düzenini VE HANGİ NESNENİN HANGİ DAL/KOL/KONUMDA olduğunu bağlamla tutarlı hale " +
    "getir — özellikle birden fazla dal/yol varsa her nesnenin doğru dalda göründüğünden emin ol.",
  VERI_UYUSMAZLIGI: "Yalnız izin verilen değerleri, verildiği gibi ve net okunur biçimde göster.",
  ANLAM_UYUSMAZLIGI: "Sahnenin planlanan bilgi rolünü gerçekten taşıdığından emin ol.",
  YAPAY_GORUNUM: "Yerleşimi daha doğal/asimetrik yap; havada asılı, kaynaşmış veya anlamsız tekrar eden nesneleri düzelt; yüzey parlaklığını gerçekçi malzeme dokusuna çevir.",
  ASIRI_KARMASA: "Sahnedeki dekoratif/gereksiz nesne yoğunluğunu azalt, ana konuya odaklan.",
  KOMPOZISYON_HATASI: "Kadrajı ve perspektifi düzelt; ana nesne net ve doğru oranlarda görünsün.",
};

/**
 * "Regenerate everything" yerine yalnız hatalı alanı düzelt (bkz.
 * `provider.ts`'in `ImageEditOptions` yorumu) — önceki görseli girdi alıp
 * kompozisyon/ışık/stili koruyarak yalnız RED nedenlerini hedefleyen kısa
 * bir talimatla `images.edit` çağırır. Tam prompttan yeniden üretmek yerine
 * bu, kullanıcı mimarisinin "LOCK camera/composition/lighting, CHANGE only X"
 * ilkesinin (madde 18) gpt-image-1 ile gerçekçi karşılığıdır.
 */
export async function duzeltGorsel(
  onceki: GorselUretimSonucu,
  denetim: GorselDenetimi,
  state: GorselIstekState,
  deps: GorselUretimDeps,
  /** Değer sayısı fazla olduğunda strateji değişikliği talimatı (bkz. `20-baglam-gorseli.ts`). */
  ekTalimat?: string
): Promise<GorselUretimSonucu> {
  const talimatlar = denetim.hataKodlari.length
    ? denetim.hataKodlari.map((k) => HATA_KODU_TALIMATI[k] ?? k)
    : denetim.nedenler;

  const editPrompt =
    "Bu görseli DEĞİŞTİRME — yalnız aşağıdaki somut sorunları düzelt, kompozisyonu, kamerayı, " +
    "ışığı ve genel sahneyi olduğu gibi koru:\n- " +
    [...new Set(talimatlar)].join("\n- ") +
    "\n- " +
    denetim.nedenler.join("\n- ") +
    (ekTalimat ? "\n\nSTRATEJİ DEĞİŞİKLİĞİ:\n" + ekTalimat : "");

  const res = await deps.provider.editImage({
    model: deps.editModel ?? deps.model,
    baseImage: onceki.data,
    baseImageMimeType: onceki.mimeType,
    prompt: editPrompt,
    size: state.imageSize,
    quality: "high",
    seed: onceki.seed,
  });

  const stripped = res.data
    .trim()
    .replace(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, "")
    .replace(/\s+/g, "");
  const bytes = Buffer.from(stripped, "base64");
  if (!bytes || bytes.length < 100) {
    throw new Error(`Düzeltilen görsel verisi boş veya aşırı kısa. Byte: ${bytes?.length ?? 0}`);
  }
  const isPng = bytes.length >= 8 && PNG_MAGIC.every((b, i) => bytes[i] === b);
  if (!isPng) {
    throw new Error(`Düzeltilen görsel PNG formatında değil. İlk byte imzası: ${bytes.subarray(0, 16).toString("hex")}`);
  }
  return { mimeType: "image/png", data: bytes.toString("base64"), byteLength: bytes.length, seed: res.seed ?? onceki.seed };
}
