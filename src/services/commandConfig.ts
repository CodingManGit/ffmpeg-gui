import type { CommandsConfig, CommandOption, UserCommandOptions } from '../types/command-options'

// Import the config directly as raw text - Vite will inline it
import commandOptionsJson from '../config/command-options.json?raw'

export class CommandConfigService {
  private static config: CommandsConfig | null = null

  static async loadConfig(): Promise<CommandsConfig> {
    if (this.config) return this.config

    // Parse the imported JSON
    try {
      this.config = JSON.parse(commandOptionsJson) as CommandsConfig
      console.log('Loaded command config from bundled config')
      return this.config!
    } catch (error) {
      console.error('Failed to load command config:', error)
      throw new Error('Configuration file not found or invalid')
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
