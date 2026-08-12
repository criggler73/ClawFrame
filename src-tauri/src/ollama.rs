//! Ollama HTTP API client.
//!
//! Talks to the local Ollama daemon at http://localhost:11434.
//! Reference: https://github.com/ollama/ollama/blob/main/docs/api.md

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

const OLLAMA_BASE: &str = "http://localhost:11434";

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub digest: String,
    pub modified_at: String,
}

#[derive(Deserialize)]
struct TagsResponse {
    models: Vec<OllamaModel>,
}

/// Returns true if the Ollama daemon is reachable.
pub async fn ping() -> Result<bool> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()?;
    let res = client.get(OLLAMA_BASE).send().await;
    Ok(res.is_ok())
}

/// List models installed via Ollama (GET /api/tags).
pub async fn list_models() -> Result<Vec<OllamaModel>> {
    let url = format!("{}/api/tags", OLLAMA_BASE);
    let res: TagsResponse = reqwest::Client::new()
        .get(&url)
        .send()
        .await
        .context("failed to reach Ollama (is `ollama serve` running?)")?
        .json()
        .await
        .context("failed to parse Ollama response")?;
    Ok(res.models)
}

/// Pull a model (POST /api/pull). The real API streams JSON-line progress;
/// for the prototype we just block until done. To stream progress to the
/// frontend later, switch to reqwest streaming + emit Tauri events.
pub async fn pull_model(name: &str) -> Result<()> {
    let url = format!("{}/api/pull", OLLAMA_BASE);
    let body = serde_json::json!({ "name": name, "stream": false });
    let res = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60 * 30)) // 30 min for big pulls
        .build()?
        .post(&url)
        .json(&body)
        .send()
        .await
        .context("pull request failed")?;
    if !res.status().is_success() {
        anyhow::bail!("pull failed: HTTP {}", res.status());
    }
    Ok(())
}

/// Delete a model (DELETE /api/delete).
pub async fn delete_model(name: &str) -> Result<()> {
    let url = format!("{}/api/delete", OLLAMA_BASE);
    let body = serde_json::json!({ "name": name });
    let res = reqwest::Client::new()
        .delete(&url)
        .json(&body)
        .send()
        .await
        .context("delete request failed")?;
    if !res.status().is_success() {
        anyhow::bail!("delete failed: HTTP {}", res.status());
    }
    Ok(())
}
