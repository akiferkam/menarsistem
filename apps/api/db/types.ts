export interface Yayinevi {
  id: string;
  ad: string;
  createdAt: string;
}

export interface Ogretmen {
  id: string;
  yayineviId: string;
  ad: string;
  kullaniciAdi: string | null;
  createdAt: string;
}

export type IsDurumu = "QUEUED" | "RUNNING" | "NEEDS_REVIEW" | "APPROVED" | "DONE" | "FAILED";

export interface IsKaydi {
  id: string;
  yayineviId: string;
  ogretmenId: string;
  status: IsDurumu;
  inputJson: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  hataMesaji: string | null;
  revizeKaynakIsId: string | null;
  revizeNotu: string | null;
}

export interface SoruSonucu {
  id: string;
  isId: string;
  adayJson: string;
  kanitTablosuJson: string;
  finalKilidi: string;
  zipPath: string;
  onaylayanOgretmenId: string | null;
  onayZamani: string | null;
}

/** "fal" opsiyoneldir — yalnız bağlam görseli üretiminde (seed/img2img için), openai/anthropic gibi zorunlu değildir. */
export type ApiProvider = "openai" | "anthropic" | "fal";
