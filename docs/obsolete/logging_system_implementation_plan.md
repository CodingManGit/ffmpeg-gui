# ⚠️ OBSOLETE: Command Logging System Implementation Plan

> **⚠️ IMPORTANT: This document is obsolete and preserved for historical reference only.**
> 
> **Status**: Deprecated  
> **Reason**: Superseded by newer implementation approaches  
> **Last Updated**: December 27, 2025  
> **Location**: `/docs/obsolete/` folder
> 
> ---

## Overview

*This document outlines the implementation plan for a comprehensive command logging system that captures, displays, and manages command execution feedback. The system was planned to provide real-time logging, progress tracking, and detailed execution history for all command operations (cp, ffmpeg, etc.).*

## Requirements Analysis

1. **Real-time Command Output**: Capture and display command stdout/stderr in real-time
2. **Progress Tracking**: Parse command output for progress indicators
3. **Log Persistence**: Save execution logs for later review
4. **Error Handling**: Distinguish between warnings, errors, and fatal failures
5. **User Interface**: Dedicated logging panel with filtering and search
6. **Performance**: Handle high-volume output without blocking UI
7. **Export Capabilities**: Export logs for debugging and sharing

## Architecture Overview

### 1. Logging Infrastructure

- **Log Capture**: Stream-based command output capture
- **Log Processing**: Parse and categorize log entries
- **Log Storage**: Persistent storage with rotation and cleanup
- **Log Display**: Real-time UI updates with filtering

### 2. UI Components

- **Log Viewer Panel**: Main logging interface
- **Progress Indicators**: Visual progress bars and status
- **Filter Controls**: Log level and category filtering
- **Export Functions**: Save logs to files

### 3. Data Flow

- **Command Execution**: Spawn processes with stdio streams
- **Stream Processing**: Parse output in real-time
- **UI Updates**: Emit events to update display
- **Storage**: Persist logs to database/files

## Detailed Implementation Plan

### Phase 1: Core Logging Infrastructure

#### 1.1 Log Entry Structure
**File**: `src/types/logging.ts`

```typescript
export interface LogEntry {
  id: string
  timestamp: Date
  command: string
  type: 'stdout' | 'stderr' | 'system'
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source: string // file path or command name
  metadata?: {
    progress?: number // 0-100
    duration?: number // milliseconds
    exitCode?: number
    pid?: number
  }
}

export interface CommandSession {
  id: string
  command: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  exitCode?: number
  logs: LogEntry[]
  inputFiles: string[]
  outputFiles: string[]
}

export interface LogFilter {
  levels: LogLevel[]
  commands: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  searchText?: string
}
```

#### 1.2 Logging Service
**File**: `src/services/loggingService.ts`

```typescript
export class LoggingService {
  private static instance: LoggingService
  private sessions: Map<string, CommandSession> = new Map()
  private listeners: Set<LogListener> = new Set()

  static getInstance(): LoggingService
  
  // Session management
  createSession(command: string, inputFiles: string[], outputFiles: string[]): string
  getSession(sessionId: string): CommandSession | undefined
  endSession(sessionId: string, exitCode: number): void
  
  // Log entry management
  addLogEntry(sessionId: string, entry: Omit<LogEntry, 'id' | 'timestamp'>): void
  getSessionLogs(sessionId: string): LogEntry[]
  
  // Progress tracking
  updateProgress(sessionId: string, progress: number): void
  
  // Event handling
  addListener(listener: LogListener): void
  removeListener(listener: LogListener): void
  
  // Persistence
  saveLogs(sessionId: string): Promise<void>
  loadLogs(sessionId: string): Promise<LogEntry[]>
  exportLogs(filter: LogFilter, format: 'json' | 'txt' | 'csv'): Promise<string>
}
```

#### 1.3 Command Output Parser
**File**: `src/services/outputParser.ts`

```typescript
export class OutputParser {
  // Parse different command outputs
  static parseFFmpegOutput(line: string): ParsedOutput
  static parseCpOutput(line: string): ParsedOutput
  static parseGenericOutput(line: string): ParsedOutput
  
  // Extract progress information
  static extractProgress(command: string, line: string): number | null
  
  // Categorize log levels
  static categorizeLogLevel(line: string): LogLevel
}

interface ParsedOutput {
  level: LogLevel
  message: string
  progress?: number
  metadata?: Record<string, any>
}
```

### Phase 2: Backend Integration

#### 2.1 Enhanced Command Execution
**File**: `electron/main.ts`

Updates needed:

```typescript
import { spawn, ChildProcess } from 'child_process'

// Enhanced command execution with logging
ipcMain.handle('execute-command-with-logging', async (
  _event: any, 
  sessionId: string,
  command: string, 
  args: string[], 
  options: ExecutionOptions
) => {
  const childProcess = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: options.workingDirectory
  })

  // Stream stdout
  childProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        const parsed = OutputParser.parseGenericOutput(line)
        sendLogToRenderer(sessionId, {
          type: 'stdout',
          level: parsed.level,
          message: parsed.message,
          source: command,
          metadata: parsed.metadata
        })
      }
    })
  })

  // Stream stderr
  childProcess.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        sendLogToRenderer(sessionId, {
          type: 'stderr',
          level: 'error',
          message: line,
          source: command
        })
      }
    })
  })

  // Handle process completion
  childProcess.on('close', (code) => {
    sendSessionEnd(sessionId, code || 0)
  })

  return { processId: childProcess.pid, sessionId }
})
```

#### 2.2 Preload Script Updates
**File**: `electron/preload.ts`

```typescript
// Add logging APIs
contextBridge.exposeInMainWorld('loggingAPI', {
  createSession: (command: string, inputFiles: string[], outputFiles: string[]) => 
    ipcRenderer.invoke('create-log-session', command, inputFiles, outputFiles),
  
  executeWithLogging: (sessionId: string, command: string, args: string[], options: any) => 
    ipcRenderer.invoke('execute-command-with-logging', sessionId, command, args, options),
  
  onLogEntry: (callback: (entry: LogEntry) => void) => 
    ipcRenderer.on('log-entry', (_event, entry) => callback(entry)),
  
  onSessionEnd: (callback: (sessionId: string, exitCode: number) => void) => 
    ipcRenderer.on('session-end', (_event, sessionId, exitCode) => callback(sessionId, exitCode)),
  
  exportLogs: (filter: LogFilter, format: string) => 
    ipcRenderer.invoke('export-logs', filter, format),
  
  clearLogs: (beforeDate?: Date) => 
    ipcRenderer.invoke('clear-logs', beforeDate)
})
```

### Phase 3: UI Components Development

#### 3.1 Log Viewer Component
**File**: `src/components/LogViewer.vue`

Features:

- Real-time log display with auto-scroll
- Log level filtering (info, warning, error, debug)
- Search and highlight functionality
- Progress indicators for active sessions
- Export buttons
- Clear/archive options

```vue
<template>
  <div class="log-viewer">
    <div class="log-header">
      <div class="log-controls">
        <select v-model="selectedLevel" @change="filterLogs">
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        
        <input 
          v-model="searchText" 
          placeholder="Search logs..." 
          @input="filterLogs"
          class="search-input"
        />
        
        <button @click="clearLogs" class="clear-button">Clear</button>
        <button @click="exportLogs" class="export-button">Export</button>
      </div>
    </div>
    
    <div class="log-content" ref="logContainer">
      <div 
        v-for="entry in filteredLogs" 
        :key="entry.id"
        :class="['log-entry', `log-${entry.level}`]"
      >
        <span class="timestamp">{{ formatTime(entry.timestamp) }}</span>
        <span class="level">{{ entry.level.toUpperCase() }}</span>
        <span class="source">{{ entry.source }}</span>
        <span class="message">{{ entry.message }}</span>
      </div>
    </div>
    
    <div v-if="activeSessions.length > 0" class="progress-section">
      <div 
        v-for="session in activeSessions" 
        :key="session.id"
        class="session-progress"
      >
        <div class="session-info">
          <span>{{ session.command }}</span>
          <span class="progress-text">{{ session.progress || 0 }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${session.progress || 0}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 3.2 Mini Log Display
**File**: `src/components/MiniLogDisplay.vue`

A compact log display for integration into the main conversion interface:

- Shows last few log entries
- Progress indicator for current operation
- Click to expand to full log viewer
- Status indicators (success, error, warning)

#### 3.3 Log Export Dialog
**File**: `src/components/LogExportDialog.vue`

Features:

- Format selection (JSON, TXT, CSV)
- Date range filtering
- Log level filtering
- Command filtering
- Preview before export

### Phase 4: Integration and Enhancement

#### 4.1 Progress Parsing

Implement command-specific progress parsers:

```typescript
// FFmpeg progress parsing
export class FFmpegProgressParser {
  static parseProgress(line: string): number | null {
    // Parse "frame=  123 fps= 25 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1677.7kbits/s speed=1.02x"
    const timeMatch = line.match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
    const durationMatch = line.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/)
    
    if (timeMatch && durationMatch) {
      const currentSeconds = this.timeToSeconds(timeMatch)
      const totalSeconds = this.timeToSeconds(durationMatch)
      return Math.round((currentSeconds / totalSeconds) * 100)
    }
    return null
  }
}
```

#### 4.2 Error Pattern Recognition

```typescript
export class ErrorPatternMatcher {
  private static patterns = [
    { pattern: /No such file or directory/, type: 'file_not_found' },
    { pattern: /Permission denied/, type: 'permission_error' },
    { pattern: /Invalid argument/, type: 'invalid_argument' },
    { pattern: /ffmpeg.*error/i, type: 'ffmpeg_error' }
  ]
  
  static categorizeError(message: string): ErrorType | null {
    for (const { pattern, type } of this.patterns) {
      if (pattern.test(message)) {
        return type
      }
    }
    return null
  }
}
```

### Phase 5: Persistence and Management

#### 5.1 Log Database Schema
**File**: `src/services/logDatabase.ts`

```typescript
interface LogDatabase {
  sessions: CommandSession[]
  logs: LogEntry[]
  settings: LogSettings
}

export class LogDatabaseManager {
  private dbPath: string
  
  async initializeDatabase(): Promise<void>
  async saveSession(session: CommandSession): Promise<void>
  async loadSessions(filter?: LogFilter): Promise<CommandSession[]>
  async cleanupOldLogs(olderThan: Date): Promise<void>
  async getStorageStats(): Promise<LogStorageStats>
}
```

#### 5.2 Log Rotation and Cleanup

- Automatic cleanup of logs older than configurable period
- Size-based log rotation
- Compression of archived logs
- User-configurable retention policies

## File Structure Changes

```
src/
├── components/
│   ├── LogViewer.vue (new)
│   ├── MiniLogDisplay.vue (new)
│   ├── LogExportDialog.vue (new)
│   └── ConversionSettings.vue (updated)
├── services/
│   ├── loggingService.ts (new)
│   ├── outputParser.ts (new)
│   ├── logDatabase.ts (new)
│   └── progressParsers/ (new)
│       ├── ffmpegParser.ts
│       └── genericParser.ts
├── types/
│   ├── logging.ts (new)
│   └── electron.d.ts (updated)
└── stores/
    └── loggingStore.ts (new)
```

## Technical Considerations

### Performance

- Stream processing to avoid memory buildup
- Virtual scrolling for large log displays
- Debounced search and filtering
- Background log persistence

### Storage

- SQLite for structured log storage
- File-based storage for log content
- Configurable retention policies
- Compression for archived logs

### Error Handling

- Graceful handling of command failures
- Recovery from logging system errors
- Fallback to console logging if UI unavailable

## Success Criteria

1. Real-time display of command output without UI blocking
2. Accurate progress tracking for supported commands
3. Comprehensive error logging and categorization
4. Efficient search and filtering of historical logs
5. Successful export of logs in multiple formats
6. Stable performance with high-volume command output
7. Persistent storage of logs across application restarts

## Future Enhancements

- Log analytics and statistics
- Custom log parsing rules
- Integration with external logging services
- Log-based notifications and alerts
- Advanced search with regex support
- Log comparison tools
- Remote log sharing capabilities

---

## ⚠️ OBSOLETE STATUS

### Why This Document Is Obsolete

This implementation plan has been deprecated for the following reasons:

1. **Architectural Changes**: The project architecture has evolved significantly since this plan was created
2. **Simplified Approach**: A simpler logging solution was implemented that better fits the current application needs
3. **Maintenance Overhead**: The comprehensive system described here would have introduced unnecessary complexity
4. **Performance Considerations**: The planned system would have added significant overhead for minimal benefit

### Current Implementation Status

- **Basic Logging**: Simple console output logging is currently implemented
- **Progress Display**: Basic progress indicators are shown during operations
- **Error Handling**: Error messages are displayed to users in a simplified format
- **No Persistence**: Logs are not persisted across sessions (intentional design decision)

### Recommendations for Reference

If reviewing this document for historical purposes:

1. **Do not implement** this system as described
2. **Consider extracting** useful concepts for future lightweight logging improvements
3. **Refer to** current application code for actual implementation patterns
4. **Contact** the project maintainers if logging requirements change significantly

### Archive Information

- **Archived Date**: December 27, 2025
- **Archived By**: GitHub Copilot
- **Location**: `/docs/obsolete/` folder
- **Purpose**: Historical reference and learning material
