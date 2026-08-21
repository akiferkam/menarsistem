import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");

/** Section 3: `packages/core` DB'yi hiç bilmez — bu dosya yalnız `apps/api`'ye özel. */
export function openDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync(SCHEMA_PATH, "utf8"));
  migrate(db);
  return db;
}

/**
 * `CREATE TABLE IF NOT EXISTS` yeni kolon eklemez — schema.sql'e sonradan
 * eklenen `ogretmen.kullanici_adi`/`sifre_hash` için var olan `mays.db`
 * üzerinde açık ALTER TABLE gerekiyor. Idempotent: kolon zaten varsa atlanır.
 */
function migrate(db: Database.Database): void {
  const ogretmenCols = db.prepare("PRAGMA table_info(ogretmen)").all() as { name: string }[];
  const ogretmenNames = new Set(ogretmenCols.map((c) => c.name));
  if (!ogretmenNames.has("kullanici_adi")) db.exec("ALTER TABLE ogretmen ADD COLUMN kullanici_adi TEXT");
  if (!ogretmenNames.has("sifre_hash")) db.exec("ALTER TABLE ogretmen ADD COLUMN sifre_hash TEXT");
  // Kolonlar artık kesin var (yeni DB: schema.sql'den, eski DB: yukarıdaki ALTER'dan) — index şimdi güvenle kurulur.
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_ogretmen_yayinevi_kullanici
     ON ogretmen(yayinevi_id, kullanici_adi) WHERE kullanici_adi IS NOT NULL`
  );

  const isKaydiCols = db.prepare("PRAGMA table_info(is_kaydi)").all() as { name: string }[];
  const isKaydiNames = new Set(isKaydiCols.map((c) => c.name));
  if (!isKaydiNames.has("revize_kaynak_is_id")) db.exec("ALTER TABLE is_kaydi ADD COLUMN revize_kaynak_is_id TEXT");
  if (!isKaydiNames.has("revize_notu")) db.exec("ALTER TABLE is_kaydi ADD COLUMN revize_notu TEXT");

  // SQLite CHECK kısıtları ALTER TABLE ile değiştirilemez — var olan bir
  // mays.db'de publisher_api_key.provider hâlâ eski ('openai','anthropic')
  // kısıtını taşıyorsa, 'fal' eklemek için standart SQLite "12 adım" tablo
  // yeniden kurma deseni gerekir (yeni tablo + veri kopyala + eskiyi sil +
  // yeniden adlandır). Idempotent: kısıt zaten güncelse atlanır.
  const eskiKisitVarMi = (
    db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='publisher_api_key'").get() as
      | { sql: string }
      | undefined
  )?.sql?.includes("'fal'");
  if (eskiKisitVarMi === false) {
    db.exec(`
      CREATE TABLE publisher_api_key_new (
        id TEXT PRIMARY KEY,
        yayinevi_id TEXT NOT NULL REFERENCES yayinevi(id),
        provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'fal')),
        sifreli_anahtar TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (yayinevi_id, provider)
      );
      INSERT INTO publisher_api_key_new SELECT * FROM publisher_api_key;
      DROP TABLE publisher_api_key;
      ALTER TABLE publisher_api_key_new RENAME TO publisher_api_key;
    `);
  }
}
