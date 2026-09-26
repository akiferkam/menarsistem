import type { RotationLedger, StageCost } from "@menar/core";
import type { ApiProvider, IsDurumu, IsKaydi, Ogretmen, SoruSonucu, TopluUretim, Yayinevi } from "./types.js";

/**
 * Faz 4'te SQLite -> Postgres geçişinde yalnız `sqlite-repository.ts`
 * değişecek — geri kalan `apps/api` (rotalar, worker) bu arayüze karşı yazılır.
 */
export interface Repository {
  yayinevi: {
    create(ad: string): Yayinevi;
    get(id: string): Yayinevi | undefined;
    /** Admin ekranı için — şifreli anahtarları döndürmez, yalnız kimlik/ad. */
    list(): Yayinevi[];
    setApiKey(yayineviId: string, provider: ApiProvider, encryptedKey: string): void;
    /** Şifreli hâliyle döner — çözme işi `auth/crypto.ts`'e ait, repository şifreleme bilmez. */
    getApiKey(yayineviId: string, provider: ApiProvider): string | undefined;
    getLedger(yayineviId: string): RotationLedger;
    saveLedger(yayineviId: string, ledger: RotationLedger): void;
  };
  ogretmen: {
    create(yayineviId: string, ad: string, kullaniciAdi: string, sifreHash: string, tokenHash: string): Ogretmen;
    findByTokenHash(tokenHash: string): Ogretmen | undefined;
    /** POST /login için — bulunamazsa/şifre yoksa undefined, karşılaştırma auth/password.ts'e ait. */
    findCredentials(yayineviId: string, kullaniciAdi: string): { id: string; sifreHash: string } | undefined;
    /** Başarılı girişte oturum bearer token'ını yeniler (tek aktif oturum). */
    rotateToken(id: string, tokenHash: string): void;
    get(id: string): Ogretmen | undefined;
    /** Admin ekranı için — şifre hash'i döndürmez. */
    listByYayinevi(yayineviId: string): Ogretmen[];
  };
  is: {
    /** `revizeKaynakIsId` doluysa bu satır sıfırdan üretim değil, o işin tek turlu düzeltmesidir — bkz. IsKaydi. */
    create(args: {
      yayineviId: string;
      ogretmenId: string;
      inputJson: string;
      revizeKaynakIsId?: string;
      revizeNotu?: string;
      topluUretimId?: string;
      topluUretimSira?: number;
    }): IsKaydi;
    get(id: string): IsKaydi | undefined;
    listQueued(limit: number): IsKaydi[];
    countRunning(): number;
    countRunningByYayinevi(): Map<string, number>;
    /** QUEUED -> RUNNING atomik geçiş; başka bir tur zaten aldıysa false döner. */
    markRunning(id: string): boolean;
    setStatus(id: string, status: IsDurumu, extra?: { hataMesaji?: string; finishedAt?: string }): void;
    /** Sunucu başlangıcında önceki çökmüş process'in RUNNING bıraktığı işleri kurtarır. */
    recoverStuckRunning(): number;
    /** Sorai'ye aktarım için (bkz. bin/export-sorai.ts) — TÜM yayınevlerinden DONE/APPROVED işler. */
    listDoneOrApproved(limit: number, offset: number): IsKaydi[];
  };
  sonuc: {
    create(args: {
      isId: string;
      adayJson: string;
      kanitTablosuJson: string;
      finalKilidi: string;
      zipPath: string;
    }): SoruSonucu;
    getByIsId(isId: string): SoruSonucu | undefined;
    approve(isId: string, ogretmenId: string): void;
  };
  usage: {
    insertMany(isId: string, stages: StageCost[]): void;
  };
  topluUretim: {
    create(args: {
      yayineviId: string;
      ogretmenId: string;
      baslik?: string;
      toplamSatir: number;
    }): TopluUretim;
    get(id: string): TopluUretim | undefined;
    setDone(id: string, pdfPath: string): void;
    /** Sıraya göre (toplu_uretim_sira) — batch'in ilerleme/PDF birleştirme sırası budur. */
    listJobsFor(topluUretimId: string): IsKaydi[];
  };
}
