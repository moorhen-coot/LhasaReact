// This is a Node.js script to copy all the necessary assets from the public/ directory
// to the dist/assets directory during the build process. 
// It ensures that the required files are available in the correct location for deployment. The script uses modern ES module syntax and Node.js built-in modules for file operations and path handling.

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

console.log('Copying distributable assets...');
cpSync(resolve(src, 'lhasa.js'), resolve(dest, 'lhasa.js'));
cpSync(resolve(src, 'lhasa.wasm'), resolve(dest, 'lhasa.wasm'));
cpSync(resolve(src, 'Components-inchikey.ich'), resolve(dest, 'Components-inchikey.ich'));
cpSync(resolve(src, 'icons'), resolve(dest, 'icons'), { recursive: true });

console.log('All assets copied to dist/assets/');
