import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { exec, spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

// Add bundled binaries directory to PATH
// Development: public/bin/
// Production: resources/bin/
function addBundledBinariesToPATH() {
  let binDir: string

  if (VITE_DEV_SERVER_URL) {
    // Development mode
    binDir = path.join(process.env.APP_ROOT, 'public', 'bin')
  } else {
    // Production mode
    binDir = path.join(process.resourcesPath, 'bin')
  }

  // Add to PATH
  const currentPath = process.env.PATH || ''
  if (!currentPath.includes(binDir)) {
    process.env.PATH = `${binDir}${path.delimiter}${currentPath}`
    console.log(`Added bundled binaries to PATH: ${binDir}`)
  }
}

// Call this early to add binaries to PATH
addBundledBinariesToPATH()

// Get command-options.json path
function getCommandOptionsPath(): string {
  if (VITE_DEV_SERVER_URL) {
    // Development mode: serve from public folder via Vite
    return 'command-options.json'
  }

  // Production mode: file is in resources directory (outside asar)
  return path.join(process.resourcesPath, 'command-options.json')
}

let win: any

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Open DevTools in development to debug
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools()
  } else {
    // Also open in production to debug loading issues
    win.webContents.openDevTools()
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // In production, load index.html from dist directory
    // Normalize path to use forward slashes for asar compatibility
    const indexPath = path.normalize(path.join(__dirname, '../dist/index.html')).replace(/\\/g, '/')
    win.loadFile(indexPath)
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

        const fullPath = path.join(dirPath, item.name)
        // Normalize the full path to use forward slashes
        const normalizedFullPath = fullPath.replace(/\\/g, '/')

        result.push({
          name: item.name,
          path: normalizedFullPath,
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
    // Return normalized home directory path
    return os.homedir().replace(/\\/g, '/')
  })

  ipcMain.handle('list-drives', async () => {
    if (process.platform !== 'win32') {
      // On Unix systems, return root
      return [{
        name: 'Root',
        path: '/',
        isDirectory: true,
        isFile: false
      }]
    }

    // On Windows, list available drives
    const drives: string[] = []
    // Windows drives are typically A-Z
    for (let i = 65; i <= 90; i++) {
      const driveLetter = String.fromCharCode(i)
      const drivePath = `${driveLetter}:\\`
      try {
        // Check if drive exists by trying to access it
        await fs.access(drivePath)
        drives.push(driveLetter)
      } catch {
        // Drive doesn't exist, skip it
      }
    }

    return drives.map(drive => ({
      name: `${drive}:`,
      path: `${drive}:/`,
      isDirectory: true,
      isFile: false
    }))
  })

  ipcMain.handle('get-parent-directory', (_event: any, currentPath: string) => {
    const parentPath = path.dirname(currentPath)
    // Normalize and prevent going above root
    const normalizedParent = parentPath.replace(/\\/g, '/')
    if (normalizedParent === currentPath) {
      return currentPath
    }
    return normalizedParent
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

  // Generic command execution handler with logging
  ipcMain.handle('execute-command', async (_event: any, command: string, args: string[]) => {
    try {
      console.log('[MAIN] ==================== Command Execution ====================')
      console.log('[MAIN] Original command:', command)
      console.log('[MAIN] Original args:', args)
      console.log('[MAIN] Platform:', process.platform)

      // Handle platform-specific commands
      let actualCommand = command
      let actualArgs = [...args]

      if (process.platform === 'win32') {
        // On Windows, convert Unix commands to Windows equivalents
        if (command === 'cp') {
          actualCommand = 'copy'
          // copy uses: copy source destination
          actualArgs = [
            actualArgs[0], // source (already has forward slashes from renderer)
            actualArgs[actualArgs.length - 1] // destination (already has forward slashes from renderer)
          ]
          console.log('[MAIN] Converted "cp" to "copy"')
        }

        // When using shell: true, we need to escape paths with spaces
        // On Windows with shell, paths with spaces need to be quoted
        actualArgs = actualArgs.map(arg => {
          // Convert forward slashes to backslashes for Windows paths
          const windowsPath = arg.replace(/\//g, '\\')
          // Quote if contains spaces
          if (windowsPath.includes(' ')) {
            return `"${windowsPath}"`
          }
          return windowsPath
        })
        console.log('[MAIN] Converted paths to Windows format')
      } else {
        // On Unix, quote arguments that contain spaces
        actualArgs = actualArgs.map(arg => {
          if (arg.includes(' ')) {
            return `"${arg}"`
          }
          return arg
        })
      }

      console.log('[MAIN] Actual command:', actualCommand)
      console.log('[MAIN] Actual args:', actualArgs)
      console.log('[MAIN] Full command:', actualCommand, actualArgs.join(' '))

      const childProcess = spawn(actualCommand, actualArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32' // Use shell on Windows for better compatibility
      })

      console.log('[MAIN] Spawned process with PID:', childProcess.pid)

      // Capture stdout and log to console
      childProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString().trim()
        if (output) {
          console.log(`[${actualCommand} stdout]: ${output}`)
        }
      })

      // Capture stderr and log to console
      childProcess.stderr.on('data', (data: Buffer) => {
        const errorOutput = data.toString().trim()
        if (errorOutput) {
          console.error(`[${actualCommand} stderr]: ${errorOutput}`)
        }
      })

      // Wait for process completion
      return new Promise((resolve, reject) => {
        childProcess.on('close', (code: number) => {
          console.log('[MAIN] Process exited with code:', code)
          console.log('[MAIN] ==================== Command Execution Complete ====================')
          if (code === 0) {
            console.log('[MAIN] ✅ Command succeeded')
            resolve(true)
          } else {
            console.error('[MAIN] ❌ Command failed with exit code:', code)
            reject(new Error(`Command failed with exit code ${code}`))
          }
        })

        childProcess.on('error', (error: Error) => {
          console.error('[MAIN] ❌ Command failed to start:', error)
          console.error('[MAIN] Error details:', {
            message: error.message,
            stack: error.stack,
            code: (error as any).code
          })
          reject(error)
        })
      })

    } catch (error) {
      console.error('[MAIN] ❌ Exception during command execution:', error)
      console.error('[MAIN] Exception details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
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

  // Get directory file names (for conflict detection)
  ipcMain.handle('get-directory-files', async (_event: any, dirPath: string) => {
    try {
      const items = await fs.readdir(dirPath)
      // Return only file names (not directories)
      const result: string[] = []
      for (const item of items) {
        const fullPath = path.join(dirPath, item)
        try {
          const stat = await fs.stat(fullPath)
          if (stat.isFile()) {
            result.push(item)
          }
        } catch {
          // Skip if can't stat
        }
      }
      return result
    } catch (error) {
      console.error('Error reading directory files:', error)
      // If directory doesn't exist, return empty array
      return []
    }
  })

  // Get command-options.json content
  ipcMain.handle('get-command-config', async () => {
    try {
      const configPath = getCommandOptionsPath()
      console.log('Loading command config from:', configPath)

      // In dev mode, try fetch from Vite dev server
      if (VITE_DEV_SERVER_URL) {
        const response = await fetch('command-options.json')
        if (response.ok) {
          const text = await response.text()
          return JSON.parse(text)
        }
      }

      // In production, read from filesystem
      const content = await fs.readFile(configPath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Error loading command config:', error)
      return { commands: {} }
    }
  })

  // Get path to a bundled binary
  ipcMain.handle('get-path-to-binary', async (_event: any, binaryName: string) => {
    try {
      let binDir: string

      if (VITE_DEV_SERVER_URL) {
        // Development mode
        binDir = path.join(process.env.APP_ROOT, 'public', 'bin')
      } else {
        // Production mode
        binDir = path.join(process.resourcesPath, 'bin')
      }

      const binaryPath = process.platform === 'win32'
        ? path.join(binDir, `${binaryName}.exe`)
        : path.join(binDir, binaryName)

      // Check if binary exists
      await fs.access(binaryPath)
      console.log(`Found binary at: ${binaryPath}`)
      return binaryPath
    } catch (error) {
      console.error(`Binary ${binaryName} not found:`, error)
      // Return null if binary doesn't exist, allowing fallback to system PATH
      return null
    }
  })

  // Get platform information
  ipcMain.handle('get-platform', async () => {
    return process.platform
  })
})
