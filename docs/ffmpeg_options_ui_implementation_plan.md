# Dynamic Command Options UI Implementation Plan

## Overview
This document outlines the implementation plan for a dynamic command options configuration UI. The system will allow users to discover and configure command options through a user-friendly interface generated from a JSON configuration file. We'll start with `cp` command options as a proof of concept before expanding to other commands like FFmpeg.

## Requirements Analysis
1. **Dynamic UI Generation**: Generate UI components from JSON configuration
2. **Options Discovery**: Help users discover available command options
3. **Interactive Help**: Question mark icons with floating tooltips/popups for specifications
4. **Default Values**: Pre-populated default values for options
5. **Modal Configuration**: Popup window for option configuration
6. **Extensible Framework**: Easy to add new commands and their options

## Architecture Overview

### 1. Configuration Layer
- **Command Options Config**: JSON file containing command options metadata
- **Option Types**: Support different input types (text, number, boolean, select, etc.)
- **Validation Rules**: Input validation and constraints

### 2. UI Components
- **Options Modal**: Main configuration popup window
- **Option Groups**: Categorized option sections (File Operations, Permissions, etc.)
- **Dynamic Input Components**: Input fields generated based on option type
- **Help System**: Tooltips and help overlays

### 3. Data Flow
- **Configuration Loading**: Load command options from JSON config
- **User Input**: Capture and validate user selections
- **Command Generation**: Build command string from user options
- **Execution**: Execute commands with user-selected options

## Detailed Implementation Plan

### Phase 1: Configuration Infrastructure

#### 1.1 Command Options Configuration File
**File**: `src/config/command-options.json`

```json
{
  "commands": {
    "cp": {
      "name": "Copy Command",
      "description": "File copy operation with various options",
      "categories": {
        "basic": {
          "name": "Basic Options",
          "description": "Common copy options",
          "options": {
            "recursive": {
              "name": "Recursive Copy",
              "description": "Copy directories recursively",
              "type": "boolean",
              "flag": "-r",
              "default": false,
              "specification": "Copy directories and their contents recursively. Required when copying directories."
            },
            "preserve": {
              "name": "Preserve Attributes",
              "description": "Preserve file attributes",
              "type": "select",
              "flag": "-p",
              "default": "none",
              "options": ["none", "timestamps", "permissions", "all"],
              "specification": "Preserve specified file attributes during copy operation."
            },
            "verbose": {
              "name": "Verbose Output",
              "description": "Show detailed output",
              "type": "boolean",
              "flag": "-v",
              "default": false,
              "specification": "Display detailed information about the copy operation."
            }
          }
        },
        "advanced": {
          "name": "Advanced Options",
          "description": "Advanced copy settings",
          "options": {
            "force": {
              "name": "Force Overwrite",
              "description": "Force overwrite existing files",
              "type": "boolean",
              "flag": "-f",
              "default": false,
              "specification": "Force overwrite of existing destination files without prompting."
            },
            "interactive": {
              "name": "Interactive Mode",
              "description": "Prompt before overwrite",
              "type": "boolean",
              "flag": "-i",
              "default": false,
              "specification": "Prompt before overwriting existing files."
            }
          }
        }
      }
    },
    "ffmpeg": {
      "name": "FFmpeg Video Converter",
      "description": "Video/audio conversion with comprehensive options",
      "categories": {
        "video": {
          "name": "Video Options",
          "description": "Options for video processing",
          "options": {
            "codec": {
              "name": "Video Codec",
              "description": "Specify the video codec to use",
              "type": "select",
              "flag": "-c:v",
              "default": "libx264",
              "options": ["libx264", "libx265", "libvpx", "libvpx-vp9"],
              "required": false,
              "specification": "The video codec determines how video data is compressed. libx264 is widely compatible, libx265 offers better compression, libvpx is for WebM format."
            },
            "bitrate": {
              "name": "Video Bitrate",
              "description": "Set the video bitrate",
              "type": "text",
              "flag": "-b:v",
              "default": "1000k",
              "placeholder": "e.g., 1000k, 2M",
              "validation": "^\\d+[kKmMgG]?$",
              "specification": "Video bitrate controls the quality and file size. Higher bitrates mean better quality but larger files. Use 'k' for kilobits, 'M' for megabits."
            },
            "resolution": {
              "name": "Output Resolution",
              "description": "Set output video resolution",
              "type": "select",
              "flag": "-s",
              "default": "original",
              "options": ["original", "1920x1080", "1280x720", "854x480", "640x360"],
              "specification": "Output video resolution. 'original' maintains input resolution. Lower resolutions reduce file size."
            }
          }
        },
        "audio": {
          "name": "Audio Options",
          "description": "Options for audio processing",
          "options": {
            "audio_codec": {
              "name": "Audio Codec",
              "description": "Specify the audio codec",
              "type": "select",
              "flag": "-c:a",
              "default": "aac",
              "options": ["aac", "mp3", "ogg", "flac", "copy"],
              "specification": "Audio codec determines how audio is compressed. AAC is widely compatible, MP3 is universal, FLAC is lossless, 'copy' preserves original audio."
            },
            "audio_bitrate": {
              "name": "Audio Bitrate",
              "description": "Set the audio bitrate",
              "type": "select",
              "flag": "-b:a",
              "default": "128k",
              "options": ["64k", "128k", "192k", "256k", "320k"],
              "specification": "Audio bitrate affects audio quality. 128k is standard quality, 192k+ is high quality, 64k is low quality/small size."
            }
          }
        },
        "format": {
          "name": "Format Options",
          "description": "Output format and container options",
          "options": {
            "output_format": {
              "name": "Output Format",
              "description": "Output container format",
              "type": "select",
              "flag": "-f",
              "default": "mp4",
              "options": ["mp4", "avi", "mkv", "webm", "mov"],
              "specification": "The output format determines the container. MP4 is widely compatible, MKV supports many codecs, WebM is web-optimized, AVI is legacy format."
            }
          }
        }
      }
    }
  }
}
```

#### 1.2 TypeScript Types
**File**: `src/types/command-options.ts`

```typescript
export interface CommandOption {
  name: string
  description: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multi-select'
  flag: string
  default?: string | number | boolean
  options?: string[] // for select types
  placeholder?: string
  validation?: string // regex pattern
  required?: boolean
  specification: string
}

export interface OptionCategory {
  name: string
  description: string
  options: Record<string, CommandOption>
}

export interface CommandConfig {
  name: string
  description: string
  categories: Record<string, OptionCategory>
}

export interface CommandsConfig {
  commands: Record<string, CommandConfig>
}

export interface UserCommandOptions {
  [optionKey: string]: string | number | boolean | string[]
}
```

### Phase 2: UI Components Development

#### 2.1 Command Options Modal Component
**File**: `src/components/CommandOptionsModal.vue`

Key Features:

- Modal overlay with close functionality
- Tabbed interface for different option categories
- Dynamic form generation based on JSON config
- Real-time command preview
- Save/Cancel actions

#### 2.2 Dynamic Option Input Components
**File**: `src/components/options/`

Components to create:

- `TextOption.vue` - Text input with validation
- `NumberOption.vue` - Number input with min/max
- `BooleanOption.vue` - Checkbox/toggle
- `SelectOption.vue` - Dropdown selection
- `MultiSelectOption.vue` - Multiple selection
- `OptionHelp.vue` - Help tooltip component

#### 2.3 Integration with Conversion Settings
**File**: `src/components/ConversionSettings.vue`

Add:

- "Advanced Options" button to open command options modal
- Display selected options summary
- Reset to defaults functionality

### Phase 3: Core Logic Implementation

#### 3.1 Command Configuration Service
**File**: `src/services/commandConfig.ts`

```typescript
export class CommandConfigService {
  static async loadConfig(): Promise<CommandsConfig>
  static validateOption(option: CommandOption, value: any): boolean
  static generateCommandFlags(userOptions: UserCommandOptions, command: string, config: CommandsConfig): string[]
}
```

#### 3.2 Command Builder Service
**File**: `src/services/commandBuilder.ts`

```typescript
export class CommandBuilder {
  static buildCommand(
    command: string,
    inputPath: string,
    outputPath: string,
    userOptions: UserCommandOptions,
    config: CommandsConfig
  ): string
}
```

### Phase 4: Backend Integration

#### 4.1 Main Process Updates
**File**: `electron/main.ts`

Updates needed:

- Replace `copy-file` handler with `execute-command` handler
- Add generic command execution with options
- Progress tracking and cancellation support
- Error handling and logging

#### 4.2 Preload Script Updates
**File**: `electron/preload.ts`

Add new APIs:

```typescript
contextBridge.exposeInMainWorld('commandAPI', {
  executeCommand: (command: string, inputPath: string, outputPath: string, options: string[]) => 
    ipcRenderer.invoke('execute-command', command, inputPath, outputPath, options),
  getCommandVersion: (command: string) => ipcRenderer.invoke('get-command-version', command),
  cancelExecution: (taskId: string) => ipcRenderer.invoke('cancel-execution', taskId)
})
```

### Phase 5: User Experience Enhancements

#### 5.1 Help System

- Floating tooltips for option descriptions
- Expandable specification panels
- Links to command documentation
- Common presets (Quick, Safe, Verbose, etc.)

#### 5.2 Validation and Feedback

- Real-time input validation
- Command preview with syntax highlighting
- Error messages and suggestions
- Progress indicators during execution

#### 5.3 Persistence

- Save user preferences
- Custom presets creation
- Recent configurations history

## File Structure Changes

```
src/
├── components/
│   ├── CommandOptionsModal.vue (new)
│   ├── ConversionSettings.vue (updated)
│   └── options/ (new)
│       ├── TextOption.vue
│       ├── NumberOption.vue
│       ├── BooleanOption.vue
│       ├── SelectOption.vue
│       ├── MultiSelectOption.vue
│       └── OptionHelp.vue
├── config/
│   └── command-options.json (new)
├── services/ (new)
│   ├── commandConfig.ts
│   └── commandBuilder.ts
├── types/
│   ├── electron.d.ts (updated)
│   └── command-options.ts (new)
└── stores/ (optional)
    └── commandOptions.ts (new)
```

## Technical Considerations

### Dependencies

- No additional npm packages required initially
- Consider adding:
  - `ajv` for JSON schema validation
  - `commander` for command parsing utilities (if needed)

### Performance

- Lazy load option configurations
- Virtualize large option lists if needed
- Debounce validation and command preview

### Cross-platform Compatibility

- Ensure command path detection works on all platforms
- Handle different shell escaping requirements
- Test file path handling across OS

### Error Handling

- Command not found detection
- Invalid option combinations
- File permission issues
- Disk space validation

## Success Criteria

1. Users can discover and configure command options through intuitive UI
2. Generated commands are valid and execute successfully
3. Help system provides clear guidance on option usage
4. Modal integrates seamlessly with existing conversion workflow
5. Performance remains responsive with large option sets
6. All input validation works correctly
7. Command preview accurately reflects final command
8. Framework is extensible to support multiple commands (cp, ffmpeg, etc.)

## Future Enhancements

- Option presets and templates
- Advanced command editing mode
- Integration with command documentation
- Option search and filtering
- Batch operation support
- Custom option profiles
- Support for additional commands (ffmpeg, rsync, etc.)
