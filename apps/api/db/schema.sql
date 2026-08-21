-- Faz 3 çok-kiracılı şema. Tüm birincil anahtarlar uygulama tarafında
-- crypto.randomUUID() ile üretilen TEXT id'ler — Faz 4'te Postgres'e
-- geçişte AUTOINCREMENT idiyomlarına bağımlı kalınmaması için.

CREATE TABLE IF NOT EXISTS yayinevi (
  id TEXT PRIMARY KEY,
  ad TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- .env.example'ın Faz 1 yorumunda öngördüğü tablo: "Faz 3+'ta bunlar
-- publisher_api_key tablosundan per-yayınevi çözülür". BYOK (Section 13 #3):
-- her yayınevi kendi anahtarını getirir, MENAR'da merkezi anahtar yok.
CREATE TABLE IF NOT EXISTS publisher_api_key (
  id TEXT PRIMARY KEY,
  yayinevi_id TEXT NOT NULL REFERENCES yayinevi(id),
  -- 'fal' opsiyonel: yalnız bağlam görseli üretiminde seed/img2img için
  -- (bkz. proje hafızası `menar-mays-gorsel-mimari`), openai/anthropic gibi
  -- her yayınevi için zorunlu değil.
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'fal')),
  sifreli_anahtar TEXT NOT NULL, -- AES-256-GCM, düz metin asla yazılmaz (bkz. auth/crypto.ts)
  created_at TEXT NOT NULL,
  UNIQUE (yayinevi_id, provider)
);

-- Section 13 #4: NEEDS_REVIEW'ı yalnız üreten öğretmen onaylar — ayrı bir
-- editör rolü yok, bu yüzden ogretmen'in kendisi hem üretici hem onaylayıcı.
-- kullanici_adi + sifre_hash: admin panelinde belirlenen giriş bilgileri
-- (bkz. auth/password.ts). token_hash artık "oturum" bearer token'ı — her
-- POST /login'de yeniden üretilir, admin'in gördüğü/dağıttığı bir şey değil.
CREATE TABLE IF NOT EXISTS ogretmen (
  id TEXT PRIMARY KEY,
  yayinevi_id TEXT NOT NULL REFERENCES yayinevi(id),
  ad TEXT NOT NULL,
  kullanici_adi TEXT,
  sifre_hash TEXT,
  token_hash TEXT NOT NULL UNIQUE, -- ham bearer token asla saklanmaz, yalnız sha256 hash'i
  created_at TEXT NOT NULL
);
-- idx_ogretmen_yayinevi_kullanici burada değil, db/client.ts's migrate()'te
-- oluşturulur: var olan bir mays.db'de kullanici_adi kolonu bu CREATE TABLE
-- IF NOT EXISTS ile eklenmez (ALTER TABLE migrate()'e ait), o kolon
-- oluşmadan bu index'i kurmaya çalışmak "no such column" ile patlar.

CREATE TABLE IF NOT EXISTS is_kaydi (
  id TEXT PRIMARY KEY,
  yayinevi_id TEXT NOT NULL REFERENCES yayinevi(id),
  ogretmen_id TEXT NOT NULL REFERENCES ogretmen(id),
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'NEEDS_REVIEW', 'APPROVED', 'DONE', 'FAILED')),
  input_json TEXT NOT NULL, -- JobInput (packages/core/pipeline/types.ts) birebir
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  hata_mesaji TEXT,
  -- Doldurulmuşsa bu satır sıfırdan bir üretim değil, `revize_kaynak_is_id`
  -- işinin tek turlu bir düzeltmesidir (bkz. worker.ts, pipeline/run.ts
  -- reviseJob()) — revize_notu öğretmenin kendi yazdığı ek düzeltme talebi.
  revize_kaynak_is_id TEXT REFERENCES is_kaydi(id),
  revize_notu TEXT
);
CREATE INDEX IF NOT EXISTS idx_is_kaydi_status ON is_kaydi(status, created_at);
CREATE INDEX IF NOT EXISTS idx_is_kaydi_yayinevi ON is_kaydi(yayinevi_id, status);

CREATE TABLE IF NOT EXISTS soru_sonucu (
  id TEXT PRIMARY KEY,
  is_id TEXT NOT NULL UNIQUE REFERENCES is_kaydi(id),
  aday_json TEXT NOT NULL,
  kanit_tablosu_json TEXT NOT NULL,
  final_kilidi TEXT NOT NULL,
  zip_path TEXT NOT NULL,
  onaylayan_ogretmen_id TEXT REFERENCES ogretmen(id),
  onay_zamani TEXT
);

-- apps/cli/lib/ledger-store.ts'in tek-dosyalı .mays-rotation.json'ının
-- yayınevi başına DB karşılığı — aynı RotationLedger şekli (JSON blob).
CREATE TABLE IF NOT EXISTS rotasyon_defteri (
  yayinevi_id TEXT PRIMARY KEY REFERENCES yayinevi(id),
  ledger_json TEXT NOT NULL
);

-- packages/core/llm/cost.ts'in summarizeCost()'unun kalıcı hâli — CLI'de
-- konsola yazdırılan aynı veri, burada yayınevi/iş bazında geçmişe dönük
-- sorgulanabilir (Section 13 #1: ≤$1/soru paketi hedefine karşı izlenecek).
CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  is_id TEXT NOT NULL REFERENCES is_kaydi(id),
  stage TEXT NOT NULL,
  model TEXT NOT NULL,
  text_input_tokens INTEGER NOT NULL,
  text_output_tokens INTEGER NOT NULL,
  image_input_tokens INTEGER NOT NULL,
  image_output_tokens INTEGER NOT NULL,
  image_count INTEGER NOT NULL,
  usd REAL -- NULL = PRICING tablosunda model yoktu, bkz. cost.ts
);
CREATE INDEX IF NOT EXISTS idx_usage_log_is ON usage_log(is_id);

-- Faz 4: öğrenci-yüzlü site. Öğretmen'in aksine bir yayinevi'ne BAĞLI DEĞİL —
-- B2C self-servis kayıt (testyapai.com gibi öğrenci kendi hesabını doğrudan
-- açar). Auth deseni ogretmen ile aynı (sifre_hash + token_hash, bkz.
-- auth/password.ts + auth/tokens.ts), yalnız tablo/route ayrı tutuluyor.
CREATE TABLE IF NOT EXISTS ogrenci (
  id TEXT PRIMARY KEY,
  ad TEXT NOT NULL,
  eposta TEXT NOT NULL UNIQUE,
  sifre_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  sinif TEXT,   -- '9','10','11','12','mezun' — opsiyonel
  alan TEXT,    -- 'sayisal','esit_agirlik','sozel','dil' — opsiyonel
  created_at TEXT NOT NULL
);

-- Ders Takip: öğrencinin packages/core/curriculum'daki (matematik/geometri/
-- fizik/kimya/biyoloji/tde) her resmî MEB kazanım kodu için ilerleme durumu.
-- Müfredat DB'de değil JSON'da yaşadığı için kazanim_kodu'na FK yok —
-- geçerliliği route katmanında (loadCurriculum ile) ayrıca doğrulanır.
CREATE TABLE IF NOT EXISTS ogrenci_konu_ilerleme (
  id TEXT PRIMARY KEY,
  ogrenci_id TEXT NOT NULL REFERENCES ogrenci(id),
  ders TEXT NOT NULL CHECK (ders IN ('matematik','geometri','fizik','kimya','biyoloji','tde')),
  kazanim_kodu TEXT NOT NULL,
  durum TEXT NOT NULL CHECK (durum IN ('OGRENILMEDI','TEKRAR_GEREKLI','OGRENILDI')) DEFAULT 'OGRENILMEDI',
  guncellenme_tarihi TEXT NOT NULL,
  UNIQUE (ogrenci_id, ders, kazanim_kodu)
);
CREATE INDEX IF NOT EXISTS idx_ogrenci_konu_ilerleme_ogrenci ON ogrenci_konu_ilerleme(ogrenci_id, ders);
