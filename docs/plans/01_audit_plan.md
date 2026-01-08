# Project Plan & Tasks

This document tracks ongoing tasks and plans for the ffmpeg-gui project.

## 1. Address NPM Vulnerabilities

**Status:** In Progress

**Issue:** `npm install` reported 2 moderate severity vulnerabilities.

**Plan:**

1.  [ ] **Inspect vulnerabilities:** Run `npm audit` to get a detailed report of the security issues.

    ```bash
    npm audit
    ```

2.  [ ] **Attempt automatic fix:** Run `npm audit fix` to patch vulnerabilities without introducing breaking changes.

    ```bash
    npm audit fix
    ```

3.  [ ] **Review remaining issues:** If vulnerabilities remain, manually review them. If a breaking change is required, use `npm audit fix --force` with caution and test the application thoroughly afterward.

## 2. Resolve Installation Warnings

**Status:** To Do

**Issue:** `npm install` shows a warning for the deprecated `inflight` package and an error for the optional `fsevents` dependency.

**Plan:**

1.  [ ] The `inflight` deprecation warning will likely be resolved by running `npm audit fix`.
2.  [ ] The `fsevents` error can be ignored as it is an optional, platform-specific dependency. No action is needed unless file-watching features misbehave on macOS.