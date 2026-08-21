import type { FastifyInstance } from "fastify";
import { encryptApiKey } from "../auth/crypto.js";
import { requireAdmin } from "../auth/middleware.js";
import type { Repository } from "../db/repository.js";
import type { ApiProvider } from "../db/types.js";

interface CreateYayineviBody {
  ad?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  /** Opsiyonel — bkz. proje hafızası `menar-mays-gorsel-mimari`: yalnız bağlam görseli seed/img2img için. */
  falApiKey?: string;
}

interface SetApiKeyBody {
  provider?: ApiProvider;
  apiKey?: string;
}

const GECERLI_PROVIDER: ApiProvider[] = ["openai", "anthropic", "fal"];

/** Section 13 #3 (BYOK) bootstrap ucu — Faz 3'te tek admin-token korumalı, self-servis kayıt yok (Faz 5). */
export function registerYayineviRoutes(
  app: FastifyInstance,
  repo: Repository,
  adminToken: string,
  encryptionSecret: string
): void {
  app.post("/yayinevi", async (req, reply) => {
    if (!requireAdmin(req, reply, adminToken)) return;
    const body = req.body as CreateYayineviBody;
    if (!body.ad || !body.openaiApiKey || !body.anthropicApiKey) {
      reply.code(400).send({ error: "ad, openaiApiKey, anthropicApiKey zorunlu" });
      return;
    }
    const yayinevi = repo.yayinevi.create(body.ad);
    repo.yayinevi.setApiKey(yayinevi.id, "openai", encryptApiKey(body.openaiApiKey, encryptionSecret));
    repo.yayinevi.setApiKey(yayinevi.id, "anthropic", encryptApiKey(body.anthropicApiKey, encryptionSecret));
    if (body.falApiKey) {
      repo.yayinevi.setApiKey(yayinevi.id, "fal", encryptApiKey(body.falApiKey, encryptionSecret));
    }
    reply.code(201).send({ id: yayinevi.id, ad: yayinevi.ad });
  });

  /**
   * Var olan bir yayınevine sonradan bir anahtar eklemek/değiştirmek için —
   * özellikle openai/anthropic zorunlu değilse de "fal" gibi opsiyonel bir
   * sağlayıcıyı, yayınevi oluşturulduktan sonra eklemek için gerekli
   * (POST /yayinevi yalnız oluşturma anında anahtar kabul ediyor).
   */
  app.post("/yayinevi/:id/api-key", async (req, reply) => {
    if (!requireAdmin(req, reply, adminToken)) return;
    const { id } = req.params as { id: string };
    const body = req.body as SetApiKeyBody;
    if (!body.provider || !GECERLI_PROVIDER.includes(body.provider) || !body.apiKey) {
      reply.code(400).send({ error: `provider (${GECERLI_PROVIDER.join("|")}) ve apiKey zorunlu` });
      return;
    }
    if (!repo.yayinevi.get(id)) {
      reply.code(404).send({ error: "yayinevi bulunamadı" });
      return;
    }
    repo.yayinevi.setApiKey(id, body.provider, encryptApiKey(body.apiKey, encryptionSecret));
    reply.code(204).send();
  });

  /** Admin ekranının öğretmen oluştururken yayınevi seçmesi için — şifreli anahtarları döndürmez. */
  app.get("/yayinevi", async (req, reply) => {
    if (!requireAdmin(req, reply, adminToken)) return;
    reply.send(repo.yayinevi.list().map((y) => ({ id: y.id, ad: y.ad, createdAt: y.createdAt })));
  });

  /** Giriş ekranındaki yayınevi seçimi için — auth gerektirmez, yalnız id+ad döner (anahtar/öğretmen bilgisi yok). */
  app.get("/yayinevi/public", async (_req, reply) => {
    reply.send(repo.yayinevi.list().map((y) => ({ id: y.id, ad: y.ad })));
  });

  app.get("/yayinevi/:id/ogretmen", async (req, reply) => {
    if (!requireAdmin(req, reply, adminToken)) return;
    const { id } = req.params as { id: string };
    reply.send(repo.ogretmen.listByYayinevi(id).map((o) => ({ id: o.id, ad: o.ad, createdAt: o.createdAt })));
  });
}
