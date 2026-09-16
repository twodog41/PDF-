export type ToolId = 'merge' | 'split' | 'compress' | 'to-pdf' | 'to-images';

export interface PageRef {
  id: string;
  fileIndex: number;
  pageIndex: number;
  label: string;
  thumbnail: string;
  selected: boolean;
}

export interface OutputFile {
  bytes: Uint8Array;
  filename: string;
  mime: string;
}

export interface CompressionResult extends OutputFile {
  reached: boolean;
  rasterized: boolean;
  originalSize: number;
}
