import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { validateJob, type JobInput } from "@menar/core";
import { requireOgretmen } from "../auth/middleware.js";
import type { Repository } from "../db/repository.js";

/** `POST /jobs` gövdesi, CLI'nin `test.json`'ıyla aynı `JobInput` şekli. */
export function registerJobRoutes(app: FastifyInstance, repo: Repository): void {
  app.post("/jobs", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const input = req.body as JobInput;
    const validation = validateJob(input);
    if (!validation.valid) {
      reply.code(400).send({ error: "GİRDİ_HATASI", detay: validation.errors });
      return;
    }

    const job = repo.is.create({
      yayineviId: ogretmen.yayineviId,
      ogretmenId: ogretmen.id,
      inputJson: JSON.stringify(input),
    });
    reply.code(202).send({ jobId: job.id, status: job.status });
  });

  app.get("/jobs/:id", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const job = repo.is.get(id);
    if (!job || job.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "iş bulunamadı" });
      return;
    }

    const sonuc = repo.sonuc.getByIsId(id);
    reply.send({
      jobId: job.id,
      status: job.status,
      hataMesaji: job.hataMesaji,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      sonuc: sonuc
        ? {
            finalKilidi: sonuc.finalKilidi,
            kanitTablosu: JSON.parse(sonuc.kanitTablosuJson) as unknown,
            aday: JSON.parse(sonuc.adayJson) as unknown,
            onaylandi: Boolean(sonuc.onaylayanOgretmenId),
          }
        : null,
    });
  });

  app.post("/jobs/:id/approve", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const job = repo.is.get(id);
    if (!job || job.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "iş bulunamadı" });
      return;
    }
    // Section 13 #4: NEEDS_REVIEW'ı yalnız üreten öğretmen onaylayabilir.
    if (job.ogretmenId !== ogretmen.id) {
      reply.code(403).send({ error: "Yalnız işi üreten öğretmen onaylayabilir" });
      return;
    }
    if (job.status !== "NEEDS_REVIEW") {
      reply.code(409).send({ error: `Onaylanabilir durumda değil (şu an: ${job.status})` });
      return;
    }

    repo.sonuc.approve(id, ogretmen.id);
    repo.is.setStatus(id, "APPROVED", { finishedAt: job.finishedAt ?? new Date().toISOString() });
    reply.send({ jobId: id, status: "APPROVED" });
  });

  /**
   * "Soruyu Düzelt" — sıfırdan yeni bir iş açmak yerine mevcut NEEDS_REVIEW
   * adayının üzerinden TEK bir düzeltme turu çalıştırır (bkz. pipeline/
   * run.ts reviseJob(); worker.ts kuyruğa aynı şekilde girer, farkı
   * revize_kaynak_is_id'nin dolu olması). Öğretmen isteğe bağlı kendi
   * notunu ekleyebilir; sistemin kendi bulduğu redNedenleri worker.ts'te
   * kaynak işin kanit_tablosu_json'undan okunur.
   */
  app.post("/jobs/:id/revise", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const kaynak = repo.is.get(id);
    if (!kaynak || kaynak.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "iş bulunamadı" });
      return;
    }
    if (kaynak.ogretmenId !== ogretmen.id) {
      reply.code(403).send({ error: "Yalnız işi üreten öğretmen düzeltme isteyebilir" });
      return;
    }
    if (kaynak.status !== "NEEDS_REVIEW") {
      reply.code(409).send({ error: `Düzeltilebilir durumda değil (şu an: ${kaynak.status})` });
      return;
    }

    const body = req.body as { not?: string } | undefined;
    const job = repo.is.create({
      yayineviId: kaynak.yayineviId,
      ogretmenId: kaynak.ogretmenId,
      inputJson: kaynak.inputJson,
      revizeKaynakIsId: kaynak.id,
      revizeNotu: body?.not?.trim() || undefined,
    });
    reply.code(202).send({ jobId: job.id, status: job.status });
  });

  app.get("/jobs/:id/zip", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const job = repo.is.get(id);
    if (!job || job.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "iş bulunamadı" });
      return;
    }
    if (job.status !== "DONE" && job.status !== "APPROVED") {
      reply.code(409).send({ error: `Paket henüz hazır değil (şu an: ${job.status})` });
      return;
    }
    const sonuc = repo.sonuc.getByIsId(id);
    if (!sonuc) {
      reply.code(404).send({ error: "sonuç bulunamadı" });
      return;
    }
    const buf = readFileSync(sonuc.zipPath);
    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${basename(sonuc.zipPath)}"`);
    reply.send(buf);
  });

  /** `worker.ts`'in zip'in yanına ayrıca yazdığı birleşik soru+görsel PNG. */
  app.get("/jobs/:id/preview.png", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;

    const { id } = req.params as { id: string };
    const job = repo.is.get(id);
    if (!job || job.yayineviId !== ogretmen.yayineviId) {
      reply.code(404).send({ error: "iş bulunamadı" });
      return;
    }
    const sonuc = repo.sonuc.getByIsId(id);
    if (!sonuc) {
      reply.code(404).send({ error: "sonuç bulunamadı" });
      return;
    }
    const previewPath = join(dirname(sonuc.zipPath), "onizleme.png");
    if (!existsSync(previewPath)) {
      reply.code(404).send({ error: "önizleme bulunamadı" });
      return;
    }
    reply.header("Content-Type", "image/png");
    reply.send(readFileSync(previewPath));
  });
}
