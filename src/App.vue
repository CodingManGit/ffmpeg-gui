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
            @concurrency-changed="updateConcurrency"
            @overwrite-changed="updateOverwrite"
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
import ConversionSettings from './components/ConversionSettings.vue'
import FileExplorer from './components/FileExplorer.vue'
import ProcessQueue from './components/ProcessQueue.vue'
import { CommandBuilder } from './services/commandBuilder'
import { CommandConfigService } from './services/commandConfig'
import { useFileSelectionStore, type SelectedItem } from './stores/fileSelection'
import type { CommandsConfig, UserCommandOptions } from './types/command-options'

const fileStore = useFileSelectionStore()
const isProcessing = ref(false)
const outputDirectory = ref<string>('')
const userOptions = ref<UserCommandOptions>({})
const config = ref<CommandsConfig | null>(null)
const conversionSettingsRef = ref<InstanceType<typeof ConversionSettings> | null>(null)
const commandName = ref<string>('cp')
const concurrency = ref<number>(1)
const overwrite = ref<boolean>(false)
const activeJobs = ref<number>(0)

// Load configuration on mount
const loadConfig = async () => {
  try {
    config.value = await CommandConfigService.loadConfig()
    console.log('App: Config loaded successfully', config.value)
    if (config.value) {
      console.log('App: Available commands:', Object.keys(config.value.commands))
    }
  } catch (error) {
    console.error('Failed to load command configuration:', error)
  }
}

// Initialize configuration
loadConfig()

const updateOutputDirectory = async (dir: string) => {
  outputDirectory.value = dir
  // Trigger conflict detection when output directory changes
  if (dir) {
    const outputFiles = await window.fileSystemAPI.getDirectoryFiles(dir)
    fileStore.getProcessableItems(overwrite.value, outputFiles)
  }
}

const updateOptions = (options: UserCommandOptions) => {
  userOptions.value = options
  console.log('Options updated:', options)
}

const updateCommand = (command: string) => {
  commandName.value = command
  console.log('Command updated:', command)
}

const updateConcurrency = (value: number) => {
  concurrency.value = value
  console.log('Concurrency updated:', value)
}

const updateOverwrite = async (value: boolean) => {
  overwrite.value = value
  console.log('Overwrite updated:', value)
  // Update duplicate status in store when overwrite changes
  if (outputDirectory.value) {
    const outputFiles = await window.fileSystemAPI.getDirectoryFiles(outputDirectory.value)
    fileStore.getProcessableItems(value, outputFiles)
  } else {
    fileStore.getProcessableItems(value)
  }
}

const processItem = async (item: SelectedItem, outputDir: string): Promise<void> => {
  if (!isProcessing.value) return

  fileStore.updateItemStatus(item.path, 'processing')
  activeJobs.value++

  try {
    // Generate output filename
    const outputFileName = item.name
    const outputPath = `${outputDir}/${outputFileName}`

    console.log(`Processing ${item.name}...`)
    console.log(`Source: ${item.path}`)
    console.log(`Destination: ${outputPath}`)

    // If overwrite is enabled, delete the output file first if it exists
    if (overwrite.value) {
      const deleteSuccess = await window.commandAPI.executeCommand(
        process.platform === 'win32' ? 'del' : 'rm',
        [outputPath]
      )
      if (deleteSuccess) {
        console.log(`Deleted existing file: ${outputPath}`)
      } else {
        console.warn(`Could not delete existing file (may not exist): ${outputPath}`)
      }
    }

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
  } finally {
    activeJobs.value--
  }
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
  activeJobs.value = 0

  console.log('Starting processing to:', outputDir)
  console.log('Concurrency level:', concurrency.value)

  // Ensure output directory exists
  const dirCreated = await window.fileSystemAPI.ensureDirectory(outputDir)
  if (!dirCreated) {
    console.error('Failed to create output directory')
    isProcessing.value = false
    return
  }

  // Scan output directory for existing files
  const outputFiles = await window.fileSystemAPI.getDirectoryFiles(outputDir)
  console.log('Output directory contains', outputFiles.length, 'files')

  // Get all processable items (respecting overwrite setting and checking output directory)
  const pendingItems = fileStore.getProcessableItems(overwrite.value, outputFiles).filter(item => item.status === 'pending')
  const queue: SelectedItem[] = [...pendingItems]
  const processingPromises: Promise<void>[] = []

  // Process items with concurrency control
  while (queue.length > 0 && isProcessing.value) {
    // Fill up to concurrency limit
    while (activeJobs.value < concurrency.value && queue.length > 0 && isProcessing.value) {
      const item = queue.shift()!
      const promise = processItem(item, outputDir)
        .then(() => {
          // Remove from processing promises when done
          const index = processingPromises.indexOf(promise)
          if (index > -1) {
            processingPromises.splice(index, 1)
          }
        })
      processingPromises.push(promise)
    }

    // Wait for at least one job to complete before adding more
    if (processingPromises.length >= concurrency.value || queue.length === 0) {
      await Promise.race(processingPromises)
    }
  }

  // Wait for all remaining jobs to complete
  await Promise.all(processingPromises)

  isProcessing.value = false
  activeJobs.value = 0
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
