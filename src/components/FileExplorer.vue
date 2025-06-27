<template>
  <div class="file-explorer">
    <div class="explorer-header">
      <h3>File Explorer</h3>
      <div class="navigation">
        <button 
          @click="navigateUp" 
          :disabled="!canNavigateUp"
          class="nav-button"
          title="Go to parent directory"
        >
          ↑
        </button>
        <button 
          @click="goHome" 
          class="nav-button"
          title="Go to home directory"
        >
          🏠
        </button>
      </div>
    </div>
    
    <div class="current-path">
      <div class="breadcrumb">
        <span 
          v-for="(segment, index) in pathSegments" 
          :key="index"
          class="breadcrumb-item"
          :class="{ active: index === pathSegments.length - 1 }"
          @click="navigateToSegment(index)"
        >
          {{ segment.name }}
          <span v-if="index < pathSegments.length - 1" class="separator">/</span>
        </span>
      </div>
    </div>
    
    <div class="file-list" v-if="!loading">
      <div 
        v-for="item in sortedItems" 
        :key="item.path"
        class="file-item"
        :class="{ 
          'directory': item.isDirectory, 
          'video-file': item.isFile && isVideoFile(item),
          'regular-file': item.isFile && !isVideoFile(item)
        }"
        @click="handleItemClick(item)"
        @dblclick="handleItemDoubleClick(item)"
      >
        <span class="file-icon">
          {{ getFileIcon(item) }}
        </span>
        <span class="file-name">{{ item.name }}</span>
        <button 
          v-if="item.isFile && isVideoFile(item)"
          @click.stop="addToQueue(item)"
          class="add-button"
          title="Add to processing queue"
        >
          +
        </button>
      </div>
    </div>
    
    <div v-else class="loading">
      Loading...
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { FileSystemItem } from '../types/electron'

const emit = defineEmits<{
  addVideoFile: [file: FileSystemItem]
}>()

const currentPath = ref('')
const items = ref<FileSystemItem[]>([])
const loading = ref(false)
const error = ref('')
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv', '.ts', '.mts']

const canNavigateUp = computed(() => {
  return currentPath.value !== '/' && currentPath.value.length > 1
})

const pathSegments = computed(() => {
  if (!currentPath.value) return []
  
  const segments = currentPath.value.split('/').filter(Boolean)
  const result = [{ name: '/', path: '/' }]
  
  let accPath = ''
  for (const segment of segments) {
    accPath += '/' + segment
    result.push({ name: segment, path: accPath })
  }
  
  return result
})

const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    // Then alphabetically
    return a.name.localeCompare(b.name)
  })
})

const isVideoFile = (item: FileSystemItem): boolean => {
  if (!item.isFile) return false
  const ext = item.name.toLowerCase().substring(item.name.lastIndexOf('.'))
  return videoExtensions.includes(ext)
}

const getFileIcon = (item: FileSystemItem): string => {
  if (item.isDirectory) return '📁'
  if (isVideoFile(item)) return '🎬'
  return '📄'
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const loadDirectory = async (path: string) => {
  loading.value = true
  error.value = ''
  
  try {
    const contents = await window.fileSystemAPI.getDirectoryContents(path)
    items.value = contents
    currentPath.value = path
  } catch (err) {
    error.value = `Failed to load directory: ${err}`
    console.error('Error loading directory:', err)
  } finally {
    loading.value = false
  }
}

const navigateUp = async () => {
  if (!canNavigateUp.value) return
  
  try {
    const parentPath = await window.fileSystemAPI.getParentDirectory(currentPath.value)
    await loadDirectory(parentPath)
  } catch (err) {
    error.value = `Failed to navigate up: ${err}`
  }
}

const goHome = async () => {
  try {
    const homePath = await window.fileSystemAPI.getHomeDirectory()
    await loadDirectory(homePath)
  } catch (err) {
    error.value = `Failed to go home: ${err}`
  }
}

const navigateToSegment = async (index: number) => {
  const segment = pathSegments.value[index]
  if (segment) {
    await loadDirectory(segment.path)
  }
}

const handleItemClick = (item: FileSystemItem) => {
  // Single click - just select the item (visual feedback could be added here)
}

const handleItemDoubleClick = (item: FileSystemItem) => {
  if (item.isDirectory) {
    loadDirectory(item.path)
  } else if (isVideoFile(item)) {
    addToQueue(item)
  }
}

const addToQueue = async (item: FileSystemItem) => {
  if (item.isFile && isVideoFile(item)) {
    // Get file stats for additional information
    try {
      const stats = await window.fileSystemAPI.getFileStats(item.path)
      const fileWithStats = {
        ...item,
        size: stats?.size
      }
      emit('addVideoFile', fileWithStats)
    } catch (err) {
      console.warn('Could not get file stats:', err)
      emit('addVideoFile', item)
    }
  }
}

onMounted(async () => {
  await goHome()
})
</script>

<style scoped>
.file-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

.explorer-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.navigation {
  display: flex;
  gap: 8px;
}

.nav-button {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background: #e9ecef;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-path {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
  overflow-x: auto;
  white-space: nowrap;
}

.breadcrumb-item {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.breadcrumb-item:hover:not(.active) {
  background: #f8f9fa;
  color: #495057;
}

.breadcrumb-item.active {
  color: #495057;
  font-weight: 500;
  cursor: default;
}

.separator {
  margin: 0 4px;
  color: #adb5bd;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.file-item:hover {
  background: #f8f9fa;
}

.file-item.directory {
  font-weight: 500;
}

.file-item.video-file {
  color: #0066cc;
}

.file-item.regular-file {
  color: #6c757d;
}

.file-icon {
  font-size: 16px;
  min-width: 20px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-button {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.add-button:hover {
  background: #218838;
}

.loading, .error {
  padding: 16px;
  text-align: center;
  font-size: 13px;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  margin: 8px;
  border-radius: 4px;
}

.loading {
  color: #6c757d;
}
</style>
