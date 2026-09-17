import './style.css';
import { TOOLS, MAX_FILE_BYTES } from './config';
import { printDocx, renderDocx } from './docx';
import {
  buildPdfFromPages,
  compressPdf,
  createPdfPageRefs,
  downloadOutput,
  imagesToPdf,
  pdfToImages,
  splitEveryPage,
} from './pdf';
import type { PageRef, ToolId } from './types';
import { formatBytes, parsePageRanges, safeBaseName } from './utils';

const root = document.querySelector<HTMLDivElement>('#app')!;
if (!root) throw new Error('应用挂载点不存在');

let currentTool = new URLSearchParams(location.search).get('tool') as ToolId | null;
if (!TOOLS.some((tool) => tool.id === currentTool)) currentTool = null;
let files: File[] = [];
let pageRefs: PageRef[] = [];
let busy = false;
let progress = { done: 0, total: 1, message: '' };
let notice: { type: 'success' | 'error' | 'info'; text: string } | null = null;
let objectUrls: string[] = [];
let docxReady = false;

const icon = (name: ToolId | 'shield' | 'arrow') => ({
  merge: '<path d="M8 7h8M8 12h8M8 17h8M4 7h.01M4 12h.01M4 17h.01"/>',
  split: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M12 2v20"/>',
  compress: '<path d="m8 3 4 4 4-4M12 7V1M8 21l4-4 4 4M12 17v6M3 8l4 4-4 4M7 12H1M21 8l-4 4 4 4M17 12h6"/>',
  'to-pdf': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 15h8M8 11h2M8 19h5"/>',
  'to-images': '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
}[name]);

function svg(name: Parameters<typeof icon>[0], className = '') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon(name)}</svg>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function cleanupObjectUrls() {
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls = [];
}

function setTool(tool: ToolId | null) {
  cleanupObjectUrls();
  currentTool = tool;
  files = [];
  pageRefs = [];
  docxReady = false;
  notice = null;
  const url = new URL(location.href);
  if (tool) url.searchParams.set('tool', tool); else url.searchParams.delete('tool');
  history.pushState({}, '', url);
  render();
}

function shell(content: string) {
  return `
    <header class="topbar">
      <button class="brand" data-home aria-label="返回首页">
        <img src="./icons/icon-48.png" alt="" width="38" height="38">
        <span><b>PDF小匠</b><small>LOCAL PDF TOOLS</small></span>
      </button>
      <nav class="topnav" aria-label="主要工具">
        ${TOOLS.map((tool) => `<button class="${currentTool === tool.id ? 'active' : ''}" data-tool="${tool.id}">${tool.title.replace('到目标大小', '')}</button>`).join('')}
      </nav>
      <div class="privacy-pill">${svg('shield')}<span>文件仅在本机处理</span></div>
    </header>
    <main>${content}</main>
    <footer class="site-footer">
      <span>PDF小匠 1.0</span><span>零账号 · 零上传 · 零广告</span><span>MIT 开源</span>
    </footer>`;
}

function homeView() {
  return shell(`
    <section class="hero">
      <div class="eyebrow"><span></span>为上传限制而生的本地 PDF 工具</div>
      <h1>文件不过云，<br><em>处理完就走。</em></h1>
      <p>无需登录、无需上传、没有广告。敏感文件始终留在你的电脑上。</p>
      <div class="trust-row">
        <span><b>0</b> 网站权限</span><i></i><span><b>100%</b> 本地运算</span><i></i><span><b>5</b> 个常用入口</span>
      </div>
    </section>
    <section class="tool-grid" aria-label="选择工具">
      ${TOOLS.map((tool) => `
        <button class="tool-card" data-tool="${tool.id}">
          <span class="tool-number">${tool.number}</span>
          <span class="tool-icon">${svg(tool.id)}</span>
          <strong>${tool.title}</strong>
          <small>${tool.description}</small>
          <span class="tool-go">开始处理 ${svg('arrow')}</span>
        </button>`).join('')}
    </section>
    <section class="privacy-proof">
      <div>${svg('shield')}<span><b>隐私不是一句口号</b><small>扩展不申请网站访问权限，不含统计 SDK，断网也能完成全部处理。</small></span></div>
      <span class="status-dot">网络访问：无</span>
    </section>`);
}

function dropZone(tool: NonNullable<(typeof TOOLS)[number]>) {
  const requirement = tool.id === 'to-pdf' ? '支持 JPG、PNG、DOCX；图片可多选，DOCX 请单独选择' : tool.multiple ? '支持同时选择多个 PDF' : '一次选择一个 PDF';
  return `
    <label class="drop-zone" id="drop-zone">
      <input id="file-input" type="file" accept="${tool.accept}" ${tool.multiple ? 'multiple' : ''}>
      <span class="drop-plus">+</span>
      <strong>拖放文件到这里</strong>
      <span>或点击选择文件</span>
      <small>${requirement} · 单文件最大 500 MB</small>
    </label>`;
}

function progressView() {
  const percent = Math.min(100, Math.max(2, Math.round((progress.done / Math.max(progress.total, 1)) * 100)));
  return `<div class="progress-card" role="status"><div><span>${escapeHtml(progress.message || '正在处理')}</span><b>${percent}%</b></div><progress max="100" value="${percent}"></progress><small>请保持此页面打开，文件不会离开你的电脑。</small></div>`;
}

function noticeView() {
  return notice ? `<div class="notice ${notice.type}" role="${notice.type === 'error' ? 'alert' : 'status'}">${escapeHtml(notice.text)}</div>` : '';
}

function pageGrid(selectable = false) {
  return `<div class="page-grid" id="page-grid">
    ${pageRefs.map((page, index) => `
      <article class="page-card ${selectable && !page.selected ? 'unselected' : ''}" draggable="true" data-page-index="${index}">
        <div class="page-preview"><img src="${page.thumbnail}" alt="${escapeHtml(page.label)}"></div>
        <div class="page-meta">
          ${selectable ? `<input type="checkbox" data-select-page="${index}" ${page.selected ? 'checked' : ''} aria-label="选择${escapeHtml(page.label)}">` : '<span class="drag-handle" aria-hidden="true">⠿</span>'}
          <span title="${escapeHtml(page.label)}">${escapeHtml(page.label)}</span>
          <span class="page-moves"><button data-move="up" data-index="${index}" aria-label="向前移动">←</button><button data-move="down" data-index="${index}" aria-label="向后移动">→</button></span>
        </div>
      </article>`).join('')}
  </div>`;
}

function fileSummary() {
  return `<div class="file-summary"><span>${files.length} 个文件</span><b>${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</b><button data-reset>重新选择</button></div>`;
}

function mergeWorkspace() {
  return `${fileSummary()}<div class="workspace-title"><div><h2>调整页面顺序</h2><p>拖拽缩略图，或使用方向按钮。最终按从左到右、从上到下合并。</p></div><span>${pageRefs.length} 页</span></div>${pageGrid()}<div class="action-bar"><span>页面顺序已保存于当前页面，不会上传。</span><button class="primary" data-action="merge">合并并下载</button></div>`;
}

function splitWorkspace() {
  return `${fileSummary()}<div class="workspace-title"><div><h2>选择要保留的页面</h2><p>点击缩略图复选框，或输入范围，例如 1-3,5。</p></div><span>${pageRefs.filter((page) => page.selected).length}/${pageRefs.length} 页</span></div>
    <div class="range-row"><label>页码范围<input id="page-range" value="1-${pageRefs.length}" inputmode="numeric" aria-label="页码范围"></label><button data-action="apply-range">应用范围</button><button data-action="toggle-all">反选</button></div>
    ${pageGrid(true)}
    <div class="action-bar"><button class="secondary" data-action="split-pages">每页单独打包 ZIP</button><button class="primary" data-action="extract">提取所选页面</button></div>`;
}

function compressWorkspace() {
  return `${fileSummary()}<div class="compact-workspace">
    <div class="target-panel">
      <span class="panel-kicker">TARGET SIZE</span><h2>希望压到多大？</h2><p>我们会逐页调整清晰度，并在下载前验证实际大小。</p>
      <div class="preset-row">${[2, 5, 10, 20, 25].map((size) => `<button data-target="${size}" class="${size === 5 ? 'active' : ''}">${size} MB</button>`).join('')}</div>
      <label class="target-input"><span>自定义目标</span><input id="target-size" type="number" min="0.1" step="0.1" value="5"><b>MB</b></label>
      <div class="warning"><b>可能变成图片型 PDF</b><span>强压缩会影响文字搜索、表单、链接和数字签名。普通扫描件效果最佳。</span></div>
      <button class="primary wide" data-action="compress">开始压缩</button>
    </div>
    <div class="file-facts"><span>原始文件</span><strong>${escapeHtml(files[0]?.name ?? '')}</strong><dl><div><dt>当前大小</dt><dd>${formatBytes(files[0]?.size ?? 0)}</dd></div><div><dt>处理位置</dt><dd>仅此设备</dd></div><div><dt>上传次数</dt><dd>0</dd></div></dl></div>
  </div>`;
}

function imageCards() {
  cleanupObjectUrls();
  return `<div class="image-grid">${files.map((file, index) => {
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    return `<article class="image-card" draggable="true" data-file-index="${index}"><img src="${url}" alt="${escapeHtml(file.name)}"><span><b>${index + 1}</b><small>${escapeHtml(file.name)}</small><span class="page-moves"><button data-file-move="up" data-index="${index}" aria-label="向前移动">←</button><button data-file-move="down" data-index="${index}" aria-label="向后移动">→</button></span></span></article>`;
  }).join('')}</div>`;
}

function toPdfWorkspace() {
  const isDocx = files[0]?.name.toLowerCase().endsWith('.docx');
  if (isDocx) {
    return `${fileSummary()}<div class="docx-toolbar"><div><h2>DOCX 转 PDF 预览</h2><p>复杂表格、浮动图片和特殊字体可能与 Word 略有差异，请先检查。</p></div><button class="primary" data-action="print-docx" ${docxReady ? '' : 'disabled'}>打印 / 另存为 PDF</button></div><div id="docx-preview" class="docx-preview"><div class="docx-loading">正在解析 DOCX…</div></div>`;
  }
  return `${fileSummary()}<div class="workspace-title"><div><h2>调整图片顺序</h2><p>所有图片将按 A4 页面自动适配方向并留出页边距。</p></div><span>${files.length} 页</span></div>${imageCards()}<div class="action-bar"><span>支持 JPG 和 PNG，最长边超过 6000px 时会自动缩小。</span><button class="primary" data-action="images-to-pdf">生成并下载 PDF</button></div>`;
}

function toImagesWorkspace() {
  return `${fileSummary()}<div class="compact-workspace"><div class="target-panel"><span class="panel-kicker">EXPORT PAGES</span><h2>导出页面图片</h2><p>多页 PDF 将自动打包成 ZIP。</p><div class="field-grid"><label>格式<select id="image-format"><option value="jpeg">JPG · 文件更小</option><option value="png">PNG · 更清晰</option></select></label><label>分辨率<select id="image-dpi"><option value="96">96 DPI · 屏幕</option><option value="144" selected>144 DPI · 推荐</option><option value="216">216 DPI · 高清</option></select></label></div><button class="primary wide" data-action="pdf-to-images">导出并下载</button></div><div class="file-facts"><span>源文件</span><strong>${escapeHtml(files[0]?.name ?? '')}</strong><dl><div><dt>当前大小</dt><dd>${formatBytes(files[0]?.size ?? 0)}</dd></div><div><dt>导出方式</dt><dd>逐页处理</dd></div><div><dt>上传次数</dt><dd>0</dd></div></dl></div></div>`;
}

function toolView(tool: NonNullable<(typeof TOOLS)[number]>) {
  let workspace = dropZone(tool);
  if (files.length) {
    if (tool.id === 'merge') workspace = mergeWorkspace();
    if (tool.id === 'split') workspace = splitWorkspace();
    if (tool.id === 'compress') workspace = compressWorkspace();
    if (tool.id === 'to-pdf') workspace = toPdfWorkspace();
    if (tool.id === 'to-images') workspace = toImagesWorkspace();
  }
  return shell(`<section class="tool-page"><button class="back" data-home>← 所有工具</button><div class="tool-heading"><span>${tool.number}</span><div><h1>${tool.title}</h1><p>${tool.description}</p></div></div>${noticeView()}${busy ? progressView() : workspace}</section>`);
}

function render() {
  const tool = TOOLS.find((item) => item.id === currentTool);
  root.innerHTML = tool ? toolView(tool) : homeView();
  bindCommonEvents();
  if (tool && !files.length && !busy) bindDropZone(tool);
  if (pageRefs.length) bindPageGrid();
  if (tool?.id === 'to-pdf' && files[0]?.name.toLowerCase().endsWith('.docx') && !busy && !docxReady) void mountDocxPreview(files[0]);
}

function bindCommonEvents() {
  root.querySelectorAll<HTMLElement>('[data-home]').forEach((element) => element.addEventListener('click', () => setTool(null)));
  root.querySelectorAll<HTMLElement>('[data-tool]').forEach((element) => element.addEventListener('click', () => setTool(element.dataset.tool as ToolId)));
  root.querySelectorAll<HTMLElement>('[data-reset]').forEach((element) => element.addEventListener('click', () => {
    cleanupObjectUrls(); files = []; pageRefs = []; docxReady = false; notice = null; render();
  }));
  root.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => element.addEventListener('click', () => void handleAction(element.dataset.action ?? '')));
  root.querySelectorAll<HTMLButtonElement>('[data-target]').forEach((button) => button.addEventListener('click', () => {
    root.querySelectorAll('[data-target]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const input = root.querySelector<HTMLInputElement>('#target-size');
    if (input) input.value = button.dataset.target ?? '5';
  }));
  bindFileReordering();
}

function bindDropZone(tool: NonNullable<(typeof TOOLS)[number]>) {
  const zone = root.querySelector<HTMLElement>('#drop-zone');
  const input = root.querySelector<HTMLInputElement>('#file-input');
  if (!zone || !input) return;
  input.addEventListener('change', () => void acceptFiles([...input.files ?? []], tool));
  for (const name of ['dragenter', 'dragover']) zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.add('dragging'); });
  for (const name of ['dragleave', 'drop']) zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove('dragging'); });
  zone.addEventListener('drop', (event) => void acceptFiles([...event.dataTransfer?.files ?? []], tool));
}

function validateFiles(selected: File[], tool: NonNullable<(typeof TOOLS)[number]>) {
  if (!selected.length) throw new Error('没有选择文件');
  if (selected.some((file) => file.size > MAX_FILE_BYTES)) throw new Error('单个文件不能超过 500 MB');
  if (!tool.multiple && selected.length > 1) throw new Error('这个工具一次处理一个 PDF');
  const lowerNames = selected.map((file) => file.name.toLowerCase());
  if (tool.id === 'to-pdf') {
    const docx = lowerNames.filter((name) => name.endsWith('.docx'));
    const images = lowerNames.filter((name) => /\.(jpe?g|png)$/.test(name));
    if (docx.length && selected.length !== 1) throw new Error('DOCX 请单独选择，不能与图片混合');
    if (!docx.length && images.length !== selected.length) throw new Error('仅支持 JPG、PNG 或单个 DOCX');
  } else if (lowerNames.some((name) => !name.endsWith('.pdf'))) {
    throw new Error('请选择 PDF 文件');
  }
}

async function acceptFiles(selected: File[], tool: NonNullable<(typeof TOOLS)[number]>) {
  try {
    validateFiles(selected, tool);
    files = selected;
    notice = null;
    if (tool.id === 'merge' || tool.id === 'split') {
      await runBusy('正在读取 PDF', async () => {
        pageRefs = await createPdfPageRefs(files, updateProgress);
      });
    } else {
      render();
    }
  } catch (error) {
    files = [];
    showError(error);
  }
}

function updateProgress(done: number, total: number, message: string) {
  progress = { done, total, message };
  const card = root.querySelector<HTMLElement>('.progress-card');
  if (!card) return;
  const percent = Math.min(100, Math.max(2, Math.round((done / Math.max(total, 1)) * 100)));
  const label = card.querySelector('span');
  const value = card.querySelector('b');
  const bar = card.querySelector<HTMLProgressElement>('progress');
  if (label) label.textContent = message;
  if (value) value.textContent = `${percent}%`;
  if (bar) bar.value = percent;
}

async function runBusy(message: string, operation: () => Promise<void>) {
  busy = true;
  progress = { done: 1, total: 10, message };
  render();
  try {
    await operation();
  } finally {
    busy = false;
    render();
  }
}

function showError(error: unknown) {
  notice = { type: 'error', text: error instanceof Error ? error.message : String(error) };
  busy = false;
  render();
}

function showSuccess(text: string) {
  notice = { type: 'success', text };
}

async function handleAction(action: string) {
  try {
    if (action === 'merge') {
      await runBusy('正在合并页面', async () => {
        const output = await buildPdfFromPages(files, pageRefs, 'pdf-xiaojiang-merged.pdf');
        downloadOutput(output); showSuccess(`已生成 ${formatBytes(output.bytes.length)} 的合并文件`);
      });
    }
    if (action === 'apply-range') {
      const input = root.querySelector<HTMLInputElement>('#page-range');
      const selected = new Set(parsePageRanges(input?.value ?? '', pageRefs.length));
      pageRefs.forEach((page, index) => { page.selected = selected.has(index); });
      render();
    }
    if (action === 'toggle-all') {
      pageRefs.forEach((page) => { page.selected = !page.selected; });
      render();
    }
    if (action === 'extract') {
      await runBusy('正在提取页面', async () => {
        const output = await buildPdfFromPages(files, pageRefs.filter((page) => page.selected), `${safeBaseName(files[0]?.name ?? 'file')}-selected.pdf`);
        downloadOutput(output); showSuccess(`已提取 ${pageRefs.filter((page) => page.selected).length} 页`);
      });
    }
    if (action === 'split-pages') {
      await runBusy('正在逐页拆分', async () => {
        const file = files[0]; if (!file) throw new Error('请选择 PDF');
        const output = await splitEveryPage(file, updateProgress); downloadOutput(output); showSuccess('已生成逐页 PDF 压缩包');
      });
    }
    if (action === 'compress') {
      const input = root.querySelector<HTMLInputElement>('#target-size');
      const targetMb = Number(input?.value);
      if (!Number.isFinite(targetMb) || targetMb < 0.1 || targetMb > 500) throw new Error('目标大小应在 0.1–500 MB 之间');
      await runBusy('正在分析可压缩空间', async () => {
        const file = files[0]; if (!file) throw new Error('请选择 PDF');
        const output = await compressPdf(file, targetMb * 1024 ** 2, updateProgress);
        downloadOutput(output);
        showSuccess(output.reached
          ? `已达到目标：${formatBytes(output.originalSize)} → ${formatBytes(output.bytes.length)}${output.rasterized ? '；已采用页面图像压缩' : ''}`
          : `已压至 ${formatBytes(output.bytes.length)}，但未达到 ${targetMb} MB；可尝试拆分文件`);
      });
    }
    if (action === 'images-to-pdf') {
      await runBusy('正在生成 PDF', async () => {
        const output = await imagesToPdf(files, updateProgress); downloadOutput(output); showSuccess(`已将 ${files.length} 张图片生成 PDF`);
      });
    }
    if (action === 'pdf-to-images') {
      const format = root.querySelector<HTMLSelectElement>('#image-format')?.value as 'jpeg' | 'png';
      const dpi = Number(root.querySelector<HTMLSelectElement>('#image-dpi')?.value ?? 144);
      await runBusy('正在导出页面', async () => {
        const file = files[0]; if (!file) throw new Error('请选择 PDF');
        const output = await pdfToImages(file, format, dpi, updateProgress); downloadOutput(output); showSuccess('页面图片已生成');
      });
    }
    if (action === 'print-docx') printDocx();
  } catch (error) {
    showError(error);
  }
}

function bindPageGrid() {
  root.querySelectorAll<HTMLInputElement>('[data-select-page]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const index = Number(checkbox.dataset.selectPage);
    const page = pageRefs[index];
    if (page) page.selected = checkbox.checked;
    render();
  }));
  let dragged = -1;
  root.querySelectorAll<HTMLElement>('[data-page-index]').forEach((card) => {
    card.addEventListener('dragstart', () => { dragged = Number(card.dataset.pageIndex); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (event) => event.preventDefault());
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      const target = Number(card.dataset.pageIndex);
      moveItem(pageRefs, dragged, target); render();
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => button.addEventListener('click', () => {
    const from = Number(button.dataset.index);
    moveItem(pageRefs, from, from + (button.dataset.move === 'up' ? -1 : 1)); render();
  }));
}

function bindFileReordering() {
  let dragged = -1;
  root.querySelectorAll<HTMLElement>('[data-file-index]').forEach((card) => {
    card.addEventListener('dragstart', () => { dragged = Number(card.dataset.fileIndex); });
    card.addEventListener('dragover', (event) => event.preventDefault());
    card.addEventListener('drop', (event) => { event.preventDefault(); moveItem(files, dragged, Number(card.dataset.fileIndex)); render(); });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-file-move]').forEach((button) => button.addEventListener('click', () => {
    const from = Number(button.dataset.index); moveItem(files, from, from + (button.dataset.fileMove === 'up' ? -1 : 1)); render();
  }));
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return;
  const [item] = items.splice(from, 1);
  if (item !== undefined) items.splice(to, 0, item);
}

async function mountDocxPreview(file: File) {
  const container = root.querySelector<HTMLElement>('#docx-preview');
  if (!container) return;
  try {
    await renderDocx(file, container);
    docxReady = true;
    const button = root.querySelector<HTMLButtonElement>('[data-action="print-docx"]');
    if (button) button.disabled = false;
  } catch (error) {
    showError(new Error(`DOCX 解析失败：${error instanceof Error ? error.message : String(error)}`));
  }
}

window.addEventListener('popstate', () => {
  currentTool = new URLSearchParams(location.search).get('tool') as ToolId | null;
  files = []; pageRefs = []; docxReady = false; notice = null; render();
});

render();
