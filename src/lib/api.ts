/**
 * Tauri command adapter.
 *
 * This is the ONLY file in the frontend that talks to Rust.
 * Every UI component goes through this adapter — never imports
 * @tauri-apps/api directly.
 *
 * When running in `tauri dev` we call the real Rust commands.
 * When running in `vite` (browser only, no Tauri) we fall back
 * to mock data so the UI is still usable for design iteration.
 */

import { invoke } from "@tauri-apps/api/core";

// Detect if we're running inside Tauri (window.__TAURI_INTERNALS__ exists)
// vs. plain browser mode (vite dev for design work).
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// ============================================================================
// Types — these MUST match the Rust structs in src-tauri/src/*.rs
// ============================================================================
export interface SystemInfo {
  os: string;
  os_version: string;
  arch: string;
  cpu_brand: string;
  cpu_cores: number;
  total_memory_gb: number;
  available_memory_gb: number;
  free_disk_gb: number;
  total_disk_gb: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface ComponentStatus {
  name: string;
  installed: boolean;
  version: string | null;
  detected_path: string | null;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

// ============================================================================
// Public API — call these from React components
// ============================================================================

export const api = {
  /** Scan the host system for OS, hardware, and resources. */
  async getSystemInfo(): Promise<SystemInfo> {
    if (!isTauri) return mockSystemInfo();
    return await invoke<SystemInfo>("get_system_info");
  },

  /** Detect which dependencies (WSL, Docker, Ollama, etc.) are installed. */
  async detectComponents(): Promise<ComponentStatus[]> {
    if (!isTauri) return mockComponents();
    return await invoke<ComponentStatus[]>("detect_components");
  },

  /** List models currently installed via Ollama. */
  async listOllamaModels(): Promise<OllamaModel[]> {
    if (!isTauri) return mockOllamaModels();
    return await invoke<OllamaModel[]>("list_ollama_models");
  },

  /** Check if the Ollama HTTP API is reachable on localhost:11434. */
  async pingOllama(): Promise<boolean> {
    if (!isTauri) return true;
    return await invoke<boolean>("ping_ollama");
  },

  /**
   * Pull a model from Ollama. Streams progress via the onProgress callback.
   * NOTE: Real implementation will use Tauri events for streaming.
   * For now this is a single-shot call.
   */
  async pullOllamaModel(name: string): Promise<void> {
    if (!isTauri) return mockPull(name);
    return await invoke<void>("pull_ollama_model", { name });
  },

  /** Delete a model from Ollama. */
  async deleteOllamaModel(name: string): Promise<void> {
    if (!isTauri) return;
    return await invoke<void>("delete_ollama_model", { name });
  },

  /** Create a snapshot of the current ClawFrame state. */
  async createSnapshot(label: string): Promise<string> {
    if (!isTauri) return `mock-snapshot-${Date.now()}`;
    return await invoke<string>("create_snapshot", { label });
  },
};

// ============================================================================
// Mock data — used when running in vite dev mode (no Tauri)
// ============================================================================

function mockSystemInfo(): SystemInfo {
  return {
    os: "Windows",
    os_version: "11 Pro 24H2",
    arch: "x86_64",
    cpu_brand: "Intel i7-13700K",
    cpu_cores: 24,
    total_memory_gb: 32,
    available_memory_gb: 18,
    free_disk_gb: 312,
    total_disk_gb: 1000,
  };
}

function mockComponents(): ComponentStatus[] {
  return [
    { name: "WSL2", installed: true, version: "2.1.5", detected_path: "C:\\Windows\\System32\\wsl.exe" },
    { name: "Docker Desktop", installed: true, version: "4.27.2", detected_path: "C:\\Program Files\\Docker" },
    { name: "Ollama", installed: false, version: null, detected_path: null },
    { name: "NemoClaw", installed: false, version: null, detected_path: null },
  ];
}

function mockOllamaModels(): OllamaModel[] {
  return [
    { name: "llama3.1:8b", size: 4_700_000_000, digest: "sha256:a1f8…3d92", modified_at: "2026-04-24T13:54:00Z" },
    { name: "qwen2.5-coder:7b", size: 4_400_000_000, digest: "sha256:b2c9…5e10", modified_at: "2026-04-24T14:31:00Z" },
  ];
}

async function mockPull(_name: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 800));
}
