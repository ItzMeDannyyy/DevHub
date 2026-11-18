// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        // Force Microsoft WebView2 to enable GPU hardware rasterization, avoid frame throttling,
        // and maintain smooth 60+ FPS animations in release builds.
        let existing_args =
            std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
        let perf_flags = "--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --disable-background-timer-throttling --disable-renderer-backgrounding";
        let combined = if existing_args.is_empty() {
            perf_flags.to_string()
        } else {
            format!("{} {}", existing_args, perf_flags)
        };
        unsafe {
            std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", combined);
        }
    }

    tauri_app_lib::run()
}
