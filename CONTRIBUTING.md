# Contributing to ClawFrame

Thanks for your interest in helping build ClawFrame! This is an early-stage project — the architecture is intentionally simple so contributors can jump in quickly.

## Quick start

See the main [README.md](./README.md) for setup. TL;DR:

```bash
npm install
npm run tauri:dev
```

## Project structure

```
clawframe/
├── src/                    React + TypeScript frontend
│   ├── components/         Shared UI components
│   ├── pages/              Route-level pages (Wizard, Console)
│   ├── lib/api.ts          The ONLY file that talks to Rust
│   └── styles/             Global CSS
├── src-tauri/              Rust backend
│   └── src/
│       ├── main.rs         Tauri app entry + plugin registration
│       ├── commands.rs     Thin handlers exposed to the frontend
│       ├── system.rs       OS / hardware / dependency detection
│       └── ollama.rs       Ollama HTTP API client
└── .github/workflows/      CI builds for Windows + macOS
```

## How to add a new feature

A typical feature touches three files:

1. **`src-tauri/src/<module>.rs`** — implement the logic in Rust.
2. **`src-tauri/src/commands.rs`** — add a thin `#[tauri::command]` handler.
3. **`src-tauri/src/main.rs`** — register the handler in `invoke_handler![...]`.
4. **`src/lib/api.ts`** — add a typed wrapper that calls `invoke("name")`.
5. **`src/pages/...`** — call `api.yourFunction()` from a React component.

Keep the frontend ignorant of Tauri internals — everything goes through `api.ts`.

## Coding conventions

- **TypeScript**: strict mode, no `any` unless commented why.
- **Rust**: `cargo fmt` and `cargo clippy` before pushing.
- **Commits**: short, present-tense, lowercase. `add models page snapshot`, not `Added the models page snapshot.`

## Areas that need help

See the issues tab. Good first issues:

- Port the rest of the wizard steps from the prototype (`clawframe.html`) into React components.
- Implement real snapshots in `src-tauri/src/snapshot.rs`.
- Add streaming progress for `pull_ollama_model` via Tauri events.
- macOS-specific dependency detection (Homebrew, Docker.app paths).
- Repair mode: a safe-mode launch flow.

## Reporting issues

Please include:

- Your OS and version
- ClawFrame version (visible in the top bar)
- Whether Ollama is running, and which version
- Steps to reproduce

## Code of conduct

Be kind. We're all here to build something useful.
