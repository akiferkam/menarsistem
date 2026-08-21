import type { FastifyReply, FastifyRequest } from "fastify";
import type { Repository } from "../db/repository.js";
import type { Ogretmen } from "../db/types.js";
import { extractBearerToken, hashToken } from "./tokens.js";

/** Admin uçları (yayınevi/öğretmen bootstrap) — tek paylaşılan `API_ADMIN_TOKEN`. */
export function requireAdmin(req: FastifyRequest, reply: FastifyReply, adminToken: string): boolean {
  const token = extractBearerToken(req.headers.authorization);
  if (!token || token !== adminToken) {
    reply.code(401).send({ error: "Yetkisiz: geçerli admin bearer token gerekli" });
    return false;
  }
  return true;
}

/**
 * Öğretmen kimliği — bulunamazsa 401 yazıp null döner, çağıran `return` etmeli.
 * Section 13 #4/#5: bir işe erişim/onay her zaman bu öğretmenin kendi
 * yayinevi_id'siyle sınırlanır, rota katmanında ayrıca kontrol edilir.
 */
export function requireOgretmen(req: FastifyRequest, reply: FastifyReply, repo: Repository): Ogretmen | null {
  const token = extractBearerToken(req.headers.authorization);
  const ogretmen = token ? repo.ogretmen.findByTokenHash(hashToken(token)) : undefined;
  if (!ogretmen) {
    reply.code(401).send({ error: "Yetkisiz: geçerli öğretmen bearer token gerekli" });
    return null;
  }
  return ogretmen;
}
