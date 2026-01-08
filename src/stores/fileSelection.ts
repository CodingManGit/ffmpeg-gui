import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileSystemItem } from '../types/electron'

export interface SelectedItem extends FileSystemItem {
  status: 'pending' | 'processing' | 'completed' | 'error' | 'existing'
  isDuplicate?: boolean
}

export const useFileSelectionStore = defineStore('fileSelection', () => {
  // Set of selected item paths (using Set for O(1) lookups)
  const selectedPaths = ref<Set<string>>(new Set())

  // Map of path to SelectedItem for full item data
  const selectedItems = ref<Map<string, SelectedItem>>(new Map())

  // Track duplicate files
  const duplicateNames = ref<Set<string>>(new Set())

  // Computed getters
  const selectedList = computed(() => {
    return Array.from(selectedItems.value.values())
  })

  const selectedCount = computed(() => {
    return selectedPaths.value.size
  })

  const hasSelection = computed(() => {
    return selectedPaths.value.size > 0
  })

  // Actions
  const toggleSelection = (item: FileSystemItem) => {
    if (selectedPaths.value.has(item.path)) {
      // Deselect
      selectedPaths.value.delete(item.path)
      selectedItems.value.delete(item.path)
      updateDuplicates()
    } else {
      // Select
      selectedPaths.value.add(item.path)
      selectedItems.value.set(item.path, {
        ...item,
        status: 'pending'
      })
      updateDuplicates()
    }
  }

  const isSelected = (path: string): boolean => {
    return selectedPaths.value.has(path)
  }

  const addItems = (items: FileSystemItem[]) => {
    for (const item of items) {
      if (!selectedPaths.value.has(item.path)) {
        selectedPaths.value.add(item.path)
        selectedItems.value.set(item.path, {
          ...item,
          status: 'pending'
        })
      }
    }
    updateDuplicates()
  }

  const removeItem = (path: string) => {
    selectedPaths.value.delete(path)
    selectedItems.value.delete(path)
    updateDuplicates()
  }

  const clearSelection = () => {
    selectedPaths.value.clear()
    selectedItems.value.clear()
    duplicateNames.value.clear()
  }

  const clearCompleted = () => {
    const pathsToDelete: string[] = []
    selectedItems.value.forEach((item, path) => {
      if (item.status === 'completed' || item.status === 'error') {
        pathsToDelete.push(path)
      }
    })
    pathsToDelete.forEach(path => {
      selectedPaths.value.delete(path)
      selectedItems.value.delete(path)
    })
    updateDuplicates()
  }

  const updateItemStatus = (path: string, status: SelectedItem['status']) => {
    const item = selectedItems.value.get(path)
    if (item) {
      item.status = status
      selectedItems.value.set(path, item)
    }
  }

  const getItemStatus = (path: string): SelectedItem['status'] | null => {
    return selectedItems.value.get(path)?.status || null
  }

  // Check for duplicate file names and mark them
  const updateDuplicates = () => {
    // Count occurrences of each filename
    const nameCount = new Map<string, number>()
    selectedItems.value.forEach((item) => {
      const count = nameCount.get(item.name) || 0
      nameCount.set(item.name, count + 1)
    })

    // Update duplicate flags
    duplicateNames.value.clear()
    selectedItems.value.forEach((item, path) => {
      const isDuplicate = (nameCount.get(item.name) || 0) > 1
      item.isDuplicate = isDuplicate
      selectedItems.value.set(path, item)

      if (isDuplicate) {
        duplicateNames.value.add(item.name)
      }
    })
  }

  // Get items that will be processed (filtered by overwrite setting)
  const getProcessableItems = (overwrite: boolean, outputDirFiles: string[] = []): SelectedItem[] => {
    if (overwrite) {
      // When overwrite is enabled, reset all to pending and mark all as non-duplicate
      selectedList.value.forEach((item) => {
        if (!item.isDirectory) {
          item.status = 'pending'
          item.isDuplicate = false
          selectedItems.value.set(item.path, item)
        }
      })
      // Return all non-directory items
      return selectedList.value.filter(item => !item.isDirectory)
    } else {
      // Filter out duplicates (keep first occurrence, mark others as existing)
      const seen = new Set<string>()
      const processable: SelectedItem[] = []

      selectedList.value.forEach((item) => {
        if (item.isDirectory) return

        // Check if file exists in output directory
        const existsInOutput = outputDirFiles.includes(item.name)

        if (seen.has(item.name) || existsInOutput) {
          // Mark as existing (will be skipped)
          item.status = 'existing'
          item.isDuplicate = true
          selectedItems.value.set(item.path, item)
        } else {
          seen.add(item.name)
          item.status = 'pending'
          item.isDuplicate = false
          selectedItems.value.set(item.path, item)
          processable.push(item)
        }
      })

      return processable
    }
  }

  return {
    // State
    selectedPaths,
    selectedItems,
    duplicateNames,

    // Getters
    selectedList,
    selectedCount,
    hasSelection,

    // Actions
    toggleSelection,
    isSelected,
    addItems,
    removeItem,
    clearSelection,
    clearCompleted,
    updateItemStatus,
    getItemStatus,
    updateDuplicates,
    getProcessableItems
  }
})
