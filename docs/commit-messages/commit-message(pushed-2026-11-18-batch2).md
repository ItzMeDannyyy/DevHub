docs(design-system): extract reverse-engineered DevHub UI/UX blueprint

### Added
- [Design Systems Blueprint] Reverse-engineered and extracted complete DevHub UI/UX specification into deterministic `devhub_ui_blueprint.json` at project root
- [Tokens & Metrics] Mapped exact CSS variable color tokens for light and dark modes, typography scales, geometry, and transitions
- [Component Recipes] Documented comprehensive recipes for 21 UI components including NavbarIsland, ProjectCard, ScopeFilter, SplitButtons, and ModalDialogs
- [UX Laws & Keybindings] Defined global shortcuts (`Ctrl+K`, `Escape`, `Enter`), strict Lucide icon rules, and design constraints

### Testing & Verification
- `npx tsc --noEmit` passed with 0 type errors
- `npm run build` compiled client bundle and assets cleanly
- `cargo check --manifest-path src-tauri/Cargo.toml` validated Rust compilation
- `cargo test --manifest-path src-tauri/Cargo.toml` passed all unit and doc tests cleanly
- Verified `devhub_ui_blueprint.json` syntax and schema compliance with Node.js
