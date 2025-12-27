# FFmpeg GUI - Technical Architecture Documentation

**Status**: 🔧 Technical
**Last Updated**: 2025-12-27
**Version**: 0.0.0 (Pre-Alpha)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [IPC Communication Layer](#ipc-communication-layer)
7. [State Management](#state-management)
8. [File System Operations](#file-system-operations)
9. [Video Processing Pipeline](#video-processing-pipeline)
10. [Security Model](#security-model)
11. [Error Handling Strategy](#error-handling-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Extension Points](#extension-points)

---

## Overview

### Purpose

This document provides a comprehensive technical overview of the FFmpeg GUI application architecture. It serves as a reference for developers, architects, and contributors who need to understand the system's design, component relationships, and data flow patterns.

### System Summary

FFmpeg GUI is a cross-platform desktop application built with Electron and Vue.js 3 that provides an intuitive interface for video file conversion. The application follows Electron's multi-process architecture, separating concerns between the main process (Node.js) and renderer process (Vue.js application).

### Key Technologies

- **Electron v30.0.1**: Cross-platform desktop framework
- **Vue.js 3**: Progressive frontend framework with Composition API
- **TypeScript**: Type-safe JavaScript throughout
- **Vite**: Fast build tool and development server
- **IPC (Inter-Process Communication)**: Secure main-renderer communication

---

## Architecture Principles

### 1. Separation of Concerns

The application strictly separates responsibilities:
- **Main Process**: System-level operations, file I/O, FFmpeg processes
- **Renderer Process**: UI rendering, user interaction, state management
- **Preload Script**: Secure API bridge with context isolation

### 2. Type Safety

TypeScript is used throughout with strict type checking:
- All components have full type definitions
- IPC interfaces are strongly typed
- No `any` types without explicit justification

### 3. Security First

Security is enforced at architectural boundaries:
- Context isolation prevents renderer access to Node.js APIs
- All system operations go through typed IPC handlers
- File paths are validated before operations
- No direct `eval` or unsafe dynamic code execution

### 4. Reactive UI State

The UI follows Vue.js 3's reactivity model:
- State is managed with `ref()` and `reactive()`
- Props flow down, events flow up
- Components are stateless where possible

### 5. Progressive Enhancement

The application is built incrementally:
- Current implementation uses stub (file copy) for FFmpeg
- Architecture supports real FFmpeg integration
- UI is prepared for progress tracking and error handling

---

## System Architecture

### Multi-Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                    FFmpeg GUI Application                   │
├──────────────────────────┬──────────────────────────────────┤
│     Main Process         │      Renderer Process            │
│     (Node.js Context)    │      (Chromium Context)          │
├──────────────────────────┼──────────────────────────────────┤
│                          │                                  │
│  ┌────────────────────┐  │  ┌──────────────────────────┐  │
│  │  BrowserWindow     │  │  │   Vue.js 3 App           │  │
│  │  Management        │  │  │                          │  │
│  └────────────────────┘  │  │  ┌────────────────────┐  │  │
│                          │  │  │  App.vue           │  │  │
│  ┌────────────────────┐  │  │  │  (Main Container)  │  │  │
│  │  IPC Handlers      │◄─┼──┼──┤                    │  │  │
│  │  - File System     │  │  │  └────────────────────┘  │  │
│  │  - FFmpeg Spawn    │  │  │           │               │  │
│  │  - Dialogs         │  │  │           ▼               │  │
│  └────────────────────┘  │  │  ┌────────────────────┐  │  │
│                          │  │  │  Components        │  │  │
│  ┌────────────────────┐  │  │  │  - FileExplorer    │  │  │
│  │  File System API   │  │  │  │  - VideoQueue      │  │  │
│  │  (fs.promises)     │  │  │  │  - Conversion...   │  │  │
│  └────────────────────┘  │  │  └────────────────────┘  │  │
│                          │  │                          │  │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │  │
│  │  FFmpeg Processes  │  │  │  │  State Management  │  │  │
│  │  (child_process)   │  │  │  │  (ref/reactive)    │  │  │
│  └────────────────────┘  │  │  └────────────────────┘  │  │
│                          │  │                          │  │
└──────────────────────────┴──────────────────────────────┘
           │                                    │
           │        IPC Communication          │
           └────────────────────────────────────┘
              (via preload.ts + contextBridge)
```

### Process Responsibilities

#### Main Process ([electron/main.ts](../electron/main.ts))

**Responsibilities:**
- Application lifecycle management (ready, quit, window-all-closed)
- BrowserWindow creation and management
- IPC handler registration and response
- File system operations (read directory, file stats, copy)
- Native dialog management (directory selection)
- FFmpeg process spawning (future)

**Key Operations:**
```typescript
// Directory traversal
get-directory-contents → Promise<FileSystemItem[]>

// File information
check-if-video-file → Promise<boolean>
get-file-stats → Promise<FileStats>

// Path manipulation
get-home-directory → Promise<string>
get-parent-directory → Promise<string>

// File operations
copy-file → Promise<boolean> (stub for ffmpeg)
ensure-directory → Promise<boolean>

// UI interactions
select-directory → Promise<string | null>
```

#### Renderer Process ([src/App.vue](../src/App.vue))

**Responsibilities:**
- UI rendering and layout
- User interaction handling
- State management (video files, processing status)
- Component orchestration
- IPC invocation from renderer

**State Management:**
```typescript
const videoFiles = ref<VideoFile[]>([])      // Video queue
const isProcessing = ref<boolean>(false)     // Processing state
const outputDirectory = ref<string>('')      // Output path
```

#### Preload Script ([electron/preload.ts](../electron/preload.ts))

**Responsibilities:**
- Context bridge setup for secure IPC
- Type-safe API exposure to renderer
- Prevent direct Node.js API access

**Exposed APIs:**
```typescript
window.fileSystemAPI  // File operations
window.ipcRenderer    // Raw IPC access (limited)
```

---

## Data Flow

### 1. Application Initialization Flow

```
┌────────────────────────────────────────────────────────────┐
│                   Application Startup                      │
└────────────────────────────────────────────────────────────┘

electron/main.ts
      │
      ├─► app.whenReady()
      │     │
      │     └─► createWindow()
      │           │
      │           ├─► new BrowserWindow()
      │           │     │
      │           │     ├─► Load preload script
      │           │     │     └─► electron/preload.ts
      │           │     │           └─► contextBridge.exposeInMainWorld()
      │           │     │
      │           │     └─► Load renderer content
      │           │           ├─► Dev: Vite dev server
      │           │           └─► Prod: dist/index.html
      │           │
      │           └─► Register IPC handlers
      │                 ├─► get-directory-contents
      │                 ├─► check-if-video-file
      │                 ├─► ... (9 handlers total)
      │
      └─► Renderer loads
            │
            └─► src/main.ts
                  └─► createApp(App.vue).mount()
                        └─► Initialize Vue components
```

### 2. File Explorer Navigation Flow

```
User Interaction (FileExplorer.vue)
      │
      ├─► User clicks directory
      │     │
      │     └─► onDirectoryClick(path)
      │           │
      │           └─► window.fileSystemAPI.getDirectoryContents(path)
      │                 │
      │                 ▼
      │           IPC Invoke (Main Process)
      │                 │
      │                 └─► ipcMain.handle('get-directory-contents')
      │                       │
      │                       ├─► fs.readdir(dirPath, { withFileTypes: true })
      │                       ├─► Filter hidden/system files
      │                       ├─► Map to FileSystemItem[]
      │                       └─► Return Promise<FileSystemItem[]>
      │                 │
      │                 ▼
      ├─► Update component state
      │     │
      │     └─► currentPath.value = path
      │           directoryItems.value = items
      │
      └─► Reactive UI update
            └─► Template re-renders with new items
```

### 3. Video Queue Addition Flow

```
User Interaction (FileExplorer.vue)
      │
      ├─► User double-clicks video file
      │     │
      │     └─► onFileDoubleClick(item)
      │           │
      │           └─► emit('add-video-file', item)
      │
      ▼
Parent Component (App.vue)
      │
      ├─► addVideoFile(file: FileSystemItem)
      │     │
      │     ├─► Check for duplicates
      │     │     └─► videoFiles.value.some(f => f.path === file.path)
      │     │
      │     ├─► Create VideoFile object
      │     │     └─► { name, path, status: 'pending' }
      │     │
      │     └─► videoFiles.value.push(videoFile)
      │
      ▼
Component Update (VideoQueue.vue)
      │
      └─► Receives updated :video-files prop
            └─► Reactive list re-renders
```

### 4. Conversion Process Flow (Current Stub)

```
User Action (ConversionSettings.vue)
      │
      ├─► User clicks "Start Conversion"
      │     │
      │     └─► emit('start-conversion', outputDir)
      │
      ▼
Parent Component (App.vue)
      │
      ├─► startConversion(outputDir: string)
      │     │
      │     ├─► isProcessing.value = true
      │     │
      │     ├─► Ensure output directory exists
      │     │     └─► window.fileSystemAPI.ensureDirectory(outputDir)
      │     │           └─► IPC → fs.mkdir(dirPath, { recursive: true })
      │     │
      │     ├─► Filter pending files
      │     │     └─► videoFiles.value.filter(f => f.status === 'pending')
      │     │
      │     └─► Process each file (for loop)
      │           │
      │           ├─► file.status = 'processing'
      │           │
      │           ├─► Generate output path
      │           │     └─► outputPath = `${outputDir}/${file.name}`
      │           │
      │           ├─► Execute stub operation
      │           │     └─► window.fileSystemAPI.copyFile(src, dest)
      │           │           └─► IPC → execAsync(`cp "${src}" "${dest}"`)
      │           │
      │           ├─► Update status based on result
      │           │     ├─► Success: file.status = 'completed'
      │           │     └─► Error: file.status = 'error'
      │           │
      │           └─► await new Promise(resolve => setTimeout(resolve, 500))
      │
      ├─► isProcessing.value = false
      │
      └─► Console: "Conversion process completed"
```

### 5. Future FFmpeg Integration Flow (Planned)

```
User clicks "Start Conversion"
      │
      ▼
Generate FFmpeg Command
      │
      ├─► Parse conversion settings (format, codec, bitrate, etc.)
      ├─► Build FFmpeg argument array
      └─► ffmpeg -i input.mp4 -c:v libx264 -b:v 5M output.mp4
      │
      ▼
Main Process Spawns FFmpeg
      │
      ├─► spawn('ffmpeg', args, { ...options })
      │     │
      │     ├─► stdout: Parse progress data
      │     ├─► stderr: Capture FFmpeg output
      │     └─► on('exit'): Handle completion
      │
      ▼
Real-time Progress Updates
      │
      ├─► Parse FFmpeg progress from stderr
      │     └─► Extract time, duration, frame, fps
      │
      ├─► Send progress via IPC event
      │     └─► win.webContents.send('conversion-progress', data)
      │
      └─► Renderer updates UI in real-time
            └─► Update progress bar, percentage, ETA
```

---

## Component Architecture

### Component Tree

```
App.vue (Root)
│
├─┬─ FileExplorer.vue
│ │
│ ├─► State:
│ │   - currentPath: string
│ │   - directoryItems: FileSystemItem[]
│ │   - navigationHistory: string[]
│ │
│ ├─► Props: (none)
│ │
│ ├─► Emits:
│ │   - add-video-file: (file: FileSystemItem) => void
│ │
│ └─► Responsibilities:
│     - Directory navigation (up, home, click)
│     - File system display
│     - Video file identification
│     - Double-click to add to queue
│
├─┬─ VideoQueue.vue
│ │
│ ├─► State: (none - pure presentation)
│ │
│ ├─► Props:
│ │   - videoFiles: VideoFile[]
│ │
│ ├─► Emits:
│ │   - remove-file: (index: number) => void
│ │   - clear-queue: () => void
│ │
│ └─► Responsibilities:
│     - Display queued video files
│     - Show file status with icons
│     - Remove individual files
│     - Clear entire queue
│
└─┬─ ConversionSettings.vue
  │
  ├─► State:
  │   - outputDirectory: string
  │   - outputDirectoryValid: boolean
  │
  ├─► Props:
  │   - videoFiles: VideoFile[]
  │   - isProcessing: boolean
  │
  ├─► Emits:
  │   - start-conversion: (outputDir: string) => void
  │   - stop-conversion: () => void
  │   - output-directory-changed: (dir: string) => void
  │
  └─► Responsibilities:
      - Output directory selection
      - Start/Stop conversion buttons
      - Display queue count
      - Validate output directory
```

### Component Communication Pattern

**Props Down, Events Up:**

```
┌─────────────────────────────────────────────┐
│              App.vue (Parent)               │
│                                             │
│  State: videoFiles, isProcessing            │
└─────────┬───────────────────┬───────────────┘
          │ Props             │ Props
          ▼                   ▼
┌──────────────────┐  ┌─────────────────────┐
│  FileExplorer    │  │  VideoQueue         │
│                  │  │                     │
│  Emits:          │  │  Emits:             │
│  add-video-file  │  │  remove-file        │
└──────────────────┘  │  clear-queue        │
                      └─────────────────────┘

          │ Props
          ▼
┌─────────────────────────────────────────┐
│     ConversionSettings                  │
│                                         │
│  Emits:                                │
│  - start-conversion                     │
│  - stop-conversion                      │
│  - output-directory-changed             │
└─────────────────────────────────────────┘
```

### Component Lifecycle

```typescript
// Each component follows Vue 3 Composition API lifecycle

onMounted(() => {
  // Component is mounted to DOM
  // Initialize default state
  // Set up initial directory for FileExplorer
})

onUpdated(() => {
  // Component has re-rendered due to reactive state change
})

onUnmounted(() => {
  // Clean up before component destruction
  // Remove event listeners, clear timers
})
```

---

## IPC Communication Layer

### IPC Handler Registration

All IPC handlers are registered in the main process during `app.whenReady()`:

```typescript
// electron/main.ts (lines 75-176)

ipcMain.handle('channel-name', async (event, ...args) => {
  // Handler implementation
  return result
})
```

### IPC Channels Reference

| Channel Name | Direction | Purpose | Return Type |
|-------------|-----------|---------|-------------|
| `get-directory-contents` | Renderer → Main | List directory contents | `Promise<FileSystemItem[]>` |
| `get-home-directory` | Renderer → Main | Get user home directory | `Promise<string>` |
| `get-parent-directory` | Renderer → Main | Get parent directory path | `Promise<string>` |
| `check-if-video-file` | Renderer → Main | Check if file is video | `Promise<boolean>` |
| `get-file-stats` | Renderer → Main | Get file metadata | `Promise<FileStats \| null>` |
| `select-directory` | Renderer → Main | Open directory dialog | `Promise<string \| null>` |
| `copy-file` | Renderer → Main | Copy file (stub) | `Promise<boolean>` |
| `ensure-directory` | Renderer → Main | Create directory if needed | `Promise<boolean>` |
| `main-process-message` | Main → Renderer | Main process ready event | `void` (event) |

### Type Safety in IPC

**Preload Script Types:**
```typescript
// electron/preload.ts

contextBridge.exposeInMainWorld('fileSystemAPI', {
  getDirectoryContents: (dirPath: string): Promise<FileSystemItem[]> =>
    ipcRenderer.invoke('get-directory-contents', dirPath),
  // ... all methods are typed
})
```

**Global Window Interface:**
```typescript
// src/types/electron.d.ts (lines 26-45)

declare global {
  interface Window {
    fileSystemAPI: {
      getDirectoryContents(dirPath: string): Promise<FileSystemItem[]>
      // ... all methods typed
    }
  }
}
```

### IPC Error Handling

```typescript
// Main Process Pattern
ipcMain.handle('operation-name', async (_event, arg) => {
  try {
    const result = await someOperation(arg)
    return { success: true, data: result }
  } catch (error) {
    console.error('Operation failed:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Renderer Process Pattern
const response = await window.fileSystemAPI.someOperation(arg)
if (!response.success) {
  // Handle error
  console.error(response.error)
}
```

---

## State Management

### Application State

State is managed at the top level in [App.vue](../src/App.vue):

```typescript
// Lines 38-40
const videoFiles = ref<VideoFile[]>([])      // Video queue
const isProcessing = ref<boolean>(false)     // Processing state
const outputDirectory = ref<string>('')      // Output path
```

### State Flow Pattern

```
┌─────────────────────────────────────────────┐
│         State Management Flow               │
└─────────────────────────────────────────────┘

1. State Definition (App.vue)
   │
   ├─► const videoFiles = ref<VideoFile[]>([])
   │
   └─► Reactive state container

2. State Mutation
   │
   ├─► Direct modification
   │   └─► videoFiles.value.push(newFile)
   │
   ├─► Filter operations
   │   └─► videoFiles.value = videoFiles.value.filter(...)
   │
   └─► Object updates
       └─► file.status = 'processing'

3. State Propagation
   │
   ├─► Pass to child via props
   │   └─► <VideoQueue :video-files="videoFiles" />
   │
   └─► Child components receive updates
       └─► Automatic re-render on change

4. State Events
   │
   ├─► Child emits event
   │   └─► emit('remove-file', index)
   │
   ├─► Parent handles event
   │   └─► removeVideoFile(index: number)
   │
   └─► Parent updates state
       └─► videoFiles.value.splice(index, 1)
```

### Reactive State Strategy

**Using `ref()` for Primitives:**
```typescript
const isProcessing = ref<boolean>(false)
// Access: isProcessing.value
```

**Using `ref()` for Arrays:**
```typescript
const videoFiles = ref<VideoFile[]>([])
// Access: videoFiles.value
// Modify: videoFiles.value.push(...)
```

**Reactive Object Updates:**
```typescript
// Object properties are reactive automatically
file.status = 'processing'  // Triggers UI update
```

### Computed State (Planned)

Future enhancements may use Vue's `computed()` for derived state:

```typescript
const pendingCount = computed(() =>
  videoFiles.value.filter(f => f.status === 'pending').length
)

const completedCount = computed(() =>
  videoFiles.value.filter(f => f.status === 'completed').length
)

const progressPercentage = computed(() => {
  const total = videoFiles.value.length
  const completed = completedCount.value
  return total > 0 ? (completed / total) * 100 : 0
})
```

---

## File System Operations

### Supported File System Operations

The application abstracts file system operations through typed APIs:

| Operation | Method | Platform | Error Handling |
|-----------|--------|----------|----------------|
| List directory | `fs.readdir()` | All | Try-catch with error throw |
| Get file stats | `fs.stat()` | All | Returns null on error |
| Copy file | `exec('cp')` | Unix-like | Returns boolean |
| Create directory | `fs.mkdir()` | All | Recursive flag |

### Video File Detection

```typescript
// electron/main.ts (lines 114-122)

const videoExtensions = [
  '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
  '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts', '.vob',
  '.mpg', '.mpeg', '.divx', '.xvid', '.rm', '.rmvb', '.asf'
]

ipcMain.handle('check-if-video-file', (_event, filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return videoExtensions.includes(ext)
})
```

### File Path Handling

**Cross-Platform Path Separators:**
```typescript
// Use path module for cross-platform compatibility
path.join(dirPath, itemName)      // Join path segments
path.dirname(filePath)            // Get parent directory
path.extname(filePath)            // Get file extension
```

**Path Validation (Planned):**
```typescript
// Future: Add path validation
function validatePath(userPath: string): boolean {
  const resolved = path.resolve(userPath)
  // Check for directory traversal
  // Check for invalid characters
  // Verify path exists
  return true
}
```

### Directory Navigation Strategy

```typescript
// Navigation state in FileExplorer.vue

const currentPath = ref<string>(await getHomeDirectory())
const navigationHistory = ref<string[]>([])

// Navigate to directory
const navigateToDirectory = async (dirPath: string) => {
  navigationHistory.value.push(currentPath.value)
  currentPath.value = dirPath
  await loadDirectoryContents(dirPath)
}

// Navigate to parent
const navigateUp = async () => {
  const parentPath = await window.fileSystemAPI.getParentDirectory(currentPath.value)
  if (parentPath !== currentPath.value) {
    navigateToDirectory(parentPath)
  }
}

// Navigate to home
const navigateHome = async () => {
  navigationHistory.value = []
  const homePath = await window.fileSystemAPI.getHomeDirectory()
  navigateToDirectory(homePath)
}
```

---

## Video Processing Pipeline

### Current Implementation (Stub)

The current implementation uses file copying as a stub for video conversion:

```typescript
// electron/main.ts (lines 157-165)

ipcMain.handle('copy-file', async (_event, sourcePath, destinationPath) => {
  try {
    await execAsync(`cp "${sourcePath}" "${destinationPath}"`)
    return true
  } catch (error) {
    console.error('Error copying file:', error)
    return false
  }
})
```

**Why a Stub?**
- Allows UI development before FFmpeg integration
- Tests IPC communication patterns
- Validates file system operations
- Provides a placeholder for the conversion pipeline

### Future FFmpeg Integration Architecture

**Planned Components:**

1. **FFmpeg Service Module** (New)
   ```typescript
   // electron/services/ffmpeg.ts
   export class FFmpegService {
     async convert(config: ConversionConfig): Promise<ConversionResult>
     spawnProcess(input: string, output: string, args: string[]): ChildProcess
     parseProgress(stderr: string): ProgressData
   }
   ```

2. **Progress Tracking System** (New)
   ```typescript
   // electron/handlers/progress.ts
   interface ProgressData {
     currentTime: number      // Current timestamp in video
     duration: number         // Total video duration
     percentage: number       // 0-100
     fps: number              // Current processing speed
     bitrate: number          // Current bitrate
   }

   // Send progress to renderer
   win.webContents.send('conversion-progress', progressData)
   ```

3. **Command Builder** (New)
   ```typescript
   // electron/utils/ffmpeg-command-builder.ts
   export class FFmpegCommandBuilder {
     withInput(path: string): this
     withVideoCodec(codec: string): this
     withAudioCodec(codec: string): this
     withBitrate(bitrate: string): this
     withResolution(width: number, height: number): this
     withOutput(path: string): this
     build(): string[]
   }
   ```

### Conversion Workflow (Future)

```
┌─────────────────────────────────────────────────────────────┐
│              FFmpeg Conversion Workflow                     │
└─────────────────────────────────────────────────────────────┘

User starts conversion
      │
      ▼
1. Parse Conversion Settings
      ├─► Output format (mp4, mkv, avi, etc.)
      ├─► Video codec (h264, h265, vp9, etc.)
      ├─► Audio codec (aac, mp3, opus, etc.)
      ├─► Bitrate settings
      ├─► Resolution scaling
      └─► Additional filters
      │
      ▼
2. Build FFmpeg Command
      ├─► FFmpegCommandBuilder
      │     ├─► .withInput(inputPath)
      │     ├─► .withVideoCodec('libx264')
      │     ├─► .withBitrate('5M')
      │     └─► .withOutput(outputPath)
      │
      └─► Build args array
            └─► ['ffmpeg', '-i', 'input.mp4', '-c:v', 'libx264', ...]
      │
      ▼
3. Spawn FFmpeg Process
      ├─► spawn('ffmpeg', args)
      │     ├─► stdout: Parse progress
      │     ├─► stderr: Capture FFmpeg output
      │     └─► on('exit'): Handle completion
      │
      └─► Store process reference
            └─► Allow cancellation
      │
      ▼
4. Monitor Progress (Real-time)
      ├─► Parse stderr for progress
      │     └─► Regex: /time=(\d{2}):(\d{2}):(\d{2})/
      │
      ├─► Calculate percentage
      │     └─► (currentTime / duration) * 100
      │
      └─► Send to renderer
            └─► win.webContents.send('conversion-progress', data)
      │
      ▼
5. Handle Completion
      ├─► Process exits with code 0
      │     └─► Success: Update file status to 'completed'
      │
      ├─► Process exits with non-zero code
      │     └─► Error: Update file status to 'error'
      │
      └─► Move to next file in queue
```

### Error Handling in Conversion

```typescript
// Future error handling pattern

try {
  await convertFile(inputPath, outputPath, settings)
  file.status = 'completed'
} catch (error) {
  file.status = 'error'
  file.error = (error as Error).message

  // Categorize errors
  if (error.message.includes('Permission denied')) {
    showError('Cannot write to output directory. Check permissions.')
  } else if (error.message.includes('Invalid data')) {
    showError('Input file is corrupted or not a valid video file.')
  } else {
    showError('An unexpected error occurred during conversion.')
  }
}
```

---

## Security Model

### Context Isolation

Electron's context isolation is enabled by default, preventing the renderer process from accessing Node.js APIs directly:

```typescript
// electron/main.ts (lines 35-37)

webPreferences: {
  preload: path.join(__dirname, 'preload.mjs'),
  // contextIsolation: true (enabled by default)
}
```

### Secure IPC Bridge

The preload script creates a secure bridge using `contextBridge`:

```typescript
// electron/preload.ts (lines 23-35)

contextBridge.exposeInMainWorld('fileSystemAPI', {
  getDirectoryContents: (dirPath: string): Promise<FileSystemItem[]> =>
    ipcRenderer.invoke('get-directory-contents', dirPath),
  // All methods are explicitly exposed and typed
})
```

**Security Benefits:**
- Renderer cannot access Node.js APIs directly
- Only explicitly exposed methods are available
- TypeScript types prevent API misuse
- No arbitrary code execution from renderer

### Input Validation

**File Path Validation (Needs Enhancement):**
```typescript
// Current: Basic validation
ipcMain.handle('get-directory-contents', async (_event, dirPath) => {
  // No validation currently performed
  const items = await fs.readdir(dirPath, { withFileTypes: true })
  return result
})

// Recommended: Add validation
ipcMain.handle('get-directory-contents', async (_event, dirPath) => {
  // Validate path
  const normalized = path.normalize(dirPath)
  if (!normalized.startsWith('/home') && !normalized.startsWith('C:\\')) {
    throw new Error('Access denied: Invalid path')
  }

  // Check for directory traversal
  if (normalized.includes('..')) {
    throw new Error('Access denied: Directory traversal not allowed')
  }

  const items = await fs.readdir(normalized, { withFileTypes: true })
  return result
})
```

**FFmpeg Command Sanitization (Planned):**
```typescript
// Prevent command injection
function sanitizeFFmpegArgs(userArgs: string[]): string[] {
  const safeArgs: string[] = []

  for (const arg of userArgs) {
    // Remove shell metacharacters
    const sanitized = arg.replace(/[;&|`$()]/g, '')

    // Validate argument format
    if (sanitized.match(/^[a-zA-Z0-9_\-./]+$/)) {
      safeArgs.push(sanitized)
    }
  }

  return safeArgs
}
```

### File System Access Control

**Current Access Model:**
- Full file system access through IPC
- No user permission prompts
- No access logging

**Recommended Enhancements:**
1. **Scoped File Access**: Request permission for each directory
2. **Access Logging**: Log file system operations
3. **User Prompts**: Confirm before destructive operations
4. **Sandbox Mode**: Restrict access to user-selected directories only

### Security Checklist

- ✅ Context isolation enabled
- ✅ No direct Node.js API access in renderer
- ✅ Typed IPC interface
- ⚠️ File path validation needs enhancement
- ⚠️ No user permission prompts for file access
- ❌ FFmpeg command sanitization not implemented
- ❌ No operation logging
- ❌ No sandbox restrictions

---

## Error Handling Strategy

### Error Categories

1. **File System Errors**
   - File not found
   - Permission denied
   - Directory doesn't exist
   - Disk full

2. **IPC Communication Errors**
   - Handler not registered
   - Invalid arguments
   - Timeout
   - Process crash

3. **Conversion Errors** (Future)
   - FFmpeg not found
   - Invalid input file
   - Unsupported codec
   - Out of memory

4. **User Interface Errors**
   - Invalid user input
   - Missing required settings
   - Operation cancelled

### Error Handling Patterns

**Main Process Pattern:**
```typescript
ipcMain.handle('operation-name', async (_event, arg) => {
  try {
    const result = await performOperation(arg)
    return { success: true, data: result }
  } catch (error) {
    console.error('Operation failed:', error)
    return {
      success: false,
      error: (error as Error).message,
      code: (error as any).code
    }
  }
})
```

**Renderer Process Pattern:**
```typescript
const result = await window.fileSystemAPI.someOperation(arg)

if (!result.success) {
  // Handle error
  switch (result.code) {
    case 'ENOENT':
      showErrorMessage('File not found. Please check the path.')
      break
    case 'EACCES':
      showErrorMessage('Permission denied. Check file permissions.')
      break
    default:
      showErrorMessage(`An error occurred: ${result.error}`)
  }
}
```

**Component Error Boundary (Planned):**
```typescript
// Vue 3 error handler pattern
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)

  // Send error to error tracking service
  reportError(err, info)
}
```

### User Error Communication

**Current State:**
- Console logging only
- No user-facing error messages
- No error recovery guidance

**Planned Improvements:**
```typescript
// Error toast notifications
function showErrorToast(message: string, details?: string) {
  toastStore.show({
    type: 'error',
    message,
    details,
    duration: 5000
  })
}

// Error dialog for critical errors
function showErrorDialog(title: string, message: string, error: Error) {
  dialog.showErrorBox(title, `${message}\n\n${error.message}`)
}
```

---

## Performance Considerations

### Current Performance Characteristics

1. **File System Operations**
   - Synchronous readdir calls may block main process
   - No caching of directory listings
   - Repeated stat calls for same files

2. **Video Processing**
   - Stub implementation is fast (simple file copy)
   - No real CPU usage currently
   - Future FFmpeg will be CPU-intensive

3. **UI Responsiveness**
   - 500ms delay between file processing (artificial)
   - Main thread not blocked during file operations
   - Reactive UI updates perform well

### Optimization Strategies

**1. Directory Listing Caching (Planned)**
```typescript
const directoryCache = new Map<string, {
  items: FileSystemItem[]
  timestamp: number
}>()

const CACHE_TTL = 5000 // 5 seconds

ipcMain.handle('get-directory-contents', async (_event, dirPath) => {
  const cached = directoryCache.get(dirPath)
  const now = Date.now()

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.items
  }

  const items = await loadDirectoryContents(dirPath)
  directoryCache.set(dirPath, { items, timestamp: now })
  return items
})
```

**2. Debounced File Operations (Planned)**
```typescript
// Debounce rapid user interactions
import { debounce } from 'lodash-es'

const debouncedLoad = debounce(async (path: string) => {
  const items = await window.fileSystemAPI.getDirectoryContents(path)
  directoryItems.value = items
}, 300)
```

**3. Lazy Loading for Large Directories (Planned)**
```typescript
// Load directories in chunks
const CHUNK_SIZE = 100

async function loadDirectoryChunk(path: string, offset: number) {
  const allItems = await fs.readdir(path, { withFileTypes: true })
  return allItems.slice(offset, offset + CHUNK_SIZE)
}
```

**4. FFmpeg Process Pool (Future)**
```typescript
// Limit concurrent FFmpeg processes
const MAX_CONCURRENT_PROCESSES = 2
const activeProcesses: ChildProcess[] = []

async function queueConversion(input: string, output: string) {
  while (activeProcesses.length >= MAX_CONCURRENT_PROCESSES) {
    await Promise.race(activeProcesses.map(p => new Promise(r => p.on('exit', r))))
  }

  const process = spawnFFmpeg(input, output)
  activeProcesses.push(process)

  process.on('exit', () => {
    const index = activeProcesses.indexOf(process)
    activeProcesses.splice(index, 1)
  })
}
```

### Memory Management

**Current Concerns:**
- Large video file lists stored in memory
- No virtualization for long lists
- File stats loaded for all files

**Planned Improvements:**
```typescript
// Virtual scrolling for large lists
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  largeFileList,
  { itemHeight: 40, overscan: 10 }
)

// Lazy stat loading
async function getStatsIfNeeded(item: FileSystemItem) {
  if (!item.size && item.isFile) {
    const stats = await window.fileSystemAPI.getFileStats(item.path)
    item.size = stats?.size
  }
}
```

---

## Extension Points

### Adding New IPC Handlers

**Step 1: Define Handler in Main Process**
```typescript
// electron/main.ts
ipcMain.handle('new-operation', async (_event, arg1, arg2) => {
  try {
    const result = await performNewOperation(arg1, arg2)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})
```

**Step 2: Expose in Preload Script**
```typescript
// electron/preload.ts
contextBridge.exposeInMainWorld('fileSystemAPI', {
  // Existing methods...
  newOperation: (arg1: string, arg2: number): Promise<Result> =>
    ipcRenderer.invoke('new-operation', arg1, arg2)
})
```

**Step 3: Add TypeScript Types**
```typescript
// src/types/electron.d.ts
declare global {
  interface Window {
    fileSystemAPI: {
      // Existing methods...
      newOperation(arg1: string, arg2: number): Promise<Result>
    }
  }
}
```

**Step 4: Use in Component**
```typescript
// In any Vue component
const result = await window.fileSystemAPI.newOperation('test', 42)
```

### Adding New Vue Components

**Component Template:**
```vue
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  initialValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0
})

const emit = defineEmits<{
  update: [value: number]
  change: [event: Event]
}>()

const localValue = ref(props.initialValue)
</script>

<style scoped>
.my-component {
  /* Component styles */
}
</style>
```

### Adding Conversion Presets (Future)

```typescript
// electron/presets/conversion-presets.ts
export interface ConversionPreset {
  name: string
  description: string
  outputFormat: string
  videoCodec: string
  audioCodec: string
  bitrate: string
  extensions: string[]
}

export const PRESETS: ConversionPreset[] = [
  {
    name: 'High Quality MP4',
    description: 'H.264 video with AAC audio, 5 Mbps bitrate',
    outputFormat: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    bitrate: '5M',
    extensions: ['mp4', 'mov', 'avi']
  },
  {
    name: 'Web Optimized',
    description: 'H.264 video optimized for web streaming',
    outputFormat: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    bitrate: '2M',
    extensions: ['mp4']
  }
  // ... more presets
]
```

### Adding FFmpeg Filters (Future)

```typescript
// electron/filters/video-filters.ts
export interface VideoFilter {
  name: string
  description: string
  buildFFmpegArgs: (params: any) => string[]
}

export const SCALE_FILTER: VideoFilter = {
  name: 'Scale',
  description: 'Resize video to specified dimensions',
  buildFFmpegArgs: (params) => {
    return ['-vf', `scale=${params.width}:${params.height}`]
  }
}

export const CROP_FILTER: VideoFilter = {
  name: 'Crop',
  description: 'Crop video to specified area',
  buildFFmpegArgs: (params) => {
    return ['-vf', `crop=${params.width}:${params.height}:${params.x}:${params.y}`]
  }
}
```

---

## Appendices

### A. TypeScript Type Definitions

**Core Types** ([src/types/electron.d.ts](../src/types/electron.d.ts))

```typescript
// File system item representation
export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

// Video file in processing queue
export interface VideoFile {
  name: string
  path: string
  size?: number
  status: 'pending' | 'processing' | 'completed' | 'error'
}

// Conversion configuration
export interface ConversionConfig {
  outputDirectory: string
  outputFormat?: string
  videoCodec?: string
  audioCodec?: string
  bitrate?: string
  resolution?: { width: number; height: number }
}

// File metadata
export interface FileStats {
  size: number
  modified: Date
  isDirectory: boolean
  isFile: boolean
}
```

### B. File Organization

```
ffmpeg-gui/
├── electron/                    # Main process code
│   ├── main.ts                 # Entry point, IPC handlers
│   └── preload.ts              # Preload script (API bridge)
│
├── src/                        # Renderer process code
│   ├── components/             # Vue components
│   │   ├── FileExplorer.vue    # File browser
│   │   ├── VideoQueue.vue      # Queue manager
│   │   └── ConversionSettings.vue  # Output configuration
│   ├── types/                  # TypeScript definitions
│   │   └── electron.d.ts       # Global types
│   ├── App.vue                 # Root component
│   └── main.ts                 # Vue app initialization
│
├── docs/                       # Documentation
│   ├── AGENTS.md              # Documentation hub
│   ├── architecture.md        # This document
│   ├── audit_plan.md          # Security audit plan
│   └── ffmpeg_options_ui_implementation_plan.md  # UI plans
│
├── dist/                       # Built renderer assets
├── dist-electron/              # Built main process assets
└── electron-builder.json5      # Packaging configuration
```

### C. Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Build only (no packaging)
npm run build:quick

# Package application (creates installer)
npm run dist

# Run packaged electron app
npm run electron
```

### D. Related Documentation

- [AGENTS.md](./AGENTS.md) - Documentation hub and getting started
- [audit_plan.md](./audit_plan.md) - Security and code quality guidelines
- [ffmpeg_options_ui_implementation_plan.md](./ffmpeg_options_ui_implementation_plan.md) - UI implementation plans

### E. Architecture Decision Records

**ADR-001: Electron Multi-Process Architecture**
- **Status**: Accepted
- **Context**: Need cross-platform desktop app with web technologies
- **Decision**: Use Electron with strict main/renderer separation
- **Consequences**: Secure but requires IPC communication overhead

**ADR-002: Vue.js 3 Composition API**
- **Status**: Accepted
- **Context**: Modern reactive framework for UI
- **Decision**: Use Vue 3 with Composition API and TypeScript
- **Consequences**: Better type safety, but learning curve for Options API developers

**ADR-003: Stub FFmpeg Implementation**
- **Status**: Temporary
- **Context**: UI development needed before FFmpeg integration
- **Decision**: Use file copy as stub placeholder
- **Consequences**: Faster development, but requires refactoring later

**ADR-004: TypeScript Strict Mode**
- **Status**: Accepted
- **Context**: Type safety for IPC and component communication
- **Decision**: Enable strict TypeScript throughout
- **Consequences**: Fewer runtime errors, but more verbose code

---

## Document Metadata

**Author**: FFmpeg GUI Development Team
**Status**: Active - Technical Reference
**Version**: 1.0.0
**Last Modified**: 2025-12-27
**Review Cycle**: Quarterly

---

**End of Architecture Document**
