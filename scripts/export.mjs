import { chromium } from 'playwright';
import { mkdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const output = fileURLToPath(new URL('../assets/generated/', import.meta.url));
const temp = `${output}.pending/`;
const { server, url } = await serve();
let browser;
try {
  await mkdir(temp, { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const [size, width] of [['desktop', 1040], ['mobile', 480]]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2, colorScheme: theme });
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('requestfailed', request => failures.push(request.url()));
      page.on('response', response => { if (!response.ok()) failures.push(`${response.status()} ${response.url()}`); });
      // Export only local assets. A new remote dependency must be vendored first.
      await page.route('**/*', route => {
        if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
        failures.push(`Unexpected external asset: ${route.request().url()}`);
        return route.abort();
      });
      await page.goto(`${url}?theme=${theme}`, { waitUntil: 'networkidle' });
      const report = await page.evaluate(async () => {
        await Promise.all([...document.fonts].map(font => font.load()));
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
        const fonts = [...document.fonts];
        const missing = fonts.filter(font => font.status !== 'loaded').map(font => `${font.family} ${font.weight}`);
        const clippedText = [];
        const walker = document.createTreeWalker(document.querySelector('#profile-artwork'), NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          if ([...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1)) clippedText.push(node.textContent.trim());
        }
        const profile = document.querySelector('.profile').getBoundingClientRect();
        const story = document.querySelector('.interlude-story').getBoundingClientRect();
        const overlap = innerWidth <= 832 && profile.bottom > story.top + 1;
        return { missing, clippedText, overlap, overflow: document.documentElement.scrollWidth > innerWidth, height: document.querySelector('#profile-artwork').getBoundingClientRect().height };
      });
      if (failures.length || report.missing.length || report.clippedText.length || report.overlap || report.overflow) throw new Error(JSON.stringify({ failures, ...report }));
      const filename = `profile-${size}-${theme}.png`;
      await page.locator('#profile-artwork').screenshot({ path: `${temp}${filename}`, animations: 'disabled' });
      console.log(`${filename}: ${width} × ${Math.ceil(report.height)} CSS px, 2× resolution`);
      await page.close();
    }
  }
  await mkdir(output, { recursive: true });
  for (const size of ['desktop', 'mobile']) for (const theme of ['light', 'dark']) {
    const filename = `profile-${size}-${theme}.png`;
    await rename(`${temp}${filename}`, `${output}${filename}`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}
