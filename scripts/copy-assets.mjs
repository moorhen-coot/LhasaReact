import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'public');
const dest = resolve(root, 'dist', 'assets');

console.log(`Source directory: ${src}, Destination directory: ${dest}`);

console.log('Creating destination directory...');
mkdirSync(dest, { recursive: true });

console.log('Copying lhasa.js...');
cpSync(resolve(src, 'lhasa.js'), resolve(dest, 'lhasa.js'));

console.log('Copying lhasa.wasm...');
cpSync(resolve(src, 'lhasa.wasm'), resolve(dest, 'lhasa.wasm'));

console.log('Copying Components-inchikey.ich...');
cpSync(resolve(src, 'Components-inchikey.ich'), resolve(dest, 'Components-inchikey.ich'));

console.log('Copying icons/...');
cpSync(resolve(src, 'icons'), resolve(dest, 'icons'), { recursive: true });

console.log('All assets copied to dist/assets/');
