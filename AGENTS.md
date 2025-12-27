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

A cross-platform desktop application that simplifies video conversion through an intuitive interface. Users can browse their file system, select video files, configure conversion settings, and process them in batches.

### Technology Stack

- **Frontend**: Vue.js 3 with TypeScript and Composition API
- **Desktop Framework**: Electron (v30.0.1)
- **Build Tool**: Vite with custom Electron plugins
- **Packaging**: Electron Builder for installers

### Current Status

- ✅ File system navigation and file explorer
- ✅ Video queue management
- ✅ Output directory configuration
- 🚧 FFmpeg integration (stub implementation)
- 📋 Dynamic command options UI (planned)

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
- **[App.vue](../src/App.vue)**: Main application container
- **[components/FileExplorer.vue](../src/components/FileExplorer.vue)**: File browser with navigation
- **[components/VideoQueue.vue](../src/components/VideoQueue.vue)**: Video processing queue
- **[components/ConversionSettings.vue](../src/components/ConversionSettings.vue)**: Output configuration

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
├── electron/              # Electron main process
│   ├── main.ts           # Entry point, IPC handlers
│   └── preload.ts        # API bridge to renderer
├── src/                  # Vue.js 3 application
│   ├── components/       # Vue components
│   ├── types/           # TypeScript definitions
│   └── App.vue          # Root component
├── docs/                # Documentation (this file)
├── dist/                # Built web assets
├── dist-electron/       # Built Electron assets
└── electron-builder.json5  # Packaging config
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
- **TypeScript throughout** (strict mode enabled)
- **Composition API** for Vue components
- **IPC-based architecture** (main/renderer communication)

#### Code Style Guidelines

**Vue Components:**
- Use `<script setup lang="ts">` syntax
- Prefer Composition API over Options API
- Define props with `defineProps<T>()`
- Emit events with `defineEmits<T>()`
- Use `ref<T>()` for reactive primitives
- Use `reactive<T>()` for reactive objects

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

1. **[electron/main.ts](../electron/main.ts)** - IPC handlers, FFmpeg process management
2. **[electron/preload.ts](../electron/preload.ts)** - API bridge between main and renderer
3. **[src/App.vue](../src/App.vue)** - Main application layout and state
4. **[package.json](../package.json)** - Dependencies and scripts

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

**FFmpeg Integration:**
- FFmpeg is currently stub (file copy placeholder)
- Real implementation will spawn FFmpeg processes from main process
- Use `child_process.spawn()` for real-time progress
- Send progress updates via IPC events

#### Security Considerations

- ⚠️ Never expose Node.js APIs directly to renderer
- ⚠️ Always use `contextBridge` for secure IPC
- ⚠️ Validate file paths to prevent directory traversal
- ⚠️ Sanitize FFmpeg command arguments
- ⚠️ Handle user input before spawning processes

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

**Last Updated**: 2025-12-27
**Project Version**: Development (pre-alpha)