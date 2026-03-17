# bundler_plugins/

These plugins are **for consumers of the `lhasa-ligand-builder` npm package**, not for building the library itself.

When a consumer installs the package, these plugins help them integrate Lhasa's runtime assets (`lhasa.js`, `lhasa.wasm`, `Components-inchikey.ich`, `icons/`) into their own build pipeline. The assets are sourced from this package's own `dist/assets/` directory (i.e. `node_modules/lhasa-ligand-builder/dist/assets/`) and copied into the consumer's build output.

## Files

- `vite.mjs` — Vite plugin. Copies assets on production build (`closeBundle` hook) and serves them via dev-server middleware during development.
- `webpack.cjs` — Webpack plugin. Copies assets after emit (`afterEmit` hook) and exposes a `devServerStatic()` helper for webpack-dev-server.
- `utils.mjs` — Shared constants (asset list, path to `dist/assets/`).

## Relation to the library build

The library's own build uses `scripts/copy-assets.mjs` to populate `dist/assets/`. These bundler plugins are downstream of that: they distribute those already-built assets into whatever project the consumer is building.
