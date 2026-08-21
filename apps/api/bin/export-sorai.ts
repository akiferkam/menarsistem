#!/usr/bin/env node
// Sorai'ye aktarım — MAYS artık yalnız ÜRETİYOR (öğretmen/AI pipeline), Sorai
// bu betiğin ürettiği JSON'u kendi veritabanına import ediyor (bkz. proje
// notu, iki sistem 2026-08-19'da ayrıldı). MAYS'in kendi API'sinde bir
// "export" UÇ NOKTASI YOK — bu bilinçli: iki sistem network üzerinden
// birbirine BAĞIMLI olmasın, yalnız bu dosya (adım adım çalıştırılan bir CLI)
// aradaki köprü.
import { config as loadDotenv } from "dotenv";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "../db/client.js";
import { createSqliteRepository } from "../db/sqlite-repository.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
loadDotenv({ path: join(REPO_ROOT, ".env") });

const KOD_ONEKI_DERS: Record<string, string> = {
  MAT: "matematik",
  GEO: "geometri",
  FIZ: "fizik",
  KIM: "kimya",
  BIY: "biyoloji",
  TDE: "tde",
};
function dersFromKod(kod: string): string | null {
  const onek = kod.split(".")[0];
  return onek ? (KOD_ONEKI_DERS[onek] ?? null) : null;
}

interface AdaySoru {
  kok?: string;
  secenekler?: string[];
  dogru_secenek?: string;
  dogru_cevap?: string;
  cozum_adimlari?: string[];
}
interface AdayJson {
  sorular?: AdaySoru[];
}

interface SoraiExportSatiri {
  id: string;
  ders: string | null;
  kod: string;
  sinifVeyaSinav: string;
  kok: string;
  secenekler: string[];
  dogruSecenek: string | null;
  dogruCevap: string | null;
  cozumAdimlari: string[];
  iqDegeri: number | null;
}

function main(): void {
  const dbPath = process.env.MAYS_DB_PATH ?? join(REPO_ROOT, "mays.db");
  if (!existsSync(dbPath)) {
    console.error(`mays.db bulunamadı: ${dbPath}`);
    process.exit(1);
  }
  const db = openDb(dbPath);
  const repo = createSqliteRepository(db);

  const isKayitlari = repo.is.listDoneOrApproved(1000, 0);
  const satirlar: SoraiExportSatiri[] = [];

  for (const isKaydi of isKayitlari) {
    const sonuc = repo.sonuc.getByIsId(isKaydi.id);
    if (!sonuc) continue;
    let input: { kod?: string; sinifVeyaSinav?: string };
    let aday: AdayJson;
    let kanitTablosu: { satirlar?: Record<string, string> };
    try {
      input = JSON.parse(isKaydi.inputJson) as typeof input;
      aday = JSON.parse(sonuc.adayJson) as AdayJson;
      kanitTablosu = JSON.parse(sonuc.kanitTablosuJson) as typeof kanitTablosu;
    } catch {
      continue;
    }
    const kod = input.kod ?? "";
    const dersAdi = dersFromKod(kod);
    const iqMetni = kanitTablosu.satirlar?.["IQ GERÇEK SEVİYE"];
    const iqDegeriHam = iqMetni ? Number(iqMetni.match(/\d+/)?.[0]) : NaN;
    const iqDegeri = Number.isNaN(iqDegeriHam) ? null : iqDegeriHam;

    (aday.sorular ?? []).forEach((soru, i) => {
      if (!soru.kok || !soru.secenekler) return;
      satirlar.push({
        id: `${isKaydi.id}:${i}`,
        ders: dersAdi,
        kod,
        sinifVeyaSinav: input.sinifVeyaSinav ?? "",
        kok: soru.kok,
        secenekler: soru.secenekler,
        dogruSecenek: soru.dogru_secenek ?? null,
        dogruCevap: soru.dogru_cevap ?? null,
        cozumAdimlari: soru.cozum_adimlari ?? [],
        iqDegeri,
      });
    });
  }

  const outPath = process.argv[2] ?? join(REPO_ROOT, "sorai-export.json");
  writeFileSync(outPath, JSON.stringify(satirlar, null, 1), "utf8");
  console.log(`${satirlar.length} soru dışa aktarıldı: ${outPath}`);
  console.log(`Sorai'de içe aktarmak için: pnpm import-sorular ${outPath}  (sorai/ dizininde)`);
}

main();
