import { readFileSync, readdirSync } from 'node:fs';
import { join, posix, relative } from 'node:path';

export function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}

export function publishableFiles(dist) {
  const all = collectFiles(dist);
  const byName = new Map(all.map((path) => [relative(dist, path).replaceAll('\\', '/'), path]));
  const selected = new Set([...byName.keys()].filter((name) => !name.startsWith('assets/')));
  const queue = ['app.html', 'popup.html'];
  for (const name of queue) {
    const path = byName.get(name);
    if (!path) continue;
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/assets\/[A-Za-z0-9_.-]+/g)) {
      const asset = match[0];
      if (!byName.has(asset)) throw new Error(`Build references missing ${asset}`);
      if (!selected.has(asset)) {
        selected.add(asset);
        if (/\.(?:m?js|css)$/.test(asset)) queue.push(asset);
      }
    }
    for (const match of source.matchAll(/new URL\(["']([^"']+)["'],\s*import\.meta\.url\)/g)) {
      const asset = posix.normalize(posix.join(posix.dirname(name), match[1]));
      if (!byName.has(asset)) throw new Error(`Build references missing ${asset}`);
      if (!selected.has(asset)) {
        selected.add(asset);
        if (/\.(?:m?js|css)$/.test(asset)) queue.push(asset);
      }
    }
  }
  return {
    files: [...selected].sort().map((name) => byName.get(name)),
    orphanAssets: [...byName.keys()].filter((name) => name.startsWith('assets/') && !selected.has(name)),
  };
}
