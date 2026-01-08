# FFmpeg GUI - Project Documentation Hub

**Welcome to the FFmpeg GUI project documentation!**

This is a modern desktop video conversion application built with Electron and Vue.js 3. It provides a user-friendly graphical interface for video file conversion using FFmpeg.

## Quick Links

- 📖 [Project Overview](#project-overview)
- 🏗️ [Architecture](#architecture)
- 🚀 [Getting Started](#getting-started)
- 📚 [Documentation Index](#documentation-index)
- 🤖 [For AI Agents](#for-ai-agents)

---

## Project Overview

### What is FFmpeg GUI?

A cross-platform desktop application that provides a generic graphical interface for command-line tool execution. Originally designed for FFmpeg video conversion, it now supports any command-line tool through dynamic JSON configuration. Users can browse their file system, select files and directories, configure command options through a visual interface, and execute batch operations with concurrency control.

**Key Features:**
- Generic command execution framework (not limited to FFmpeg)
- Dynamic command configuration via JSON
- Multi-file/directory selection and processing
- Configurable concurrency (1-4 parallel jobs)
- Duplicate file detection and conflict resolution
- Overwrite control for existing files
- Cross-platform support (Windows/Unix)
- Real-time command preview

### Technology Stack

- **Frontend**: Vue.js 3 with TypeScript and Composition API
- **State Management**: Pinia for centralized state
- **Desktop Framework**: Electron (v30.0.1)
- **Build Tool**: Vite with custom Electron plugins
- **Packaging**: Electron Builder for installers

### Current Status

- ✅ File system navigation and file explorer
- ✅ Multi-file/directory selection with checkboxes
- ✅ Pinia-based state management
- ✅ Dynamic command configuration loading
- ✅ Command options modal with categorized tabs
- ✅ Generic command execution (cross-platform)
- ✅ Concurrency control (1-4 parallel jobs)
- ✅ Duplicate detection and conflict resolution
- ✅ Overwrite toggle for existing files
- 🚧 Progress tracking (basic status, no progress bars yet)
- 📋 Preset management (planned)
- 📋 Command history (planned)

---

## Architecture

### Electron Multi-Process Architecture

```
┌─────────────────────────────────────────┐
│         Electron Application            │
├──────────────────┬──────────────────────┤
│   Main Process   │   Renderer Process   │
│   (Node.js)      │   (Vue.js 3 App)     │
├──────────────────┼──────────────────────┤
│ • File system    │ • User Interface     │
│ • FFmpeg spawn   │ • State Management   │
│ • IPC handlers   │ • Event Handling     │
│                  │                      │
│  ←←← IPC →→→     │                      │
└──────────────────┴──────────────────────┘
```

### Key Components

#### Main Process ([electron/main.ts](../electron/main.ts))
- Handles file system operations
- Spawns and manages FFmpeg processes
- Exposes safe APIs via IPC

#### Renderer Process ([src/](../src/))
- **[App.vue](../src/App.vue)**: Main application container and processing orchestration
- **[components/FileExplorer.vue](../src/components/FileExplorer.vue)**: File browser with navigation and multi-selection
- **[components/ProcessQueue.vue](../src/components/ProcessQueue.vue)**: Processing queue display with status tracking
- **[components/ConversionSettings.vue](../src/components/ConversionSettings.vue)**: Command selection, options, and output configuration
- **[components/CommandOptionsModal.vue](../src/components/CommandOptionsModal.vue)**: Command options editor with categorized tabs
- **[components/options/](../src/components/options/)**: Option input components (text, boolean, select)
- **[stores/fileSelection.ts](../src/stores/fileSelection.ts)**: Pinia store for file selection state
- **[services/commandBuilder.ts](../src/services/commandBuilder.ts)**: Command building logic
- **[services/commandConfig.ts](../src/services/commandConfig.ts)**: Configuration loading and validation

#### IPC Communication
Secure communication through preload script ([electron/preload.ts](../electron/preload.ts))

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- FFmpeg (must be available in system PATH)

### Installation

```bash
# Install dependencies
npm install

# Run development mode
npm run dev

# Build for production
npm run build

# Package application
npm run dist
```

### Development Workflow

1. **Main Process Development**: Edit files in [electron/](../electron/)
2. **Renderer Development**: Edit files in [src/](../src/)
3. **Hot Reload**: Vite provides hot reload for renderer process
4. **Main Process Reload**: Restart the dev server to apply main process changes

### Project Structure

```
ffmpeg-gui/
├── electron/                    # Electron main process
│   ├── main.ts                 # Entry point, IPC handlers
│   └── preload.ts              # API bridge to renderer
├── src/                        # Vue.js 3 application
│   ├── components/             # Vue components
│   │   ├── FileExplorer.vue
│   │   ├── ProcessQueue.vue
│   │   ├── ConversionSettings.vue
│   │   ├── CommandOptionsModal.vue
│   │   └── options/           # Option input components
│   ├── services/               # Business logic
│   │   ├── commandBuilder.ts
│   │   └── commandConfig.ts
│   ├── stores/                 # Pinia stores
│   │   └── fileSelection.ts
│   ├── types/                  # TypeScript definitions
│   └── App.vue                 # Root component
├── public/                     # Public assets
│   └── command-options.json    # Command configuration
├── docs/                       # Documentation (this file)
├── dist/                       # Built web assets
├── dist-electron/              # Built Electron assets
└── electron-builder.json5      # Packaging config
```

---

## Documentation Index

### 📋 Active Documents

- **[architecture.md](./architecture.md)** - 🔧 Comprehensive technical architecture documentation covering system design, data flow, IPC communication, and component architecture
- **[audit_plan.md](./audit_plan.md)** - Security and code quality audit plan with review checklist
- **[ffmpeg_options_ui_implementation_plan.md](./ffmpeg_options_ui_implementation_plan.md)** - Detailed plan for implementing dynamic FFmpeg command options UI

### ⚠️ Obsolete Documents

Located in [obsolete/](./obsolete/) for historical reference:

- **[logging_system_implementation_plan.md](./obsolete/logging_system_implementation_plan.md)** - Historical logging system plan (superseded)

## Document Status Legend

- ✅ **Active** - Current, relevant documentation
- ⚠️ **Obsolete** - Historical reference only, not to be implemented
- 📋 **Plan** - Implementation plans and proposals
- 🔧 **Technical** - Technical specifications and architecture

---

## For AI Agents

### Context for AI Coding Assistants

This section provides essential context for AI agents (Claude, Copilot, etc.) assisting with this project.

#### Project Type
- **Electron + Vue.js 3 desktop application**
- **Generic command execution framework** (not FFmpeg-specific)
- **TypeScript throughout** (strict mode enabled)
- **Composition API** for Vue components
- **Pinia** for state management
- **IPC-based architecture** (main/renderer communication)
- **Dynamic JSON configuration** for commands

#### Code Style Guidelines

**Vue Components:**
- Use `<script setup lang="ts">` syntax
- Prefer Composition API over Options API
- Define props with `defineProps<T>()`
- Emit events with `defineEmits<T>()`
- Use `ref<T>()` for reactive primitives
- Use `reactive<T>()` for reactive objects

**State Management:**
- Use Pinia stores for shared state
- Import stores with `useFileSelectionStore()`
- Call store actions directly
- Use computed getters for derived state
- Local component state for UI-only state

**TypeScript:**
- Enable strict type checking
- Avoid `any` types
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Export types from dedicated `types/` directory

**IPC Communication:**
- Main → Renderer: Use `window.mainApi.on()` event listeners
- Renderer → Main: Use `window.mainApi.invoke()` for async operations
- Always handle errors in IPC calls
- Type IPC handlers in [electron/preload.ts](../electron/preload.ts)

#### Key Files to Understand

1. **[electron/main.ts](../electron/main.ts)** - IPC handlers, command execution
2. **[electron/preload.ts](../electron/preload.ts)** - API bridge between main and renderer
3. **[src/App.vue](../src/App.vue)** - Main application layout, processing orchestration
4. **[src/stores/fileSelection.ts](../src/stores/fileSelection.ts)** - Pinia store for file selection
5. **[src/services/commandConfig.ts](../src/services/commandConfig.ts)** - Configuration loading
6. **[src/services/commandBuilder.ts](../src/services/commandBuilder.ts)** - Command building
7. **[public/command-options.json](../public/command-options.json)** - Command definitions
8. **[package.json](../package.json)** - Dependencies and scripts

#### Common Tasks

**Adding a new IPC handler:**
1. Add handler in [electron/main.ts](../electron/main.ts) `ipcMain.handle()`
2. Expose in [electron/preload.ts](../electron/preload.ts) `contextBridge.exposeInMainWorld()`
3. Add TypeScript type to `MainWindowApi` interface
4. Call from renderer with `window.mainApi.invoke()`

**Creating a Vue component:**
1. Create in [src/components/](../src/components/)
2. Use `<script setup lang="ts">` syntax
3. Define props interface: `interface Props { propName: Type }`
4. Emit events: `const emit = defineEmits<{ eventName: [payload: Type] }>()`

**Adding a new command configuration:**
1. Edit [public/command-options.json](../public/command-options.json)
2. Add command definition following the structure
3. Define categories and options
4. Specify flags and defaults
5. Reload app to see new command

**Using the Pinia store:**
```typescript
import { useFileSelectionStore } from '@/stores/fileSelection'

const fileStore = useFileSelectionStore()

// Check selection
if (fileStore.hasSelection) {
  // Get items
  const items = fileStore.selectedList

  // Update status
  fileStore.updateItemStatus(path, 'processing')

  // Clear completed
  fileStore.clearCompleted()
}
```

#### Security Considerations

- ⚠️ Never expose Node.js APIs directly to renderer
- ⚠️ Always use `contextBridge` for secure IPC
- ⚠️ Validate file paths to prevent directory traversal
- ⚠️ Sanitize command arguments before execution
- ⚠️ Handle user input before spawning processes
- ⚠️ Be careful with overwrite functionality (data loss risk)

#### Testing Strategy

- **Unit Tests**: Test Vue components in isolation
- **Integration Tests**: Test IPC communication
- **E2E Tests**: Test full user flows
- **Manual Testing**: Test packaged application before releases

---

## Contributing to Documentation

### Creating New Documentation

1. **Place active documents** in the root of [docs/](.)
2. **Move obsolete documents** to the [obsolete/](./obsolete/) folder
3. **Mark clearly** with appropriate status in the Document Status Legend
4. **Add index entry** in the Documentation Index section above
5. **Update this file** ([AGENTS.md](./AGENTS.md)) to reference new docs

### Documentation Template

```markdown
# Document Title

**Status**: ✅ Active | ⚠️ Obsolete | 📋 Plan | 🔧 Technical

## Overview
[Brief description of what this document covers]

## Purpose
[Why this document exists and who it's for]

## Contents
[Main content of the document]

## Related Documents
- Links to related documentation
```

### Document Maintenance

- **Review quarterly** for relevance
- **Update status** when implementations change
- **Preserve historical** documents in [obsolete/](./obsolete/) folder
- **Delete only** if contains sensitive information or completely irrelevant

---

## Additional Resources

### Official Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [Vue.js 3 Documentation](https://vuejs.org/guide/introduction.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

### Project Configuration
- **[package.json](../package.json)** - Dependencies and npm scripts
- **[electron-builder.json5](../electron-builder.json5)** - Packaging configuration
- **[vite.config.ts](../vite.config.ts)** - Build configuration
- **[tsconfig.json](../tsconfig.json)** - TypeScript configuration

---

**Last Updated**: 2025-01-08
**Project Version**: Development (pre-alpha)