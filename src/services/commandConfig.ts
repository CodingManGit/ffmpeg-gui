import type { CommandOption, CommandsConfig, UserCommandOptions } from '../types/command-options'

declare global {
  interface Window {
    commandAPI?: {
      getCommandConfig?: () => Promise<CommandsConfig>
      getPathToBinary?: (binaryName: string) => Promise<string | null>
      executeCommand?: (command: string, args: string[]) => Promise<boolean>
    }
  }
}



export class CommandConfigService {
  private static config: CommandsConfig | null = null

  static async loadConfig(): Promise<CommandsConfig> {
    if (this.config) return this.config

    try {
      // Check if we're in Electron and use IPC
      const isElectron = typeof window !== 'undefined' && window.commandAPI !== undefined

      if (isElectron) {
        // In Electron, prefer IPC to load config from main process, but fall back to file-based loader
        console.log('Running in Electron environment')
        try {
          if (window.commandAPI?.getCommandConfig) {
            console.log('Loading config via IPC in Electron environment')
            this.config = await window.commandAPI.getCommandConfig()
            return this.config!
          } else {
            console.log('No IPC getCommandConfig handler available, trying file-based Electron loader')
            this.config = await this.loadConfigForElectron()
            return this.config!
          }
        } catch (error) {
          console.warn('IPC config fetch failed, falling back to file loader', error)
          this.config = await this.loadConfigForElectron()
          return this.config!
        }
      } else {
        // Regular web environment - use fetch
        console.log('Loading config via fetch in web environment')
        return await this.loadConfigForWeb()
      }
      
    } catch (error) {
      console.error('Failed to load command config:', error)
      // Fallback to empty config if file not found
      return this.getEmptyConfig()
    }
  }

  private static async loadConfigForWeb(): Promise<CommandsConfig> {
    // Try multiple possible paths for the config file
    const possiblePaths = [
      '/command-options.json',
      './command-options.json',
      'command-options.json'
    ]
    
    let lastError: Error | null = null
    
    for (const path of possiblePaths) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          const commandOptionsJson = await response.text()
          this.config = JSON.parse(commandOptionsJson) as CommandsConfig
          console.log(`Loaded command config from: ${path}`)
          return this.config!
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to load config from ${path}:`, error)
      }
    }
    
    // If all fetch attempts failed, try to load from window.location
    if (typeof window !== 'undefined' && window.location) {
      const baseUrl = window.location.origin
      const configUrl = `${baseUrl}/command-options.json`
      try {
        const response = await fetch(configUrl)
        if (response.ok) {
          const commandOptionsJson = await response.text()
          this.config = JSON.parse(commandOptionsJson) as CommandsConfig
          console.log(`Loaded command config from absolute URL: ${configUrl}`)
          return this.config!
        }
      } catch (error) {
        lastError = error as Error
      }
    }
    
    throw lastError || new Error('All config loading attempts failed')
  }

  private static async loadConfigForElectron(): Promise<CommandsConfig> {
    console.log('Attempting to load config in Electron environment...')
    console.log('Window location:', window.location.href)
    console.log('Window protocol:', window.location.protocol)
    
    // Try multiple paths for Electron
    const pathsToTry = [
      'command-options.json',           // Relative to current page
      './command-options.json',         // Same directory
      '/command-options.json',          // Root directory
      'file:///command-options.json',   // Absolute file path
    ]
    
    // If we're running from file://, try to construct the path
    if (window.location.protocol === 'file:') {
      const basePath = window.location.pathname
      const dirPath = basePath.substring(0, basePath.lastIndexOf('/'))
      pathsToTry.push(`file://${dirPath}/command-options.json`)
      pathsToTry.push(`${dirPath}/command-options.json`)
      console.log('File:// URL detected, base path:', dirPath)
    }
    
    for (const path of pathsToTry) {
      console.log(`Trying to fetch from: ${path}`)
      try {
        const response = await fetch(path)
        console.log(`Fetch response for ${path}:`, response.status, response.statusText)
        
        if (response.ok) {
          const commandOptionsJson = await response.text()
          console.log(`Successfully loaded config from: ${path}`)
          console.log('Config content length:', commandOptionsJson.length)
          this.config = JSON.parse(commandOptionsJson) as CommandsConfig
          console.log('Config commands available:', Object.keys(this.config.commands))
          if (this.config.commands.ffmpeg) {
            console.log('FFmpeg categories:', Object.keys(this.config.commands.ffmpeg.categories))
          }
          return this.config!
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${path}:`, error)
      }
    }
    
    // If fetch doesn't work, try XMLHttpRequest (older but sometimes works better with file://)
    console.log('Fetch attempts failed, trying XMLHttpRequest...')
    for (const path of pathsToTry) {
      try {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', path, false) // synchronous
        xhr.send()
        
        if (xhr.status === 200) {
          const commandOptionsJson = xhr.responseText
          console.log(`Successfully loaded config via XHR from: ${path}`)
          this.config = JSON.parse(commandOptionsJson) as CommandsConfig
          return this.config!
        }
      } catch (error) {
        console.warn(`XHR failed for ${path}:`, error)
      }
    }
    
    console.error('All Electron config loading attempts failed')
    throw new Error('Could not load config in Electron environment')
  }

  private static getEmptyConfig(): CommandsConfig {
    return {
      commands: {}
    }
  }

  static validateOption(option: CommandOption, value: any): boolean {
    // Check if required field is empty
    if (option.required && (value === '' || value === null || value === undefined)) {
      return false
    }

    // Validate based on type
    switch (option.type) {
      case 'text':
        if (option.validation && value) {
          const regex = new RegExp(option.validation)
          return regex.test(value as string)
        }
        return true

      case 'number':
        return typeof value === 'number' && !isNaN(value)

      case 'boolean':
        return typeof value === 'boolean'

      case 'select':
        return option.options?.includes(value as string) ?? false

      case 'multi-select':
        if (!Array.isArray(value)) return false
        return value.every(v => option.options?.includes(v))

      default:
        return true
    }
  }

  static generateCommandFlags(
    userOptions: UserCommandOptions,
    command: string,
    config: CommandsConfig
  ): string[] {
    const flags: string[] = []
    const commandConfig = config.commands[command]

    if (!commandConfig) {
      console.warn(`Command ${command} not found in config`)
      return flags
    }

    // Iterate through all categories and options
    for (const category of Object.values(commandConfig.categories)) {
      for (const [key, option] of Object.entries(category.options)) {
        const value = userOptions[key]

        // Skip if value is undefined or null
        if (value === undefined || value === null) {
          // Use default if available
          if (option.default !== undefined) {
            const defaultVal = option.default
            if (this.shouldIncludeOption(option, defaultVal)) {
              flags.push(...this.buildFlag(option, defaultVal))
            }
          }
          continue
        }

        // Add flag if value should be included
        if (this.shouldIncludeOption(option, value)) {
          flags.push(...this.buildFlag(option, value))
        }
      }
    }

    return flags
  }

  private static shouldIncludeOption(option: CommandOption, value: any): boolean {
    // For boolean flags, only include if true
    if (option.type === 'boolean') {
      return value === true
    }

    // For select with "none" option, skip if none is selected
    if (option.type === 'select' && value === 'none') {
      return false
    }

    // For text/number, include if has value
    if (option.type === 'text' || option.type === 'number') {
      return value !== ''
    }

    // For multi-select, include if array has items
    if (option.type === 'multi-select') {
      return Array.isArray(value) && value.length > 0
    }

    return true
  }

  private static buildFlag(option: CommandOption, value: any): string[] {
    const flags: string[] = []

    switch (option.type) {
      case 'boolean':
        // Just the flag, no value
        flags.push(option.flag)
        break

      case 'select':
      case 'text':
      case 'number':
        // Flag and value
        flags.push(option.flag, String(value))
        break

      case 'multi-select':
        // Flag with each value
        if (Array.isArray(value)) {
          value.forEach(v => {
            flags.push(option.flag, String(v))
          })
        }
        break
    }

    return flags
  }

  static getCommandConfig(command: string, config: CommandsConfig) {
    return config.commands[command]
  }
}
