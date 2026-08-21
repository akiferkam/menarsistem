import type { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { requireAdmin, requireOgretmen } from "../auth/middleware.js";
import { generateBearerToken, hashToken } from "../auth/tokens.js";
import type { Repository } from "../db/repository.js";

interface CreateOgretmenBody {
  yayineviId?: string;
  ad?: string;
  kullaniciAdi?: string;
  sifre?: string;
}

interface LoginBody {
  yayineviId?: string;
  kullaniciAdi?: string;
  sifre?: string;
}

/** Section 13 #2/#4: her öğretmen kendi bearer token'ıyla kimliklenir, işini kendi onaylar. */
export function registerOgretmenRoutes(app: FastifyInstance, repo: Repository, adminToken: string): void {
  /** Admin panelinde öğretmen için giriş bilgileri (kullanıcı adı + şifre) belirlenir — token artık yalnız login sonrası üretilir, kimseye gösterilmez. */
  app.post("/ogretmen", async (req, reply) => {
    if (!requireAdmin(req, reply, adminToken)) return;
    const body = req.body as CreateOgretmenBody;
    if (!body.yayineviId || !body.ad || !body.kullaniciAdi || !body.sifre) {
      reply.code(400).send({ error: "yayineviId, ad, kullaniciAdi, sifre zorunlu" });
      return;
    }
    if (!repo.yayinevi.get(body.yayineviId)) {
      reply.code(404).send({ error: "yayinevi bulunamadı" });
      return;
    }
    if (repo.ogretmen.findCredentials(body.yayineviId, body.kullaniciAdi)) {
      reply.code(409).send({ error: "bu kullanıcı adı bu yayınevinde zaten kayıtlı" });
      return;
    }
    // Login öncesi kimsenin kullanamayacağı bir yer tutucu — token_hash NOT NULL/UNIQUE için gerekli.
    const placeholderToken = generateBearerToken();
    const ogretmen = repo.ogretmen.create(
      body.yayineviId,
      body.ad,
      body.kullaniciAdi,
      hashPassword(body.sifre),
      hashToken(placeholderToken)
    );
    reply.code(201).send({ id: ogretmen.id, ad: ogretmen.ad, kullaniciAdi: ogretmen.kullaniciAdi });
  });

  /** Öğretmen girişi — yayınevi + kullanıcı adı + şifre doğrulanır, taze bir oturum bearer token'ı döner. */
  app.post("/login", async (req, reply) => {
    const body = req.body as LoginBody;
    if (!body.yayineviId || !body.kullaniciAdi || !body.sifre) {
      reply.code(400).send({ error: "yayineviId, kullaniciAdi, sifre zorunlu" });
      return;
    }
    const cred = repo.ogretmen.findCredentials(body.yayineviId, body.kullaniciAdi);
    if (!cred || !verifyPassword(body.sifre, cred.sifreHash)) {
      reply.code(401).send({ error: "Kullanıcı adı veya şifre hatalı" });
      return;
    }
    const token = generateBearerToken();
    repo.ogretmen.rotateToken(cred.id, hashToken(token));
    const ogretmen = repo.ogretmen.get(cred.id)!;
    const yayinevi = repo.yayinevi.get(ogretmen.yayineviId);
    reply.send({
      token,
      id: ogretmen.id,
      ad: ogretmen.ad,
      yayineviId: ogretmen.yayineviId,
      yayineviAd: yayinevi?.ad ?? null,
    });
  });

  /** Öğretmenin sayfa yenilemesinde saklı token'ını doğrulaması için — web-legacy'nin giriş ekranı bunu kullanır. */
  app.get("/me", async (req, reply) => {
    const ogretmen = requireOgretmen(req, reply, repo);
    if (!ogretmen) return;
    const yayinevi = repo.yayinevi.get(ogretmen.yayineviId);
    reply.send({ id: ogretmen.id, ad: ogretmen.ad, yayineviId: ogretmen.yayineviId, yayineviAd: yayinevi?.ad ?? null });
  });
}
