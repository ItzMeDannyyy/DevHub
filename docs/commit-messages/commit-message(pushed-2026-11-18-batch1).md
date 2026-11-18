feat(analytics): integrate Aptabase telemetry and privacy-first error tracking

### Added
- [Aptabase Backend Plugin] Integrated `tauri-plugin-aptabase` (v1.3.0) with automated crash reporting in `src-tauri/src/lib.rs`
- [Lifecycle Telemetry] Added background lifecycle tracking for `app_started` on `RunEvent::Ready` and `app_exited` with blocking flush on `RunEvent::Exit`
- [Tauri Capabilities] Configured `aptabase:allow-track-event` and `aptabase:allow-track-error` security permissions in `default.json`
- [Analytics Service] Created `src/services/analytics.ts` exposing safe `trackEvent` and `trackError` utilities with silent development fallbacks
- [Frontend Telemetry Events] Wired analytics telemetry in `App.tsx` for `app_initialized`, `screen_view` tab transitions, and `save_settings`

### Changed
- [Git Ignore] Added `CHANGELOG.md` to `.gitignore` to prevent local changelog build artifacts from polluting version control

### Testing & Verification
- `npx tsc --noEmit` passed with 0 type errors
- `npm run build` compiled client bundle and assets cleanly
- `cargo check --manifest-path src-tauri/Cargo.toml` validated Rust compilation
- `cargo test --manifest-path src-tauri/Cargo.toml` ran unit and doc tests cleanly
