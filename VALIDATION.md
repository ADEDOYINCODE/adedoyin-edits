# Validation evidence

Validated in this cloud instance with Node 24.19.0, npm 11.9.0, Python 3.12, and Chromium 154. No deployment or fresh cloud-task restoration is claimed.

## Passed

- `npm ci --no-audit --no-fund`: frozen-lockfile clean install, 116 packages.
- `npm run build`: strict TypeScript compilation, production Vite bundle, and generated offline service worker. Feature chunks are lazy-loaded; the largest compressed workspace chunk is approximately 131 KB. Upstream Zod comments produce harmless Rollup annotation warnings; compilation succeeds.
- `npm test`: **12 tests passed**. Covers template clearing/reuse, extraction deduplication, answer association/validation, HTML/script escaping, malformed backup rejection, HSL harmony/roundtrip, WCAG reference ratios, ASE binary header/count, dominant-color extraction, and version diffs.
- `npx playwright test`: **7 tests passed**, 40.2 seconds in the final regression run. The source app remained stable during the run; no mocked persistence or networking service supplies the workflow.
- `git diff --check`: no whitespace errors.

## Browser coverage

1. Create project → enter intake → export a client form → fill the generated form → download answers → import answers → enter URL reference with Take/Avoid → extract priorities → export ASE → set fonts → create board objects/zones → save version → export brief HTML → complete its approval form → import feedback → reload persistence → download/restore a full backup → duplicate as template.
2. Original two-color PNG upload, image sampling, worker palette extraction, frame note annotation, real local TTF indexing/preview/favorite/selection, canvas PNG, complete brief PNG, Markdown and browser-rendered PDF, 50-image bulk import, and send-to-board.
3. Stress fixture with **2,000 distinct local image records** (original small SVGs and thumbnails), **10,000 indexed font metadata records**, virtualized DOM bounds, and search of the final entries. Latest measured library open plus search: **968 ms**; font search: **37 ms**. Fewer than 40 library cards and 30 font rows render. These are environment-specific observations, not a claim that 10,000 physical font binaries or 2,000 full-resolution photographs were decoded in this test.
4. Production service-worker installation, network disabled, full page reload, then opening previously unvisited lazy feature modules and the generated brief. **No external destination requests** were observed.
5. Axe WCAG A/AA checks across all eight workspace tabs, then light-theme Overview. User-colored graphic previews and the Konva canvas are excluded from automated contrast analysis; the product exposes WCAG palette ratios and keyboard-accessible object/position controls. This is automated coverage, not a claim of formal accessibility certification.
6. A 390-pixel mobile layout, command-palette keyboard navigation, and no horizontal page overflow in the hub or intake.

Workflow, media, and offline browser checks assert that no page exceptions occurred. PNG signatures, PDF signatures, downloaded content, visible document sections, persisted state, and real restore results are verified. The generated client HTML is loaded directly into a browser document for testing because this managed browser blocks `file://` navigation; normal standalone-file opening on every mobile OS is not claimed.

## Additional print check

The original Marcus Cole demo’s **Editor Cheat Sheet prints to exactly one A4 page**, verified with Chromium PDF generation and `pdfinfo`. The full client brief is deliberately multi-page. Long custom input can extend the cheat sheet beyond one page.

## Practical boundaries

Sharing uses portable HTML/PDF and returned JSON files, not hosted public URLs. PDF uses the browser print engine. Font files remain local and require folder reconnection after a new session; unsupported font containers use filename indexing/system fallback. Full-resolution media decode throughput and other browsers/devices need their own benchmarking. Optional next work is a thin desktop wrapper for persistent folder handles and native window behavior; neither it nor AI is required for the implemented workflow.

## v1.1 interface revision

The revision replaces the promotional dashboard with actual project previews, recent-project navigation, next-task resumption, grid/list modes, and client/deadline/update sorting. The client brief uses a project-specific cover, board imagery, palette/type key, numbered sections, reference extraction, and a compact approval form. Storage schema and exported backup format remain unchanged.

The regression suite includes the new dashboard controls and next-step calculation. Theme changes are immediate to avoid transitional contrast failures. Screenshots under `docs/` show the actual app and generated document. The Windows batch launcher’s underlying Vite flags were verified in Linux; the `.cmd` file itself has not been executed on Windows in this environment.
