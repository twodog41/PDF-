import { copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'node_modules', 'pdfjs-dist', 'wasm');
const target = join(root, 'dist', 'wasm');
mkdirSync(target, { recursive: true });
for (const name of ['jbig2.wasm', 'openjpeg.wasm', 'qcms_bg.wasm']) {
  copyFileSync(join(source, name), join(target, name));
}
