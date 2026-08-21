import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { RotationLedger, StageCost } from "@menar/core";
import type { Repository } from "./repository.js";
import type { IsDurumu, IsKaydi, Ogretmen, SoruSonucu, Yayinevi } from "./types.js";

const BOS_LEDGER: RotationLedger = { son100BaglamAilesi: [], son200AileDna: [], son15GorselAilesi: [] };

interface YayineviRow {
  id: string;
  ad: string;
  created_at: string;
}
interface OgretmenRow {
  id: string;
  yayinevi_id: string;
  ad: string;
  kullanici_adi: string | null;
  created_at: string;
}
interface IsKaydiRow {
  id: string;
  yayinevi_id: string;
  ogretmen_id: string;
  status: IsDurumu;
  input_json: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  hata_mesaji: string | null;
  revize_kaynak_is_id: string | null;
  revize_notu: string | null;
}
interface SoruSonucuRow {
  id: string;
  is_id: string;
  aday_json: string;
  kanit_tablosu_json: string;
  final_kilidi: string;
  zip_path: string;
  onaylayan_ogretmen_id: string | null;
  onay_zamani: string | null;
}

const toYayinevi = (r: YayineviRow): Yayinevi => ({ id: r.id, ad: r.ad, createdAt: r.created_at });
const toOgretmen = (r: OgretmenRow): Ogretmen => ({
  id: r.id,
  yayineviId: r.yayinevi_id,
  ad: r.ad,
  kullaniciAdi: r.kullanici_adi,
  createdAt: r.created_at,
});
const toIsKaydi = (r: IsKaydiRow): IsKaydi => ({
  id: r.id,
  yayineviId: r.yayinevi_id,
  ogretmenId: r.ogretmen_id,
  status: r.status,
  inputJson: r.input_json,
  createdAt: r.created_at,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  hataMesaji: r.hata_mesaji,
  revizeKaynakIsId: r.revize_kaynak_is_id,
  revizeNotu: r.revize_notu,
});
const toSoruSonucu = (r: SoruSonucuRow): SoruSonucu => ({
  id: r.id,
  isId: r.is_id,
  adayJson: r.aday_json,
  kanitTablosuJson: r.kanit_tablosu_json,
  finalKilidi: r.final_kilidi,
  zipPath: r.zip_path,
  onaylayanOgretmenId: r.onaylayan_ogretmen_id,
  onayZamani: r.onay_zamani,
});

export function createSqliteRepository(db: Database.Database): Repository {
  return {
    yayinevi: {
      create(ad) {
        const row: YayineviRow = { id: randomUUID(), ad, created_at: new Date().toISOString() };
        db.prepare("INSERT INTO yayinevi (id, ad, created_at) VALUES (@id, @ad, @created_at)").run(row);
        return toYayinevi(row);
      },
      get(id) {
        const row = db.prepare("SELECT * FROM yayinevi WHERE id = ?").get(id) as YayineviRow | undefined;
        return row && toYayinevi(row);
      },
      list() {
        const rows = db.prepare("SELECT * FROM yayinevi ORDER BY created_at DESC").all() as YayineviRow[];
        return rows.map(toYayinevi);
      },
      setApiKey(yayineviId, provider, encryptedKey) {
        db.prepare(
          `INSERT INTO publisher_api_key (id, yayinevi_id, provider, sifreli_anahtar, created_at)
           VALUES (@id, @yayineviId, @provider, @encryptedKey, @createdAt)
           ON CONFLICT(yayinevi_id, provider) DO UPDATE SET sifreli_anahtar = excluded.sifreli_anahtar`
        ).run({ id: randomUUID(), yayineviId, provider, encryptedKey, createdAt: new Date().toISOString() });
      },
      getApiKey(yayineviId, provider) {
        const row = db
          .prepare("SELECT sifreli_anahtar FROM publisher_api_key WHERE yayinevi_id = ? AND provider = ?")
          .get(yayineviId, provider) as { sifreli_anahtar: string } | undefined;
        return row?.sifreli_anahtar;
      },
      getLedger(yayineviId) {
        const row = db.prepare("SELECT ledger_json FROM rotasyon_defteri WHERE yayinevi_id = ?").get(yayineviId) as
          | { ledger_json: string }
          | undefined;
        return row ? (JSON.parse(row.ledger_json) as RotationLedger) : BOS_LEDGER;
      },
      saveLedger(yayineviId, ledger) {
        db.prepare(
          `INSERT INTO rotasyon_defteri (yayinevi_id, ledger_json) VALUES (?, ?)
           ON CONFLICT(yayinevi_id) DO UPDATE SET ledger_json = excluded.ledger_json`
        ).run(yayineviId, JSON.stringify(ledger));
      },
    },

    ogretmen: {
      create(yayineviId, ad, kullaniciAdi, sifreHash, tokenHash) {
        const row: OgretmenRow = {
          id: randomUUID(),
          yayinevi_id: yayineviId,
          ad,
          kullanici_adi: kullaniciAdi,
          created_at: new Date().toISOString(),
        };
        db.prepare(
          `INSERT INTO ogretmen (id, yayinevi_id, ad, kullanici_adi, sifre_hash, token_hash, created_at)
           VALUES (@id, @yayinevi_id, @ad, @kullanici_adi, @sifre_hash, @token_hash, @created_at)`
        ).run({ ...row, sifre_hash: sifreHash, token_hash: tokenHash });
        return toOgretmen(row);
      },
      findByTokenHash(tokenHash) {
        const row = db.prepare("SELECT * FROM ogretmen WHERE token_hash = ?").get(tokenHash) as OgretmenRow | undefined;
        return row && toOgretmen(row);
      },
      findCredentials(yayineviId, kullaniciAdi) {
        const row = db
          .prepare("SELECT id, sifre_hash FROM ogretmen WHERE yayinevi_id = ? AND kullanici_adi = ?")
          .get(yayineviId, kullaniciAdi) as { id: string; sifre_hash: string | null } | undefined;
        return row?.sifre_hash ? { id: row.id, sifreHash: row.sifre_hash } : undefined;
      },
      rotateToken(id, tokenHash) {
        db.prepare("UPDATE ogretmen SET token_hash = ? WHERE id = ?").run(tokenHash, id);
      },
      get(id) {
        const row = db.prepare("SELECT * FROM ogretmen WHERE id = ?").get(id) as OgretmenRow | undefined;
        return row && toOgretmen(row);
      },
      listByYayinevi(yayineviId) {
        const rows = db
          .prepare("SELECT * FROM ogretmen WHERE yayinevi_id = ? ORDER BY created_at DESC")
          .all(yayineviId) as OgretmenRow[];
        return rows.map(toOgretmen);
      },
    },

    is: {
      create({ yayineviId, ogretmenId, inputJson, revizeKaynakIsId, revizeNotu }) {
        const row: IsKaydiRow = {
          id: randomUUID(),
          yayinevi_id: yayineviId,
          ogretmen_id: ogretmenId,
          status: "QUEUED",
          input_json: inputJson,
          created_at: new Date().toISOString(),
          started_at: null,
          finished_at: null,
          hata_mesaji: null,
          revize_kaynak_is_id: revizeKaynakIsId ?? null,
          revize_notu: revizeNotu ?? null,
        };
        db.prepare(
          `INSERT INTO is_kaydi (id, yayinevi_id, ogretmen_id, status, input_json, created_at, revize_kaynak_is_id, revize_notu)
           VALUES (@id, @yayinevi_id, @ogretmen_id, @status, @input_json, @created_at, @revize_kaynak_is_id, @revize_notu)`
        ).run(row);
        return toIsKaydi(row);
      },
      get(id) {
        const row = db.prepare("SELECT * FROM is_kaydi WHERE id = ?").get(id) as IsKaydiRow | undefined;
        return row && toIsKaydi(row);
      },
      listQueued(limit) {
        const rows = db
          .prepare("SELECT * FROM is_kaydi WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT ?")
          .all(limit) as IsKaydiRow[];
        return rows.map(toIsKaydi);
      },
      countRunning() {
        const row = db.prepare("SELECT COUNT(*) AS n FROM is_kaydi WHERE status = 'RUNNING'").get() as { n: number };
        return row.n;
      },
      countRunningByYayinevi() {
        const rows = db
          .prepare("SELECT yayinevi_id, COUNT(*) AS n FROM is_kaydi WHERE status = 'RUNNING' GROUP BY yayinevi_id")
          .all() as { yayinevi_id: string; n: number }[];
        return new Map(rows.map((r) => [r.yayinevi_id, r.n]));
      },
      markRunning(id) {
        const info = db
          .prepare("UPDATE is_kaydi SET status = 'RUNNING', started_at = ? WHERE id = ? AND status = 'QUEUED'")
          .run(new Date().toISOString(), id);
        return info.changes > 0;
      },
      setStatus(id, status, extra) {
        db.prepare("UPDATE is_kaydi SET status = ?, hata_mesaji = ?, finished_at = ? WHERE id = ?").run(
          status,
          extra?.hataMesaji ?? null,
          extra?.finishedAt ?? null,
          id
        );
      },
      recoverStuckRunning() {
        const info = db.prepare("UPDATE is_kaydi SET status = 'QUEUED', started_at = NULL WHERE status = 'RUNNING'").run();
        return info.changes;
      },
      listDoneOrApproved(limit, offset) {
        const rows = db
          .prepare("SELECT * FROM is_kaydi WHERE status IN ('DONE','APPROVED') ORDER BY created_at DESC LIMIT ? OFFSET ?")
          .all(limit, offset) as IsKaydiRow[];
        return rows.map(toIsKaydi);
      },
    },

    sonuc: {
      create({ isId, adayJson, kanitTablosuJson, finalKilidi, zipPath }) {
        const row: SoruSonucuRow = {
          id: randomUUID(),
          is_id: isId,
          aday_json: adayJson,
          kanit_tablosu_json: kanitTablosuJson,
          final_kilidi: finalKilidi,
          zip_path: zipPath,
          onaylayan_ogretmen_id: null,
          onay_zamani: null,
        };
        db.prepare(
          `INSERT INTO soru_sonucu (id, is_id, aday_json, kanit_tablosu_json, final_kilidi, zip_path)
           VALUES (@id, @is_id, @aday_json, @kanit_tablosu_json, @final_kilidi, @zip_path)`
        ).run(row);
        return toSoruSonucu(row);
      },
      getByIsId(isId) {
        const row = db.prepare("SELECT * FROM soru_sonucu WHERE is_id = ?").get(isId) as SoruSonucuRow | undefined;
        return row && toSoruSonucu(row);
      },
      approve(isId, ogretmenId) {
        db.prepare("UPDATE soru_sonucu SET onaylayan_ogretmen_id = ?, onay_zamani = ? WHERE is_id = ?").run(
          ogretmenId,
          new Date().toISOString(),
          isId
        );
      },
    },

    usage: {
      insertMany(isId, stages) {
        const stmt = db.prepare(
          `INSERT INTO usage_log
             (id, is_id, stage, model, text_input_tokens, text_output_tokens, image_input_tokens, image_output_tokens, image_count, usd)
           VALUES (@id, @isId, @stage, @model, @textInputTokens, @textOutputTokens, @imageInputTokens, @imageOutputTokens, @imageCount, @usd)`
        );
        const insertAll = db.transaction((rows: StageCost[]) => {
          for (const s of rows) {
            stmt.run({
              id: randomUUID(),
              isId,
              stage: s.stage,
              model: s.model,
              textInputTokens: s.usage.textInputTokens,
              textOutputTokens: s.usage.textOutputTokens,
              imageInputTokens: s.usage.imageInputTokens,
              imageOutputTokens: s.usage.imageOutputTokens,
              imageCount: s.usage.imageCount,
              usd: s.usd,
            });
          }
        });
        insertAll(stages);
      },
    },
  };
}
