import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
  ],
  // Ensure static assets are accessible
  publicDir: 'public',
  assetsInclude: ['**/*.json'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Don't copy bin/ folder to dist (to avoid duplication)
          if (assetInfo.name && assetInfo.name.includes('bin/')) {
            return null
          }
          // Don't copy command-options.json to dist (will be in resources)
          if (assetInfo.name === 'command-options.json') {
            return null
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
