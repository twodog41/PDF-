import type { ToolId } from './types';

export const TOOLS: Array<{
  id: ToolId;
  number: string;
  title: string;
  description: string;
  accept: string;
  multiple: boolean;
}> = [
  { id: 'merge', number: '01', title: '合并 PDF', description: '拖拽页面，按你的顺序合成', accept: '.pdf,application/pdf', multiple: true },
  { id: 'split', number: '02', title: '拆分 PDF', description: '提取指定页，或逐页打包', accept: '.pdf,application/pdf', multiple: false },
  { id: 'compress', number: '03', title: '压缩到目标大小', description: '面向 2MB、5MB、10MB 上传限制', accept: '.pdf,application/pdf', multiple: false },
  { id: 'to-pdf', number: '04', title: '转为 PDF', description: 'JPG、PNG、DOCX 本地转换', accept: '.jpg,.jpeg,.png,.docx,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document', multiple: true },
  { id: 'to-images', number: '05', title: 'PDF 转图片', description: '导出 JPG 或 PNG，自动打包', accept: '.pdf,application/pdf', multiple: false },
];

export const MAX_FILE_BYTES = 500 * 1024 * 1024;
