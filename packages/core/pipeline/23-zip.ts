import { PassThrough } from "node:stream";
import type { InddPaket } from "./types.js";

/**
 * archiver@8 ships no type declarations, and `@types/archiver` targets the
 * old v5/v6 CJS factory-function API — incompatible with the installed
 * class-based `ZipArchive` API. `moduleResolution: "bundler"` also refuses
 * `declare module` augmentation of an already-untyped package, so the
 * import is accepted as implicitly-any here and re-typed locally via
 * `ZipArchiveInstance` instead of maintaining a full ambient shim.
 */
// @ts-expect-error archiver@8 ships no type declarations
import { ZipArchive } from "archiver";

interface ZipArchiveInstance {
  pipe(destination: NodeJS.WritableStream): unknown;
  append(source: Buffer, data: { name: string }): unknown;
  finalize(): Promise<void>;
  on(event: "error", listener: (err: Error) => void): unknown;
}

const ZipArchiveCtor = ZipArchive as new (opts: { zlib: { level: number } }) => ZipArchiveInstance;

/**
 * node "72 - ZIP Paketi"nin portu. `archiver` bir bellek içi `PassThrough`
 * akışına yazılır — hiçbir dosya sistemi erişimi yok (Section 3:
 * `packages/core` asla fs/DB bilmez); gerçek diske yazma çağıran katmanda
 * (`apps/cli`) olur, tıpkı rotasyon defteri kalıcılığı gibi.
 */
export function buildZipBuffer(paket: InddPaket): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchiveCtor({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    const out = new PassThrough();

    out.on("data", (chunk: Buffer) => chunks.push(chunk));
    out.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", (err) => reject(err));
    archive.pipe(out);

    paket.files.forEach((f) => {
      const buf = f.encoding === "base64" ? Buffer.from(f.content, "base64") : Buffer.from(f.content, "utf8");
      archive.append(buf, { name: f.name });
    });

    void archive.finalize();
  });
}
