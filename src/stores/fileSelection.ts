import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileSystemItem } from '../types/electron'

export interface SelectedItem extends FileSystemItem {
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export const useFileSelectionStore = defineStore('fileSelection', () => {
  // Set of selected item paths (using Set for O(1) lookups)
  const selectedPaths = ref<Set<string>>(new Set())

  // Map of path to SelectedItem for full item data
  const selectedItems = ref<Map<string, SelectedItem>>(new Map())

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
    } else {
      // Select
      selectedPaths.value.add(item.path)
      selectedItems.value.set(item.path, {
        ...item,
        status: 'pending'
      })
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
  }

  const removeItem = (path: string) => {
    selectedPaths.value.delete(path)
    selectedItems.value.delete(path)
  }

  const clearSelection = () => {
    selectedPaths.value.clear()
    selectedItems.value.clear()
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

  return {
    // State
    selectedPaths,
    selectedItems,

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
    getItemStatus
  }
})
