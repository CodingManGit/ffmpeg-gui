import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

// Plugin to exclude files/folders from public directory being copied to dist
function excludeFromPublic(exclude: string[]): Plugin {
  return {
    name: 'exclude-from-public',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const outDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(outDir)) return

      exclude.forEach(item => {
        const targetPath = path.join(outDir, item)
        if (fs.existsSync(targetPath)) {
          const stat = fs.statSync(targetPath)
          if (stat.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true })
            console.log(`[Vite] Excluded directory from build: ${item}`)
          } else {
            fs.unlinkSync(targetPath)
            console.log(`[Vite] Excluded file from build: ${item}`)
          }
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    excludeFromPublic(['bin', 'command-options.json']),
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
  // Use absolute paths for production builds
  base: process.env.NODE_ENV === 'production' ? './' : '/',

  // Custom plugin to exclude bin/ and command-options.json from being copied to dist
  // These should only be in resources/ via extraResources, not in asar
  publicDir: 'public',
  assetsInclude: ['**/*.svg', '**/*.png'],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
