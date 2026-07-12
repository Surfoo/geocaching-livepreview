# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page tool that lets geocache owners write their cache description in HTML/CodeMirror and see a live preview rendered with geocaching.com's actual CSS (`coreCSS`, Noto Sans font), so they don't have to save-and-reload on the real site to check formatting.

## Commands

- `bun run watch` — rebuild `public/app.bundle.js` on change (bun build, minified, inline sourcemap)
- `bun run build` — one-off production build of the bundle
- `bunx biome check .` / `bunx biome format --write .` — lint/format (biome.json: 4-space indent, single quotes, no semicolons, 120 col width, `linter.recommended` disabled)

There is no test suite. There's no dev server script — open `public/index.html` directly or serve `public/` statically after building the bundle.

## Architecture

- `src/app.js` is the entire application (single file, no framework). It bundles to `public/app.bundle.js` via bun's built-in bundler (invoked through the `bun build` CLI flags in `package.json` scripts — there's no separate esbuild/rollup config file). The bundle is committed and referenced with a cache-busting query string in `index.html` (`app.bundle.js?20240907` — bump this string when shipping a bundle change).
- **Editor**: CodeMirror 6 (`@codemirror/*`) instance mounted on `#inputText`, with HTML language support, one-dark theme, autocompletion, and history/keymaps. Its contents are persisted to `localStorage` under the key `content` on every change (guarded by a `storageAvailable` feature check) and restored on load.
- **Preview**: an open shadow root attached to `#previewContainer`. `initPreview()` builds a synthetic `<html><head>…<link coreCSS/fonts…></head><body><div class="UserSuppliedContent"><span id="ctl00_ContentBody_LongDescription">…` structure inside the shadow root, mimicking geocaching.com's actual DOM (`ctl00_ContentBody_LongDescription` is the real element ID geocaching.com uses) so the loaded `coreCSS` styles apply identically. `applyPreview(content)` sets `innerHTML` on that span on every editor change — intentionally unsanitized since it's a local single-user preview of the user's own content.
- **i18n**: `i18next` + `i18next-fetch-backend`, loading `assets/locales/{{lng}}.json` (currently hardcoded to `fr.json` as `loadPath` in `i18nextOptions`, not driven by browser locale detection). Locale files live at `public/assets/locales/{en,fr}.json`; elements needing translation are marked with `data-i18n-key` in `index.html`.
- **Modals**: generic `[data-modal]` trigger → `#<id>.modal` show/hide via `.modal-open` class, wired at the bottom of `app.js`. Used for the Help popin.
- Copy-to-clipboard button is hidden entirely if `navigator.clipboard.writeText` is unavailable.

## Notes

- Dependencies are minimal: CodeMirror + i18next only, no framework.
- `public/app.bundle.js` and its `.map` are build artifacts but are committed to the repo — regenerate with `bun run build` after editing `src/app.js`, and bump the query-string version in `index.html`'s script tag.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->
