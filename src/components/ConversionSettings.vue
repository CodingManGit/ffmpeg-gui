<template>
  <div class="conversion-settings">
    <div class="settings-header">
      <h3>{{ $t('conversionSettings.title') }}</h3>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <label for="command-select">{{ $t('conversionSettings.command') }}:</label>
        <select
          id="command-select"
          v-model="localCommandName"
          class="command-select"
          :disabled="isProcessing"
        >
          <option v-for="(cmdConfig, cmdKey) in availableCommands" :key="cmdKey" :value="cmdKey">
            {{ cmdConfig.name }}
          </option>
        </select>
        <div class="command-description">
          {{ selectedCommandDescription }}
        </div>
      </div>

      <div class="setting-item">
        <label for="output-directory">{{ $t('conversionSettings.outputDirectory') }}:</label>
        <div class="directory-selector">
          <input
            id="output-directory"
            type="text"
            :value="outputDirectory"
            readonly
            :placeholder="$t('conversionSettings.selectOutput') + '...'"
            class="directory-input"
          />
          <button @click="selectOutputDirectory" class="browse-button">
            {{ $t('common.browse') }}
          </button>
        </div>
        <div v-if="outputDirectory" class="directory-info">
          {{ $t('conversionSettings.filesWillBeSavedTo', { path: outputDirectory }) }}
        </div>
      </div>

      <div class="setting-item">
        <label>{{ $t('conversionSettings.commandOptions') }}:</label>
        <button @click="openOptionsModal" class="options-button">
          {{ $t('conversionSettings.configureOptions') }}
        </button>
        <div v-if="hasCustomOptions" class="options-summary">
          {{ optionsSummary }}
        </div>
      </div>

      <div class="setting-item">
        <div class="concurrency-row">
          <div class="concurrency-input">
            <label for="concurrency-select">{{ $t('conversionSettings.concurrency') }}:</label>
            <select
              id="concurrency-select"
              v-model.number="concurrency"
              class="concurrency-select"
              :disabled="isProcessing"
            >
              <option v-for="n in 10" :key="n" :value="n">
                {{ n }} {{ n > 1 ? $t('conversionSettings.jobs') : $t('conversionSettings.job') }}
              </option>
            </select>
          </div>
          <div class="overwrite-checkbox">
            <label for="overwrite-checkbox" class="checkbox-label">
              <input
                id="overwrite-checkbox"
                type="checkbox"
                v-model="overwrite"
                :disabled="isProcessing"
                class="checkbox-input"
              />
              {{ $t('conversionSettings.overwrite') }}
            </label>
          </div>
        </div>
        <div class="concurrency-info">
          {{ $t('conversionSettings.processUpTo', { count: concurrency, plural: concurrency > 1 ? 's' : '' }) }}
        </div>
      </div>

      <div class="conversion-actions">
        <button
          @click="startConversion"
          :disabled="!canStartConversion"
          class="convert-button"
        >
          {{ $t('conversionSettings.startConversion') }}
        </button>
        <button
          @click="stopConversion"
          :disabled="!isProcessing"
          class="stop-button"
        >
          {{ $t('conversionSettings.stop') }}
        </button>
      </div>
    </div>

    <!-- Command Options Modal -->
    <CommandOptionsModal
      v-if="commandConfig"
      :is-open="isModalOpen"
      :command-config="commandConfig"
      :command-name="localCommandName"
      :config="config"
      :model-value="localOptions"
      @update:is-open="isModalOpen = $event"
      @update:model-value="updateOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { CommandConfigService } from '../services/commandConfig'
import { useFileSelectionStore } from '../stores/fileSelection'
import type { CommandsConfig, UserCommandOptions } from '../types/command-options'
import CommandOptionsModal from './CommandOptionsModal.vue'

const { t } = useI18n()

const props = defineProps<{
  isProcessing: boolean
  commandName: string
}>()

const emit = defineEmits<{
  'start-conversion': [outputDir: string]
  'stop-conversion': []
  'output-directory-changed': [outputDir: string]
  'options-changed': [options: UserCommandOptions]
  'command-changed': [command: string]
  'concurrency-changed': [concurrency: number]
  'overwrite-changed': [overwrite: boolean]
}>()

const fileStore = useFileSelectionStore()
const outputDirectory = ref<string>('')
const config = ref<CommandsConfig | null>(null)
const localOptions = ref<UserCommandOptions>({})
const isModalOpen = ref(false)
const concurrency = ref<number>(1)
const overwrite = ref<boolean>(false)

// Local state for command name (synced with prop)
const localCommandName = ref(props.commandName)

// Watch for prop changes
watch(() => props.commandName, (newCommand) => {
  localCommandName.value = newCommand
})

// Available commands from config
const availableCommands = computed(() => {
  return config.value?.commands || {}
})

// Selected command config
const commandConfig = computed(() => {
  if (!config.value) return null
  return CommandConfigService.getCommandConfig(localCommandName.value, config.value)
})

// Description of selected command
const selectedCommandDescription = computed(() => {
  return commandConfig.value?.description || ''
})

const canStartConversion = computed(() => {
  return fileStore.hasSelection &&
         outputDirectory.value &&
         !props.isProcessing &&
         fileStore.selectedList.some(item => item.status === 'pending' && !item.isDirectory)
})

const hasCustomOptions = computed(() => {
  return Object.keys(localOptions.value).length > 0
})

const optionsSummary = computed(() => {
  const count = Object.keys(localOptions.value).length
  return t('conversionSettings.optionsConfigured', { count, plural: count !== 1 ? 's' : '' })
})

// Load configuration on mount
onMounted(async () => {
  try {
    config.value = await CommandConfigService.loadConfig()
    // Initialize with defaults if we have a valid command
    if (config.value && localCommandName.value) {
      const cmdConfig = CommandConfigService.getCommandConfig(localCommandName.value, config.value)
      if (cmdConfig) {
        const defaults: UserCommandOptions = {}
        for (const category of Object.values(cmdConfig.categories)) {
          for (const [key, option] of Object.entries(category.options)) {
            if (option.default !== undefined) {
              defaults[key] = option.default
            }
          }
        }
        localOptions.value = defaults
      }
    }
  } catch (error) {
    console.error('Failed to load command configuration:', error)
  }
})

// Watch for command changes to reset options with defaults
watch(localCommandName, async (newCommand) => {
  if (config.value) {
    const cmdConfig = CommandConfigService.getCommandConfig(newCommand, config.value)
    if (cmdConfig) {
      const defaults: UserCommandOptions = {}
      for (const category of Object.values(cmdConfig.categories)) {
        for (const [key, option] of Object.entries(category.options)) {
          if (option.default !== undefined) {
            defaults[key] = option.default
          }
        }
      }
      localOptions.value = defaults
      emit('command-changed', newCommand)
    }
  }
})

const selectOutputDirectory = async () => {
  try {
    const selectedDir = await window.fileSystemAPI.selectDirectory()
    if (selectedDir) {
      outputDirectory.value = selectedDir
      emit('output-directory-changed', selectedDir)
    }
  } catch (error) {
    console.error('Error selecting output directory:', error)
  }
}

const openOptionsModal = () => {
  isModalOpen.value = true
}

const updateOptions = (options: UserCommandOptions) => {
  localOptions.value = options
  emit('options-changed', options)
}

const startConversion = () => {
  if (canStartConversion.value) {
    emit('start-conversion', outputDirectory.value)
  }
}

const stopConversion = () => {
  emit('stop-conversion')
}

// Watch for concurrency changes
watch(concurrency, (newValue) => {
  emit('concurrency-changed', newValue)
})

// Watch for overwrite changes
watch(overwrite, (newValue) => {
  emit('overwrite-changed', newValue)
})

// Expose options, command, concurrency, and overwrite for parent component
defineExpose({
  getOptions: () => localOptions.value,
  getCommand: () => localCommandName.value,
  getConcurrency: () => concurrency.value,
  getOverwrite: () => overwrite.value
})
</script>

<style scoped>
.conversion-settings {
  background: white;
  border-top: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.settings-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.settings-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #212529;
}

.settings-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item label {
  font-weight: 500;
  color: #495057;
  font-size: 12px;
}

.directory-selector {
  display: flex;
  gap: 6px;
}

.directory-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background: #f8f9fa;
  color: #495057;
}

.directory-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.browse-button,
.options-button {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.browse-button:hover,
.options-button:hover {
  background: #0056b3;
}

.directory-info {
  font-size: 11px;
  color: #6c757d;
  font-style: italic;
}

.options-summary {
  font-size: 11px;
  color: #28a745;
  font-weight: 500;
}

.conversion-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.convert-button {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.convert-button:hover:not(:disabled) {
  background: #218838;
}

.convert-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.stop-button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.stop-button:hover:not(:disabled) {
  background: #c82333;
}

.stop-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.command-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.command-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.command-select:hover:not(:disabled) {
  border-color: #adb5bd;
}

.command-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.6;
}

.command-description {
  font-size: 11px;
  color: #6c757d;
  font-style: italic;
}

.concurrency-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.concurrency-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.concurrency-select:hover:not(:disabled) {
  border-color: #adb5bd;
}

.concurrency-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.6;
}

.concurrency-info {
  font-size: 11px;
  color: #6c757d;
  font-style: italic;
}

.concurrency-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.concurrency-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overwrite-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
