//! Cross-platform system inspection.
//!
//! Uses `sysinfo` for hardware info, and platform-specific PATH probes
//! for detecting dependencies (WSL, Docker, Ollama, etc.).

use anyhow::Result;
use serde::Serialize;
use sysinfo::{Disks, System};

#[derive(Serialize)]
pub struct SystemInfo {
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub total_memory_gb: f64,
    pub available_memory_gb: f64,
    pub free_disk_gb: f64,
    pub total_disk_gb: f64,
}

#[derive(Serialize)]
pub struct ComponentStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub detected_path: Option<String>,
}

pub fn get_system_info() -> Result<SystemInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let disks = Disks::new_with_refreshed_list();
    let primary = disks.iter().next();
    let (free_disk_gb, total_disk_gb) = match primary {
        Some(d) => (
            d.available_space() as f64 / 1_073_741_824.0,
            d.total_space() as f64 / 1_073_741_824.0,
        ),
        None => (0.0, 0.0),
    };

    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".into());

    Ok(SystemInfo {
        os: System::name().unwrap_or_else(|| "Unknown".into()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".into()),
        arch: std::env::consts::ARCH.into(),
        cpu_brand,
        cpu_cores: sys.cpus().len(),
        total_memory_gb: sys.total_memory() as f64 / 1_073_741_824.0,
        available_memory_gb: sys.available_memory() as f64 / 1_073_741_824.0,
        free_disk_gb,
        total_disk_gb,
    })
}

pub async fn detect_components() -> Result<Vec<ComponentStatus>> {
    Ok(vec![
        detect_command("WSL2", "wsl", &["--version"]).await,
        detect_command("Docker Desktop", "docker", &["--version"]).await,
        detect_command("Ollama", "ollama", &["--version"]).await,
        ComponentStatus {
            name: "NemoClaw".into(),
            installed: false,
            version: None,
            detected_path: None,
        },
    ])
}

/// Run `cmd args...` and capture the first line of stdout as the version.
/// Returns installed=false if the command can't be run.
async fn detect_command(name: &str, cmd: &str, args: &[&str]) -> ComponentStatus {
    let output = tokio::process::Command::new(cmd)
        .args(args)
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let version = stdout.lines().next().map(|s| s.trim().to_string());
            ComponentStatus {
                name: name.into(),
                installed: true,
                version,
                detected_path: which::which(cmd)
                    .ok()
                    .map(|p| p.display().to_string()),
            }
        }
        _ => ComponentStatus {
            name: name.into(),
            installed: false,
            version: None,
            detected_path: None,
        },
    }
}
