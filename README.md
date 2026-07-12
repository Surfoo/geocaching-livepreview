# Geocaching Live Preview

Get your final geocache description at a glance!

When writing a geocache description on geocaching.com, checking the result normally means saving, then reloading the cache page in another tab — repeated for every tweak. Geocaching Live Preview lets you write your HTML description in an editor and see it rendered instantly, using geocaching.com's own stylesheet (`coreCSS`) and fonts, so what you see matches the real page.

This is an "expert" mode for people who already write their descriptions in HTML.

## Features

- CodeMirror-based HTML editor with syntax highlighting, autocompletion, and undo history
- Live preview rendered in a shadow DOM against geocaching.com's real `coreCSS`
- Content auto-saved to `localStorage` so you don't lose your work on reload
- One-click copy of the HTML back to your clipboard for pasting into geocaching.com

## Running locally

Requires [Bun](https://bun.sh).

```bash
bun install
bun run build   # one-off build of public/app.bundle.js
# or
bun run watch   # rebuild on file changes
```

Then serve the `public/` directory statically, e.g.:

```bash
bunx serve public
```

and open it in your browser.

## Development

- `bun run build` — production build (minified, inline sourcemap)
- `bun run watch` — rebuild on change
- `bun run check` / `bun run fix` — lint / auto-fix with [Biome](https://biomejs.dev)

A pre-commit hook lints staged files with Biome. It's enabled automatically by `bun install` (via the `prepare` script); to enable it manually run `git config core.hooksPath hooks`.

## License

GNU General Public License v3.0
