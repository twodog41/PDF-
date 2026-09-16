import assert from 'node:assert/strict';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const assets = resolve(root, 'dist', 'assets');
assert.equal(dirname(dirname(assets)), root, 'Refusing to clean outside the project root');
assert.equal(basename(dirname(assets)), 'dist', 'Refusing to clean an unexpected directory');
assert.equal(basename(assets), 'assets', 'Refusing to clean an unexpected directory');
if (existsSync(assets)) {
  for (const entry of readdirSync(assets, { withFileTypes: true })) {
    if (!entry.isFile()) throw new Error(`Unexpected directory in generated assets: ${entry.name}`);
    unlinkSync(resolve(assets, entry.name));
  }
}
