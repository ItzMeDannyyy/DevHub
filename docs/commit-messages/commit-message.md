feat(modal): add native folder picker dialog for repository path selection

### Added
- [Native Dialog] Integrated `@tauri-apps/plugin-dialog` to support native OS directory picker
- [Bridge] Added `selectFolderDialog` bridge helper in `src/services/tauriBridge.ts`
- [Modal] Added interactive "Browse" button with `FolderOpen` icon in `AddProjectModal.tsx`
- [Backend] Initialized `tauri_plugin_dialog` in `src-tauri/src/lib.rs` and added `dialog:default` capability permission

### Changed
- Automatically populates project name from folder basename when empty upon folder selection
- Triggers real-time directory validation and subdirectory detection immediately upon choosing a folder

### Testing & Verification
- `npx tsc --noEmit`: 0 errors. TypeScript compilation passed cleanly.
- `npm run build`: Production Vite bundle generated in 897ms without errors.
- `cargo check --manifest-path src-tauri/Cargo.toml`: Finished cleanly in 0.53s.
- `cargo test --manifest-path src-tauri/Cargo.toml`: All Rust tests passed cleanly.
