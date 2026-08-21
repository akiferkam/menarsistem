import { z } from "zod";

/**
 * node "20P - Solver Şeması A" / "21P - Solver Şeması B"nin portu — iki şema
 * kaynakta bayt bayt aynı, tek şema olarak paylaşılıyor.
 */
const SecenekDenetimiSchema = z.object({
  harf: z.enum(["A", "B", "C", "D", "E"]).nullish(),
  deger: z.string().nullish(),
  kosullari_saglar: z.boolean().nullish(),
  hata_yolu: z.string().nullish(),
  karar: z.enum(["DOĞRU", "YANLIŞ", "BELİRSİZ"]).nullish(),
});

const SolverCozumSchema = z.object({
  soru_no: z.number().nullish(),
  adimlar: z.array(z.string()).nullish(),
  sonuc: z.string().nullish(),
  dogru_secenek: z.enum(["A", "B", "C", "D", "E", "YOK"]).nullish(),
  secenek_denetimi: z.array(SecenekDenetimiSchema).length(5).nullish(),
});

export const SolverOutputSchema = z.object({
  yontem: z.string().nullish(),
  cozumler: z.array(SolverCozumSchema),
});

export type SolverOutput = z.infer<typeof SolverOutputSchema>;
export type SolverCozum = z.infer<typeof SolverCozumSchema>;
