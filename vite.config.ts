import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

const isLibBuild = process.env.BUILD_MODE === 'lib';

// https://vitejs.dev/config/
export default defineConfig(async (_env) => {
  const plugins = [
    react(),
    crossOriginIsolation(),
  ];

  if (isLibBuild) {
    const dts = (await import('vite-plugin-dts')).default;
    plugins.push(dts({ copyDtsFiles: true }));
  }

  const config: UserConfig = {
    server: {
      headers: {
        // This is for the backend, I think
        //
        // 'Access-Control-Allow-Origin': "*",
        // 'access-control-allow-origin': "*",
        // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        // This breaks frontend
        // 'Cross-Origin-Opener-Policy': "*",
        // 'a': 'b'
      },
      proxy: {
            '/run_acedrg': {
              target: 'http://localhost:8080',
              changeOrigin: true
            },
            '/get_cif': {
              target: 'http://localhost:8080',
              changeOrigin: true
            },
            '/ws': {
              target: 'ws://localhost:8080',
              changeOrigin: true
            }
          }
    },
    // https://sass-lang.com/documentation/breaking-changes/legacy-js-api/
    css: {
      preprocessorOptions: {
        scss: {
          importers: [
            // ...
          ],
        },
      }
    },
    plugins,
    ...(isLibBuild ? {
      build: {
        // For library builds, we prevent Vite from copying the public directory.
        // This is because the assets are copied separately in `scripts/copy-assets.mjs'.
        copyPublicDir: false,
        lib: {
          entry: 'src/lib.ts',
          formats: ['es'] as const,
          fileName: 'lhasa-ligand-builder',
        },
        rolldownOptions: {
          // Excludes React from the bundle, as it will be provided by the consumer of the library
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      }
    } : {}),
  };
  return config;
})
