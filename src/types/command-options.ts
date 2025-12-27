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
