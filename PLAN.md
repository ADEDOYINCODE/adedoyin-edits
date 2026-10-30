# Style Foundry

## Product and architecture

A private, offline-first React + TypeScript/Vite application. CSS variables define a bespoke editing-suite interface. Dexie/IndexedDB stores structured projects and media separately; Zustand coordinates selection and workspace state. Konva provides the board scene graph and image export. Color extraction runs in a worker; color relationships use HSL and WCAG luminance math. Standalone HTML exports carry their own styles and data, without hosted accounts or remotely uploaded client material. PDF uses the browser's high-fidelity print engine; PNG uses local DOM/canvas rendering. Font files remain local and are excluded from exports and backups.

## Data model

Projects contain client metadata, workflow state, questionnaire schema/answers, references and take/avoid notes, ranked priorities, palette/background rationale, font trio, board objects, checklist, guide versions and reuse provenance. Separate tables hold library entries, media blobs, font metadata/favorites, templates and branding. Backups are versioned JSON with media encoded for portable restoration and validated before replacing data.

## Screens

Project hub; project workspace tabs: Intake, References, Priorities, Color Lab, Board, Typography, Brief. Global Library and Settings. Compact quick reference and keyboard command palette. Client form and approval documents are exported standalone artifacts.

## Milestones and validation

1. M1: data layer, project CRUD/template reuse, design system, validated backup/restore. Build and persistence tests.
2. M2: editable questionnaire/templates, standalone client form, answer import, print/PDF. Questionnaire logic tests.
3. M3: URL/media references, annotated frames, extraction and reorderable priorities. Extraction tests.
4. M4: worker palette extraction, image sampling, harmony/contrast, previews, palette formats including ASE. Color/export tests.
5. M5: bulk media library, filtering/capture/send-to-board; local font folder indexing, preview/favorites/history.
6. M6: Konva board, movable objects/zones, images/notes/swatches/specimens/arrows/links, masonry mode and exports.
7. M7: editorial brief, editable vision, approvals/feedback import, immutable versions/diffs and HTML/Markdown/JSON/PDF/PNG.
8. M8: checklist, compact reference, theme/shortcuts, offline cache, responsive/accessibility/performance validation, README and user guide.

Each milestone receives a commit and relevant build/tests. End-to-end browser checks exercise core flows, exports, persistence and restore. Large-library checks use generated metadata and original artwork.

## Assumptions and boundaries

No backend: sharing means downloading a standalone HTML file and sending it; recipients return an answer/feedback JSON file for import. No public hosted URL is claimed. PDF is Save as PDF from a print dialog. Font directory access uses user selection with a directory-input fallback; browsers cannot discover arbitrary local paths. Local font previews load lazily, never redistribute font bytes. Optional AI and desktop packaging are deferred because the full workflow must require neither. Original SVG demo artwork is generated locally. Existing portfolio files may be replaced by the requested application. This is now an application-development task, so source changes are authorized.

## Completion record

M1–M8 are implemented. Each M1–M7 feature milestone has its own commit; M8 records the integrated polish, performance, offline, accessibility, documentation, and final validation pass. The final application includes the original Marcus Cole demo, portable client forms/briefs, schema-validated atomic restore, thumbnail-preserving backups, and no remote service dependency. See VALIDATION.md for executed checks, measured limits, and supported sharing/printing assumptions.
