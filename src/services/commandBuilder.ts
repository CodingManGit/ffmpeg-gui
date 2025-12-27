import type { UserCommandOptions, CommandsConfig } from '../types/command-options'
import { CommandConfigService } from './commandConfig'

export class CommandBuilder {
  static buildCommand(
    command: string,
    inputPath: string,
    outputPath: string,
    userOptions: UserCommandOptions,
    config: CommandsConfig
  ): { command: string; args: string[] } {
    const args: string[] = []

    // Add input file based on command type
    if (command === 'ffmpeg') {
      // FFmpeg uses -i flag for input
      args.push('-i', inputPath)
    } else if (command === 'cp') {
      // cp command: source comes before options, destination at end
      args.push(inputPath)
    } else {
      // For other commands, add input path first
      args.push(inputPath)
    }

    // Add user option flags
    const optionFlags = CommandConfigService.generateCommandFlags(userOptions, command, config)
    args.push(...optionFlags)

    // Handle special case for resolution "original"
    if (command === 'ffmpeg' && userOptions.resolution === 'original') {
      // Remove the -s flag if it exists
      const resolutionIndex = args.indexOf('-s')
      if (resolutionIndex !== -1) {
        args.splice(resolutionIndex, 2)
      }
    }

    // Add output path
    args.push(outputPath)

    return {
      command,
      args
    }
  }

  static buildPreviewCommand(
    command: string,
    userOptions: UserCommandOptions,
    config: CommandsConfig
  ): string {
    const { args } = this.buildCommand(command, '<input>', '<output>', userOptions, config)

    // Build readable command string
    const commandParts = [command, ...args]
    return commandParts.join(' ')
  }
}
