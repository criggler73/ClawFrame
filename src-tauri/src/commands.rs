//! Tauri commands — these are the entry points the frontend calls
//! via `invoke("command_name")`. Keep these thin: validation here,
//! real logic in the modules they delegate to.

use crate::ollama;
use crate::system;
use serde::Serialize;

// ============================================================================
// System info
// ============================================================================

#[tauri::command]
pub async fn get_system_info() -> Result<system::SystemInfo, String> {
    system::get_system_info().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn detect_components() -> Result<Vec<system::ComponentStatus>, String> {
    system::detect_components().await.map_err(|e| e.to_string())
}

// ============================================================================
// Ollama
// ============================================================================

#[tauri::command]
pub async fn ping_ollama() -> Result<bool, String> {
    Ok(ollama::ping().await.unwrap_or(false))
}

#[tauri::command]
pub async fn list_ollama_models() -> Result<Vec<ollama::OllamaModel>, String> {
    ollama::list_models().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pull_ollama_model(name: String) -> Result<(), String> {
    ollama::pull_model(&name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_ollama_model(name: String) -> Result<(), String> {
    ollama::delete_model(&name).await.map_err(|e| e.to_string())
}

// ============================================================================
// Snapshots (placeholder — implement next)
// ============================================================================

#[derive(Serialize)]
pub struct SnapshotResult {
    pub id: String,
}

#[tauri::command]
pub async fn create_snapshot(label: String) -> Result<String, String> {
    // TODO: real implementation will:
    // 1. Snapshot the config dir (C:\ProgramData\ClawFrame on Windows,
    //    ~/Library/Application Support/ClawFrame on macOS)
    // 2. Record manifest of installed components and versions
    // 3. Store under snapshots/<timestamp-label>.json
    let id = format!(
        "snapshot-{}-{}",
        chrono::Utc::now().format("%Y%m%d-%H%M%S"),
        label
    );
    Ok(id)
}
