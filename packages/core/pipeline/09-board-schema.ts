import { z } from "zod";

/** node "23P - Yayın Kurulu Şeması"nın portu. */
const DurumSchema = z.enum(["PASS", "RED", "DOĞRULANAMADI"]);

const PuanlamaSchema = z.object({
  kazanim_uyumu: z.number().min(0).max(1.5).nullish(),
  matematiksel_dogruluk: z.number().min(0).max(2).nullish(),
  gorsel_islevsellik: z.number().min(0).max(1.5).nullish(),
  bilgi_tekrarsizligi: z.number().min(0).max(1).nullish(),
  celdirici_kalitesi: z.number().min(0).max(1.5).nullish(),
  iq_uygunlugu: z.number().min(0).max(1).nullish(),
  baglam_islevselligi: z.number().min(0).max(1).nullish(),
  dil_yayin_duzeni: z.number().min(0).max(0.5).nullish(),
});

export const BoardOutputSchema = z.object({
  kazanim_uyumu: DurumSchema.nullish(),
  tymm_uyumu: DurumSchema.nullish(),
  ders_hakemi: DurumSchema.nullish(),
  olcme_uzmani: DurumSchema.nullish(),
  bas_editor: z.enum(["PASS", "RED"]),
  yayin_kurulu: z.enum(["PASS", "RED"]),
  red_nedenleri: z.array(z.string()).nullish(),
  onerilen_degisiklik: z.string().nullish(),
  puanlama: PuanlamaSchema,
});

export type BoardOutput = z.infer<typeof BoardOutputSchema>;
