use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GitRepoInfo {
    pub branch: String,
    pub uncommitted_count: usize,
    pub last_commit_message: String,
    pub is_clean: bool,
}

#[tauri::command]
fn open_in_ide(path: String, ide: String) -> Result<String, String> {
    let ide_cmd = match ide.to_lowercase().as_str() {
        "cursor" => "cursor",
        "zed" => "zed",
        "sublime" | "subl" => "subl",
        _ => "code",
    };

    #[cfg(target_os = "windows")]
    {
        // Using cmd /C to resolve .cmd / .bat executables in Windows PATH like code.cmd
        Command::new("cmd")
            .args(["/C", ide_cmd, &path])
            .spawn()
            .map_err(|e| format!("Failed to spawn IDE ({}): {}", ide_cmd, e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new(ide_cmd)
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to spawn IDE ({}): {}", ide_cmd, e))?;
    }

    Ok(format!("Opened {} at {}", ide_cmd, path))
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Try opening Windows Terminal, fallback to PowerShell
        let wt_result = Command::new("cmd")
            .args(["/C", "start", "wt", "-d", &path])
            .spawn();

        if wt_result.is_err() {
            Command::new("cmd")
                .args([
                    "/C",
                    "start",
                    "powershell",
                    "-NoExit",
                    "-Command",
                    &format!("Set-Location -LiteralPath '{}'", path),
                ])
                .spawn()
                .map_err(|e| format!("Failed to open terminal: {}", e))?;
        }
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-a", "Terminal", &path])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-terminal")
            .arg(&path)
            .spawn()
            .or_else(|_| {
                Command::new("x-terminal-emulator")
                    .args([&format!("--working-directory={}", path)])
                    .spawn()
            })
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    Ok(format!("Terminal opened at {}", path))
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(format!("Explorer opened at {}", path))
}

#[tauri::command]
fn inspect_git_repo(path: String) -> Result<GitRepoInfo, String> {
    // 1. Get branch
    let branch_output = Command::new("git")
        .args(["-C", &path, "rev-parse", "--abbrev-ref", "HEAD"])
        .output()
        .map_err(|e| format!("Git branch error: {}", e))?;

    let branch = String::from_utf8_lossy(&branch_output.stdout)
        .trim()
        .to_string();

    // 2. Get status count (uncommitted changes)
    let status_output = Command::new("git")
        .args(["-C", &path, "status", "--porcelain"])
        .output()
        .map_err(|e| format!("Git status error: {}", e))?;

    let status_str = String::from_utf8_lossy(&status_output.stdout);
    let uncommitted_count = status_str.lines().filter(|l| !l.trim().is_empty()).count();

    // 3. Get last commit message
    let log_output = Command::new("git")
        .args(["-C", &path, "log", "-1", "--pretty=%B"])
        .output()
        .map_err(|e| format!("Git log error: {}", e))?;

    let last_commit_message = String::from_utf8_lossy(&log_output.stdout)
        .trim()
        .to_string();

    Ok(GitRepoInfo {
        branch: if branch.is_empty() { "main".into() } else { branch },
        uncommitted_count,
        last_commit_message: if last_commit_message.is_empty() {
            "No commits yet".into()
        } else {
            last_commit_message
        },
        is_clean: uncommitted_count == 0,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_in_ide,
            open_in_terminal,
            open_in_file_manager,
            inspect_git_repo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
