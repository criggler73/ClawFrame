# Architecture

This doc captures why ClawFrame is built the way it is, so future contributors don't have to re-litigate decisions that were already made.

## High-level

```
┌────────────────────────────────────────────────────┐
│                   ClawFrame.app                    │
│  ┌──────────────┐         ┌────────────────────┐   │
│  │   Frontend   │  IPC    │   Rust backend     │   │
│  │ React + TS   │ ◄────►  │  Tauri commands    │   │
│  │   (WebView)  │         │  + native modules  │   │
│  └──────────────┘         └────────┬───────────┘   │
└────────────────────────────────────┼───────────────┘
                                     │
            ┌────────────────────────┼─────────────────────┐
            ▼                        ▼                     ▼
       ┌─────────┐            ┌────────────┐         ┌──────────┐
       │ Ollama  │            │ Filesystem │         │  Shell   │
       │  HTTP   │            │ Snapshots  │         │ commands │
       │  :11434 │            │   Logs     │         │ (wsl,    │
       └─────────┘            │  Configs   │         │  docker) │
                              └────────────┘         └──────────┘
```

## Why Tauri 2.x

We compared Tauri vs. Electron vs. native (Swift + C#). Tauri won because:

| Concern | Tauri | Electron | Native |
|---|---|---|---|
| Installer size | ~10 MB | 100+ MB | Smallest |
| Idle memory | 30-40 MB | 200-300 MB | Smallest |
| Single codebase Win+Mac | ✅ | ✅ | ❌ (two codebases) |
| Security model | Capability-based, deny by default | Permissive | Most flexible |
| Web UI portability | ✅ | ✅ | ❌ |
| Learning curve | Rust learning required | Pure JS | Two languages |

For a **security/install tool aimed at small businesses**, install size and trust matter most. A 10 MB signed installer feels professional. A 150 MB Electron blob feels suspect for a tool whose job is to install other tools.

## Frontend stack

- **React 18 + TypeScript** — boring, well-supported, AI tools (including Cursor) write it well
- **Vite** — fast dev server, fast builds, no config drama
- **Hand-rolled CSS with design tokens** — no Tailwind. Reasoning: the design language is small and intentional, and CSS variables play nicely with both light and dark mode if we add it later. Also avoids Tailwind purging issues in Tauri's WebView.
- **No state library** — `useState` and `useEffect` are enough until they aren't. Add Zustand if global state grows.

## Backend stack

- **Rust + Tauri 2.x** — Tauri's Rust is mostly "shell out, parse, return JSON." Solo developers with AI assistants ship Tauri apps every week.
- **`reqwest`** for HTTP (Ollama API)
- **`sysinfo`** for hardware probes (cross-platform)
- **`tokio::process`** for shelling out to native commands (`wsl`, `docker`, `ollama`)
- **`anyhow`** for ergonomic error handling
- **`serde`** for JSON serialization between Rust and the frontend

## The IPC boundary

Every command from the frontend lives in `src-tauri/src/commands.rs` as a thin `#[tauri::command]` handler. These handlers do **only**:

1. Parameter validation
2. Delegation to a real module (`system::`, `ollama::`, etc.)
3. Error mapping to `String` for the frontend

This keeps business logic out of the IPC layer and easy to unit-test with plain `cargo test`.

The frontend mirrors this with `src/lib/api.ts` — the *only* file that imports `@tauri-apps/api`. Components call `api.method()`, which:

- Calls the real Rust command when running inside Tauri
- Returns mock data when running in plain `npm run dev` (vite-only)

This dual-mode is critical for design iteration: you can run the UI in a browser without compiling Rust at all.

## Permission model

Tauri 2 uses **capability-based permissions**. Every native call is denied by default; the frontend can only do what `src-tauri/capabilities/default.json` explicitly grants.

This is the opposite of Electron, where the renderer has Node.js access by default and you have to lock things down. For a tool that handles installs and secrets, default-deny is the right posture.

## Snapshots (planned)

Every change ClawFrame makes — installing a dependency, editing config, pulling a model — should be reversible. Plan:

- A snapshot is a JSON manifest + tarball of the config dir
- Stored at `<data_dir>/snapshots/<timestamp>-<label>.tar.gz`
- Created automatically before any state-changing operation
- Listed in the Snapshots page; restorable with one click

Implementation lives in (future) `src-tauri/src/snapshot.rs`.

## Updates (planned)

Tauri has a built-in updater. Plan:

- Self-host the update manifest at `https://releases.clawframe.app/<channel>/latest.json`
- Three channels: stable, beta, dev (already in the wizard)
- Updater checks on launch + every 4 hours; prompts user; downloads + verifies signature; restarts

## What we explicitly chose NOT to do

- **No Electron.** Size, memory, security model.
- **No bundled Ollama.** ClawFrame *manages* Ollama; it doesn't ship its own copy. This keeps our binary small and lets users keep their existing Ollama install.
- **No telemetry by default.** Local-only logs. Opt-in support bundle export.
- **No public AI APIs in the runtime.** External AI only via approved brokered endpoints.
- **No multi-user / RBAC in v1.** That's enterprise. Different package, later.
