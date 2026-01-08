The following changes were made to fix the build and runtime issues in the `ffmpeg-gui` application:

1.  **Fix TypeScript Compilations Errors (`electron/main.ts`)**
    *   Removed unused variables `enPath` and `zhPath` which were causing the build to fail during `vue-tsc` check.

2.  **Fix Runtime Connection Refused Error (`electron/main.ts`)**
    *   Added error handling and a retry mechanism when loading `VITE_DEV_SERVER_URL`. This handles race conditions where Electron might attempt to load the page before the Vite server is fully listening.
    *   Updated the `fetch('command-options.json')` call to use an absolute URL (`new URL('command-options.json', VITE_DEV_SERVER_URL).href`). Fetch in Node.js (Electron Main Process) requires absolute URLs, and this would have caused a runtime error.

These changes should resolve the `ERR_CONNECTION_REFUSED` error and allow the application to build and run successfully.
