import type { GeneratorOutput, JobInput } from "@menar/core";
import type { Repository } from "../db/repository.js";
import type { IsKaydi } from "../db/types.js";

/**
 * "Bir Ben Bir Sen" (kullanıcı isteği, 2026-09-27): BEN bittiğinde (DONE ya da
 * NEEDS_REVIEW→APPROVED), eşleştirilmiş SEN'i BEN'in sonucunu referans alarak
 * OTOMATİK olarak kuyruğa ekler — BEN ve SEN tamamen AYRI, bağımsız job'lardır
 * (her biri kendi baglam_katmani/görselini üretir), yalnız aynı toplu_uretim
 * batch'ine bağlanarak birlikte gruplanır/indirilebilir (bkz. queue/toplu-pdf.ts
 * ile aynı batch mekanizması). worker.ts (job DONE olduğunda) VE routes/jobs.ts
 * (/approve, job NEEDS_REVIEW'dan APPROVED'a geçtiğinde) İKİ ayrı çağırandan
 * tetiklenir — bu yüzden idempotent: SEN zaten varsa tekrar oluşturmaz.
 */
export function maybeSpawnBtbsSen(benJob: IsKaydi, repo: Repository): void {
  if (!benJob.topluUretimId) return;

  const input = JSON.parse(benJob.inputJson) as JobInput;
  if (input.mode !== "BTBS" || (input.btbsRol && input.btbsRol !== "BEN")) return;

  const kardesler = repo.topluUretim.listJobsFor(benJob.topluUretimId);
  if (kardesler.some((k) => k.id !== benJob.id)) return; // SEN (veya başka bir kardeş) zaten var

  const sonuc = repo.sonuc.getByIsId(benJob.id);
  if (!sonuc) return;
  const aday = JSON.parse(sonuc.adayJson) as GeneratorOutput;
  const soru = aday.sorular[0];
  if (!soru) return;

  const senInput: JobInput = {
    ...input,
    btbsRol: "SEN",
    btbsReferans: {
      kok: soru.kok,
      secenekler: soru.secenekler,
      dogruSecenek: soru.dogru_secenek,
      dogruCevap: soru.dogru_cevap,
      cozumAdimlari: soru.cozum_adimlari ?? [],
    },
  };

  repo.is.create({
    yayineviId: benJob.yayineviId,
    ogretmenId: benJob.ogretmenId,
    inputJson: JSON.stringify(senInput),
    topluUretimId: benJob.topluUretimId,
    topluUretimSira: (benJob.topluUretimSira ?? 0) + 1,
  });
}
