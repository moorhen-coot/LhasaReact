// Wrapper for the library build. Exists so that flags like --outDir and --base
// can be forwarded to 'vite build' while also propagating the relevant values
// to post-build scripts (e.g. copy-assets.mjs) via environment variables.

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// import.meta.url — the URL of the current module file (e.g. file:///home/.../LhasaReact/scripts/build-lib.mjs)
// fileURLToPath(...) — converts that URL to a filesystem path string
// dirname(...) — strips the filename, leaving just the directory (e.g. .../scripts)
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const args = process.argv.slice(2);

// Extract --outDir and --base to expose them to post-build scripts via environment
// variables (LHASA_OUTDIR, LHASA_BASE). Both flags are also forwarded to 'vite build'
// as-is via args.join(' '). Defaults match Vite's own defaults.
function extractArg(args, flag, defaultValue) {
    for (let i = 0; i < args.length; i++) {
        if (args[i] === flag && i + 1 < args.length) return args[i + 1];
        if (args[i].startsWith(`${flag}=`)) return args[i].slice(flag.length + 1);
    }
    return defaultValue;
}

const outDir = extractArg(args, '--outDir', 'dist');
// '--base' is irrelevant for library builds
// const base   = extractArg(args, '--base',   '/');

execSync(`vite build ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, BUILD_MODE: 'lib' },
});

execSync('node scripts/copy-assets.mjs', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, LHASA_OUTDIR: outDir },
});
