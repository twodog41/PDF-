import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { zipSync } from 'fflate';
import type { CompressionResult, OutputFile, PageRef } from './types';
import { allocateTargetBudgets, safeBaseName, toArrayBuffer } from './utils';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type Progress = (done: number, total: number, message: string) => void;

function friendlyPdfError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted/i.test(message)) return new Error('暂不支持加密或设有打开密码的 PDF');
  if (/invalid|format|header|xref/i.test(message)) return new Error('无法读取该 PDF，文件可能已损坏或格式不受支持');
  return error instanceof Error ? error : new Error(message);
}

async function loadPdfJs(file: File) {
  try {
    return await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      wasmUrl: new URL('../wasm/', pdfWorkerUrl).href,
    }).promise;
  } catch (error) {
    throw friendlyPdfError(error);
  }
}

async function loadPdfLib(file: File) {
  try {
    return await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  } catch (error) {
    throw friendlyPdfError(error);
  }
}

async function renderPage(page: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfJs>>['getPage']>>, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('浏览器无法创建页面画布');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return { canvas, viewport };
}

function canvasBlob(canvas: HTMLCanvasElement, type: 'image/jpeg' | 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片编码失败')), type, quality);
  });
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
}

export async function createPdfPageRefs(files: File[], onProgress?: Progress): Promise<PageRef[]> {
  const refs: PageRef[] = [];
  let completed = 0;
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    if (!file) continue;
    const pdf = await loadPdfJs(file);
    for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex + 1);
      const base = page.getViewport({ scale: 1 });
      const { canvas } = await renderPage(page, Math.min(0.28, 170 / base.width));
      const thumbnail = canvas.toDataURL('image/jpeg', 0.72);
      releaseCanvas(canvas);
      refs.push({
        id: `${fileIndex}-${pageIndex}-${crypto.randomUUID()}`,
        fileIndex,
        pageIndex,
        label: files.length > 1 ? `${safeBaseName(file.name)} · ${pageIndex + 1}` : `第 ${pageIndex + 1} 页`,
        thumbnail,
        selected: true,
      });
      completed += 1;
      onProgress?.(completed, Math.max(completed, pdf.numPages), '正在生成页面预览');
    }
    await pdf.cleanup();
  }
  return refs;
}

export async function buildPdfFromPages(files: File[], refs: PageRef[], filename: string): Promise<OutputFile> {
  if (!refs.length) throw new Error('请至少保留一页');
  const sourceDocs = await Promise.all(files.map(loadPdfLib));
  const output = await PDFDocument.create();
  for (const ref of refs) {
    const source = sourceDocs[ref.fileIndex];
    if (!source || ref.pageIndex >= source.getPageCount()) throw new Error('页面来源无效');
    const [page] = await output.copyPages(source, [ref.pageIndex]);
    if (page) output.addPage(page);
  }
  return { bytes: await output.save({ useObjectStreams: true }), filename, mime: 'application/pdf' };
}

export async function splitEveryPage(file: File, onProgress?: Progress): Promise<OutputFile> {
  const source = await loadPdfLib(file);
  const total = source.getPageCount();
  const entries: Record<string, Uint8Array> = {};
  const base = safeBaseName(file.name);
  const digits = String(total).length;
  for (let index = 0; index < total; index += 1) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [index]);
    if (page) output.addPage(page);
    entries[`${base}-${String(index + 1).padStart(digits, '0')}.pdf`] = await output.save({ useObjectStreams: true });
    onProgress?.(index + 1, total, '正在拆分页面');
  }
  return { bytes: zipSync(entries, { level: 0 }), filename: `${base}-pages.zip`, mime: 'application/zip' };
}

async function normalizedJpeg(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const maxSide = 6000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('浏览器无法处理图片');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const bytes = new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());
  releaseCanvas(canvas);
  return { bytes, width, height };
}

export async function imagesToPdf(files: File[], onProgress?: Progress): Promise<OutputFile> {
  if (!files.length) throw new Error('请选择至少一张图片');
  const output = await PDFDocument.create();
  const a4Portrait: [number, number] = [595.28, 841.89];
  const margin = 34;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) continue;
    const imageData = await normalizedJpeg(file);
    const image = await output.embedJpg(imageData.bytes);
    const landscape = imageData.width > imageData.height;
    const [pageWidth, pageHeight] = landscape ? [...a4Portrait].reverse() as [number, number] : a4Portrait;
    const ratio = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
    const width = image.width * ratio;
    const height = image.height * ratio;
    const page = output.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    onProgress?.(index + 1, files.length, '正在排版图片');
  }
  return { bytes: await output.save({ useObjectStreams: true }), filename: 'images.pdf', mime: 'application/pdf' };
}

export async function pdfToImages(
  file: File,
  format: 'jpeg' | 'png',
  dpi: number,
  onProgress?: Progress,
): Promise<OutputFile> {
  const pdf = await loadPdfJs(file);
  const base = safeBaseName(file.name);
  const entries: Record<string, Uint8Array> = {};
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const digits = String(pdf.numPages).length;
  for (let index = 0; index < pdf.numPages; index += 1) {
    const page = await pdf.getPage(index + 1);
    const { canvas } = await renderPage(page, dpi / 72);
    const blob = await canvasBlob(canvas, mime, format === 'jpeg' ? 0.9 : undefined);
    entries[`${base}-${String(index + 1).padStart(digits, '0')}.${extension}`] = new Uint8Array(await blob.arrayBuffer());
    releaseCanvas(canvas);
    onProgress?.(index + 1, pdf.numPages, '正在导出页面');
  }
  await pdf.cleanup();
  const names = Object.keys(entries);
  if (names.length === 1 && names[0]) {
    return { bytes: entries[names[0]]!, filename: names[0], mime };
  }
  return { bytes: zipSync(entries, { level: 0 }), filename: `${base}-${extension}.zip`, mime: 'application/zip' };
}

async function jpegWithinBudget(canvas: HTMLCanvasElement, budget: number): Promise<Uint8Array> {
  let low = 0.28;
  let high = 0.92;
  let best = await canvasBlob(canvas, 'image/jpeg', low);
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasBlob(canvas, 'image/jpeg', quality);
    if (blob.size <= budget) {
      best = blob;
      low = quality;
    } else {
      high = quality;
    }
  }
  return new Uint8Array(await best.arrayBuffer());
}

async function buildRasterPdf(
  source: Awaited<ReturnType<typeof loadPdfJs>>,
  scale: number,
  targetBytes: number,
  onProgress?: Progress,
): Promise<Uint8Array> {
  const pageSizes: Array<{ width: number; height: number; area: number }> = [];
  for (let index = 1; index <= source.numPages; index += 1) {
    const page = await source.getPage(index);
    const viewport = page.getViewport({ scale });
    pageSizes.push({ width: viewport.width, height: viewport.height, area: viewport.width * viewport.height });
  }
  const budgets = allocateTargetBudgets(pageSizes.map((page) => page.area), targetBytes, 0.9);
  const output = await PDFDocument.create();
  for (let index = 0; index < source.numPages; index += 1) {
    const page = await source.getPage(index + 1);
    const original = page.getViewport({ scale: 1 });
    const { canvas } = await renderPage(page, scale);
    const jpeg = await jpegWithinBudget(canvas, budgets[index] ?? 1024);
    releaseCanvas(canvas);
    const embedded = await output.embedJpg(jpeg);
    const outputPage = output.addPage([original.width, original.height]);
    outputPage.drawImage(embedded, { x: 0, y: 0, width: original.width, height: original.height });
    onProgress?.(index + 1, source.numPages, `正在压缩页面 · ${Math.round(scale * 72)} DPI`);
  }
  return output.save({ useObjectStreams: true });
}

export async function compressPdf(
  file: File,
  targetBytes: number,
  onProgress?: Progress,
): Promise<CompressionResult> {
  if (targetBytes < 64 * 1024) throw new Error('目标大小不能低于 64 KB');
  const base = safeBaseName(file.name);
  if (file.size <= targetBytes) {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()), filename: `${base}-within-target.pdf`, mime: 'application/pdf',
      reached: true, rasterized: false, originalSize: file.size,
    };
  }

  const structural = await loadPdfLib(file);
  const optimized = await structural.save({ useObjectStreams: true, addDefaultPage: false });
  if (optimized.length < file.size && optimized.length <= targetBytes) {
    return {
      bytes: optimized, filename: `${base}-compressed.pdf`, mime: 'application/pdf',
      reached: true, rasterized: false, originalSize: file.size,
    };
  }

  const source = await loadPdfJs(file);
  let best = optimized.length < file.size ? optimized : new Uint8Array(await file.arrayBuffer());
  let bestRasterized = false;
  for (const scale of [2, 1.6, 1.25, 1, 0.75, 0.55]) {
    const candidate = await buildRasterPdf(source, scale, targetBytes, onProgress);
    if (candidate.length < best.length) {
      best = candidate;
      bestRasterized = true;
    }
    if (candidate.length <= targetBytes) {
      await source.cleanup();
      return {
        bytes: candidate, filename: `${base}-compressed.pdf`, mime: 'application/pdf',
        reached: true, rasterized: true, originalSize: file.size,
      };
    }
  }
  await source.cleanup();
  return {
    bytes: best, filename: `${base}-minimum.pdf`, mime: 'application/pdf',
    reached: best.length <= targetBytes, rasterized: bestRasterized, originalSize: file.size,
  };
}

export function downloadOutput(output: OutputFile) {
  const blob = new Blob([toArrayBuffer(output.bytes)], { type: output.mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = output.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
