# FFmpeg GUI

A modern desktop application for generic command execution with dynamic configuration, built with Electron and Vue.js 3.

## Overview

FFmpeg GUI has evolved from a simple FFmpeg video converter to a **generic command execution framework** that supports any command-line tool through dynamic JSON configuration. The application provides a user-friendly interface for selecting files, configuring command options, and executing batch operations with concurrency control.

## Key Features

- 🏗️ **Generic Command Framework**: Support for any command-line tool via JSON configuration
- 📁 **File System Explorer**: Browse and select files/directories with multi-selection support
- ⚙️ **Dynamic Command Configuration**: Load commands and options from JSON configuration
- 🔄 **Batch Processing**: Process multiple files with configurable concurrency (1-4 parallel jobs)
- 🛡️ **Duplicate Detection**: Automatic detection and handling of duplicate files
- 📊 **Status Tracking**: Real-time status updates for all processing jobs
- 🔧 **Cross-Platform**: Works on Windows and Unix systems

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Command-line tools you want to use (e.g., FFmpeg for video conversion)

### Installation
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production (renderer process only)
npm run build

# Build Electron app (unpacked, no installer)
npm run build:electron

# Package the application (creates installers)
npm run dist
```

## Usage

1. **Browse Files**: Use the file explorer to navigate and select files/directories
2. **Select Command**: Choose a command from the dropdown (loaded from configuration)
3. **Configure Options**: Click "Configure Options" to set command parameters
4. **Set Output Directory**: Select where processed files should be saved
5. **Start Processing**: Click "Start Processing" to begin batch execution

## Architecture

The application follows Electron's multi-process architecture:

- **Main Process** (`electron/main.ts`): Handles file system operations and command execution
- **Renderer Process** (`src/`): Vue.js 3 application with TypeScript and Composition API
- **Preload Script** (`electron/preload.ts`): Secure API bridge between processes
- **State Management**: Pinia stores for centralized state management
- **Dynamic Configuration**: JSON-based command definitions in `public/command-options.json`

### Key Components
- **FileExplorer.vue**: File browser with navigation and multi-selection
- **ProcessQueue.vue**: Processing queue display with status tracking
- **ConversionSettings.vue**: Command selection and output configuration
- **CommandOptionsModal.vue**: Command options editor with categorized tabs

## Configuration

Commands are defined in `public/command-options.json` using a flexible schema:
```json
{
  "commands": {
    "cp": {
      "name": "Copy Files",
      "description": "Copy files to destination directory",
      "categories": [
        {
          "name": "Basic",
          "options": [
            {
              "name": "preserve",
              "type": "boolean",
              "description": "Preserve file attributes",
              "default": true
            }
          ]
        }
      ]
    }
  }
}
```

## Development

### Project Structure
```
ffmpeg-gui/
├── electron/          # Electron main process
├── src/              # Vue.js 3 application
│   ├── components/   # Vue components
│   ├── services/     # Business logic
│   ├── stores/       # Pinia stores
│   └── types/        # TypeScript definitions
├── public/           # Static assets and configuration
└── docs/             # Documentation
```

### Development Commands
```bash
# Development with hot reload
npm run dev

# Build web assets (production)
npm run build

# Build Electron app (unpacked)
npm run build:electron

# Package application for distribution
npm run dist

# Run built Electron app
npm run electron

# Clean build outputs
npm run clean
```

## Documentation

For comprehensive technical documentation, see:
- **[docs/architecture.md](docs/architecture.md)** - Detailed technical architecture and design
- **[docs/AGENTS.md](docs/AGENTS.md)** - Project documentation hub and AI agent guidelines

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use Vue 3 Composition API with `<script setup>` syntax
3. Maintain type safety throughout
4. Add new commands via JSON configuration
5. Test cross-platform compatibility

## License

This project is under active development.