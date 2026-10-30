# Style Foundry

A private creative-direction workspace for independent video editors and motion designers. Turn client intake, references, and visual decisions into an approval-ready brief before opening the timeline.

## Run

Requires Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

For the offline-capable production application:

```sh
npm run build
npm run preview
```

The production build generates a service worker that pre-caches the application, workers, and lazy modules. Load once on localhost or HTTPS, then the same origin can reload offline. Development mode intentionally does not register a service worker. No external fonts, analytics, AI service, or backend are required. Serve `dist` from a static host to deploy; retain HTTPS for storage/clipboard/service-worker features.

## Quality checks

```sh
npm test
npm run build
npx playwright test
```

Browser tests start or reuse a development server on port 5173 and a production preview on port 4173. The config uses `CHROMIUM_PATH` when supplied, then `/usr/bin/chromium` when available, otherwise the Playwright browser installation (`npx playwright install chromium`). Tests cover the creative workflow, exported documents, backup restoration, keyboard/mobile behavior, color math, and invalid imports. See `VALIDATION.md` for measured outcomes and limitations.

## What is included

- Project hub with searchable/archiveable cards, deadlines, workflow states, and template duplication with reuse provenance.
- Editable intake questions, reusable templates, standalone offline client forms, manual answers, answer-file import, and blank/filled print-to-PDF.
- Reference URLs and local media, Take/Avoid extraction, screenshot annotation, and reorderable Must/Should/Avoid priorities with deadline trade-offs.
- Client-photo sampling, worker-based k-means palette extraction, HSL harmonies, WCAG checks, tone controls, live graphic previews, HEX/RGB/CSS/JSON/Adobe ASE exports.
- Virtualized style library with bulk import, clipboard capture, filters, categories, and send-to-board.
- Local font directory indexing in a worker, virtualized/lazy previews, favorites, usage counts, pairing starting points, and a manual identification-service link.
- Konva mood board with pan/zoom, movable image/note/color/type/arrow/section/link objects, an eight-zone template, masonry view, and PNG/HTML/print exports.
- Editorial brief and compact cheat sheet, vision drafting, approval/feedback files, immutable versions with change summaries, HTML/Markdown/JSON/PNG/print-to-PDF, branding, and editing handoff notes.
- Workflow checklist, quick reference, command palette, light/dark themes, backup/restore, and original demo artwork.

## Local data & privacy

Dexie stores projects, local media Blobs and thumbnails, style entries, font metadata, questionnaire templates, and settings in the `style-foundry` IndexedDB database. The UI uses Zustand only for transient workspace state. Data is specific to this browser profile and origin. Clearing site data deletes it. Browser storage is not an independent backup.

Use **Settings & backup → Full backup · JSON** regularly. A versioned JSON includes media and all project data; restore validates schema, IDs, referenced media, and version snapshots before an atomic database replacement. Restoration is explicitly confirmed. Backups can be large because they include original media. Keep a copy outside the browser. Font bytes are never persisted or included in backups; reconnect a licensed font folder each session.

Client forms and approval briefs are self-contained downloaded HTML files. Send them yourself; clients return downloaded answer/feedback JSON files. This avoids accounts, public hosting, and automatic uploads. Public URLs and multi-user realtime collaboration are deliberately outside the local-first architecture. A feedback file is a recorded client decision, not a cryptographic signature.

## Architecture

`src/model.ts` defines domain types; `db.ts` owns schema, original demo data, and media ingestion; `schemas.ts`/`backup.ts` validate portable data. Feature screens live in `src/features`. `color.worker.ts` and `font.worker.ts` isolate CPU-heavy scanning. `documents.ts` and `guide.ts` generate escaped standalone documents. Konva handles retained scene-graph dragging and rasterization rather than a custom whiteboard engine. Feature modules are lazy-loaded; library and font DOM rows are virtualized.

Custom CSS variables define a restrained editing-suite aesthetic. HSL is used for transparent, predictable hue relationships; WCAG contrast uses linearized sRGB luminance. No proprietary frame or font ships with the demo.

## Practical limits

- PDF uses the browser’s print engine / Save as PDF, not a remote renderer. The cheat sheet is compact; very long inputs may require more than one page. User fonts are not embedded for licensing reasons.
- The font worker reads OpenType name tables in TTF/OTF. WOFF/WOFF2 use filename-based names; unsupported or disconnected fonts show a clearly labeled system fallback. The browser cannot scan arbitrary filesystem paths without user selection.
- Font-identification screenshots are kept locally while the helper is open. Opening WhatTheFont does not upload them; choose the image there yourself if desired.
- The board’s PNG export has a 24-megapixel bounds guard. Use HTML for a very large canvas. PDF boards use an A3 landscape print layout; large boards may span pages.
- Videos remain local reference assets. The app does not download videos from reference URLs, transcribe, analyze video frames automatically, or promise visual font recognition.
- No hosted link service, optional AI, or desktop wrapper is included. These can be added without changing the local data model.

See [USER_GUIDE.md](USER_GUIDE.md) for the workflow and [PLAN.md](PLAN.md) for the architecture and milestone decisions.
