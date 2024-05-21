# LhasaReact

Moorhen's frontend for Lhasa - web version of Coot's ligand builder


## Usage

LhasaReact can be used standalone, outside of Moorhen.

Lhasa is part of [Coot](https://github.com/pemsley/coot) and you need to compile the C++ WebAssembly module first.
Clone the repo and go to `lhasa/`.

The build procedure is very much like [Moorhen](https://github.com/moorhen-coot/Moorhen)'s:

* Run `get_sources` (download C++ dependencies)
* Run `initial_build.sh` to build all the necessary dependencies using Emscripten
* Run `build_lhasa.sh` to build Lhasa WebAssembly module
* Copy `lhasa.js`, `lhasa.worker.js` and `lhasa.wasm` from `Coot/lhasa/lhbuild/` to `LhasaReact/public`
* Your React app is ready to go (Use Vite.js to run: `npx vite serve`)
