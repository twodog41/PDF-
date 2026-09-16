export function safeBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'file';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(bytes < 10 * 1024 ** 2 ? 2 : 1)} MB`;
}

export function parsePageRanges(value: string, pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('页数无效');
  const pages = new Set<number>();
  const input = value.trim();
  if (!input) throw new Error('请输入页码，例如 1-3,5');

  for (const part of input.split(/[,，\s]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!range) throw new Error(`无法识别页码“${part}”`);
    const start = Number(range[1]);
    const end = Number(range[2] ?? range[1]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`页码“${part}”超出 1-${pageCount}`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }
  return [...pages];
}

export function allocateTargetBudgets(areas: number[], targetBytes: number, reserveRatio = 0.92): number[] {
  if (!areas.length || areas.some((area) => !Number.isFinite(area) || area <= 0)) throw new Error('页面尺寸无效');
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) throw new Error('目标大小无效');
  const available = Math.floor(targetBytes * reserveRatio);
  const total = areas.reduce((sum, area) => sum + area, 0);
  return areas.map((area) => Math.max(1024, Math.floor((available * area) / total)));
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
