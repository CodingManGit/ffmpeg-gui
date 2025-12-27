<template>
  <div class="app">
    <div class="app-body">
      <div class="sidebar">
        <FileExplorer />
        <div class="conversion-settings-inline">
          <ConversionSettings
            ref="conversionSettingsRef"
            :is-processing="isProcessing"
            @start-conversion="startConversion"
            @stop-conversion="stopConversion"
            @output-directory-changed="updateOutputDirectory"
            @options-changed="updateOptions"
            @command-changed="updateCommand"
          />
        </div>
      </div>

      <div class="main-content">
        <ProcessQueue />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileExplorer from './components/FileExplorer.vue'
import ProcessQueue from './components/ProcessQueue.vue'
import ConversionSettings from './components/ConversionSettings.vue'
import { CommandBuilder } from './services/commandBuilder'
import { CommandConfigService } from './services/commandConfig'
import { useFileSelectionStore } from './stores/fileSelection'
import type { UserCommandOptions, CommandsConfig } from './types/command-options'

const fileStore = useFileSelectionStore()
const isProcessing = ref(false)
const outputDirectory = ref<string>('')
const userOptions = ref<UserCommandOptions>({})
const config = ref<CommandsConfig | null>(null)
const conversionSettingsRef = ref<InstanceType<typeof ConversionSettings> | null>(null)
const commandName = ref<string>('cp')

// Load configuration on mount
const loadConfig = async () => {
  try {
    config.value = await CommandConfigService.loadConfig()
  } catch (error) {
    console.error('Failed to load command configuration:', error)
  }
}

// Initialize configuration
loadConfig()

const updateOutputDirectory = (dir: string) => {
  outputDirectory.value = dir
}

const updateOptions = (options: UserCommandOptions) => {
  userOptions.value = options
  console.log('Options updated:', options)
}

const updateCommand = (command: string) => {
  commandName.value = command
  console.log('Command updated:', command)
}

const startConversion = async (outputDir: string) => {
  if (isProcessing.value) return

  // Check if there are any selected items
  if (!fileStore.hasSelection) {
    console.warn('No items selected for processing')
    return
  }

  isProcessing.value = true
  outputDirectory.value = outputDir

  console.log('Starting processing to:', outputDir)

  // Ensure output directory exists
  const dirCreated = await window.fileSystemAPI.ensureDirectory(outputDir)
  if (!dirCreated) {
    console.error('Failed to create output directory')
    isProcessing.value = false
    return
  }

  // Process each pending file
  const pendingItems = fileStore.selectedList.filter(item => item.status === 'pending' && !item.isDirectory)

  for (const item of pendingItems) {
    if (!isProcessing.value) break // Stop if user clicked stop

    fileStore.updateItemStatus(item.path, 'processing')

    try {
      // Generate output filename
      const outputFileName = item.name
      const outputPath = `${outputDir}/${outputFileName}`

      console.log(`Processing ${item.name}...`)
      console.log(`Source: ${item.path}`)
      console.log(`Destination: ${outputPath}`)

      // Build command with user options
      if (config.value) {
        const { command, args } = CommandBuilder.buildCommand(
          commandName.value,
          item.path,
          outputPath,
          userOptions.value,
          config.value
        )

        console.log(`Executing: ${command} ${args.join(' ')}`)

        // Execute command using the command API
        const success = await window.commandAPI.executeCommand(command, args)

        if (success) {
          fileStore.updateItemStatus(item.path, 'completed')
          console.log(`✅ Successfully processed ${item.name}`)
        } else {
          fileStore.updateItemStatus(item.path, 'error')
          console.error(`❌ Failed to process ${item.name}`)
        }
      } else {
        throw new Error('Configuration not loaded')
      }
    } catch (error) {
      console.error(`Error processing ${item.name}:`, error)
      fileStore.updateItemStatus(item.path, 'error')
    }

    // Add a small delay to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  isProcessing.value = false
  console.log('Processing completed')
}

const stopConversion = () => {
  console.log('Stopping processing...')
  isProcessing.value = false

  // Reset processing items back to pending
  const processingItems = fileStore.selectedList.filter(item => item.status === 'processing')
  processingItems.forEach(item => {
    fileStore.updateItemStatus(item.path, 'pending')
  })
}
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  min-width: 250px;
  max-width: 400px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  resize: horizontal;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.conversion-settings-inline {
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  background: white;
  overflow: hidden;
}
</style>
