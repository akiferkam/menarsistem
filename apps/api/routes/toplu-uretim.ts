import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { FastifyInstance } from "fastify";
import { validateJob, type JobInput } from "@menar/core";
import { requireOgretmen } from "../auth/middleware.js";
import type { Repository } from "../db/repository.js";

/**
 * Faz 5 "Soru Bankası": `POST /jobs`'un toplu hâli. Her `kalem` normal bir
 * `JobInput` — tek tek `validateJob()`'dan geçer (biri geçersizse hiç job
 * açılmaz), sonra sıradan `repo.is.create()` ile aynı kuyruğa (worker.ts'in
 * `tick()`'i) girer. Toplu üretime özel olan tek şey `toplu_uretim_id`/
 * `toplu_uretim_sira` etiketi — kuyruk/eşzamanlılık tarafında YENİ bir şey
 * yok. PDF birleştirme `worker.ts`'te her job terminale ulaştığında tetiklenir.
 */
export function registerTopluUretimRoutes(app: FastifyInstance, repo: Repository): void {
  app.post("/toplu-uretim", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const body = req.body as { baslik?: string; kalemler?: JobInput[] } | undefined;
    const kalemler = body?.kalemler;
    if (!Array.isArray(kalemler) || kalemler.length === 0) {
      reply.code(400).send({ error: "GİRDİ_HATASI", detay: ["kalemler boş olamaz"] });
      return;
    }

    // Hepsi tek tek doğrulanır — biri bile geçersizse hiç job açılmaz, kısmi
    // bir toplu üretim (bazı satırlar üretilmiş bazıları hiç kuyruğa
    // girmemiş) öğretmeni yanıltır.
    for (let i = 0; i < kalemler.length; i++) {
      const validation = validateJob(kalemler[i] as JobInput);
      if (!validation.valid) {
        reply.code(400).send({ error: "GİRDİ_HATASI", detay: [`Satır ${i + 1}:`, ...validation.errors] });
        return;
      }
    }

    // BTBS ("Bir Ben Bir Sen") kalemleri yalnız BEN'i şimdi açar — eşleştirilmiş
    // SEN, BEN bittiğinde queue/btbs.ts tarafından OTOMATİK olarak bu AYNI
    // batch'e eklenir. Bu yüzden (a) toplamSatir her BTBS kalemi için bir
    // FAZLA sayılır, (b) sira numaralandırması her BTBS kaleminden sonra bir
    // BOŞLUK bırakır — aksi halde sonradan eklenen SEN'in sira'sı (=BEN+1)
    // listedeki BİR SONRAKİ kalemin sira'sıyla çakışırdı.
    const btbsSayisi = kalemler.filter((k) => (k as JobInput).mode === "BTBS").length;
    const batch = repo.topluUretim.create({
      yayineviId: ogretmen.yayineviId,
      ogretmenId: ogretmen.id,
      baslik: body?.baslik,
      toplamSatir: kalemler.length + btbsSayisi,
    });

    let sira = 0;
    const jobIds = kalemler.map((kalem) => {
      const job = repo.is.create({
        yayineviId: ogretmen.yayineviId,
        ogretmenId: ogretmen.id,
        inputJson: JSON.stringify(kalem),
        topluUretimId: batch.id,
        topluUretimSira: sira,
      });
      sira += (kalem as JobInput).mode === "BTBS" ? 2 : 1;
      return job.id;
    });

    reply.code(202).send({ topluUretimId: batch.id, jobIds });
  });

  app.get("/toplu-uretim/:id", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const batch = repo.topluUretim.get(id);
    if (!batch || batch.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "toplu üretim bulunamadı" });
      return;
    }

    const jobs = repo.topluUretim.listJobsFor(id).map((job) => ({
      jobId: job.id,
      sira: job.topluUretimSira,
      status: job.status,
      kod: (JSON.parse(job.inputJson) as JobInput).kod,
      hataMesaji: job.hataMesaji,
    }));

    reply.send({
      topluUretimId: batch.id,
      status: batch.status,
      baslik: batch.baslik,
      toplamSatir: batch.toplamSatir,
      pdfHazir: batch.status === "TAMAMLANDI" && Boolean(batch.pdfPath),
      satirlar: jobs,
    });
  });

  app.get("/toplu-uretim/:id/pdf", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const batch = repo.topluUretim.get(id);
    if (!batch || batch.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "toplu üretim bulunamadı" });
      return;
    }
    if (batch.status !== "TAMAMLANDI" || !batch.pdfPath) {
      reply.code(409).send({ error: `PDF henüz hazır değil (şu an: ${batch.status})` });
      return;
    }

    const buf = readFileSync(batch.pdfPath);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${basename(batch.pdfPath)}"`);
    reply.send(buf);
  });
}
