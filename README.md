# LhasaReact

Frontend for Lhasa - Moorhen's ligand builder: a React + WebAssembly version of Layla (Coot's ligand builder).

## Installation / embedding

There is an experimental [`lhasa-ligand-builder`](https://www.npmjs.com/package/lhasa-ligand-builder) package.

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

## Building from source

LhasaReact can be used standalone, outside of Moorhen.

Lhasa is part of [Coot](https://github.com/pemsley/coot) and you need to compile the C++ WebAssembly module first.

NOTE: All build scripts are Unix scripts. On Windows, you may need WSL.

### Building the WebAssembly module

#### Tools you will need

* Emscripten
* meson
* curl, tar, etc.

Clone the [Coot](https://github.com/pemsley/coot) repo and go to `lhasa/`.

The build procedure is very much like [Moorhen](https://github.com/moorhen-coot/Moorhen)'s:

* Run `get_sources` (download C++ dependencies)
* Run `initial_build.sh` to build all the necessary dependencies using Emscripten
* Run `build_lhasa.sh` to build the Lhasa WebAssembly module
* Copy `lhasa.js`, `lhasa.worker.js` (if it exists) and `lhasa.wasm` from `Coot/lhasa/lhbuild/` to `LhasaReact/public`

### Running LhasaReact locally

After building and copying the WebAssembly module:

```bash
npm install
npm run dev
```

### Building the library

```bash
npm run build:lib
```

This produces `dist/` with the ESM bundle, CSS, type declarations, and all WASM/icon/data assets.
