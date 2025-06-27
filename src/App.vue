<template>
  <div class="app">
    <div class="app-header">
      <h1>FFmpeg GUI</h1>
      <p>Video conversion made easy</p>
    </div>
    
    <div class="app-body">
      <div class="sidebar">
        <FileExplorer @add-video-file="addVideoFile" />
      </div>
      
      <div class="main-content">
        <VideoQueue 
          :video-files="videoFiles"
          @remove-file="removeVideoFile"
          @clear-queue="clearVideoQueue"
          @start-processing="startProcessing"
          @stop-processing="stopProcessing"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileExplorer from './components/FileExplorer.vue'
import VideoQueue from './components/VideoQueue.vue'
import type { FileSystemItem, VideoFile } from './types/electron'

const videoFiles = ref<VideoFile[]>([])

const addVideoFile = (file: FileSystemItem) => {
  // Check if file is already in the queue
  const exists = videoFiles.value.some(videoFile => videoFile.path === file.path)
  if (exists) {
    return // Don't add duplicates
  }
  
  const videoFile: VideoFile = {
    name: file.name,
    path: file.path,
    status: 'pending'
  }
  
  videoFiles.value.push(videoFile)
}

const removeVideoFile = (index: number) => {
  videoFiles.value.splice(index, 1)
}

const clearVideoQueue = () => {
  // Only clear files that are not currently processing
  videoFiles.value = videoFiles.value.filter(file => file.status === 'processing')
}

const startProcessing = () => {
  console.log('Starting video processing...')
  // TODO: Implement actual video processing logic
  // For now, just simulate processing
  videoFiles.value.forEach(file => {
    if (file.status === 'pending') {
      file.status = 'processing'
      // Simulate completion after 3 seconds
      setTimeout(() => {
        if (file.status === 'processing') {
          file.status = 'completed'
        }
      }, 3000)
    }
  })
}

const stopProcessing = () => {
  console.log('Stopping video processing...')
  // TODO: Implement actual stop logic
  videoFiles.value.forEach(file => {
    if (file.status === 'processing') {
      file.status = 'pending'
    }
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

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.app-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
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
  overflow: hidden;
}

.main-content {
  flex: 1;
  background: white;
  overflow: hidden;
}
</style>
