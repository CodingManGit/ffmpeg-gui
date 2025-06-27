<template>
  <div class="video-queue">
    <div class="queue-header">
      <h3>Processing Queue</h3>
      <div class="queue-actions">
        <button 
          @click="clearQueue" 
          :disabled="videoFiles.length === 0"
          class="clear-button"
        >
          Clear All
        </button>
      </div>
    </div>
    
    <div class="queue-stats">
      <span class="file-count">{{ videoFiles.length }} file{{ videoFiles.length !== 1 ? 's' : '' }}</span>
    </div>
    
    <div class="file-list" v-if="videoFiles.length > 0">
      <div 
        v-for="(file, index) in videoFiles" 
        :key="file.path"
        class="video-file-item"
        :class="{ 
          'processing': file.status === 'processing',
          'completed': file.status === 'completed',
          'error': file.status === 'error'
        }"
      >
        <div class="file-info">
          <div class="file-icon">🎬</div>
          <div class="file-details">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-path" :title="file.path">{{ file.path }}</div>
            <div v-if="file.size" class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
        
        <div class="file-status">
          <span class="status-indicator" :class="file.status">
            {{ getStatusText(file.status) }}
          </span>
        </div>
        
        <div class="file-actions">
          <button 
            @click="removeFile(index)"
            :disabled="file.status === 'processing'"
            class="remove-button"
            title="Remove from queue"
          >
            ×
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-queue">
      <div class="empty-icon">📂</div>
      <p>No video files in queue</p>
      <p class="empty-hint">Use the file explorer to add video files</p>
    </div>
    
    <div class="conversion-controls" v-if="videoFiles.length > 0">
      <button 
        @click="startProcessing"
        :disabled="isProcessing || videoFiles.length === 0"
        class="start-button"
      >
        {{ isProcessing ? 'Processing...' : 'Start Conversion' }}
      </button>
      
      <button 
        @click="stopProcessing"
        :disabled="!isProcessing"
        class="stop-button"
      >
        Stop
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoFile } from '../types/electron'

const props = defineProps<{
  videoFiles: VideoFile[]
}>()

const emit = defineEmits<{
  removeFile: [index: number]
  clearQueue: []
  startProcessing: []
  stopProcessing: []
}>()

const isProcessing = computed(() => {
  return props.videoFiles.some(file => file.status === 'processing')
})

const getStatusText = (status: VideoFile['status']): string => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'processing': return 'Processing'
    case 'completed': return 'Completed'
    case 'error': return 'Error'
    default: return 'Unknown'
  }
}

const removeFile = (index: number) => {
  emit('removeFile', index)
}

const clearQueue = () => {
  emit('clearQueue')
}

const startProcessing = () => {
  emit('startProcessing')
}

const stopProcessing = () => {
  emit('stopProcessing')
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
</script>

<style scoped>
.video-queue {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.queue-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.clear-button {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-button:hover:not(:disabled) {
  background: #5a6268;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.queue-stats {
  padding: 8px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.file-count {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.video-file-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s;
}

.video-file-item:hover {
  background: #f8f9fa;
}

.video-file-item.processing {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.video-file-item.completed {
  background: #d1edff;
  border-left: 4px solid #28a745;
}

.video-file-item.error {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;
  min-width: 0;
}

.file-icon {
  font-size: 20px;
  min-width: 24px;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-path {
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #adb5bd;
  font-weight: 500;
}

.file-status {
  margin: 0 12px;
}

.status-indicator {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.status-indicator.pending {
  background: #e9ecef;
  color: #6c757d;
}

.status-indicator.processing {
  background: #fff3cd;
  color: #856404;
}

.status-indicator.completed {
  background: #d4edda;
  color: #155724;
}

.status-indicator.error {
  background: #f8d7da;
  color: #721c24;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.remove-button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-button:hover:not(:disabled) {
  background: #c82333;
}

.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-queue {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-queue p {
  margin: 8px 0;
  color: #6c757d;
}

.empty-hint {
  font-size: 13px;
  font-style: italic;
}

.conversion-controls {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  gap: 12px;
}

.start-button {
  flex: 1;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.start-button:hover:not(:disabled) {
  background: #218838;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-button {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.stop-button:hover:not(:disabled) {
  background: #c82333;
}

.stop-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
