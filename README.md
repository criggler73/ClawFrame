# ClawFrame

> Managed installer & control console for OpenClaw / NemoClaw.
> Local-first. Signed. Reversible.

ClawFrame replaces the painful CLI install of OpenClaw/NemoClaw with a guided desktop app: detect your environment, install dependencies safely, pin known-good versions, and roll back when something breaks. Built with **Tauri 2.x + React + Rust**.

---

## Status

🚧 **Early prototype** — the scaffold runs, the Models page talks to a real Ollama daemon, the rest of the UI is being ported from the design prototype.

## Why Tauri?

Tauri produces a ~10 MB signed installer instead of Electron's 100+ MB, uses ~30 MB of RAM at idle vs. 200+ MB, and has a security-by-default permission model that fits a tool managing privileged installs. See [`docs/architecture.md`](./docs/architecture.md) for the full reasoning.

---

## Prerequisites

You only need to install these once. After that, `npm run tauri:dev` is the only command you'll run day-to-day.

### 1. Node.js 20+

- **Windows / macOS**: [nodejs.org](https://nodejs.org) — download the LTS installer
- Verify: `node --version` should print `v20.x` or higher

### 2. Rust (stable)

- **Windows**: download `rustup-init.exe` from [rustup.rs](https://rustup.rs)
- **macOS**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Verify: `rustc --version` should print `rustc 1.8x.x` or higher
- Restart your terminal after install so PATH updates take effect

### 3. Platform build tools

**Windows:** install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — pick "Desktop development with C++" in the installer. Also enable [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (already on Windows 11).

**macOS:** `xcode-select --install` (if you haven't already)

### 4. Ollama (optional, but the Models page needs it)

- Install from [ollama.com](https://ollama.com)
- Run `ollama serve` in a terminal (or it auto-starts on macOS)

---

## Run it

```bash
# 1. Install JS dependencies
npm install

# 2. Run in dev mode (compiles Rust the first time — takes 2-5 minutes)
npm run tauri:dev
```

A native window should open with ClawFrame running. The first build is slow because Rust compiles every dependency from source. Subsequent builds are seconds.

### Frontend-only mode (no Rust compile)

If you just want to iterate on the UI without waiting on Rust:

```bash
npm run dev
```

Open `http://localhost:1420` in your browser. The `api.ts` adapter falls back to mock data automatically when not running inside Tauri, so the UI is fully usable.

---

## Build a real installer

```bash
npm run tauri:build
```

Output:

- **Windows (MSI)**: `src-tauri/target/release/bundle/msi/ClawFrame_0.1.0_x64_en-US.msi`
- **Windows (setup EXE)**: `src-tauri/target/release/bundle/nsis/ClawFrame_0.1.0_x64-setup.exe`
- **macOS**: `src-tauri/target/release/bundle/dmg/ClawFrame_0.1.0_aarch64.dmg`

These are unsigned. To distribute publicly without scaring users, you'll need code signing — see [Distribution](#distribution) below.

---

## Project structure

```
clawframe/
├── src/                          React + TypeScript frontend
│   ├── App.tsx                   View switcher (wizard ↔ console)
│   ├── components/               TopBar, ToastHost
│   ├── pages/
│   │   ├── Wizard.tsx            10-step setup wizard
│   │   └── Console.tsx           Sidebar nav for the main app
│   │       └── console/
│   │           ├── Overview.tsx
│   │           └── Models.tsx    Live Ollama integration
│   ├── lib/api.ts                The ONLY file that talks to Rust
│   └── styles/global.css         Design tokens (dark + lime accent)
│
├── src-tauri/                    Rust backend
│   ├── Cargo.toml                Rust dependencies
│   ├── tauri.conf.json           Window size, bundle config, identifier
│   ├── capabilities/default.json Tauri 2 permission grants
│   └── src/
│       ├── main.rs               Desktop entry point
│       ├── lib.rs                App builder and command registration
│       ├── commands.rs           #[tauri::command] handlers
│       ├── system.rs             OS / hardware / dependency probes
│       └── ollama.rs             Ollama HTTP client
│
├── .github/workflows/build.yml   CI: builds Win MSI + Mac DMG on every tag
├── README.md                     ← you are here
└── CONTRIBUTING.md               How to add features
```

---

## How the frontend talks to Rust

A typical feature flows like this:

```
React component                     →  src/lib/api.ts        →  src-tauri/src/commands.rs  →  src-tauri/src/<module>.rs
api.listOllamaModels()                  invoke("list_ollama_models")  #[tauri::command]              ollama::list_models()
```

The frontend never imports `@tauri-apps/api` directly — everything goes through `lib/api.ts`. This means:

- TypeScript types match Rust structs in one place
- Mock fallbacks live in one place (so `npm run dev` works without Tauri)
- Swapping in real Rust later is a one-line change

### Adding a new command (template)

1. **Rust logic** — add a function in the right module (`system.rs`, `ollama.rs`, or a new file).
2. **Command handler** — add a thin `#[tauri::command]` in `commands.rs` that calls your function.
3. **Register** — add the handler name to `invoke_handler![ ... ]` in `lib.rs`.
4. **TypeScript wrapper** — add a method in `src/lib/api.ts` with matching types.
5. **Use it** — call `api.yourCommand()` from any React component.

---

## Push to GitHub

If you want others to contribute:

```bash
# From inside the clawframe/ directory
git init
git add .
git commit -m "initial scaffold"

# Create the empty repo on github.com first, then:
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/clawframe.git
git push -u origin main
```

### Cut your first release

When you're ready to publish a build:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The `.github/workflows/build.yml` workflow will fire automatically and build:
- Windows MSI (x64)
- macOS DMG (Apple Silicon)
- macOS DMG (Intel)

Builds appear as a **draft release** on GitHub. Edit it, write release notes, and publish.

---

## Distribution

Unsigned builds work but trigger scary warnings. To ship cleanly:

### Windows

- Buy an **EV Code Signing Certificate** (~$300–600/year — Sectigo, DigiCert, SSL.com)
- Add `WINDOWS_CERTIFICATE_THUMBPRINT` and related secrets to your GitHub Actions workflow
- See [Tauri's Windows signing guide](https://v2.tauri.app/distribute/sign/windows/)

### macOS

- Apple Developer Program membership (~$99/year)
- Set `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` secrets
- Apps must be **notarized** (Apple scans for malware) — Tauri handles this automatically when secrets are present
- See [Tauri's macOS signing guide](https://v2.tauri.app/distribute/sign/macos/)

Both certificates take 1–2 weeks to obtain and verify. Start that process before you need it.

---

## Roadmap

- [x] Tauri scaffold + React frontend skeleton
- [x] System info via Rust
- [x] Live Ollama integration (list, pull, delete)
- [ ] Port full 10-step wizard from `clawframe.html` prototype
- [ ] Streaming pull progress (Tauri events)
- [ ] Snapshot create/restore
- [ ] Repair mode (safe-mode launch)
- [ ] Configuration page with diff-against-applied
- [ ] Logs & audit trail
- [ ] Auto-updater
- [ ] Code signing for Windows and macOS
- [ ] Windows MSI + macOS DMG release pipeline

---

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs welcome.
