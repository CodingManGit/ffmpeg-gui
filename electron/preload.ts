import { ipcRenderer, contextBridge } from 'electron'
import type { FileSystemItem } from '../src/types/electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Expose file system APIs
contextBridge.exposeInMainWorld('fileSystemAPI', {
  getDirectoryContents: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('get-directory-contents', dirPath),
  getHomeDirectory: (): Promise<string> =>
    ipcRenderer.invoke('get-home-directory'),
  getParentDirectory: (currentPath: string) => ipcRenderer.invoke('get-parent-directory', currentPath),
  checkIfVideoFile: (filePath: string) => ipcRenderer.invoke('check-if-video-file', filePath),
  getFileStats: (filePath: string) => ipcRenderer.invoke('get-file-stats', filePath),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  copyFile: (sourcePath: string, destinationPath: string) => ipcRenderer.invoke('copy-file', sourcePath, destinationPath),
  ensureDirectory: (dirPath: string) => ipcRenderer.invoke('ensure-directory', dirPath),
  listDrives: (): Promise<FileSystemItem[]> => ipcRenderer.invoke('list-drives'),
  getDirectoryFiles: (dirPath: string): Promise<string[]> => ipcRenderer.invoke('get-directory-files', dirPath),
})

// Expose command execution APIs
contextBridge.exposeInMainWorld('commandAPI', {
  executeCommand: (command: string, args: string[]) =>
    ipcRenderer.invoke('execute-command', command, args),
})
