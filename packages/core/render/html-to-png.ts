import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

/**
 * `page-preview.ts`'in ürettiği HTML'i gerçek bir Chrome/Chromium ile
 * rasterize eder — "soru metni ve fotoğrafı birleşik tek bir PNG" isteği
 * (toplu soru PDF'i değil, tek soru önizlemesi). Section 3'ün "packages/core
 * asla HTTP/DB bilmez" kuralı burada da geçerli: bu yalnız yerel bir
 * tarayıcı süreci başlatır, ağ sunucusu veya veritabanı değil — mevcut
 * OpenAI/Anthropic SDK çağrılarıyla aynı türde bir dış I/O.
 */

function candidateChromePaths(): string[] {
  switch (process.platform) {
    case "win32":
      return [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ];
    case "darwin":
      return [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      ];
    default:
      return ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium-browser", "/usr/bin/chromium"];
  }
}

/** Chrome bulunamazsa sessizce atlamak yerine net bir hata fırlatır (Section 15 ruhu: bir aşamayı asla sessizce atlama). */
export function resolveChromeExecutable(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.MENAR_CHROME_PATH ?? env.PUPPETEER_EXECUTABLE_PATH;
  if (override) {
    if (!existsSync(override)) {
      throw new Error(`MENAR_CHROME_PATH/PUPPETEER_EXECUTABLE_PATH belirtilmiş ama dosya bulunamadı: ${override}`);
    }
    return override;
  }
  const found = candidateChromePaths().find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "Önizleme PNG'si için Chrome/Chromium bulunamadı. MENAR_CHROME_PATH ortam değişkenini kurulu " +
        "tarayıcının yoluna ayarlayın (örn. chrome.exe / google-chrome)."
    );
  }
  return found;
}

/** `page-preview.ts`'in ürettiği HTML'i, `.page` çerçevesiyle sınırlı tek bir PNG'ye dönüştürür. */
export async function renderPagePreviewPng(html: string, widthPx = 900): Promise<Buffer> {
  const executablePath = resolveChromeExecutable();
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    // deviceScaleFactor:1 (varsayılan) küçük SVG tablo/etiket metnini bulanık
    // çıkarıyordu — 2x ("retina") ekran görüntüsü aynı görsel boyutta net metin verir.
    await page.setViewport({ width: widthPx, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });
    // data: URI <img> etiketleri "load" olayından sonra da bir kare geç
    // decode olabilir; ekran görüntüsü erken alınırsa tarayıcının kırık
    // görsel ikonu yakalanır. Gerçek çözüm: tüm <img>'lerin `complete`
    // olmasını beklemek.
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    const frame = await page.$(".page");
    const shot = frame ? await frame.screenshot({ type: "png" }) : await page.screenshot({ type: "png", fullPage: true });
    return Buffer.from(shot);
  } finally {
    await browser.close();
  }
}
