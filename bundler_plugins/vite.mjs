import { cpSync, existsSync, createReadStream, statSync, mkdirSync } from 'fs';
import { resolve, extname } from 'path';
import { ASSETS_DIR, ASSET_ENTRIES } from './utils.mjs';

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.ich': 'application/octet-stream',
  '.svg': 'image/svg+xml',
};

/**
 * Vite plugin that copies Lhasa assets into the build output
 * and serves them during development.
 *
 * @param {Object} [options]
 * @param {string} [options.outputPath='lhasa-assets'] Sub-path within the build output where assets are placed.
 * @param {string[]} [options.assets] Which asset entries to include. Defaults to all.
 * @returns {import('vite').Plugin}
 */
export default function lhasaCopyAssets(options = {}) {
  const outputPath = options.outputPath ?? 'lhasa-assets';
  const assetFilter = options.assets ?? ASSET_ENTRIES;
  let resolvedOutDir;

  return {
    name: 'lhasa-copy-assets',

    configResolved(config) {
      resolvedOutDir = config.build.outDir;
    },

    // Dev server: serve assets directly from dist/assets/ via middleware
    configureServer(server) {
      const urlPrefix = '/' + outputPath;

      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(urlPrefix + '/')) {
          return next();
        }

        const relativePath = req.url.slice(urlPrefix.length + 1);
        const filePath = resolve(ASSETS_DIR, relativePath);

        // Prevent path traversal outside assets dir
        if (!filePath.startsWith(ASSETS_DIR)) {
          return next();
        }

        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
          return next();
        }

        const ext = extname(filePath);
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        createReadStream(filePath).pipe(res);
      });
    },

    // Production build: copy assets into the output directory
    closeBundle() {
      if (!resolvedOutDir) return;

      const destDir = resolve(resolvedOutDir, outputPath);
      mkdirSync(destDir, { recursive: true });

      for (const entry of assetFilter) {
        const src = resolve(ASSETS_DIR, entry);
        const dest = resolve(destDir, entry);
        if (!existsSync(src)) {
          console.warn(`[lhasa-copy-assets] Asset not found: ${src}`);
          continue;
        }
        cpSync(src, dest, { recursive: true });
      }

      console.log(`[lhasa-copy-assets] Copied assets to ${destDir}`);
    },
  };
}
