<template>
  <div class="app">
    <div class="app-header">
      <h1>FFmpeg GUI</h1>
      <p>Video conversion made easy</p>
    </div>
    
    <div class="app-body">
      <div class="sidebar">
        <FileExplorer @add-video-file="addVideoFile" />
        <ConversionSettings 
          :video-files="videoFiles"
          :is-processing="isProcessing"
          @start-conversion="startConversion"
          @stop-conversion="stopConversion"
          @output-directory-changed="updateOutputDirectory"
        />
      </div>
      
      <div class="main-content">
        <VideoQueue 
          :video-files="videoFiles"
          @remove-file="removeVideoFile"
          @clear-queue="clearVideoQueue"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileExplorer from './components/FileExplorer.vue'
import VideoQueue from './components/VideoQueue.vue'
import ConversionSettings from './components/ConversionSettings.vue'
import type { FileSystemItem, VideoFile } from './types/electron'

const videoFiles = ref<VideoFile[]>([])
const isProcessing = ref(false)
const outputDirectory = ref<string>('')

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

const updateOutputDirectory = (dir: string) => {
  outputDirectory.value = dir
}

const startConversion = async (outputDir: string) => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  outputDirectory.value = outputDir
  
  console.log('Starting video conversion to:', outputDir)
  
  // Ensure output directory exists
  const dirCreated = await window.fileSystemAPI.ensureDirectory(outputDir)
  if (!dirCreated) {
    console.error('Failed to create output directory')
    isProcessing.value = false
    return
  }
  
  // Process each pending file
  const pendingFiles = videoFiles.value.filter(file => file.status === 'pending')
  
  for (const file of pendingFiles) {
    if (!isProcessing.value) break // Stop if user clicked stop
    
    file.status = 'processing'
    
    try {
      // Generate output filename (for now, just copy with same name)
      // In the future, this will be where we change the extension based on conversion settings
      const outputFileName = file.name
      const outputPath = `${outputDir}/${outputFileName}`
      
      console.log(`Converting ${file.name}...`)
      console.log(`Source: ${file.path}`)
      console.log(`Destination: ${outputPath}`)
      
      // Stub: Copy file to output directory (will be replaced with ffmpeg conversion)
      const success = await window.fileSystemAPI.copyFile(file.path, outputPath)
      
      if (success) {
        file.status = 'completed'
        console.log(`✅ Successfully processed ${file.name}`)
      } else {
        file.status = 'error'
        console.error(`❌ Failed to process ${file.name}`)
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error)
      file.status = 'error'
    }
    
    // Add a small delay to simulate processing time and allow UI updates
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  isProcessing.value = false
  console.log('Conversion process completed')
}

const stopConversion = () => {
  console.log('Stopping video conversion...')
  isProcessing.value = false
  
  // Reset processing files back to pending
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
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: white;
  overflow: hidden;
}
</style>
