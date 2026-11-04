# Quire

A thoughtful, offline desktop Writer for Windows, Linux, and macOS. Built by Sagar.

Quire keeps your documents on your device. There is no account, cloud sync, telemetry, or network requirement at runtime. Open a blank page or one of six original starter templates, write with a full ribbon, and save to `.docx` or export a vector PDF.

## Features

- Paged Letter, A4, and Legal canvas with 20px rulers, margins, zoom, and print/web/read views.
- Rich text editing with styles, tables, images, shapes, links, headers, footers, page numbers, and watermarks.
- Full Writer ribbon: Home, Insert, Draw, Design, Layout, References, Mailings, Review, View, and Help.
- Comments, tracked changes, word count, find/replace, and read-only protection.
- Mail merge from local CSV, envelopes, and labels.
- DOCX open/save with Quire layout metadata preserved in a custom document property.
- PDF export through Electron print-to-PDF of the paged document.
- Native file dialogs, recent documents with thumbnails, tabs, AutoSave, and keyboard shortcuts.
- Light, dark, and system themes with keyboard-accessible controls and reduced-motion support.

## Install

Download the installer for your platform from the [v1.0.0 release](https://github.com/Sagar-79-Singh/Quire/releases/tag/v1.0.0):

- Windows: NSIS installer (`.exe`)
- Linux: AppImage and `.deb`
- macOS: DMG and ZIP for Intel and Apple Silicon

macOS builds are unsigned in this release. If Gatekeeper blocks the app, right-click the app and choose Open, or allow it in System Settings → Privacy & Security.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| New document | Ctrl/Cmd+N |
| Open | Ctrl/Cmd+O |
| Save | Ctrl/Cmd+S |
| Save As | Ctrl/Cmd+Shift+S |
| Print | Ctrl/Cmd+P |
| Find | Ctrl/Cmd+F |
| Replace | Ctrl/Cmd+H |
| Undo / Redo | Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z |
| Bold / Italic / Underline | Ctrl/Cmd+B / I / U |
| Spelling | F7 |
| Full screen | F11 |
| Next / previous tab | Ctrl+Tab / Ctrl+Shift+Tab |
| Zoom in / out / reset | Ctrl/Cmd+= / - / 0 |

## Privacy

Your documents stay on your device. Quire does not send document content, file paths, or usage data to any server. Recent-document metadata and preferences are stored locally. Keep backups of important files.

## File compatibility

Quire reads `.docx` through mammoth and writes `.docx` through the docx library. Documents saved by Quire embed a `quireDocument` custom property containing the editor HTML and page settings so Quire can round-trip its own files without losing layout metadata. Documents created elsewhere are imported as semantic HTML; complex proprietary layout may be simplified. PDF export is a printable, vector-text copy of the document.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). Stack: Electron, React, Vite, Tailwind CSS, strict TypeScript, Zustand, Vitest, Testing Library, Playwright, and electron-builder.

```bash
npm ci
npm run dev
```

## Author

Sagar — [GitHub](https://github.com/Sagar-79-Singh) — s07909084193@gmail.com

## License

MIT © 2025 Sagar. See [LICENSE](LICENSE).
