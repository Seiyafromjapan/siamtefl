import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';

const root = new URL('../', import.meta.url);
const outputAssets = new URL('../dist/assets/', import.meta.url);

await build({ root: fileURLToPath(root) });
await mkdir(outputAssets, { recursive: true });
await cp(new URL('../src/app.js', import.meta.url), new URL('../dist/assets/app.js', import.meta.url));
await cp(new URL('../src/styles.css', import.meta.url), new URL('../dist/assets/site.css', import.meta.url));

console.log(`Astro output finalized at ${new URL('dist/', root).pathname}`);
