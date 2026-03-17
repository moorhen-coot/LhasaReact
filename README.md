# LhasaReact

Frontend for Lhasa - Moorhen's ligand builder: a React + WebAssembly version of Layla (Coot's ligand builder).

LhasaReact can also be used standalone, outside of Moorhen.

## Installation / embedding

There is an npm package available: [`lhasa-ligand-builder`](https://www.npmjs.com/package/lhasa-ligand-builder).
It makes it easy to embed Lhasa into your own React app!

If you're not using React, have a look at `LhasaPlainJS` on [Github](https://github.com/moorhen-coot/LhasaPlainJS) and [npm](https://www.npmjs.com/package/lhasa-ligand-builder-plainjs) - it's a vanilla JavaScript wrapper version of this library.

### Quick start

You can install the package with:

```bash
npm install lhasa-ligand-builder
```

Then, embed Lhasa via the `LhasaEmbedder` component:

```tsx
import { LhasaEmbedder } from 'lhasa-ligand-builder'
import 'lhasa-ligand-builder/style.css'

function App() {
  return <LhasaEmbedder assetsBaseUrl="/lhasa-assets/" />
}
```

### Asset setup

Lhasa requires several runtime assets (`lhasa.js`, `lhasa.wasm`, `Components-inchikey.ich`, and the `icons/` directory) to be served by your web server. Use one of the bundler plugins below to handle this automatically, or copy the assets manually.

#### Vite

```js
// vite.config.js
import lhasaCopyAssets from 'lhasa-ligand-builder/lhasa-vite-plugin'

export default {
  plugins: [lhasaCopyAssets()],
}
```

During development, the plugin serves assets via middleware. In production builds, it copies them into your output directory under `lhasa-assets/`.

#### Webpack

```js
// webpack.config.js
const LhasaCopyAssetsPlugin = require('lhasa-ligand-builder/lhasa-webpack-plugin')

module.exports = {
  plugins: [new LhasaCopyAssetsPlugin()],
  devServer: {
    static: [LhasaCopyAssetsPlugin.devServerStatic()],
  },
}
```

#### Plugin options

Both plugins accept an options object:

| Option | Default | Description |
|--------|---------|-------------|
| `outputPath` | `'lhasa-assets'` | Sub-path in the build output where assets are placed. |
| `assets` | All entries | Array of asset names to copy: `'lhasa.js'`, `'lhasa.wasm'`, `'Components-inchikey.ich'`, `'icons'`. |

```js
// vite.config.js — custom output path
lhasaCopyAssets({
  outputPath: 'static/lhasa',
  // Optional override of defaults - if you know what you are doing
  // assets: ['lhasa.js', 'lhasa.wasm'],
})

// webpack.config.js — custom output path
new LhasaCopyAssetsPlugin({
  outputPath: 'static/lhasa',
  // Optional override of defaults - if you know what you are doing
  // assets: ['lhasa.js', 'lhasa.wasm'],
})
```

Remember to update `assetsBaseUrl` on `LhasaEmbedder` to match your chosen `outputPath`:

```tsx
<LhasaEmbedder assetsBaseUrl="/static/lhasa/" />
```

#### Manual copy (fallback)

If you're not using Vite or Webpack, copy the assets from `node_modules/lhasa-ligand-builder/dist/assets/` to your public directory (e.g. `public/lhasa-assets/`).

### Cross-origin isolation

Lhasa's WASM module uses `SharedArrayBuffer`, which requires your page to be served with these HTTP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these headers, the WASM module will fail to load. 
During development with Vite, the bundled `vite-plugin-cross-origin-isolation` plugin handles this automatically.

### Advanced: using `LhasaComponent` directly

If you need full control over WASM loading (e.g. you already have a `MainModule` instance), use `LhasaComponent` directly:

```tsx
import { LhasaComponent } from 'lhasa-ligand-builder'
import 'lhasa-ligand-builder/style.css'

// `lhasaModule` is a MainModule instance you've initialized yourself
<LhasaComponent
  Lhasa={lhasaModule}
  icons_path_prefix="/path/to/icons"
  data_path_prefix="/path/to/data/"
/>
```

## Building from source (alternative)

You can also build everything from source yourself, using the `build_wasm.sh` script found in this repo.

Lhasa's C++ sources are a part of [Coot](https://github.com/pemsley/coot) and the C++ WebAssembly module needs to be compiled first.

NOTE: All build scripts are Unix scripts. On Windows, you may need WSL.

### Building the WebAssembly module

#### Tools you will need

* Emscripten
* meson
* curl, tar, etc.

Conveniently, now there is a build script: `build_wasm.sh`.
It clones the [Coot](https://github.com/pemsley/coot) repo and builds the sources found at `lhasa/` and `layla/`.

You can just simply run 
```bash
./build_wasm.sh
```
and it will do everything for you, including downloading and building all C++ dependencies.
For more options, run:
```bash
./build_wasm.sh --help
```
By default, the script will output artifacts to `wasm_build/outputs` (This is configurable with environment variables).

Then, after the build finishes, you can run:
```bash
./build_wasm.sh --install
```
in order to copy the freshly generated `lhasa.js` and `lhasa.wasm` to `LhasaReact/public` (and `lhasa.d.ts` to `LhasaReact/src/types.d.ts`)

### Running LhasaReact locally

After building and copying the WebAssembly module:

```bash
npm install
# and then
npm run dev
# or, alternatively:
npx vite serve
```

### Building the library

```bash
npm run build:lib
```

This produces `dist/` with the ESM bundle, CSS, type declarations, and all WASM/icon/data assets.

### Building the standalone demo app

```bash
npm run build
# or, if you want more options passed to vite underneath:
npm run build -- --outDir dist_dir/ --base /lhasa
```