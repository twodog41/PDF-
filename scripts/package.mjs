import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { zipSync } from 'fflate';
import { publishableFiles } from './build-files.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const artifacts = join(root, 'artifacts');
const version = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8')).version;

mkdirSync(artifacts, { recursive: true });
for (const name of readdirSync(artifacts)) {
  if (/^pdf-xiaojiang-(?:chrome|edge)-.+\.zip$|^SHA256SUMS\.txt$/.test(name)) rmSync(join(artifacts, name));
}

const entries = {};
for (const path of publishableFiles(dist).files) {
  const name = relative(dist, path).replaceAll('\\', '/');
  entries[name] = [new Uint8Array(readFileSync(path)), { mtime: new Date('2026-01-01T00:00:00Z') }];
}
const archive = zipSync(entries, { level: 9 });
const names = [`pdf-xiaojiang-chrome-${version}.zip`, `pdf-xiaojiang-edge-${version}.zip`];
for (const name of names) writeFileSync(join(artifacts, name), archive);
const checksums = names.map((name) => `${createHash('sha256').update(readFileSync(join(artifacts, name))).digest('hex')}  ${name}`).join('\n');
writeFileSync(join(artifacts, 'SHA256SUMS.txt'), `${checksums}\n`);
console.log(`Packaged ${names.map((name) => basename(name)).join(' and ')} (${(statSync(join(artifacts, names[0])).size / 1024 / 1024).toFixed(2)} MB).`);
