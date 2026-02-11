import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the package's dist/assets/ directory. */
export const ASSETS_DIR = resolve(__dirname, '..', 'dist', 'assets');

/** Top-level entries to copy from dist/assets/. */
export const ASSET_ENTRIES = [
  'lhasa.js',
  'lhasa.wasm',
  'Components-inchikey.ich',
  'icons',
];
