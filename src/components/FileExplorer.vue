<template>
  <div class="file-explorer">
    <div class="explorer-header">
      <h3>{{ $t('fileExplorer.title') }}</h3>
      <div class="selection-info" v-if="fileStore.hasSelection">
        {{ $t('fileExplorer.selected', { count: fileStore.selectedCount }) }}
      </div>
      <div class="navigation">
        <button
          @click="navigateUp"
          :disabled="!canNavigateUp"
          class="nav-button"
          :title="$t('fileExplorer.parentDirectory')"
        >
          ↑
        </button>
        <button
          @click="goHome"
          class="nav-button"
          :title="$t('fileExplorer.homeDirectory')"
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
          'drive': isDrive(item),
          'video-file': item.isFile && isVideoFile(item),
          'regular-file': item.isFile && !isVideoFile(item),
          'selected': fileStore.isSelected(item.path)
        }"
        @click="handleItemClick(item)"
      >
        <input
          type="checkbox"
          :checked="fileStore.isSelected(item.path)"
          @click.stop="toggleSelection(item)"
          class="checkbox"
        />
        <span class="file-icon">
          {{ getFileIcon(item) }}
        </span>
        <span class="file-name">{{ item.name }}</span>
      </div>
    </div>

    <div v-else class="loading">
      {{ $t('common.loading') }}
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { FileSystemItem } from '../types/electron'
import { useFileSelectionStore } from '../stores/fileSelection'

const fileStore = useFileSelectionStore()

const currentPath = ref('')
const items = ref<FileSystemItem[]>([])
const loading = ref(false)
const error = ref('')
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv', '.ts', '.mts']

const canNavigateUp = computed(() => {
  // Check if we can go up (not at root)
  if (!currentPath.value) return true

  // Virtual root - can't go up from here
  if (currentPath.value === '/') return false

  // Windows drive root: C:/ or similar
  const windowsRootRegex = /^[A-Z]:\/$/
  if (windowsRootRegex.test(currentPath.value)) return true

  // Drive letter root: /C/
  if (/^\/[A-Z]\/$/.test(currentPath.value)) return true

  // Unix root
  if (currentPath.value === '/') return false

  return true
})

const pathSegments = computed(() => {
  if (!currentPath.value) return []

  // Virtual root
  if (currentPath.value === '/') {
    return [{ name: '/', path: '/' }]
  }

  // Handle Windows paths like "C:/Users/..." or "/C:/Users/..."
  const windowsPathRegex = /^\/?([A-Z]):\/(.*)$/
  const match = currentPath.value.match(windowsPathRegex)

  if (match) {
    // Windows path: show as /C:/Users/... format
    const drive = match[1]
    const rest = match[2] || ''
    const segments = rest.split('/').filter(Boolean)

    const result = [
      { name: '/', path: '/' },
      { name: `${drive}:`, path: `${drive}:/` }
    ]

    let accPath = `${drive}:`
    for (const segment of segments) {
      accPath += '/' + segment
      result.push({ name: segment, path: accPath })
    }

    return result
  }

  // Unix-style path
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

const isDrive = (item: FileSystemItem): boolean => {
  return /^[A-Z]:\/$/.test(item.path) || /^\/[A-Z]:\/$/.test(item.path)
}

const getFileIcon = (item: FileSystemItem): string => {
  // Check if it's a drive (pattern: C:/, D:/, etc.)
  if (/^[A-Z]:\/$/.test(item.path) || /^\/[A-Z]:\/$/.test(item.path)) {
    return '💾'
  }
  if (item.isDirectory) return '📁'
  if (isVideoFile(item)) return '🎬'
  return '📄'
}

const loadDirectory = async (path: string) => {
  loading.value = true
  error.value = ''

  try {
    // Handle virtual root "/" - list drives
    if (path === '/') {
      const drives = await window.fileSystemAPI.listDrives()
      items.value = drives
      currentPath.value = path
    } else {
      const contents = await window.fileSystemAPI.getDirectoryContents(path)
      items.value = contents
      currentPath.value = path
    }
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
    // Check if we're at a drive root and need to go to virtual root
    const windowsRootRegex = /^[A-Z]:\/$/
    const driveRootRegex = /^\/[A-Z]\/$/

    if (windowsRootRegex.test(currentPath.value) || driveRootRegex.test(currentPath.value)) {
      // Go to virtual root to show all drives
      await loadDirectory('/')
    } else {
      const parentPath = await window.fileSystemAPI.getParentDirectory(currentPath.value)
      await loadDirectory(parentPath)
    }
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
  // Single click - navigate into directories
  if (item.isDirectory) {
    loadDirectory(item.path)
  }
}

const toggleSelection = (item: FileSystemItem) => {
  fileStore.toggleSelection(item)
}

onMounted(async () => {
  await goHome()
})
</script>

<style scoped>
.file-explorer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  min-height: 0; /* Allow flex item to shrink */
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

.selection-info {
  font-size: 12px;
  color: #007bff;
  font-weight: 500;
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

.file-item.selected {
  background: #e7f3ff;
}

.file-item.directory {
  font-weight: 500;
}

.file-item.drive {
  font-weight: 600;
  color: #0066cc;
}

.file-item.video-file {
  color: #0066cc;
}

.file-item.regular-file {
  color: #6c757d;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
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
