feat(repositories): implement draft auto-save and header resume button

### Added
- [Draft Persistence] Automated local storage draft saving for new repository forms via `saveRepoDraft`, `loadRepoDraft`, and `clearRepoDraft` in `storage.ts`
- [Draft Restoration] In-modal draft detection and auto-population restoring repository name, directory path, GitHub URL, category, priority, deadline, notes, and configured services
- [Header Warning Action] Prominent amber `Resume Draft` button in `Navbar.tsx` (in both collapsed pill and expanded headers) with Lucide `AlertTriangle` vector icon and pulsing badge
- [Restoration Banner] Contextual in-modal notification banner informing user of recovered draft with a 1-click `Discard Draft` action in the header and footer

### Changed
- [AddProjectModal] Safeguarded accidental backdrop, Cancel, and Escape closures from clearing unsaved repository work by automatically saving active drafts
- [AddProjectModal] Automatically clears stored draft upon valid repository submission or explicit discard
- [Navbar] Dynamic header width expansion accommodating the warning action when unsaved drafts exist

### Testing & Verification
- `npm run build` compiled successfully with zero TypeScript or Vite bundle errors
- `cargo check --manifest-path src-tauri/Cargo.toml` validated with exit code 0
- Verified strict compliance with `lucide-icons-only` (zero Unicode emojis, clean Lucide vector icons)
- Verified draft lifecycle: form input -> accidental outside backdrop click -> header warning display -> resume click -> form restored -> submit/discard clears draft
