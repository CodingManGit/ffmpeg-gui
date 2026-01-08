export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

export interface VideoFile {
  name: string
  path: string
  size?: number
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export interface ConversionConfig {
  outputDirectory: string
}

export interface FileStats {
  size: number
  modified: Date
  isDirectory: boolean
  isFile: boolean
}

declare global {
  interface Window {
    fileSystemAPI: {
      getDirectoryContents(dirPath: string): Promise<FileSystemItem[]>
      getHomeDirectory(): Promise<string>
      getParentDirectory(currentPath: string): Promise<string>
      checkIfVideoFile(filePath: string): Promise<boolean>
      getFileStats(filePath: string): Promise<FileStats | null>
      selectDirectory(): Promise<string | null>
      copyFile(sourcePath: string, destinationPath: string): Promise<boolean>
      ensureDirectory(dirPath: string): Promise<boolean>
      listDrives(): Promise<FileSystemItem[]>
      getDirectoryFiles(dirPath: string): Promise<string[]>
    }
    commandAPI?: {
      getCommandConfig?: () => Promise<any>
      getPathToBinary?: (binaryName: string) => Promise<string | null>
      executeCommand?: (command: string, args: string[]) => Promise<boolean>
    }
    platformAPI?: {
      platform: () => Promise<string>
    }
    ipcRenderer: {
      on(channel: string, listener: (event: any, ...args: any[]) => void): void
      off(channel: string, ...args: any[]): void
      send(channel: string, ...args: any[]): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
  }
}
