use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri_plugin_aptabase::EventTracker;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitRepoInfo {
    pub branch: String,
    pub uncommitted_count: usize,
    pub last_commit_message: String,
    pub is_clean: bool,
    pub remote_url: Option<String>,
}

#[tauri::command]
fn open_in_ide(path: String, ide: String) -> Result<String, String> {
    let ide_clean = ide.trim().to_lowercase();
    let ide_cmd = match ide_clean.as_str() {
        "cursor" => "cursor",
        "zed" => "zed",
        "sublime" | "subl" => "subl",
        "code-insiders" => "code-insiders",
        "webstorm" => "webstorm",
        "intellij" | "idea" => "idea",
        "pycharm" => "pycharm",
        "rustrover" => "rustrover",
        "goland" => "goland",
        "phpstorm" => "phpstorm",
        "clion" => "clion",
        "rider" => "rider",
        "fleet" => "fleet",
        "androidstudio" | "studio" => "studio",
        "notepad++" | "notepadplusplus" => "notepad++",
        "vscode" | "code" => "code",
        other if !other.is_empty() => other,
        _ => "code",
    };

    #[cfg(target_os = "windows")]
    {
        // Using cmd /C to resolve .cmd / .bat executables in Windows PATH like code.cmd (hidden window)
        hidden_command("cmd")
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

    Ok(format!("Opened in {} at {}", ide_cmd, path))
}

#[tauri::command]
fn open_in_terminal(path: String, terminal: Option<String>) -> Result<String, String> {
    let term = terminal.unwrap_or_else(|| "default".into()).trim().to_lowercase();

    #[cfg(target_os = "windows")]
    {
        match term.as_str() {
            "cmd" | "command prompt" => {
                Command::new("cmd")
                    .args(["/C", "start", "cmd.exe", "/K", &format!("cd /d \"{}\"", path)])
                    .spawn()
                    .map_err(|e| format!("Failed to open Command Prompt: {}", e))?;
            }
            "git-bash" | "bash" | "git bash" => {
                let pf_git_bash = r"C:\Program Files\Git\git-bash.exe";
                let pf_git_bash_x86 = r"C:\Program Files (x86)\Git\git-bash.exe";

                let launched = if std::path::Path::new(pf_git_bash).exists() {
                    Command::new(pf_git_bash)
                        .arg(format!("--cd={}", path))
                        .spawn()
                } else if std::path::Path::new(pf_git_bash_x86).exists() {
                    Command::new(pf_git_bash_x86)
                        .arg(format!("--cd={}", path))
                        .spawn()
                } else {
                    Command::new("cmd")
                        .args(["/C", "start", "", "git-bash.exe", &format!("--cd={}", path)])
                        .spawn()
                        .or_else(|_| {
                            Command::new("cmd")
                                .args(["/C", "start", "bash.exe", "-c", &format!("cd \"{}\" && exec bash", path)])
                                .spawn()
                        })
                };

                launched.map_err(|e| format!("Failed to open Git Bash: {}", e))?;
            }
            "wsl" | "ubuntu" | "debian" => {
                Command::new("cmd")
                    .args(["/C", "start", "wsl.exe", "--cd", &path])
                    .spawn()
                    .map_err(|e| format!("Failed to open WSL: {}", e))?;
            }
            "pwsh" | "powershell 7" => {
                Command::new("cmd")
                    .args([
                        "/C",
                        "start",
                        "pwsh.exe",
                        "-NoExit",
                        "-Command",
                        &format!("Set-Location -LiteralPath '{}'", path),
                    ])
                    .spawn()
                    .map_err(|e| format!("Failed to open PowerShell 7: {}", e))?;
            }
            "wt" | "windows terminal" => {
                Command::new("cmd")
                    .args(["/C", "start", "wt.exe", "-d", &path])
                    .spawn()
                    .map_err(|e| format!("Failed to open Windows Terminal: {}", e))?;
            }
            "powershell" | "windows powershell" => {
                Command::new("cmd")
                    .args([
                        "/C",
                        "start",
                        "powershell.exe",
                        "-NoExit",
                        "-Command",
                        &format!("Set-Location -LiteralPath '{}'", path),
                    ])
                    .spawn()
                    .map_err(|e| format!("Failed to open PowerShell: {}", e))?;
            }
            _ => {
                // Default: Try Windows Terminal first, fallback to PowerShell
                let wt_result = Command::new("cmd")
                    .args(["/C", "start", "wt.exe", "-d", &path])
                    .spawn();

                if wt_result.is_err() {
                    Command::new("cmd")
                        .args([
                            "/C",
                            "start",
                            "powershell.exe",
                            "-NoExit",
                            "-Command",
                            &format!("Set-Location -LiteralPath '{}'", path),
                        ])
                        .spawn()
                        .map_err(|e| format!("Failed to open terminal: {}", e))?;
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        match term.as_str() {
            "iterm" | "iterm2" => {
                Command::new("open")
                    .args(["-a", "iTerm", &path])
                    .spawn()
                    .or_else(|_| Command::new("open").args(["-a", "Terminal", &path]).spawn())
                    .map_err(|e| format!("Failed to open terminal: {}", e))?;
            }
            _ => {
                Command::new("open")
                    .args(["-a", "Terminal", &path])
                    .spawn()
                    .map_err(|e| format!("Failed to open terminal: {}", e))?;
            }
        }
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

    Ok(format!("Opened {} at {}", term, path))
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
    let p = std::path::Path::new(&path);
    if !p.exists() || !p.is_dir() {
        return Err("Directory does not exist".into());
    }

    let git_dir = p.join(".git");
    if !git_dir.exists() {
        return Ok(GitRepoInfo {
            branch: "Not a git repo".into(),
            uncommitted_count: 0,
            last_commit_message: "No git tracking initialized".into(),
            is_clean: true,
            remote_url: None,
        });
    }

    // 1. Get branch (executed silently without flashing console window)
    let branch_output = hidden_command("git")
        .args(["-C", &path, "rev-parse", "--abbrev-ref", "HEAD"])
        .output()
        .map_err(|e| format!("Git branch error: {}", e))?;

    let branch = String::from_utf8_lossy(&branch_output.stdout)
        .trim()
        .to_string();

    // 2. Get status count (uncommitted changes)
    let status_output = hidden_command("git")
        .args(["-C", &path, "status", "--porcelain"])
        .output()
        .map_err(|e| format!("Git status error: {}", e))?;

    let status_str = String::from_utf8_lossy(&status_output.stdout);
    let uncommitted_count = status_str.lines().filter(|l| !l.trim().is_empty()).count();

    // 3. Get last commit message
    let log_output = hidden_command("git")
        .args(["-C", &path, "log", "-1", "--pretty=%B"])
        .output()
        .map_err(|e| format!("Git log error: {}", e))?;

    let last_commit_message = String::from_utf8_lossy(&log_output.stdout)
        .trim()
        .to_string();

    // 4. Get remote origin URL
    let remote_url = {
        let output = hidden_command("git")
            .args(["-C", &path, "remote", "get-url", "origin"])
            .output();

        if let Ok(out) = output {
            if out.status.success() {
                let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !url.is_empty() {
                    Some(url)
                } else {
                    None
                }
            } else {
                let config_out = hidden_command("git")
                    .args(["-C", &path, "config", "--get", "remote.origin.url"])
                    .output();
                if let Ok(co) = config_out {
                    if co.status.success() {
                        let url = String::from_utf8_lossy(&co.stdout).trim().to_string();
                        if !url.is_empty() {
                            Some(url)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            }
        } else {
            None
        }
    };

    Ok(GitRepoInfo {
        branch: if branch.is_empty() {
            "main".into()
        } else {
            branch
        },
        uncommitted_count,
        last_commit_message: if last_commit_message.is_empty() {
            "No commits yet".into()
        } else {
            last_commit_message
        },
        is_clean: uncommitted_count == 0,
        remote_url,
    })
}

#[tauri::command]
fn get_git_remote_url(path: String) -> Result<Option<String>, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Ok(None);
    }

    let output = hidden_command("git")
        .args(["-C", &path, "remote", "get-url", "origin"])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !url.is_empty() {
                return Ok(Some(url));
            }
        }
    }

    let config_output = hidden_command("git")
        .args(["-C", &path, "config", "--get", "remote.origin.url"])
        .output();

    if let Ok(out) = config_output {
        if out.status.success() {
            let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !url.is_empty() {
                return Ok(Some(url));
            }
        }
    }

    Ok(None)
}

#[tauri::command]
fn set_git_remote_url(path: String, url: String) -> Result<String, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Err("Directory is not a local git repository".into());
    }

    let clean_url = url.trim().to_string();
    if clean_url.is_empty() {
        let _ = hidden_command("git")
            .args(["-C", &path, "remote", "remove", "origin"])
            .output();
        return Ok("".into());
    }

    let check = hidden_command("git")
        .args(["-C", &path, "remote", "get-url", "origin"])
        .output();

    let has_origin = check.map(|o| o.status.success()).unwrap_or(false);

    let res = if has_origin {
        hidden_command("git")
            .args(["-C", &path, "remote", "set-url", "origin", &clean_url])
            .output()
    } else {
        hidden_command("git")
            .args(["-C", &path, "remote", "add", "origin", &clean_url])
            .output()
    };

    match res {
        Ok(out) if out.status.success() => Ok(clean_url),
        Ok(out) => Err(String::from_utf8_lossy(&out.stderr).trim().to_string()),
        Err(e) => Err(format!("Failed to configure git remote: {}", e)),
    }
}

#[tauri::command]
fn list_git_branches(path: String) -> Result<Vec<String>, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() || !p.is_dir() {
        return Err("Directory does not exist".into());
    }

    let git_dir = p.join(".git");
    if !git_dir.exists() {
        return Ok(Vec::new());
    }

    // 1. Get local branches
    let local_output = hidden_command("git")
        .args(["-C", &path, "branch", "--format=%(refname:short)"])
        .output()
        .map_err(|e| format!("Failed to list local branches: {}", e))?;

    let stdout_local = String::from_utf8_lossy(&local_output.stdout);
    let mut branches: Vec<String> = stdout_local
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();

    // 2. Also check remote branches if available (e.g. origin/main, origin/development)
    if let Ok(remote_output) = hidden_command("git")
        .args(["-C", &path, "branch", "-r", "--format=%(refname:short)"])
        .output()
    {
        let stdout_remote = String::from_utf8_lossy(&remote_output.stdout);
        for line in stdout_remote.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.contains("HEAD") {
                continue;
            }
            // Strip remote prefix like "origin/"
            let branch_name = if let Some(idx) = trimmed.find('/') {
                &trimmed[idx + 1..]
            } else {
                trimmed
            };
            let branch_str = branch_name.to_string();
            if !branches.contains(&branch_str) {
                branches.push(branch_str);
            }
        }
    }

    // If branches is still empty, query rev-parse HEAD
    if branches.is_empty() {
        if let Ok(cur) = hidden_command("git")
            .args(["-C", &path, "rev-parse", "--abbrev-ref", "HEAD"])
            .output()
        {
            let b = String::from_utf8_lossy(&cur.stdout).trim().to_string();
            if !b.is_empty() && b != "HEAD" {
                branches.push(b);
            }
        }
    }

    Ok(branches)
}

#[tauri::command]
fn switch_git_branch(path: String, branch: String) -> Result<GitRepoInfo, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() || !p.is_dir() {
        return Err("Directory does not exist".into());
    }

    let target_branch = branch.trim();
    if target_branch.is_empty() {
        return Err("Target branch cannot be empty".into());
    }

    let output = hidden_command("git")
        .args(["-C", &path, "checkout", target_branch])
        .output()
        .map_err(|e| format!("Failed to execute git checkout: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let msg = if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "Git checkout failed with non-zero exit code".into()
        };
        return Err(msg);
    }

    inspect_git_repo(path)
}

#[tauri::command]
fn check_process_running(pid: u32) -> bool {
    #[cfg(target_os = "windows")]
    {
        // Use Win32 OpenProcess + GetExitCodeProcess for instant (<0.01ms) verification without spawning cmd / tasklist
        type HANDLE = *mut std::ffi::c_void;
        type DWORD = u32;
        type BOOL = i32;

        const PROCESS_QUERY_LIMITED_INFORMATION: DWORD = 0x1000;
        const STILL_ACTIVE: DWORD = 259;

        unsafe extern "system" {
            fn OpenProcess(
                dwDesiredAccess: DWORD,
                bInheritHandle: BOOL,
                dwProcessId: DWORD,
            ) -> HANDLE;
            fn GetExitCodeProcess(hProcess: HANDLE, lpExitCode: *mut DWORD) -> BOOL;
            fn CloseHandle(hObject: HANDLE) -> BOOL;
        }

        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if handle.is_null() {
                return false;
            }
            let mut exit_code: DWORD = 0;
            let success = GetExitCodeProcess(handle, &mut exit_code);
            CloseHandle(handle);
            success != 0 && exit_code == STILL_ACTIVE
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("kill").args(["-0", &pid.to_string()]).output();
        output.map(|o| o.status.success()).unwrap_or(false)
    }
}

#[tauri::command]
fn start_dev_process(path: String, command: String) -> Result<u32, String> {
    #[cfg(target_os = "windows")]
    {
        let child = hidden_command("cmd")
            .args(["/C", &command])
            .current_dir(&path)
            .spawn()
            .map_err(|e| format!("Failed to spawn command '{}': {}", command, e))?;
        Ok(child.id())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let child = Command::new("sh")
            .args(["-c", &command])
            .current_dir(&path)
            .spawn()
            .map_err(|e| format!("Failed to spawn command '{}': {}", command, e))?;
        Ok(child.id())
    }
}

#[tauri::command]
fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        hidden_command("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .spawn()
            .map_err(|e| format!("Failed to kill PID {}: {}", pid, e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("kill")
            .args(["-9", &pid.to_string()])
            .spawn()
            .map_err(|e| format!("Failed to kill PID {}: {}", pid, e))?;
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PathValidationResult {
    pub is_valid: bool,
    pub exists: bool,
    pub is_dir: bool,
    pub canonical_path: Option<String>,
    pub error_message: Option<String>,
    pub subdirectories_count: usize,
}

#[tauri::command]
fn validate_directory_path(path: String) -> Result<PathValidationResult, String> {
    let clean = path.trim().trim_matches('"').trim_matches('\'').trim();

    if clean.is_empty() {
        return Ok(PathValidationResult {
            is_valid: false,
            exists: false,
            is_dir: false,
            canonical_path: None,
            error_message: Some(
                "Directory path cannot be empty. Please provide a path.".to_string(),
            ),
            subdirectories_count: 0,
        });
    }

    let p = std::path::Path::new(clean);

    if !p.exists() {
        return Ok(PathValidationResult {
            is_valid: false,
            exists: false,
            is_dir: false,
            canonical_path: None,
            error_message: Some(format!(
                "Directory path does not exist on disk: \"{}\"",
                clean
            )),
            subdirectories_count: 0,
        });
    }

    if !p.is_dir() {
        return Ok(PathValidationResult {
            is_valid: false,
            exists: true,
            is_dir: false,
            canonical_path: None,
            error_message: Some(format!(
                "The path points to a file, not a directory folder: \"{}\"",
                clean
            )),
            subdirectories_count: 0,
        });
    }

    // Try reading directory to make sure it is accessible/has permissions
    let mut sub_count = 0;
    match std::fs::read_dir(p) {
        Ok(entries) => {
            for entry in entries.flatten() {
                if let Ok(ft) = entry.file_type() {
                    if ft.is_dir() {
                        sub_count += 1;
                    }
                }
            }
        }
        Err(e) => {
            return Ok(PathValidationResult {
                is_valid: false,
                exists: true,
                is_dir: true,
                canonical_path: None,
                error_message: Some(format!(
                    "Directory exists but cannot be accessed (permission error): {}",
                    e
                )),
                subdirectories_count: 0,
            });
        }
    }

    let canonical = match std::fs::canonicalize(p) {
        Ok(c) => {
            let s = c.to_string_lossy().to_string();
            Some(s.replace(r"\\?\", ""))
        }
        Err(_) => Some(clean.to_string()),
    };

    Ok(PathValidationResult {
        is_valid: true,
        exists: true,
        is_dir: true,
        canonical_path: canonical,
        error_message: None,
        subdirectories_count: sub_count,
    })
}

#[tauri::command]
fn list_subdirectories(path: String) -> Result<Vec<String>, String> {
    let dir = std::path::Path::new(&path);
    if !dir.exists() || !dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut folders = Vec::new();
    let ignored_names = [
        ".git",
        ".vscode",
        ".idea",
        "node_modules",
        "dist",
        "build",
        "target",
        ".next",
        ".nuxt",
        ".svelte-kit",
        "venv",
        ".venv",
        "__pycache__",
        ".gemini",
        ".turbo",
        ".artifacts",
        ".system_generated",
    ];

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let file_name = entry.file_name().to_string_lossy().to_string();
                    if !file_name.starts_with('.') && !ignored_names.contains(&file_name.as_str()) {
                        folders.push(format!("./{}", file_name));

                        // If it's a common monorepo grouping directory, inspect 1 level deeper
                        if matches!(
                            file_name.as_str(),
                            "packages" | "apps" | "services" | "crates" | "modules"
                        ) {
                            let sub_dir = entry.path();
                            if let Ok(sub_entries) = std::fs::read_dir(sub_dir) {
                                for sub_entry in sub_entries.flatten() {
                                    if let Ok(sub_ft) = sub_entry.file_type() {
                                        if sub_ft.is_dir() {
                                            let sub_name =
                                                sub_entry.file_name().to_string_lossy().to_string();
                                            if !sub_name.starts_with('.')
                                                && !ignored_names.contains(&sub_name.as_str())
                                            {
                                                folders
                                                    .push(format!("./{}/{}", file_name, sub_name));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    folders.sort();
    Ok(folders)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<TreeNode>>,
    pub size: Option<u64>,
    pub extension: Option<String>,
}

fn scan_tree(path: &std::path::Path, current_depth: usize, max_depth: usize) -> Option<TreeNode> {
    let name = path.file_name()?.to_string_lossy().to_string();
    let is_dir = path.is_dir();
    let extension = if !is_dir {
        path.extension().map(|e| e.to_string_lossy().to_string())
    } else {
        None
    };

    let size = if !is_dir {
        std::fs::metadata(path).ok().map(|m| m.len())
    } else {
        None
    };

    let mut children = None;
    if is_dir && current_depth < max_depth {
        let ignored_dirs = [
            ".git",
            "node_modules",
            "target",
            "dist",
            "build",
            ".next",
            ".nuxt",
            ".svelte-kit",
            "venv",
            ".venv",
            "__pycache__",
            ".gemini",
            ".turbo",
            ".artifacts",
        ];

        if !ignored_dirs.contains(&name.as_str()) {
            if let Ok(entries) = std::fs::read_dir(path) {
                let mut child_nodes = Vec::new();
                for entry in entries.flatten() {
                    let child_path = entry.path();
                    let child_name = child_path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    if child_name.starts_with('.') || ignored_dirs.contains(&child_name.as_str()) {
                        continue;
                    }

                    if let Some(node) = scan_tree(&child_path, current_depth + 1, max_depth) {
                        child_nodes.push(node);
                    }
                }

                // Sort directories first, then alphabetical
                child_nodes.sort_by(|a, b| match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                });

                children = Some(child_nodes);
            }
        }
    }

    Some(TreeNode {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        children,
        size,
        extension,
    })
}

#[tauri::command]
fn get_directory_tree(path: String, max_depth: Option<usize>) -> Result<TreeNode, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("Directory path does not exist: {}", path));
    }
    if !p.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let depth_limit = max_depth.unwrap_or(5);
    let root_node =
        scan_tree(p, 0, depth_limit).ok_or_else(|| "Failed to scan root directory".to_string())?;

    Ok(root_node)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContentResult {
    pub content: String,
    pub is_binary: bool,
    pub size: u64,
    pub line_count: usize,
}

fn to_base64(data: &[u8]) -> String {
    const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 {
            chunk[1] as usize
        } else {
            0
        };
        let b2 = if chunk.len() > 2 {
            chunk[2] as usize
        } else {
            0
        };

        result.push(CHARSET[(b0 >> 2) & 0x3F] as char);
        result.push(CHARSET[((b0 << 4) | (b1 >> 4)) & 0x3F] as char);
        if chunk.len() > 1 {
            result.push(CHARSET[((b1 << 2) | (b2 >> 6)) & 0x3F] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARSET[b2 & 0x3F] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[tauri::command]
fn read_file_content(path: String) -> Result<FileContentResult, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    if p.is_dir() {
        return Err(format!("Path is a directory, not a file: {}", path));
    }

    let metadata = std::fs::metadata(p).map_err(|e| e.to_string())?;
    let size = metadata.len();

    // Limit preview to files under 8 MB
    if size > 8 * 1024 * 1024 {
        return Ok(FileContentResult {
            content: format!(
                "File is too large to preview ({:.2} MB). Please open in external editor.",
                size as f64 / (1024.0 * 1024.0)
            ),
            is_binary: false,
            size,
            line_count: 0,
        });
    }

    let ext = p
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // Check for image formats
    if matches!(
        ext.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "ico"
    ) {
        if let Ok(bytes) = std::fs::read(p) {
            let mime = match ext.as_str() {
                "png" => "image/png",
                "jpg" | "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "ico" => "image/x-icon",
                _ => "application/octet-stream",
            };
            return Ok(FileContentResult {
                content: format!("data:{};base64,{}", mime, to_base64(&bytes)),
                is_binary: true,
                size,
                line_count: 0,
            });
        }
    }

    // Try reading text as UTF-8
    match std::fs::read_to_string(p) {
        Ok(text) => {
            let line_count = text.lines().count();
            Ok(FileContentResult {
                content: text,
                is_binary: false,
                size,
                line_count,
            })
        }
        Err(_) => {
            // Binary fallback
            Ok(FileContentResult {
                content: "Binary file format cannot be displayed in text viewer. Use 'Open in VS Code' to inspect this file.".to_string(),
                is_binary: true,
                size,
                line_count: 0,
            })
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_aptabase::Builder::new("A-US-0911298627")
                .with_crash_reporting()
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            open_in_ide,
            open_in_terminal,
            open_in_file_manager,
            inspect_git_repo,
            list_git_branches,
            switch_git_branch,
            get_git_remote_url,
            set_git_remote_url,
            start_dev_process,
            kill_process_by_pid,
            check_process_running,
            validate_directory_path,
            list_subdirectories,
            get_directory_tree,
            read_file_content
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|handler, event| match event {
            tauri::RunEvent::Exit { .. } => {
                let _ = handler.track_event("app_exited", None);
                handler.flush_events_blocking();
            }
            tauri::RunEvent::Ready { .. } => {
                let _ = handler.track_event("app_started", None);
            }
            _ => {}
        });
}
