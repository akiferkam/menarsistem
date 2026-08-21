import { z } from "zod";

/** node "50P - Görsel Prompt Şeması"nın portu. */
export const GorselPromptOutputSchema = z.object({
  prompt: z.string(),
  gorsel_ailesi: z.string().nullish(),
  boyut: z.enum(["2D", "3D"]).nullish(),
  gerekce: z.string().nullish(),
});

export type GorselPromptOutput = z.infer<typeof GorselPromptOutputSchema>;
