# Deployment and Distribution Guide

This guide explains how to properly distribute your FFmpeg GUI application with bundled FFmpeg and configuration files.

## Table of Contents

1. [Distribution Overview](#distribution-overview)
2. [Bundling FFmpeg](#bundling-ffmpeg)
3. [Packaging Configuration Files](#packaging-configuration-files)
4. [Building for Production](#building-for-production)
5. [Testing Your Build](#testing-your-build)
6. [Distribution](#distribution)

---

## Distribution Overview

Your application uses **electron-builder** to create installers for different platforms:

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG installer
- **Linux**: AppImage

**Key Files:**
- `electron-builder.json5` - Build configuration
- `vite.config.ts` - Vite build settings
- `electron/main.ts` - Main process with path helpers

---

## Bundling FFmpeg

### Why Bundle FFmpeg?

- ✅ Users don't need to install FFmpeg separately
- ✅ Consistent version across all installations
- ✅ Works offline
- ✅ Simplified error handling

### Step 1: Download Static FFmpeg Binaries

Create a bin directory:
```bash
mkdir -p public/bin
```

Download FFmpeg for your platform:

#### Windows
1. Download from: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract `ffmpeg.exe` from the zip
3. Place in: `public/bin/ffmpeg.exe`

#### macOS
```bash
brew install ffmpeg
# Copy the binary
cp $(which ffmpeg) public/bin/ffmpeg
```

#### Linux
```bash
sudo apt install ffmpeg  # Debian/Ubuntu
# or
sudo dnf install ffmpeg  # Fedora
# Copy the binary
cp $(which ffmpeg) public/bin/ffmpeg
```

### Step 2: Configure electron-builder

Your `electron-builder.json5` should include:

```json5
{
  "files": [
    "dist",              // ← Includes dist/bin/ from Vite copy
    "dist-electron"
  ],
  "extraResources": [
    {
      "from": "public/bin/",
      "to": "bin/",          // ← Copies to resources/bin/ in packaged app
      "filter": ["**/*"]
    }
  ]
}
```

This ensures:
- **Development**: FFmpeg is loaded from `public/bin/` (served by Vite)
- **Production**: FFmpeg is loaded from `resources/bin/` (outside ASAR)
- **No duplication**: Vite copies `public/bin/` → `dist/bin/`, electron-builder uses `dist/`

### Step 3: FFmpeg Path Resolution

The main process (`electron/main.ts`) includes a `getFFmpegPath()` function:

```typescript
function getFFmpegPath(): string {
  if (VITE_DEV_SERVER_URL) {
    // Development: public/bin/
    const binPath = path.join(process.env.APP_ROOT, 'public', 'bin')
    return process.platform === 'win32'
      ? path.join(binPath, 'ffmpeg.exe')
      : path.join(binPath, 'ffmpeg')
  }

  // Production: resources/bin/
  const binPath = path.join(process.resourcesPath, 'bin')
  return process.platform === 'win32'
    ? path.join(binPath, 'ffmpeg.exe')
    : path.join(binPath, 'ffmpeg')
}
```

### Accessing FFmpeg in Renderer

The renderer can get the FFmpeg path via IPC:

```typescript
// In your component
const ffmpegPath = await window.fileSystemAPI.getFFmpegPath()
```

---

## Packaging Configuration Files

### The Problem

Your app needs `command-options.json` to work, but in production:
- Files are in ASAR archive (not accessible via `fetch`)
- Paths are different from development

### The Solution

**Development:**
- File served by Vite from `public/` directory
- Accessible via `fetch('command-options.json')`

**Production:**
- File copied to `dist/command-options.json` by Vite
- Read via IPC from main process (can access ASAR)

### Configuration Loading

#### 1. Main Process IPC Handler

Added to `electron/main.ts`:

```typescript
ipcMain.handle('get-command-config', async () => {
  try {
    const configPath = getCommandOptionsPath()

    if (VITE_DEV_SERVER_URL) {
      // Dev mode: fetch from Vite
      const response = await fetch('command-options.json')
      return await response.json()
    }

    // Production: read from filesystem
    const content = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading command config:', error)
    return { commands: {} }
  }
})
```

#### 2. Update Renderer Service

Modify `src/services/commandConfig.ts`:

```typescript
static async loadConfig(): Promise<CommandsConfig> {
  if (this.config) return this.config

  try {
    // Use IPC to get config (works in dev and production)
    const config = await window.fileSystemAPI.getCommandConfig()
    this.config = config
    return config
  } catch (error) {
    console.error('Failed to load command config:', error)
    return this.getEmptyConfig()
  }
}
```

This simplifies the code - no need for complex path detection!

#### 3. Vite Configuration

Your `vite.config.ts` ensures JSON is copied to dist:

```typescript
build: {
  rollupOptions: {
    output: {
      assetFileNames: (assetInfo) => {
        if (assetInfo.name === 'command-options.json') {
          return 'command-options.json'  // Keep at root
        }
        return 'assets/[name]-[hash][extname]'
      }
    }
  }
}
```

### File Locations Summary

| Environment | command-options.json Location |
|-------------|-------------------------------|
| Development | `public/command-options.json` (served by Vite) |
| Production | `dist/command-options.json` (read via IPC) |
| Packaged | Inside `resources/app.asar` (read via IPC) |

---

## Building for Production

### Quick Build (Development)

```bash
npm run build
```

This creates `dist/` and `dist-electron/` but doesn't package.

### Electron Build (Unpacked)

```bash
npm run build:electron
```

This runs:
1. `vue-tsc` - Type checking
2. `vite build` - Build renderer
3. `electron-builder --dir` - Build unpacked Electron app

Output in `release/0.0.0/win-unpacked/`:
- Unpacked Electron application (no installer)

### Distribution Build (Installers)

```bash
npm run dist
```

This runs:
1. `npm run build` (TypeScript checking + Vite build)
2. `electron-builder` - Create installers

Output in `release/0.0.0/`:
- `FFmpeg GUI-Windows-0.0.0-Setup.exe` (NSIS installer)
- `FFmpeg GUI-Mac-0.0.0-Installer.dmg` (Mac)
- `FFmpeg GUI-Linux-0.0.0.AppImage` (Linux)

---

## Testing Your Build

### 1. Test the Unpacked Build

```bash
# Build
npm run build

# Run the unpacked app from release directory
release\\0.0.0\\win-unpacked\\FFmpeg GUI.exe
```

Verify:
- ✅ App launches
- ✅ File explorer works
- ✅ Command options load (check console)
- ✅ Can execute commands

### 2. Test the Packaged Build

```bash
# Full distribution build
npm run dist

# Run the installer (Windows)
release\\0.0.0\\FFmpeg\ GUI-Windows-0.0.0-Setup.exe

# Or run the extracted app directly
# Install once, then run from:
# C:\Users\<User>\App\Local\Programs\ffmpeg-gui\
```

Verify:
- ✅ Installer works
- ✅ App launches from installed location
- ✅ FFmpeg executes (check task manager)
- ✅ Config loads correctly
- ✅ File operations work

### 3. Check for Common Issues

**FFmpeg not found:**
```
❌ Error: spawn ffmpeg ENOENT
✅ Check: FFmpeg.exe exists in resources/bin/
```

**Config not loading:**
```
❌ Error: Failed to load command config
✅ Check: console.log shows correct path
✅ Check: command-options.json in dist/
```

**ASAR issues:**
```
❌ Error: EISDIR: illegal operation on a directory
✅ Use: fs.readFile instead of fs.readdir
✅ Place binaries in extraResources (not asar)
```

---

## Distribution

### Creating a Release

1. **Update version in package.json:**
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Update electron-builder.json5:**
   ```json5
   {
     "appId": "com.yourcompany.ffmpeg-gui",
     "productName": "FFmpeg GUI"
   }
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Test installers:**
   - Windows: Run the .exe on a clean machine
   - Mac: Mount the .dmg and test
   - Linux: Run the AppImage

5. **Distribute:**
   - Upload to GitHub Releases
   - Upload to your website
   - Share the download link

### GitHub Release Example

```bash
# Create a git tag
git tag v1.0.0
git push origin v1.0.0

# Go to GitHub Releases
# Upload the files from release/1.0.0/
```

### Auto-Update (Optional)

To enable auto-updates, add to `electron-builder.json5`:

```json5
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "ffmpeg-gui"
  }
}
```

Then add electron-updater to your app.

---

## Summary Checklist

Before distributing:

- [ ] Downloaded and placed FFmpeg binaries in `public/bin/`
- [ ] Updated `electron-builder.json5` with your app ID and name
- [ ] Updated version number in `package.json`
- [ ] Configured `extraResources` for FFmpeg
- [ ] Added IPC handler for config loading
- [ ] Updated renderer service to use IPC
- [ ] Tested web assets build with `npm run build`
- [ ] Tested Electron build with `npm run build:electron`
- [ ] Tested distribution build with `npm run dist`
- [ ] Verified FFmpeg executes in packaged app
- [ ] Verified config loads in packaged app
- [ ] Created GitHub Release
- [ ] Uploaded installers

---

## Troubleshooting

### Issue: FFmpeg not found in production

**Solution:**
1. Check that `public/bin/ffmpeg.exe` exists
2. Verify `electron-builder.json5` includes `extraResources`
3. Add logging to `getFFmpegPath()` to see resolved path
4. Check installed app's `resources/bin/` directory

### Issue: Config not loading in production

**Solution:**
1. Add console.log to IPC handler to see the path
2. Verify `command-options.json` is in `dist/` after build
3. Check that IPC handler is registered in `app.whenReady()`
4. Update renderer to use IPC instead of fetch

### Issue: Large file size

**Solution:**
- FFmpeg static builds are ~80MB (this is normal!)
- Consider downloading FFmpeg on first run instead of bundling
- Use UPX compression to reduce FFmpeg size by 40-50%

### Issue: Different FFmpeg for each platform

You need to build on each platform:
- Windows build on Windows machine (or use CI)
- Mac build on Mac (with code signing)
- Linux build on Linux (or use Docker)

Consider using GitHub Actions for cross-platform builds.

---

## Additional Resources

- [electron-builder documentation](https://www.electron.build/)
- [Electron packaging best practices](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- [FFmpeg static builds](https://ffmpeg.org/download.html)
- [ASAR format](https://www.electronjs.org/docs/latest/tutorial/asar-archives)

---

**Last Updated:** 2025-01-08
**Version:** 1.0.0
