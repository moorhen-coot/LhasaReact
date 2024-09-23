import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  // preview: {
  //   headers: {
  //     'Access-Control-Allow-Origin': "*",
  //     'access-control-allow-origin': "*",
  //     'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  //     'a': 'b'
  //   }
  // },
  server: {
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
  plugins: [
    react(), 
    crossOriginIsolation(),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    })
  ],
})
