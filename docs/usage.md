Looking at your project structure and the updated scripts, here's how to run your app in different scenarios:

## 🎯 Development Scenarios

### 1. **Web UI Debug (Renderer Only)**
```bash
npm run dev
```
- **Purpose**: Fast development of Vue.js UI components
- **What it does**: Starts Vite dev server with hot reload
- **Electron**: ❌ Not running
- **Best for**: UI component development, styling, Vue.js logic
- **Access**: Open browser at `http://localhost:5173`

### 2. **App Debug / Dev Run (Full Electron)**
```bash
npm run dev:electron
```
- **Purpose**: Full Electron app with hot reload
- **What it does**: 
  1. Builds web assets (`npm run build`)
  2. Launches Electron with dev server
- **Electron**: ✅ Running with dev tools
- **Best for**: Testing IPC communication, full app integration
- **Access**: Electron window opens automatically

### 3. **Build Run (Test Production Build)**
```bash
# Option A: Build web assets only
npm run build

# Option B: Build unpacked Electron app
npm run build:electron
```
- **Purpose**: Test production builds locally
- **What it does**:
  - `npm run build`: Creates dist and dist-electron folders
  - `npm run build:electron`: Creates unpacked app in win-unpacked
- **Electron**: ❌ Not launched automatically
- **Best for**: Testing production builds, verifying packaging

**To run the built app:**
```bash
# After npm run build:electron
cd release/0.0.0/win-unpacked
.\"FFmpeg GUI.exe"
```

### 4. **Distribution (Create Installers)**
```bash
npm run dist
```
- **Purpose**: Create platform-specific installers
- **What it does**: Builds everything and creates installer packages
- **Output**: 0.0.0 with:
  - `FFmpeg GUI-Windows-0.0.0-Setup.exe` (Windows installer)
  - `win-unpacked/` (unpacked app for testing)
- **Best for**: Final release, sharing with users

## 📋 Quick Reference Table

| Scenario | Command | Purpose | Electron | Hot Reload | Output |
|----------|---------|---------|----------|------------|--------|
| **Web UI Debug** | `npm run dev` | Vue.js UI development | ❌ | ✅ | Browser |
| **App Debug** | `npm run dev:electron` | Full app testing | ✅ | ✅ | Electron |
| **Build Test** | `npm run build:electron` | Production build test | ❌ | ❌ | win-unpacked |
| **Run Built App** | `npm run electron` | Run built app | ✅ | ❌ | Electron |
| **Distribution** | `npm run dist` | Create installers | ❌ | ❌ | 0.0.0 |

## 🔄 Typical Development Workflow

### Day-to-Day Development:
```bash
# 1. Work on UI components
npm run dev

# 2. Test full app integration
npm run dev:electron

# 3. Verify production build
npm run build:electron
# Then manually run from release/0.0.0/win-unpacked/
```

### Before Release:
```bash
# 1. Test production build
npm run build:electron
# Test the unpacked app thoroughly

# 2. Create installer
npm run dist

# 3. Test installer
# Run the generated .exe installer
```

## 🛠️ Additional Useful Commands

```bash
# Clean build outputs
npm run clean

# Type check only (no build)
npm run type-check

# Build web assets only (no Electron)
npm run build:web
```

## 📝 Important Notes

1. **Hot Reload**: Only works in `npm run dev` and `npm run dev:electron`
2. **Main Process Changes**: Require restart of Electron (no hot reload)
3. **Configuration Changes**: Edit command-options.json and reload app
4. **Testing IPC**: Use `npm run dev:electron` for IPC testing
5. **Performance Testing**: Use `npm run build:electron` for accurate performance

## 🚀 Recommended Setup

For most development, keep two terminals open:
```bash
# Terminal 1: UI development
npm run dev

# Terminal 2: Full app testing (when needed)
npm run dev:electron
```

This gives you the flexibility to work on UI components quickly while still being able to test the full Electron app when needed.

Would you like me to update the documentation to make this workflow clearer?