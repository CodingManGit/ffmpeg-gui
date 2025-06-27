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
    }
    ipcRenderer: {
      on(channel: string, listener: (event: any, ...args: any[]) => void): void
      off(channel: string, ...args: any[]): void
      send(channel: string, ...args: any[]): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
  }
}
