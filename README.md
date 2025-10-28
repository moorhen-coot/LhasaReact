# LhasaReact

Moorhen's frontend for Lhasa - web version of Coot's ligand builder

## Installation / embedding

There is an experimental [`lhasa-ligand-builder`](https://www.npmjs.com/package/lhasa-ligand-builder) package.

You can run to install it:
`npm i lhasa-ligand-builder`

If you're lucky, this should be enough to embed Lhasa in your project.
If it doesn't work, let me know and I'll help to fix it.
In the meantime, follow the instructions below to get a working Lhasa.

## How to build and run

LhasaReact can be used standalone, outside of Moorhen.

Lhasa is part of [Coot](https://github.com/pemsley/coot) and you need to compile the C++ WebAssembly module first.

NOTE: All build scripts are Unix scripts. On Windows, you might need to use WSL or MinGW's shell (if it works with Emscripten?)

### Building WebAssembly module

#### Tools you will need

* Emscripten
* meson
* curl, tar, etc.

Clone the [Coot](https://github.com/pemsley/coot) repo and go to `lhasa/`.

The build procedure is very much like [Moorhen](https://github.com/moorhen-coot/Moorhen)'s:

* Run `get_sources` (download C++ dependencies)
* Run `initial_build.sh` to build all the necessary dependencies using Emscripten
* Run `build_lhasa.sh` to build Lhasa WebAssembly module
* Copy `lhasa.js`, `lhasa.worker.js` (if it exists) and `lhasa.wasm` from `Coot/lhasa/lhbuild/` to `LhasaReact/public`

### Running LhasaReact

After you had built and copied the WebAssembly module, you can launch LhasaReact (you'll need Node.JS / npm):

* Get JS dependencies: `npm install`
* Run `npx vite serve`
* Done!
