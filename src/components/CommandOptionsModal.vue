<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="closeOnOverlayClick && close()">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ commandConfig.name }}</h2>
            <button @click="close()" class="close-button">&times;</button>
          </div>

          <div class="modal-body">
            <div class="command-description">{{ commandConfig.description }}</div>

            <div class="tabs">
              <button
                v-for="(category, key) in commandConfig.categories"
                :key="key"
                @click="activeCategory = key"
                class="tab-button"
                :class="{ 'is-active': activeCategory === key }"
              >
                {{ category.name }}
              </button>
            </div>

            <div class="tab-content">
              <div v-if="currentCategory" class="category-description">
                {{ currentCategory.description }}
              </div>

              <div class="options-list">
                <div
                  v-for="(option, key) in currentCategory?.options"
                  :key="key"
                  class="option-item"
                >
                  <div class="option-header">
                    <label class="option-label">{{ option.name }}</label>
                    <OptionHelp :option="option" />
                  </div>

                  <div class="option-input">
                    <TextOption
                      v-if="option.type === 'text' || option.type === 'number'"
                      :option="option"
                      :model-value="getOptionValue(key, option)"
                      @update:model-value="setOptionValue(key, $event, option)"
                    />

                    <BooleanOption
                      v-if="option.type === 'boolean'"
                      :option="option"
                      :model-value="getOptionValue(key, option)"
                      @update:model-value="setOptionValue(key, $event, option)"
                    />

                    <SelectOption
                      v-if="option.type === 'select'"
                      :option="option"
                      :model-value="getOptionValue(key, option)"
                      @update:model-value="setOptionValue(key, $event, option)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="command-preview">
              <div class="preview-header">
                <strong>Command Preview:</strong>
              </div>
              <code class="preview-command">{{ commandPreview }}</code>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="resetToDefaults" class="reset-button">
              Reset to Defaults
            </button>
            <div class="footer-actions">
              <button @click="close()" class="cancel-button">
                Cancel
              </button>
              <button @click="save()" class="save-button">
                Save Options
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CommandConfig, UserCommandOptions, CommandOption } from '../types/command-options'
import { CommandBuilder } from '../services/commandBuilder'
import TextOption from './options/TextOption.vue'
import BooleanOption from './options/BooleanOption.vue'
import SelectOption from './options/SelectOption.vue'
import OptionHelp from './options/OptionHelp.vue'

interface Props {
  isOpen: boolean
  commandConfig: CommandConfig
  commandName: string
  config: any // CommandsConfig - using any to avoid circular dependency
  modelValue: UserCommandOptions
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'update:modelValue': [value: UserCommandOptions]
}>()

const activeCategory = ref<string>(Object.keys(props.commandConfig.categories)[0])
const localOptions = ref<UserCommandOptions>({ ...props.modelValue })
const closeOnOverlayClick = ref(true)

// Get current category
const currentCategory = computed(() => {
  return props.commandConfig.categories[activeCategory.value]
})

// Get command preview
const commandPreview = computed(() => {
  return CommandBuilder.buildPreviewCommand(
    props.commandName,
    localOptions.value,
    props.config
  )
})

// Get option value with default fallback
const getOptionValue = (key: string, option: CommandOption): any => {
  if (localOptions.value[key] !== undefined) {
    return localOptions.value[key]
  }
  return option.default
}

// Set option value
const setOptionValue = (key: string, value: any, _option: CommandOption) => {
  localOptions.value[key] = value
}

// Reset to defaults
const resetToDefaults = () => {
  const defaults: UserCommandOptions = {}

  for (const category of Object.values(props.commandConfig.categories)) {
    for (const [key, option] of Object.entries(category.options)) {
      if (option.default !== undefined) {
        defaults[key] = option.default
      }
    }
  }

  localOptions.value = defaults
}

// Close modal
const close = () => {
  emit('update:isOpen', false)
}

// Save options
const save = () => {
  emit('update:modelValue', { ...localOptions.value })
  close()
}

// Watch for isOpen changes to reset local options
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    localOptions.value = { ...props.modelValue }
    // Reset to first category
    activeCategory.value = Object.keys(props.commandConfig.categories)[0]
  }
})

// Watch for modelValue changes from parent
watch(() => props.modelValue, (newValue) => {
  if (props.isOpen) {
    localOptions.value = { ...newValue }
  }
}, { deep: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #e9ecef;
  color: #495057;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.command-description {
  margin-bottom: 20px;
  color: #6c757d;
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #dee2e6;
}

.tab-button {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.tab-button.is-active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content {
  margin-bottom: 24px;
}

.category-description {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
  color: #495057;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-header {
  display: flex;
  align-items: center;
}

.option-label {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
  margin: 0;
}

.option-input {
  margin-left: 26px; /* Align with help icon offset */
}

.command-preview {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.preview-header {
  margin-bottom: 8px;
  font-size: 13px;
  color: #495057;
}

.preview-command {
  display: block;
  padding: 12px;
  background-color: #212529;
  color: #f8f9fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.reset-button {
  padding: 8px 16px;
  background: none;
  border: 1px solid #ced4da;
  border-radius: 4px;
  color: #6c757d;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
  color: #495057;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.cancel-button {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.save-button {
  padding: 8px 16px;
  background: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background: #0056b3;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
