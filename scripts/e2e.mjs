import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { chromium } from 'playwright-core';

const root = resolve(import.meta.dirname, '..');
const port = 4174;
const url = `http://127.0.0.1:${port}`;
const chromePaths = process.platform === 'win32'
  ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const executablePath = chromePaths.find(existsSync);
if (!executablePath) throw new Error('Chrome or Edge was not found; set a supported browser path in scripts/e2e.mjs');

const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  stdio: 'ignore',
});

for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch(`${url}/app.html`);
    if (response.ok) break;
  } catch {}
  await delay(100);
}

async function samplePdf(pages = 2) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < pages; index += 1) {
    const page = pdf.addPage([420, 595]);
    page.drawText(`PDF Xiaojiang test page ${index + 1}`, { x: 48, y: 520, size: 20, font });
  }
  return Buffer.from(await pdf.save());
}

async function sampleDensePdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  let seed = 123456789;
  const randomText = (length = 72) => {
    let value = '';
    for (let index = 0; index < length; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      value += String.fromCharCode(33 + (seed % 90));
    }
    return value;
  };
  for (let pageIndex = 0; pageIndex < 2; pageIndex += 1) {
    const page = pdf.addPage([420, 595]);
    for (let row = 0; row < 40; row += 1) {
      page.drawText(randomText(), { x: 14, y: 575 - row * 8, size: 5, font });
    }
  }
  pdf.setSubject(randomText(220_000));
  return Buffer.from(await pdf.save({ useObjectStreams: true }));
}

function sampleDocx() {
  const files = {
    '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>PDF Xiaojiang local DOCX preview</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>'),
  };
  return Buffer.from(zipSync(files));
}

const pdf = await samplePdf();
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFUlEQVR4nGMUjXvPgBsw4ZFjGLnSALZvAXaHj3YMAAAAAElFTkSuQmCC', 'base64');
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

async function downloadAfter(selector) {
  let download;
  try {
    [download] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), page.click(selector)]);
  } catch (error) {
    const notice = await page.locator('.notice').allInnerTexts();
    throw new Error(`No download after ${selector}. Notice: ${notice.join(' | ')}. Browser errors: ${errors.join(' | ')}`, { cause: error });
  }
  const path = await download.path();
  assert.ok(path, `Download failed: ${await download.failure()}`);
  return readFileSync(path);
}

async function captureStoreScreenshot(name) {
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.screenshot({ path: join(root, `store-assets/${name}-1280x800.png`) });
}

try {
  await page.goto(`${url}/app.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.tool-card').count(), 5);
  await page.click('[data-support]');
  assert.equal(await page.locator('#support-dialog').getAttribute('open'), '');
  assert.ok(await page.locator('#support-dialog img').evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0));
  await page.click('[data-support-close]');
  mkdirSync(join(root, 'store-assets'), { recursive: true });
  await captureStoreScreenshot('screenshot-home');

  await page.goto(`${url}/app.html?tool=merge`);
  await page.locator('#file-input').setInputFiles([
    { name: '合同正文.pdf', mimeType: 'application/pdf', buffer: pdf },
    { name: '签字附件.pdf', mimeType: 'application/pdf', buffer: await samplePdf(1) },
  ]);
  await page.waitForSelector('.page-card');
  assert.equal(await page.locator('.page-card').count(), 3);
  await captureStoreScreenshot('screenshot-merge');
  const merged = await downloadAfter('[data-action="merge"]');
  assert.equal((await PDFDocument.load(merged)).getPageCount(), 3);

  await page.goto(`${url}/app.html?tool=split`);
  await page.locator('#file-input').setInputFiles({ name: '课程讲义.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.waitForSelector('.page-card');
  await page.locator('[data-select-page="1"]').uncheck();
  const extracted = await downloadAfter('[data-action="extract"]');
  assert.equal((await PDFDocument.load(extracted)).getPageCount(), 1);

  await page.goto(`${url}/app.html?tool=compress`);
  const densePdf = await sampleDensePdf();
  assert.ok(densePdf.length > 0.1 * 1024 ** 2, 'Compression fixture must exceed the target');
  await page.locator('#file-input').setInputFiles({ name: '报名材料.pdf', mimeType: 'application/pdf', buffer: densePdf });
  await page.waitForSelector('[data-action="compress"]');
  await captureStoreScreenshot('screenshot-compress');
  await page.locator('#target-size').fill('0.1');
  const compressed = await downloadAfter('[data-action="compress"]');
  assert.equal((await PDFDocument.load(compressed)).getPageCount(), 2);
  assert.ok(compressed.length <= 0.1 * 1024 ** 2, `Compression missed the target: ${compressed.length}`);
  assert.match(await page.locator('.notice.success').innerText(), /页面图像压缩/);

  await page.goto(`${url}/app.html?tool=to-pdf`);
  await page.locator('#file-input').setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: png },
    { name: 'two.png', mimeType: 'image/png', buffer: png },
  ]);
  await page.waitForSelector('[data-action="images-to-pdf"]');
  const imagePdf = await downloadAfter('[data-action="images-to-pdf"]');
  assert.equal((await PDFDocument.load(imagePdf)).getPageCount(), 2);

  await page.goto(`${url}/app.html?tool=to-images`);
  await page.locator('#file-input').setInputFiles({ name: '产品说明.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.waitForSelector('[data-action="pdf-to-images"]');
  const imageZip = await downloadAfter('[data-action="pdf-to-images"]');
  assert.equal(Object.keys(unzipSync(imageZip)).length, 2);

  await page.goto(`${url}/app.html?tool=to-pdf`);
  await page.locator('#file-input').setInputFiles({ name: 'simple.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: sampleDocx() });
  await page.waitForSelector('[data-action="print-docx"]:not([disabled])');
  assert.match(await page.locator('#docx-preview').innerText(), /PDF Xiaojiang local DOCX preview/);

  await page.goto(`${url}/popup.html`);
  assert.equal(await page.locator('[data-tool]').count(), 5);
  assert.deepEqual(errors, []);
  console.log('E2E passed: support dialog, popup, all five tools, DOCX preview, downloads, and store screenshots.');
} finally {
  await browser.close();
  server.kill();
}
