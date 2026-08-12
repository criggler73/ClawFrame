// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ollama;
mod system;

use commands::*;

fn main() {
    clawframe_lib::run()
}

// The actual app builder lives in lib.rs so that mobile targets can reuse it.
pub mod clawframe_lib {
    use super::*;

    pub fn run() {
        tauri::Builder::default()
            .plugin(tauri_plugin_shell::init())
            .plugin(tauri_plugin_dialog::init())
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_os::init())
            .plugin(tauri_plugin_http::init())
            .plugin(tauri_plugin_store::Builder::default().build())
            .invoke_handler(tauri::generate_handler![
                get_system_info,
                detect_components,
                ping_ollama,
                list_ollama_models,
                pull_ollama_model,
                delete_ollama_model,
                create_snapshot,
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
