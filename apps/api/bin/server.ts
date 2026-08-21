#!/usr/bin/env node
import { config as loadDotenv } from "dotenv";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { openDb } from "../db/client.js";
import { createSqliteRepository } from "../db/sqlite-repository.js";
import { startQueueWorker } from "../queue/worker.js";
import { registerYayineviRoutes } from "../routes/yayinevi.js";
import { registerOgretmenRoutes } from "../routes/ogretmen.js";
import { registerJobRoutes } from "../routes/jobs.js";

// apps/cli/bin/mays.ts'teki aynı cwd-shift sorunu (bkz. proje hafızası) — repo
// kökü betiğin kendi konumuna göre sabitlenir, `pnpm --filter`e bağımlı değil.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
loadDotenv({ path: join(REPO_ROOT, ".env") });

const ADMIN_TOKEN = process.env.API_ADMIN_TOKEN;
const ENCRYPTION_SECRET = process.env.API_KEY_ENCRYPTION_SECRET;
if (!ADMIN_TOKEN || !ENCRYPTION_SECRET) {
  console.error("BEKLENMEYEN HATA: .env'de API_ADMIN_TOKEN ve API_KEY_ENCRYPTION_SECRET zorunlu.");
  process.exit(1);
}

const dbPath = process.env.MAYS_DB_PATH ?? join(REPO_ROOT, "mays.db");
const outputDir = process.env.MAYS_API_OUTPUT_DIR ?? join(REPO_ROOT, "output-api");
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const db = openDb(dbPath);
const repo = createSqliteRepository(db);

const worker = startQueueWorker({
  repo,
  encryptionSecret: ENCRYPTION_SECRET,
  outputDir,
  globalConcurrency: Number(process.env.API_GLOBAL_CONCURRENCY ?? 8),
  perYayineviConcurrency: Number(process.env.API_PER_YAYINEVI_CONCURRENCY ?? 3),
  pollIntervalMs: Number(process.env.API_QUEUE_POLL_MS ?? 2000),
});

const app = Fastify({ logger: true });
registerYayineviRoutes(app, repo, ADMIN_TOKEN, ENCRYPTION_SECRET);
registerOgretmenRoutes(app, repo, ADMIN_TOKEN);
registerJobRoutes(app, repo);

app.get("/health", async () => ({ ok: true }));

// apps/web-legacy'yi aynı origin'den servis eder — böylece tarayıcıdaki
// fetch() çağrıları için CORS'a hiç gerek kalmaz (bkz. web-legacy'nin
// kendi script'i, göreli /jobs vb. yolları kullanır).
const webLegacyIndex = join(REPO_ROOT, "apps", "web-legacy", "index.html");
app.get("/", async (_req, reply) => {
  if (!existsSync(webLegacyIndex)) {
    reply.code(404).send({ error: "apps/web-legacy/index.html bulunamadı" });
    return;
  }
  reply.type("text/html").send(readFileSync(webLegacyIndex, "utf8"));
});

// Yayınevi/öğretmen bootstrap ekranı — yalnızca API_ADMIN_TOKEN'ı bilenler
// için (sayfa kendisi public served, ama içindeki her API çağrısı admin
// bearer ister; bkz. routes/yayinevi.ts requireAdmin).
const webLegacyAdmin = join(REPO_ROOT, "apps", "web-legacy", "admin.html");
app.get("/admin", async (_req, reply) => {
  if (!existsSync(webLegacyAdmin)) {
    reply.code(404).send({ error: "apps/web-legacy/admin.html bulunamadı" });
    return;
  }
  reply.type("text/html").send(readFileSync(webLegacyAdmin, "utf8"));
});

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "127.0.0.1";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

function shutdown(): void {
  worker.stop();
  void app.close().then(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
