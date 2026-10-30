import type { Project, Settings } from "./model";
import { escapeHtml as e, download, scriptJSON } from "./utils";
export const documentCSS = `*{box-sizing:border-box}body{margin:0;background:#f5f5f2;color:#262626;font:14px/1.7 Arial,Helvetica,sans-serif}main{max-width:940px;margin:auto;padding:48px}header{border-bottom:1px solid #d1d1cc;padding-bottom:25px;margin-bottom:30px}h1{font:500 42px/1.15 Arial,Helvetica,sans-serif;letter-spacing:-1.2px;margin:20px 0}h2{font:500 24px/1.3 Arial,Helvetica,sans-serif;letter-spacing:-.4px;margin-top:32px}h3{font-size:16px}small,.eyebrow{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#62625d}label{display:block;margin:20px 0;font-size:13px}input,textarea,select{display:block;width:100%;font:inherit;padding:11px;border:1px solid #c7c7c2;background:white;border-radius:3px;margin-top:7px;color:#252525}textarea{min-height:100px}input[type=range]{padding:0;accent-color:#4c4c47}button,.button{padding:11px 17px;border:0;border-radius:3px;background:#2d2d2a;color:#fff;cursor:pointer;margin:10px 10px 10px 0;font:inherit;font-size:13px}.palette{display:flex;min-height:100px}.palette>div{flex:1;padding:45px 8px 10px}.palette span{background:#000b;color:white;padding:5px;font:11px monospace}.grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.card{border:1px solid #d1d1cc;padding:24px;border-radius:3px;margin:18px 0;break-inside:avoid}img{max-width:100%;max-height:480px;object-fit:contain}.muted{color:#62625d}.priority{border-bottom:1px solid #d9d9d3;padding:12px 0}footer{margin-top:45px;border-top:1px solid #ccc;padding-top:18px;font-size:11px}a{color:inherit}ul{padding-left:20px}.no-print{margin:20px 0}input[type=radio]{width:auto;display:inline}pre{white-space:pre-wrap}article{break-inside:avoid}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #825437;outline-offset:3px}@media(max-width:600px){main{padding:28px 20px}h1{font-size:32px}.grid{grid-template-columns:1fr}}@media print{body{background:white}main{padding:0;max-width:none}.no-print,button{display:none!important}h1{font-size:36px}h2{break-after:avoid}input,textarea{border:1px solid #ccc}a{word-break:break-word}@page{size:A4;margin:18mm}}`;
export function wrapDocument(
  title: string,
  body: string,
  script = "",
  extra = "",
) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><title>${e(title)}</title><style>${documentCSS}${extra}</style></head><body>${body}${script ? `<script>${script}</script>` : ""}</body></html>`;
}
export function openPrint(html: string) {
  const w = window.open("", "_blank");
  if (!w) throw Error("Allow pop-ups to print or save PDF.");
  w.document.write(html);
  w.document.close();
  w.addEventListener("load", () => setTimeout(() => w.print(), 350), {
    once: true,
  });
}
export function questionDocument(p: Project, brand: string, filled = false) {
  let section = "";
  const fields = p.questions
    .map((q) => {
      const head = section !== q.section ? `<h2>${e(q.section)}</h2>` : "";
      section = q.section;
      const value = filled ? p.answers[q.id] || "" : "";
      if (q.kind === "reference") {
        let v = { url: "", why: "", take: "" };
        try {
          v = { ...v, ...JSON.parse(value || "{}") };
        } catch {
          /* Legacy plain answer is retained in notes. */
        }
        return (
          head +
          `<fieldset class="card"><legend>${e(q.label)} ${q.required ? "*" : ""}</legend>${(["url", "why", "take"] as const).map((key, i) => `<label>${["Video URL", "Why do you like this?", "What exactly should I take from it?"][i]}${key === "url" ? `<input type="url" name="${e(q.id)}:${key}" value="${e(v.url)}" ${q.required ? "required" : ""}>` : `<textarea name="${e(q.id)}:${key}" ${q.required ? "required" : ""}>${e(v[key])}</textarea>`}</label>`).join("")}</fieldset>`
        );
      }
      return (
        head +
        `<label>${e(q.label)} ${q.required ? "*" : ""}${q.kind === "scale" ? `<input name="${e(q.id)}" type="range" min="0" max="100" value="${e(value || "50")}" oninput="this.nextElementSibling.value=this.value"><output>${e(value || "50")}</output>` : `<textarea name="${e(q.id)}" ${q.required ? "required" : ""}>${e(value)}</textarea>`}</label>`
      );
    })
    .join("");
  const script = `const form=document.querySelector('form');const projectId=${scriptJSON(p.id)};form.addEventListener('submit',ev=>{ev.preventDefault();const data=new FormData(form);const answers={};for(const [key,value] of data){if(key.includes(':')){const [id,field]=key.split(':');const old=answers[id]?JSON.parse(answers[id]):{};old[field]=value;answers[id]=JSON.stringify(old)}else answers[key]=value;}const result={format:'style-foundry-answers',projectId,answers};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download=projectId+'-answers.json';a.click();document.getElementById('result').textContent='Your answers are downloaded. Send the JSON file back to your editor. Thank you!';});`;
  return wrapDocument(
    `${p.client} / Editing style questionnaire`,
    `<main><header><small>${e(brand)} / CLIENT INTAKE</small><h1>${e(p.client)}<br>Editing style questionnaire.</h1><p>This is where I understand how you want your content to look and feel on screen. There are no wrong answers. Give me the references, little details, and strong opinions — I’ll turn them into a clear creative direction.</p><p class="muted">Prepared for ${e(p.client)} · ${e(p.name)}<br>About 10–15 minutes. Your answers stay in this file until you download and send them back.</p></header><form>${fields}<div class="no-print"><button type="submit">Download my answers</button><button type="button" onclick="window.print()">Print / Save PDF</button><p id="result" role="status"></p></div></form><footer>${e(brand)} / Client intake</footer></main>`,
    script,
  );
}
export function saveQuestionnaire(p: Project, brand: string) {
  download(
    `${p.client}-questionnaire.html`,
    questionDocument(p, brand),
    "text/html",
  );
}
export function parseAnswers(raw: string, p: Project) {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return { manual: raw };
  }
  if (!v || typeof v !== "object") throw Error("Answers must be an object.");
  const obj = v as Record<string, unknown>;
  if (obj.projectId && obj.projectId !== p.id)
    throw Error("These answers belong to another project.");
  const answers = (obj.answers || obj) as Record<string, unknown>;
  const clean: Record<string, string> = {};
  for (const q of p.questions)
    if (answers[q.id] !== undefined) {
      if (typeof answers[q.id] !== "string")
        throw Error("Answer values must be text.");
      const value = answers[q.id] as string;
      if (
        q.kind === "scale" &&
        value !== "" &&
        (!/^\d+$/.test(value) || Number(value) > 100)
      )
        throw Error("Scale answers must be between 0 and 100.");
      if (q.kind === "reference" && value) {
        try {
          const ref = JSON.parse(value);
          if (
            !ref ||
            ["url", "why", "take"].some((k) => typeof ref[k] !== "string")
          )
            throw Error();
        } catch {
          throw Error("Reference answers need URL, why, and take fields.");
        }
      }
      clean[q.id] = value;
    }
  if (!Object.keys(clean).length)
    throw Error("No matching question IDs found.");
  return { answers: clean };
}
export type DocumentSettings = Pick<
  Settings,
  "brand" | "accent" | "portfolio" | "logo"
>;
