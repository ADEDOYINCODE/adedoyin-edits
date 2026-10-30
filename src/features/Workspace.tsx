import { ArrowLeft, PanelRight, ArrowUpRight } from "lucide-react";
import { db } from "../db";
import type { Project, Status } from "../model";
import { checklistLabels } from "../model";
import { useUI } from "../store";
import { Section, Field, Palette } from "../components";
import { StatusSelect } from "./Hub";
import { Questionnaire } from "./Questionnaire";
import { References, Priorities } from "./References";
import { ColorLab } from "./ColorLab";
import { Fonts } from "./Fonts";
import { Board } from "./Board";
import { Brief } from "./Brief";
export function Workspace({ p }: { p: Project }) {
  const ui = useUI();
  const update = (patch: Partial<Project>) => {
    void db.projects.update(p.id, {
      ...patch,
      updated: new Date().toISOString(),
    });
  };
  return (
    <>
      <button
        className="text-button back"
        onClick={() => ui.set({ project: null })}
      >
        <ArrowLeft size={15} />
        All projects
      </button>
      <div className="page-heading workspace-heading">
        <div>
          <span className="eyebrow">
            {p.client.toUpperCase()} / CREATIVE DIRECTION
          </span>
          <h1>{p.name}</h1>
          <p>
            {p.niche} · {p.type} · {p.deliverables} deliverable
            {p.deliverables !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="row">
          <StatusSelect
            value={p.status}
            onChange={(v) => update({ status: v as Status })}
          />
          <button onClick={() => ui.set({ quick: !ui.quick })}>
            <PanelRight size={16} />
            Quick reference
          </button>
        </div>
      </div>
      <div className="tabs">
        {[
          "Overview",
          "Intake",
          "References",
          "Priorities",
          "Color Lab",
          "Typography",
          "Board",
          "Brief",
        ].map((tab) => (
          <button
            key={tab}
            className={ui.tab === tab ? "active" : ""}
            onClick={() => ui.set({ tab })}
          >
            {tab}
          </button>
        ))}
      </div>
      {ui.tab === "Brief" ? (
        <Brief p={p} update={update} />
      ) : ui.tab === "Board" ? (
        <Board p={p} update={update} />
      ) : ui.tab === "Typography" ? (
        <Fonts p={p} update={update} />
      ) : ui.tab === "Color Lab" ? (
        <ColorLab p={p} update={update} />
      ) : ui.tab === "References" ? (
        <References p={p} update={update} />
      ) : ui.tab === "Priorities" ? (
        <Priorities p={p} update={update} />
      ) : ui.tab === "Intake" ? (
        <Questionnaire p={p} update={update} />
      ) : (
        <>
          <div className="grid-2">
            <Section title="The project" eyebrow="01 / FOUNDATION">
              <Field label="Project title">
                <input
                  value={p.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field label="Client name">
                <input
                  value={p.client}
                  onChange={(e) => update({ client: e.target.value })}
                />
              </Field>
              <Field label="Channel / niche">
                <input
                  value={p.niche}
                  onChange={(e) => update({ niche: e.target.value })}
                />
              </Field>
              <div className="grid-2">
                <Field label="Project type">
                  <select
                    value={p.type}
                    onChange={(e) => update({ type: e.target.value })}
                  >
                    {[
                      "Long-form YouTube",
                      "Short-form",
                      "Ad",
                      "Documentary",
                      "Brand film",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Deliverables">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={p.deliverables}
                    onChange={(e) =>
                      update({
                        deliverables: Math.max(1, Number(e.target.value)),
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Deadline">
                <input
                  type="date"
                  value={p.deadline}
                  onChange={(e) => update({ deadline: e.target.value })}
                />
              </Field>
            </Section>
            <Section title="From intake to intention" eyebrow="02 / WORKFLOW">
              <div className="progress">
                <span style={{ width: (p.checklist.length / 7) * 100 + "%" }} />
              </div>
              <p>
                {p.checklist.length} of 7 steps complete. Build the foundation
                before the edit.
              </p>
              <div className="check-list">
                {checklistLabels.map((label) => (
                  <label key={label}>
                    <input
                      type="checkbox"
                      checked={p.checklist.includes(label)}
                      onChange={(e) =>
                        update({
                          checklist: e.target.checked
                            ? [...p.checklist, label]
                            : p.checklist.filter((c) => c !== label),
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button
                style={{ marginTop: 28 }}
                className="primary"
                onClick={() => ui.set({ tab: "Intake" })}
              >
                Shape the direction <ArrowUpRight size={15} />
              </button>
            </Section>
          </div>
          <Section title="At a glance">
            <Palette colors={p.palette} large />
            <div className="row">
              {p.fonts.map((font, i) => (
                <span className="pill" key={i}>
                  {["Primary", "Secondary", "Accent"][i]} / {font}
                </span>
              ))}
            </div>
            <p>
              {p.vision ||
                "Your vision statement will take shape as the inputs come together."}
            </p>
            {p.reused.length > 0 && (
              <p className="subtle">
                Reused from template: {p.reused.join(" · ")}
              </p>
            )}
          </Section>
        </>
      )}
      {ui.quick && (
        <aside className="quick-panel">
          <div className="section-head">
            <h3>On the timeline</h3>
            <button
              className="icon"
              onClick={() => ui.set({ quick: false })}
              aria-label="Close quick reference"
            >
              ✕
            </button>
          </div>
          <Palette colors={p.palette} />
          <p>Type system</p>
          {p.fonts.map((f, i) => (
            <button
              key={i}
              className="text-button"
              style={{ display: "block", margin: "8px 0" }}
              onClick={() => navigator.clipboard.writeText(f)}
            >
              {f}
            </button>
          ))}
          <p>Focus on these</p>
          <ol>
            {p.priorities
              .filter((x) => x.level !== "Avoid")
              .slice(0, 5)
              .map((x) => (
                <li key={x.id}>{x.text}</li>
              ))}
          </ol>
          <p>Avoid</p>
          <ul>
            {p.priorities
              .filter((x) => x.level === "Avoid")
              .map((x) => (
                <li key={x.id}>{x.text}</li>
              ))}
          </ul>
        </aside>
      )}
    </>
  );
}
