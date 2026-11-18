# Developer's Hub (DevHub)

> **A minimalist, high-contrast monochrome desktop command center and process controller for software engineers.**

Created and developed by **ItzMeDannyyy**.

---

## Overview

**Development Hub (DevHub)** is a standalone cross-platform desktop application designed to streamline daily developer workflows. It brings your local repositories, background services, filesystem diagrams, in-app document viewers, live Git tracking, and utility tools into a single, unified command deck.

DevHub is distributed as a **pre-built standalone executable**—**no Node.js, Rust, or build tools are required to run it**. Simply download, launch, and manage your projects.

---

## Quick Start (No Installation Required)

You do **not** need to install Node.js, Rust, or compile code to use DevHub.

### 1. Download the Executable
- Download the latest **`DevHub.exe`** (or installer) provided in the Releases section.

### 2. Launch DevHub
- Double-click the downloaded executable to open DevHub immediately.
- *Note for Windows users*: If Windows SmartScreen displays a warning on first run (*"Windows protected your PC"*), click **"More info"** and then **"Run anyway"**.

---

## Step-by-Step User Guide: How to Use DevHub

### Step 1: Explore the Pre-Configured Sample Project
On your first launch, DevHub automatically seeds a clean **"Sample Project"** pointing to your workspace. You can click on this project card immediately to test:
- The multi-service process controller.
- The interactive working tree diagram.
- Live Git workspace tracking.
- The in-app document and code viewer.

---

### Step 2: Add Your Local Repositories
1. Click the **"+"** button on the floating top bar or the **"Add Repository"** button on the dashboard.
2. Enter your **Project Name** (e.g. `Storefront Web App` or `Payment Microservice`).
3. Enter the **Directory Path (Absolute)**:
   - Open **Windows File Explorer** and navigate to your project folder.
   - Press <kbd>Ctrl + L</kbd> to highlight the address bar, then press <kbd>Ctrl + C</kbd> to copy the exact path.
   - Paste the path into DevHub.
   - *Automatic Sanitization*: If you copied the path with quotes (`"C:\Users\..."`), DevHub automatically strips the quotation marks.
   - *Pre-Flight Verification*: DevHub verifies the folder exists on disk in real time. If the path does not exist or points to a file, an informative error fallback card appears and blocks submission.
4. Select a **Category** (*Work*, *Personal*, *Client*, *School*, or *Open Source*) and **Priority** (*Critical*, *High*, *Medium*, or *Low*).
5. Optionally set a target deadline and sprint notes.

---

### Step 3: Configure Multi-Service Commands
In the **Run Service and Commands** section of the Add/Edit Repository drawer:
1. Select the **Working Folder** for each service from the dropdown. DevHub dynamically scans and displays only real subfolders found on your disk (e.g., `./`, `./backend`, `./frontend`, `./src-tauri`).
2. Enter the command to run (e.g., `npm run dev`, `cargo check`, `docker compose up`, or `python manage.py runserver`).
3. Click **"Add Another Service"** to configure multiple processes that belong to the same repository.
4. Click **"Add Repository"** to save.

---

### Step 4: Control & Monitor Services (Process Controller)
1. Click on any repository card to open its slide-over **Project Control Drawer**.
2. **Individual Control**: Click **"Run Service"** on any specific service to start it in the background. Once running, DevHub displays its active system **PID** and timestamp.
3. **Simultaneous Batch Control**: Click **"Run All Services"** to launch every configured service concurrently with a single click.
4. **Stopping Services**: Click **"Stop"** on individual services or click **"Stop All Services"** to terminate all active child processes at once.
5. *Process Health Protection*: If your computer restarts or the app is closed, DevHub checks the operating system process table on startup and automatically prunes dead PIDs to prevent phantom "Active" states.

---

### Step 5: Quick-Launch Your Tools
At the top of the Project Control drawer, three primary actions connect directly to your system:
- **VS Code / Preferred IDE**: Launches your selected editor directly inside the project directory.
- **Terminal**: Opens PowerShell or Windows Terminal directly in the repository directory.
- **File Explorer**: Opens the folder in Windows File Explorer.
*(If a project folder has been moved or deleted on disk, DevHub guards the action and displays a notification rather than failing silently).*

---

### Step 6: Interactive Working Tree Diagram
1. In the Project Control drawer, click **"Open Working Tree Diagram"**.
2. DevHub performs a native filesystem scan and generates an interactive tree representation:
   - **Diagram View**: A horizontal graph with visual connecting branch lines. Use the zoom controls (<kbd>+</kbd> / <kbd>-</kbd> / <kbd>Reset</kbd>) and click on folder nodes to expand or collapse branches.
   - **Outline View**: A clean, indented file-explorer tree for rapid scanning.
   - **Search Filter**: Filter files and folders by name in real time.
   - **Noise Filtering**: Automatically excludes noisy directories like `node_modules`, `.git`, `target`, `dist`, and `.next`.

---

### Step 7: Inspect Code & Documents (Document Viewer)
1. In the Working Tree Diagram, **double-click any file node** (or select a file and click **"View Document"**).
2. The in-app Document Viewer opens immediately:
   - **Code & Text Files**: View source files with line-numbered gutters and word-wrap toggle.
   - **In-Document Search**: Search text within the file with live match counting.
   - **Markdown Files**: Toggle between syntax-highlighted raw markdown and a formatted rendered view.
   - **Image Preview**: Supported image formats (`png`, `jpg`, `jpeg`, `webp`, `svg`, `ico`) render with zoom controls.
   - **Quick Actions**: Copy file contents, copy absolute path, or open the file in your external editor.

---

### Step 8: Live Git Workspace Tracking
1. The Project Control drawer automatically inspects the repository's `.git` folder directly via native Rust IPC.
2. It displays:
   - The active Git branch name (e.g. `main` or `feature/login`).
   - The number of modified / uncommitted files.
   - The latest commit message.
3. Click the **"Refresh Git"** button at any time to re-check status after staging or committing code in your editor.

---

### Step 9: Built-In Developer Utilities
Click **"Tools"** on the main navigation bar to access four essential utilities:
- **Base64 Tool**: Instant string encoding and decoding.
- **Unix Timestamp**: Convert Unix timestamps (seconds / milliseconds) to UTC and local date formats, or get the current epoch timestamp.
- **JSON Formatter**: Format uncompressed JSON with clean indentation, minify JSON, or validate syntax errors.
- **Hash Generator**: Generate SHA-256 cryptographic hashes for verification.

---

### Step 10: Snapshot Backup & Restore
1. Click the **Settings** icon on the floating navbar.
2. Under **Data Management**:
   - **Export Repositories Snapshot**: Downloads a `devhub-projects.json` file containing all your configured repositories, services, and notes.
   - **Import Repositories Snapshot**: Select an existing JSON backup to restore or merge your repository deck.
   - **Restore Factory Demo Data**: Resets DevHub to the default initial sample project state.

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Anywhere | Focus global repository search bar (switches to Home view automatically) |
| <kbd>Esc</kbd> | Drawers & Modals | Close Project Control drawer, Add modal, Document Viewer, or dismiss search |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Windows Explorer | Highlight address bar to copy folder path |
| <kbd>Enter</kbd> | Form Inputs | Submit repository addition or save changes |

---

## Technical Architecture & Design System

DevHub is built with performance and focus at its core:

```
+------------------------------------------------------------------------+
|                          DEVHUB CLIENT (UI)                            |
|          React 19  |  TypeScript  |  Tailwind CSS v4  |  Vite          |
+------------------------------------------------------------------------+
                                    |
                           Tauri v2 IPC Bridge
                      (src/services/tauriBridge.ts)
                                    |
+------------------------------------------------------------------------+
|                         NATIVE RUST CORE                               |
|                      (src-tauri/src/lib.rs)                            |
+------------------------------------------------------------------------+
    |                  |                 |                  |
[Process Mgr]     [Git Engine]      [FS Scanner]      [Doc Reader]
 - taskkill        - git branch      - read_dir        - UTF-8 text
 - tasklist        - git status      - canonicalize    - Base64 images
 - background PID  - git log         - path validation - 8 MB limit
```

### Design Standards
- **Monochrome Aesthetic**: Pure black, white, and high-contrast slate grays (`var(--bg-canvas)`, `var(--bg-card)`, `var(--border-color)`).
- **Zero Unicode Emojis**: 100% vector SVG icons strictly sourced from [`lucide-react`](https://lucide.dev).
- **Anti-Slop Layout**: Clean typography, structured information density, and smooth spring-eased slide-over drawers.

---

## For Developers: Building From Source (Optional)

If you are a developer looking to contribute to DevHub or compile the executable from source code:

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Rust & Cargo**: Stable toolchain (`rustup`)
- **C++ Build Tools**: Visual Studio C++ Build Tools (on Windows)
- **Git**

### Build Commands
```bash
# 1. Clone repository
git clone https://github.com/your-username/development-hub.git
cd "development-hub"

# 2. Install dependencies
npm install

# 3. Run development desktop app
npm run tauri dev

# 4. Compile release standalone executable (.exe / installer)
npm run tauri build
```

The resulting standalone executable and installer will be located in:
`src-tauri/target/release/`

---

## Authors & Acknowledgments

- **Danny** ([@ItzMeDannyyy](https://github.com/ItzMeDannyyy)) — Creator and lead developer of Developer Hub.
- **Reneilrp** ([@Reneilrp](https://github.com/Reneilrp)) — Creator of Handbook & Azure Guide; special thanks for contributing developer guides and tooling inspiration.
