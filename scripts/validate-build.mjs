import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publishableFiles } from './build-files.mjs';

const dist = new URL('../dist/', import.meta.url);
const required = ['manifest.json', 'app.html', 'popup.html', 'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png', 'support/wechat-pay.jpg', 'wasm/jbig2.wasm', 'wasm/openjpeg.wasm', 'wasm/qcms_bg.wasm'];
for (const file of required) assert.ok(existsSync(new URL(file, dist)), `Missing dist/${file}`);

const manifest = JSON.parse(readFileSync(new URL('manifest.json', dist), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, '1.0.2');
assert.ok(!manifest.permissions?.length, 'The extension must not request permissions');
assert.ok(!manifest.host_permissions?.length, 'The extension must not request host permissions');
assert.match(manifest.content_security_policy.extension_pages, /connect-src 'self'/);
assert.doesNotMatch(manifest.content_security_policy.extension_pages, /https?:/);
assert.doesNotMatch(manifest.content_security_policy.extension_pages, /worker-src[^;]*blob:/, 'Edge rejects blob: workers in extension CSP');

const { files, orphanAssets } = publishableFiles(fileURLToPath(dist));
const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
assert.ok(bytes < 30 * 1024 * 1024, `Extension is unexpectedly large: ${bytes} bytes`);
console.log(`Validated ${files.length} publishable files (${(bytes / 1024 / 1024).toFixed(2)} MB), zero permissions.${orphanAssets.length ? ` Ignored ${orphanAssets.length} stale build assets.` : ''}`);
