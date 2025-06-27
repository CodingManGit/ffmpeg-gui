import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: any

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})

app.whenReady().then(() => {
  createWindow();
  
  // IPC handlers for file system operations
  ipcMain.handle('get-directory-contents', async (_event: any, dirPath: string) => {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      const result = []
      
      for (const item of items) {
        // Skip hidden files and system files
        if (item.name.startsWith('.') && item.name !== '..') {
          continue
        }
        
        result.push({
          name: item.name,
          path: path.join(dirPath, item.name),
          isDirectory: item.isDirectory(),
          isFile: item.isFile()
        })
      }
      
      return result
    } catch (error) {
      console.error('Error reading directory:', error)
      throw new Error(`Failed to read directory: ${(error as Error).message}`)
    }
  })
  
  ipcMain.handle('get-home-directory', () => {
    return os.homedir()
  })
  
  ipcMain.handle('get-parent-directory', (_event: any, currentPath: string) => {
    const parentPath = path.dirname(currentPath)
    // Prevent going above root
    if (parentPath === currentPath) {
      return currentPath
    }
    return parentPath
  })
  
  ipcMain.handle('check-if-video-file', (_event: any, filePath: string) => {
    const videoExtensions = [
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', 
      '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts', '.vob',
      '.mpg', '.mpeg', '.divx', '.xvid', '.rm', '.rmvb', '.asf'
    ]
    const ext = path.extname(filePath).toLowerCase()
    return videoExtensions.includes(ext)
  })
  
  ipcMain.handle('get-file-stats', async (_event: any, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      return {
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      }
    } catch (error) {
      console.error('Error getting file stats:', error)
      return null
    }
  })

  // Directory selection handler
  ipcMain.handle('select-directory', async (_event: any) => {
    try {
      const result: any = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory'],
        title: 'Select Output Directory'
      })
      if (result.cancelled || !result.filePaths || result.filePaths.length === 0) {
        return null
      }
      return result.filePaths[0]
    } catch (error) {
      console.error('Error selecting directory:', error)
      return null
    }
  })

  // File copy handler (stub for ffmpeg conversion)
  ipcMain.handle('copy-file', async (_event: any, sourcePath: string, destinationPath: string) => {
    try {
      await execAsync(`cp "${sourcePath}" "${destinationPath}"`)
      return true
    } catch (error) {
      console.error('Error copying file:', error)
      return false
    }
  })

  // Ensure directory exists
  ipcMain.handle('ensure-directory', async (_event: any, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return true
    } catch (error) {
      console.error('Error creating directory:', error)
      return false
    }
  })
})
