<template>
  <div class="conversion-settings">
    <div class="settings-header">
      <h3>Conversion Settings</h3>
    </div>
    
    <div class="settings-content">
      <div class="setting-item">
        <label for="output-directory">Output Directory:</label>
        <div class="directory-selector">
          <input 
            id="output-directory"
            type="text" 
            :value="outputDirectory" 
            readonly 
            placeholder="Select output directory..."
            class="directory-input"
          />
          <button @click="selectOutputDirectory" class="browse-button">
            Browse
          </button>
        </div>
        <div v-if="outputDirectory" class="directory-info">
          Files will be saved to: {{ outputDirectory }}
        </div>
      </div>
      
      <div class="conversion-actions">
        <button 
          @click="startConversion" 
          :disabled="!canStartConversion"
          class="convert-button"
        >
          Start Conversion
        </button>
        <button 
          @click="stopConversion" 
          :disabled="!isProcessing"
          class="stop-button"
        >
          Stop
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoFile } from '../types/electron'

interface Props {
  videoFiles: VideoFile[]
  isProcessing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'start-conversion': [outputDir: string]
  'stop-conversion': []
  'output-directory-changed': [outputDir: string]
}>()

const outputDirectory = ref<string>('')

const canStartConversion = computed(() => {
  return props.videoFiles.length > 0 && 
         outputDirectory.value && 
         !props.isProcessing &&
         props.videoFiles.some(file => file.status === 'pending')
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
    // You could add a toast notification here
  }
}

const startConversion = () => {
  if (canStartConversion.value) {
    emit('start-conversion', outputDirectory.value)
  }
}

const stopConversion = () => {
  emit('stop-conversion')
}
</script>

<style scoped>
.conversion-settings {
  background: white;
  border-top: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* Prevent this component from being squeezed */
}

.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.settings-content {
  padding: 20px;
  flex: 1;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.directory-selector {
  display: flex;
  gap: 8px;
}

.directory-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: #f8f9fa;
  color: #495057;
}

.directory-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.browse-button {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.browse-button:hover {
  background: #0056b3;
}

.directory-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
}

.conversion-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.convert-button {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
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
  padding: 10px 20px;
  font-size: 14px;
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
</style>
