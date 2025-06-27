# FFmpeg GUI

A modern desktop application for video conversion using FFmpeg, built with Electron and Vue.js.

## Features

- 📁 **File Explorer**: Browse and select video files from your system
- 🎬 **Video Queue**: Manage multiple video files for batch processing
- ⚙️ **Output Directory Configuration**: Select where converted files will be saved
- 🔄 **Conversion Processing**: Currently implements file copying as a stub (ready for FFmpeg integration)
- 📊 **Real-time Status Updates**: Track the progress of each file in the queue

## Development

### Setup
```bash
npm install
```

### Development (Vite + Vue.js)
```bash
npm run dev
```

### Build and Run Electron App
```bash
# Quick build (for testing)
npm run dev:electron

# Full build (includes packaging)
npm run build
```

### Run Built Application
```bash
npm run electron
```

## Usage

1. **Add Video Files**: Use the file explorer on the left to browse your system and add video files to the processing queue
2. **Configure Output**: In the conversion settings panel, click "Browse" to select where processed files should be saved
3. **Start Processing**: Click "Start Conversion" to begin processing files (currently copies files as a stub)
4. **Monitor Progress**: Watch the status updates for each file in the queue

## Current Implementation

The application currently implements a **stub conversion process** that copies files to the output directory using the system `cp` command. This serves as a foundation for integrating actual FFmpeg conversion functionality.

## Next Steps

- Replace the copy stub with actual FFmpeg conversion commands
- Add conversion format options (MP4, AVI, etc.)
- Implement progress tracking for longer conversions
- Add conversion quality settings
- Support for audio extraction and conversion

## Architecture

- **Frontend**: Vue.js 3 with TypeScript
- **Backend**: Electron main process with Node.js
- **IPC Communication**: Secure communication between renderer and main process
- **File Operations**: Native file system access with proper error handling

---

# Original Architecture Design Document

This document outlines the architecture and design for a desktop application that provides a user-friendly graphical interface for FFmpeg. The application will allow users to select video files, configure FFmpeg conversion settings (e.g., target format like H.265), and specify an output directory.

## Overall Architecture and Design

The application will follow a client-server architecture, where the Electron.js application acts as the frontend (client) and a separate backend process handles the FFmpeg operations. This separation allows for better organization, scalability, and potentially running FFmpeg operations in a dedicated process without blocking the UI.

### 1. Frontend (Electron.js)

The frontend will be built using Electron.js, providing a cross-platform desktop application experience. It will be responsible for:

*   **User Interface (UI):** A clean and intuitive UI for selecting input video files, configuring FFmpeg options, and monitoring conversion progress.
*   **File System Interaction:** Browsing and selecting video files from the user's file system.
*   **Configuration Management:** Storing and retrieving user preferences, such as default output directory and frequently used FFmpeg settings.
*   **Communication with Backend:** Sending conversion requests and receiving progress updates/completion notifications from the backend.
*   **Error Handling and Feedback:** Displaying appropriate error messages and success notifications to the user.

**Key UI Components:**

*   **File Selector:** A button or drag-and-drop area to add video files.
*   **File List:** A list displaying the selected video files, potentially with options to remove or reorder them.
*   **FFmpeg Options Panel:**
    *   **Format Selection:** Dropdown for common output formats (e.g., H.265, MP4, WebM).
    *   **Codec Options:** Sliders/inputs for bitrate, quality, etc. (depending on selected format/codec).
    *   **Advanced Options (Optional):** A text area for users to input custom FFmpeg arguments.
*   **Output Directory Selector:** A button to browse and select the output folder.
*   **Conversion Progress Bar/Log:** To show the status of ongoing conversions.
*   **Start/Stop Conversion Buttons.**

### 2. Backend (Node.js with `child_process` for FFmpeg)

The backend will be a Node.js process, potentially spawned by the Electron

## Getting Started

### Prerequisites

*   Node.js (which includes npm)
*   FFmpeg installed and accessible in your system's PATH.

### Installation and Running

1.  Clone the repository and navigate into the project directory.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the application:
    ```bash
    npm run dev
    ```

## Current Implementation Status

### ✅ Completed Features

1. **File Explorer Sidebar**
   - Navigate through the file system starting from the home directory
   - Breadcrumb navigation for easy path traversal
   - Visual distinction between directories and video files
   - Support for common video formats (MP4, AVI, MKV, MOV, etc.)
   - File size display for video files
   - Click to navigate directories, double-click to add video files to queue

2. **Video Processing Queue**
   - Display selected video files with their paths and sizes
   - Remove individual files or clear entire queue
   - Status indicators (pending, processing, completed, error)
   - Start/stop processing controls
   - Prevent duplicates from being added to the queue

3. **User Interface**
   - Clean, modern design with sidebar layout
   - Responsive file explorer with navigation controls
   - Visual feedback for file types and processing status
   - Proper error handling and loading states

### 🚧 Next Steps

1. **FFmpeg Integration**
   - Implement actual video conversion using FFmpeg
   - Add conversion options (format, quality, bitrate settings)
   - Progress tracking for individual file conversions
   - Output directory selection

2. **Enhanced Features**
   - Drag and drop support for adding files
   - Batch processing options
   - Conversion presets
   - Preview functionality
   - Detailed conversion logs

### Architecture

The application uses:
- **Frontend**: Vue 3 with TypeScript for the user interface
- **Backend**: Electron main process for file system operations
- **IPC Communication**: Secure communication between renderer and main processes
- **File System**: Native Node.js APIs for directory traversal and file operations