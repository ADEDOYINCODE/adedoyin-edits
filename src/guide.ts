import { clientDocument } from "./guide-client";
import type { Project } from "./model";
import type { DocumentSettings } from "./documents";
import { wrapDocument } from "./documents";
import { escapeHtml as e } from "./utils";
export function draftVision(p: Project) {
  const pace =
    Number(p.answers.taste0 || 50) > 60
      ? "energetic and intentional"
      : "measured and confident";
  return `${p.client}’s ${p.niche.toLowerCase()} content should feel ${pace}. Build a ${p.background === "dark" ? "dark, grounded" : "light, spacious"} visual world with ${p.fonts[0]} headlines and ${p.fonts[1]} supporting type. ${p.priorities.find((x) => x.level === "Must")?.text || "Let each animation make the central idea clearer"}. Use ${p.palette[0]} to direct attention, with ${p.palette[1]} as a supporting counterpoint. Keep the same visual rules across all deliverables.`;
}
export function guideMarkdown(p: Project, brand: string) {
  return `# Creative Direction Brief\n## ${p.client} / ${p.name}\nPrepared by ${brand} · ${p.type} · ${p.deliverables} deliverables\n\n## Vision\n${p.vision || draftVision(p)}\n\n## Priorities\n${p.priorities.map((x, i) => `${i + 1}. [${x.level}] ${x.text}`).join("\n")}\n\n## Color system\n${p.palette.join(" · ")}\nBackground: ${p.background}\n${p.rationale}\n\n## Typography\n${p.fonts.map((f, i) => `${["Primary", "Secondary", "Accent"][i]}: ${f}`).join("\n")}\n\n## Reference extraction\n${p.references.map((r) => `### ${r.title}\n${r.url}\nClient reason: ${r.reason}\nTake: ${r.take}\nAvoid: ${r.avoid}\nAnnotations: ${r.annotations.map((a) => a.text).join("; ")}`).join("\n\n")}\n\n## Animation approach\n${animationNotes(p)}\n\n## Pacing & sound\n${soundNotes(p)}\n\n## Timeline\n${timelineNotes(p)}\n\n## Feedback\n${p.feedback || "Awaiting client feedback."}\n`;
}
export function animationNotes(p: Project) {
  return `${p.quantity}% emphasis on volume. ${p.quantity >= 60 ? "Use a repeatable motion vocabulary for the body. Reserve A-tier polish for the opening hook." : "Use fewer hero animations with more detail. Let typography and pacing hold the quieter moments."} ${p.answers.hook || "Open with the central idea, clearly visualized."} ${p.answers.text || "Use short bullet reveals on key statements. Animate to clarify ideas."}`;
}
export function soundNotes(p: Project) {
  const label = (key: string, a: string, b: string) =>
    Number(p.answers[key] || 50) > 55 ? b : a;
  return `${label("taste0", "Measured pacing with room to absorb ideas.", "Fast-paced, intentional cuts with clear visual hierarchy.")} ${label("taste3", "Music stays subtle or absent; prioritize the voice.", "Music supports the emotional rhythm beneath the voice.")} ${label("taste4", "Use restrained sound accents on meaningful changes.", "Layer sound design around transitions and idea reveals.")} ${p.answers["sound-notes"] || ""}`;
}
export function timelineNotes(p: Project) {
  const days = p.deadline
    ? Math.ceil(
        (new Date(p.deadline + "T23:59:59").getTime() - Date.now()) / 86400000,
      )
    : null;
  return `${p.deliverables} ${p.type} deliverable${p.deliverables > 1 ? "s" : ""}. ${p.deadline ? "Target delivery: " + p.deadline + "." : "Delivery date to be agreed."} ${days !== null && days <= 7 && p.quantity >= 60 ? "Tight timeline: prioritize quantity, reserve A-tier polish for the hook; approve the reusable system early." : "Lock the palette, fonts, and animation priorities before the editing pass."}`;
}
export async function guideDocument(
  p: Project,
  settings: DocumentSettings,
  cheat = false,
) {
  const vision = p.vision || draftVision(p);
  if (cheat)
    return wrapDocument(
      p.client + " / Editor cheat sheet",
      `<main><header><small>${e(settings.brand)} / STYLE ${p.versions.length || 1} / EDITOR CHEAT SHEET</small><h1>${e(p.client)} / Editing reference.</h1><p>${e(p.name)} · ${e(p.type)}</p></header><p class="vision">${e(vision)}</p><div class="grid"><section><h2>Focus / top priorities</h2><ol>${p.priorities
        .filter((x) => x.level !== "Avoid")
        .slice(0, 5)
        .map((x) => `<li><b>${e(x.level)}</b> / ${e(x.text)}</li>`)
        .join("")}</ol><h2>Avoid</h2><ul>${p.priorities
        .filter((x) => x.level === "Avoid")
        .map((x) => `<li>${e(x.text)}</li>`)
        .join(
          "",
        )}</ul></section><section><h2>Color system / ${e(p.background)}</h2><div class="palette">${p.palette.map((c) => `<div style="background:${e(c)}"><span>${e(c)}</span></div>`).join("")}</div><p>${e(p.rationale)}</p><h2>Type system</h2>${p.fonts.map((f, i) => `<p><small>${["PRIMARY", "SECONDARY", "ACCENT"][i]}</small> / <b>${e(f)}</b></p>`).join("")}<p class="muted">Licensed local fonts. No font files included.</p></section></div><div class="grid"><section><h2>Motion / ${p.quantity}% volume</h2><p>${e(animationNotes(p))}</p></section><section><h2>Pacing & sound</h2><p>${e(soundNotes(p))}</p></section></div><section><h2>Deadline & trade-offs</h2><p>${e(timelineNotes(p))}</p></section><footer>${e(settings.brand)} · Editing reference<button class="no-print" onclick="print()">Print / Save PDF</button></footer></main>`,
      "",
      `body{font-size:12px}main{max-width:1000px;padding:35px}h1{font-size:30px;letter-spacing:-1px}h2{font-size:18px;margin:18px 0 8px}header{margin-bottom:15px;padding-bottom:12px;border-top:4px solid ${e(settings.accent)};padding-top:20px}p{margin:8px 0}.vision{font:16px/1.5 Georgia}.grid{gap:25px}.palette{min-height:60px}.palette>div{padding:24px 4px 5px}.palette span{font-size:10px}li{margin:9px 0}footer{margin-top:15px;padding-top:10px}@media print{body{font-size:10px}h1{font-size:26px}h2{font-size:16px}.vision{font-size:13px}.grid{grid-template-columns:1fr 1fr;gap:20px}main{padding:0}header{padding-top:8px}li{margin:6px 0}}`,
    );

  return clientDocument(p, settings, {
    vision,
    animation: animationNotes(p),
    sound: soundNotes(p),
    timeline: timelineNotes(p),
  });
}
export function guideSnapshot(p: Project) {
  return {
    vision: p.vision,
    palette: p.palette,
    fonts: p.fonts,
    priorities: p.priorities,
    rationale: p.rationale,
    background: p.background,
    quantity: p.quantity,
    answers: p.answers,
    references: p.references,
    deadline: p.deadline,
    deliverables: p.deliverables,
    name: p.name,
    client: p.client,
    type: p.type,
    niche: p.niche,
  };
}
export function versionDiff(before: string, after: string) {
  const a = JSON.parse(before) as Record<string, unknown>,
    b = JSON.parse(after) as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
}
