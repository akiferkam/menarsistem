#!/usr/bin/env node
// Toplu (standart test) üretim betiği — kuyruk zaten eş-zamanlı çalışıyor
// (bkz. queue/worker.ts globalConcurrency/perYayineviConcurrency), ama
// öğretmen arayüzünden işler TEK TEK gönderiliyordu; N soru = N × ~10dk
// bekleme demekti. Bu betik bir liste dosyasındaki tüm soruları ARKA ARKAYA
// (bekleşmeden) /jobs'a gönderir, kuyruk onları paralel işler, betik hepsi
// bitene kadar durumlarını periyodik sorup son bir özet + zip indirmesi yapar.
import { config as loadDotenv } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
loadDotenv({ path: join(REPO_ROOT, ".env") });

interface OrtakGirdi {
  mode?: string;
  ders?: string;
  sinifVeyaSinav?: string;
  iq?: string;
  genislik?: string;
  cikti?: string;
  ciktiModu?: string;
  cevapGorunurlugu?: string;
  gorselKarari?: string;
  gorselKalitesi?: string;
  gorselBoyutu?: string;
  secenekYapisi?: string;
  soruSayisi?: number;
  tymmAlanBecerisi?: string;
  tymmEgilim?: string;
  metinUzunlugu?: string;
  [ekAlan: string]: unknown;
}
interface SoruGirdisi extends OrtakGirdi {
  kod: string;
  mikro: string;
}
interface ListeDosyasi {
  ortak?: OrtakGirdi;
  sorular: SoruGirdisi[];
}

function argDegeri(bayrak: string): string | undefined {
  const tamAd = `--${bayrak}=`;
  const bulunan = process.argv.find((a) => a.startsWith(tamAd));
  return bulunan?.slice(tamAd.length);
}

async function girisYap(base: string): Promise<string> {
  const yayineviId = argDegeri("yayineviId") ?? process.env.MAYS_YAYINEVI_ID;
  const kullaniciAdi = argDegeri("kullaniciAdi") ?? process.env.MAYS_KULLANICI_ADI;
  const sifre = argDegeri("sifre") ?? process.env.MAYS_SIFRE;
  if (!yayineviId || !kullaniciAdi || !sifre) {
    console.error(
      "Token yok. --token=... verin ya da MAYS_YAYINEVI_ID/MAYS_KULLANICI_ADI/MAYS_SIFRE " +
        "(veya --yayineviId/--kullaniciAdi/--sifre) ile giriş bilgisi sağlayın."
    );
    process.exit(1);
  }
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ yayineviId, kullaniciAdi, sifre }),
  });
  if (!res.ok) {
    console.error(`Giriş başarısız (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  const gövde = (await res.json()) as { token: string };
  return gövde.token;
}

interface GonderilenIs {
  kod: string;
  mikro: string;
  jobId: string;
  gonderimZamani: number;
}
interface IsDurumu {
  jobId: string;
  status: string;
  hataMesaji?: string | null;
  sonuc?: { finalKilidi: string; kanitTablosu: { yayinPuani?: number } } | null;
}

const BITMIS_DURUMLAR = new Set(["DONE", "NEEDS_REVIEW", "FAILED", "APPROVED"]);

async function main(): Promise<void> {
  const listeYolu = process.argv[2];
  if (!listeYolu || listeYolu.startsWith("--")) {
    console.error(
      "Kullanım: pnpm toplu-uret <liste.json> [--token=...] [--base=http://127.0.0.1:4000] [--out=<klasör>]\n" +
        "Liste dosyası şekli: { \"ortak\": {...JobInput alanları...}, \"sorular\": [{\"kod\":\"MAT.9.1.1\",\"mikro\":\"...\"}] }"
    );
    process.exit(1);
  }

  const base = argDegeri("base") ?? process.env.MAYS_API_BASE ?? "http://127.0.0.1:4000";
  const liste = JSON.parse(readFileSync(listeYolu, "utf8")) as ListeDosyasi;
  if (!liste.sorular?.length) {
    console.error("Liste dosyasında 'sorular' dizisi boş ya da yok.");
    process.exit(1);
  }

  const token = argDegeri("token") ?? process.env.MAYS_TOKEN ?? (await girisYap(base));

  const gonderilenler: GonderilenIs[] = [];
  console.log(`${liste.sorular.length} soru gönderiliyor (kuyruk paralel işleyecek)...`);
  for (const soru of liste.sorular) {
    const girdi = { ...liste.ortak, ...soru };
    const res = await fetch(`${base}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(girdi),
    });
    if (res.status !== 202) {
      console.error(`  [RED] ${soru.kod}: (${res.status}) ${await res.text()}`);
      continue;
    }
    const { jobId } = (await res.json()) as { jobId: string };
    gonderilenler.push({ kod: soru.kod, mikro: soru.mikro, jobId, gonderimZamani: Date.now() });
    console.log(`  [KUYRUKTA] ${soru.kod} -> ${jobId}`);
  }
  if (!gonderilenler.length) {
    console.error("Hiçbir iş kuyruğa alınamadı.");
    process.exit(1);
  }

  const POLL_MS = 5000;
  const MAKS_BEKLEME_MS = 45 * 60 * 1000;
  const baslangic = Date.now();
  const sonDurumlar = new Map<string, IsDurumu>();

  while (sonDurumlar.size < gonderilenler.length) {
    if (Date.now() - baslangic > MAKS_BEKLEME_MS) {
      console.error("Zaman aşımı: 45 dakikadır bitmeyen iş(ler) var, bekleme durduruldu.");
      break;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
    for (const is of gonderilenler) {
      if (sonDurumlar.has(is.jobId)) continue;
      const res = await fetch(`${base}/jobs/${is.jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) continue;
      const durum = (await res.json()) as IsDurumu;
      if (BITMIS_DURUMLAR.has(durum.status)) {
        sonDurumlar.set(is.jobId, durum);
        const gecenSn = Math.round((Date.now() - is.gonderimZamani) / 1000);
        console.log(`  [${durum.status}] ${is.kod} (${gecenSn}sn)`);
      }
    }
  }

  const outDir = argDegeri("out") ?? join(REPO_ROOT, "output-api", "toplu-" + new Date().toISOString().replace(/[:.]/g, "-"));
  mkdirSync(outDir, { recursive: true });

  console.log("\n--- ÖZET ---");
  const satirlar: string[] = ["kod\tdurum\tfinalKilidi\tyayinPuani\tjobId"];
  for (const is of gonderilenler) {
    const durum = sonDurumlar.get(is.jobId);
    if (!durum) {
      satirlar.push(`${is.kod}\tZAMAN_AŞIMI\t-\t-\t${is.jobId}`);
      continue;
    }
    const kilit = durum.sonuc?.finalKilidi ?? "-";
    const puan = durum.sonuc?.kanitTablosu?.yayinPuani ?? "-";
    satirlar.push(`${is.kod}\t${durum.status}\t${kilit}\t${puan}\t${is.jobId}`);

    if (durum.status === "DONE" || durum.status === "NEEDS_REVIEW") {
      const zipRes = await fetch(`${base}/jobs/${is.jobId}/zip`, { headers: { Authorization: `Bearer ${token}` } });
      if (zipRes.ok) {
        const buf = Buffer.from(await zipRes.arrayBuffer());
        const dosyaAdi = `${is.kod.replace(/[^\w.-]/g, "_")}_${is.jobId.slice(0, 8)}.zip`;
        writeFileSync(join(outDir, dosyaAdi), buf);
      }
    } else if (durum.status === "FAILED") {
      console.error(`  [FAILED] ${is.kod}: ${durum.hataMesaji ?? "(neden yok)"}`);
    }
  }
  console.log(satirlar.join("\n"));
  console.log(`\nZip'ler: ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
