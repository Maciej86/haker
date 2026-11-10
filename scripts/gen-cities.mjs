// CLI: zapisuje src/world/city/<klucz>.json z generatora (npm run gen:cities).
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateAll, serialize } from './citygen.mjs';

const dir = new URL('../src/world/city/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [k, v] of Object.entries(generateAll())) {
  const s = serialize(v);
  writeFileSync(new URL(`${k}.json`, dir), s);
  console.log(`${k}.json`.padEnd(18), (Buffer.byteLength(s) / 1024).toFixed(1), 'KB');
}
