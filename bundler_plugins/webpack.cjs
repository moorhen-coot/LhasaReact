const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.resolve(__dirname, '..', 'dist', 'assets');

const ASSET_ENTRIES = [
  'lhasa.js',
  'lhasa.wasm',
  'Components-inchikey.ich',
  'icons',
];

/**
 * Webpack plugin that copies Lhasa assets into the build output.
 *
 * @example
 * // webpack.config.js
 * const LhasaCopyAssetsPlugin = require('lhasa-ligand-builder/lhasa-webpack-plugin');
 * module.exports = {
 *   plugins: [new LhasaCopyAssetsPlugin()],
 *   devServer: {
 *     static: [LhasaCopyAssetsPlugin.devServerStatic()],
 *   },
 * };
 */
class LhasaCopyAssetsPlugin {
  /**
   * @param {Object} [options]
   * @param {string} [options.outputPath='lhasa-assets'] Sub-path within output.path where assets are placed.
   * @param {string[]} [options.assets] Which asset entries to include. Defaults to all.
   */
  constructor(options = {}) {
    this.outputPath = options.outputPath || 'lhasa-assets';
    this.assets = options.assets || ASSET_ENTRIES;
  }

  apply(compiler) {
    const pluginName = 'LhasaCopyAssetsPlugin';

    compiler.hooks.afterEmit.tapAsync(pluginName, (compilation, callback) => {
      const outputDir = compilation.outputOptions.path;
      const destDir = path.resolve(outputDir, this.outputPath);

      try {
        fs.mkdirSync(destDir, { recursive: true });

        for (const entry of this.assets) {
          const src = path.resolve(ASSETS_DIR, entry);
          const dest = path.resolve(destDir, entry);
          if (!fs.existsSync(src)) {
            compilation.warnings.push(
              new Error(`[${pluginName}] Asset not found: ${src}`)
            );
            continue;
          }
          fs.cpSync(src, dest, { recursive: true });
        }

        console.log(`[${pluginName}] Copied assets to ${destDir}`);
      } catch (err) {
        compilation.errors.push(err);
      }

      callback();
    });
  }

  /**
   * Returns a devServer.static entry for webpack-dev-server
   * so assets are served during development.
   *
   * @param {string} [outputPath='lhasa-assets']
   * @returns {{ directory: string, publicPath: string }}
   */
  static devServerStatic(outputPath = 'lhasa-assets') {
    return {
      directory: ASSETS_DIR,
      publicPath: '/' + outputPath,
    };
  }
}

module.exports = LhasaCopyAssetsPlugin;
