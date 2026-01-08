<template>
  <div class="process-queue">
    <div class="queue-header">
      <h3>Processing Queue</h3>
      <div class="queue-actions">
        <button
          @click="clearCompleted"
          :disabled="!hasCompletedItems"
          class="clear-button"
          title="Clear completed and failed items"
        >
          Clear Completed
        </button>
        <button
          @click="clearAll"
          :disabled="!fileStore.hasSelection"
          class="clear-button"
          title="Clear all items"
        >
          Clear All
        </button>
      </div>
    </div>

    <div class="queue-stats">
      <span class="file-count">{{ fileStore.selectedCount }} item{{ fileStore.selectedCount !== 1 ? 's' : '' }}</span>
      <span class="file-count" v-if="pendingCount > 0">{{ pendingCount }} pending</span>
      <span class="file-count" v-if="processingCount > 0">{{ processingCount }} processing</span>
      <span class="file-count" v-if="completedCount > 0">{{ completedCount }} completed</span>
      <span class="file-count" v-if="errorCount > 0">{{ errorCount }} failed</span>
    </div>

    <div class="file-list" v-if="fileStore.hasSelection">
      <div
        v-for="item in fileStore.selectedList"
        :key="item.path"
        class="file-item"
        :class="{
          'processing': item.status === 'processing',
          'completed': item.status === 'completed',
          'error': item.status === 'error',
          'existing': item.status === 'existing',
          'duplicate': item.isDuplicate
        }"
      >
        <div class="file-info">
          <div class="file-icon">{{ getFileIcon(item) }}</div>
          <div class="file-details">
            <div class="file-name" :title="item.name">
              {{ item.name }}
              <span v-if="item.isDuplicate" class="duplicate-badge" title="Duplicate filename">⚠️</span>
            </div>
            <div class="file-path" :title="item.path">{{ item.path }}</div>
          </div>
        </div>

        <div class="file-status">
          <span class="status-indicator" :class="item.status">
            {{ getStatusText(item.status) }}
          </span>
        </div>

        <div class="file-actions">
          <button
            @click="removeItem(item.path)"
            :disabled="item.status === 'processing'"
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
      <p>No items selected</p>
      <p class="empty-hint">Use the file explorer to select files and folders</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFileSelectionStore, type SelectedItem } from '../stores/fileSelection'

const fileStore = useFileSelectionStore()

const pendingCount = computed(() => {
  return fileStore.selectedList.filter(item => item.status === 'pending').length
})

const processingCount = computed(() => {
  return fileStore.selectedList.filter(item => item.status === 'processing').length
})

const completedCount = computed(() => {
  return fileStore.selectedList.filter(item => item.status === 'completed').length
})

const errorCount = computed(() => {
  return fileStore.selectedList.filter(item => item.status === 'error').length
})

const hasCompletedItems = computed(() => {
  return fileStore.selectedList.some(item => item.status === 'completed' || item.status === 'error')
})

const getStatusText = (status: SelectedItem['status']): string => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'processing': return 'Processing'
    case 'completed': return 'Completed'
    case 'error': return 'Error'
    case 'existing': return 'Existing'
    default: return 'Unknown'
  }
}

const getFileIcon = (item: SelectedItem): string => {
  if (item.isDirectory) return '📁'
  return '📄'
}

const removeItem = (path: string) => {
  fileStore.removeItem(path)
}

const clearCompleted = () => {
  fileStore.clearCompleted()
}

const clearAll = () => {
  fileStore.clearSelection()
}
</script>

<style scoped>
.process-queue {
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

.queue-actions {
  display: flex;
  gap: 8px;
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
  display: flex;
  gap: 16px;
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

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s;
}

.file-item:hover {
  background: #f8f9fa;
}

.file-item.processing {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.file-item.completed {
  background: #d1edff;
  border-left: 4px solid #28a745;
}

.file-item.error {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.file-item.existing {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.file-item.duplicate {
  opacity: 0.6;
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

.duplicate-badge {
  margin-left: 6px;
  font-size: 14px;
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

.status-indicator.existing {
  background: #fff3cd;
  color: #856404;
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
</style>
