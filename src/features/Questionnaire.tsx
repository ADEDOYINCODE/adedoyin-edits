import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Plus,
  FileText,
} from "lucide-react";
import { db } from "../db";
import type { Project, Question } from "../model";
import { uid } from "../model";
import { Field, Section, Modal, UploadButton } from "../components";
import { notify } from "../store";
import {
  openPrint,
  parseAnswers,
  questionDocument,
  saveQuestionnaire,
} from "../documents";
export type Update = (patch: Partial<Project>) => void;
export function Questionnaire({ p, update }: { p: Project; update: Update }) {
  const [builder, setBuilder] = useState(false);
  const [paste, setPaste] = useState(false);
  const [raw, setRaw] = useState("");
  const [templateName, setTemplateName] = useState("");
  const templates = useLiveQuery(() => db.templates.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get("main"));
  const setAnswer = (id: string, value: string) =>
    update({ answers: { ...p.answers, [id]: value } });
  const modify = (i: number, patch: Partial<Question>) =>
    update({
      questions: p.questions.map((q, n) => (n === i ? { ...q, ...patch } : q)),
    });
  const move = (i: number, d: number) => {
    const arr = [...p.questions];
    if (i + d < 0 || i + d >= arr.length) return;
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    update({ questions: arr });
  };
  const importRaw = (s: string) => {
    try {
      const result = parseAnswers(s, p);
      if (result.answers) {
        update({
          answers: { ...p.answers, ...result.answers },
          checklist: [...new Set([...p.checklist, "Answers returned"])],
        });
        notify("Answers imported.");
        setPaste(false);
      } else {
        setRaw(result.manual || "");
        setPaste(true);
        notify(
          "Paste each answer into its matching field below, or save this as an intake note.",
        );
      }
    } catch (e) {
      notify(String(e));
    }
  };
  const groups = [...new Set(p.questions.map((q) => q.section))];
  return (
    <>
      <div className="notice">
        “This is where I understand how you want your content to look and feel
        on screen…”
        <br />
        <span className="subtle">
          Identify their taste. Find the hard no’s. Collect references with a
          reason.
        </span>
      </div>
      <div className="row">
        <button
          className="primary"
          onClick={() => {
            saveQuestionnaire(p, settings?.brand || "Style Foundry");
            update({
              checklist: [...new Set([...p.checklist, "Questionnaire sent"])],
            });
          }}
        >
          <Download size={15} />
          Client form · HTML
        </button>
        <button
          onClick={() => {
            try {
              openPrint(questionDocument(p, settings?.brand || "", false));
            } catch (e) {
              notify(String(e));
            }
          }}
        >
          <FileText size={15} />
          Blank PDF
        </button>
        <button
          onClick={() => {
            try {
              openPrint(questionDocument(p, settings?.brand || "", true));
            } catch (e) {
              notify(String(e));
            }
          }}
        >
          Filled PDF
        </button>
        <UploadButton
          label="Import answer file"
          accept="application/json,.json"
          multiple={false}
          onFiles={async (fs) => {
            if (fs[0]) importRaw(await fs[0].text());
          }}
        />
        <button onClick={() => setPaste(true)}>Paste DM answers</button>
        <button onClick={() => setBuilder(!builder)}>
          {builder ? "Close builder" : "Edit questionnaire"}
        </button>
      </div>
      {builder && (
        <Section
          title="Make the questions yours"
          eyebrow="QUESTIONNAIRE BUILDER"
        >
          <div className="row">
            <select
              aria-label="Load questionnaire template"
              defaultValue=""
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value);
                if (t) update({ questions: structuredClone(t.questions) });
                e.target.value = "";
              }}
            >
              <option value="">Load a saved template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              aria-label="Template name"
              value={templateName}
              placeholder="Template name"
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <button
              disabled={!templateName.trim()}
              onClick={async () => {
                await db.templates.put({
                  id: uid(),
                  name: templateName,
                  questions: p.questions,
                });
                setTemplateName("");
                notify("Questionnaire template saved");
              }}
            >
              Save template
            </button>
          </div>
          {p.questions.map((q, i) => (
            <div className="question-editor" key={q.id}>
              <input
                aria-label="Question label"
                value={q.label}
                onChange={(e) => modify(i, { label: e.target.value })}
              />
              <div className="row">
                <input
                  aria-label="Question section"
                  value={q.section}
                  onChange={(e) => modify(i, { section: e.target.value })}
                />
                <select
                  aria-label="Question type"
                  value={q.kind}
                  onChange={(e) =>
                    modify(i, { kind: e.target.value as Question["kind"] })
                  }
                >
                  <option value="text">Text</option>
                  <option value="scale">Scale</option>
                  <option value="reference">Reference</option>
                </select>
                <label className="row small">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => modify(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  className="icon"
                  aria-label="Move question up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  className="icon"
                  aria-label="Move question down"
                  disabled={i === p.questions.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  className="icon danger"
                  aria-label="Remove question"
                  onClick={() =>
                    update({
                      questions: p.questions.filter((x) => x.id !== q.id),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              update({
                questions: [
                  ...p.questions,
                  {
                    id: uid(),
                    section: "Your questions",
                    label: "What else should I know?",
                    kind: "text",
                    required: false,
                  },
                ],
              })
            }
          >
            <Plus size={15} />
            Add question
          </button>
        </Section>
      )}
      {groups.map((group, index) => (
        <Section
          key={group}
          title={group}
          eyebrow={`INTAKE / ${String(index + 1).padStart(2, "0")}`}
        >
          <div className={group === "Taste & feel" ? "grid-2" : ""}>
            {p.questions
              .filter((q) => q.section === group)
              .map((q) => (
                <Field key={q.id} label={q.label + (q.required ? " *" : "")}>
                  {q.kind === "scale" ? (
                    <div className="scale-answer">
                      <input
                        aria-label={q.label}
                        type="range"
                        min={0}
                        max={100}
                        value={p.answers[q.id] || 50}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                      />
                      <output>{p.answers[q.id] || 50}</output>
                    </div>
                  ) : q.kind === "reference" ? (
                    <ReferenceAnswer
                      value={p.answers[q.id] || ""}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                  ) : (
                    <textarea
                      value={p.answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="In their words…"
                    />
                  )}
                </Field>
              ))}
          </div>
        </Section>
      ))}
      {paste && (
        <Modal title="Bring the conversation in" close={() => setPaste(false)}>
          <p>
            Paste a returned JSON file to match answers automatically. For
            WhatsApp or DM replies, keep a raw note here, then enter answers in
            the fields.
          </p>
          <textarea
            aria-label="Pasted client answers"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
          />
          <div className="row">
            <button className="primary" onClick={() => importRaw(raw)}>
              Import matching JSON
            </button>
            <button
              onClick={() => {
                setAnswer("intake-note", raw);
                notify("Raw client reply saved as intake note.");
                setPaste(false);
              }}
            >
              Save raw note
            </button>
          </div>
        </Modal>
      )}
      {p.answers["intake-note"] && (
        <Section title="Raw client reply">
          <textarea
            aria-label="Raw client reply"
            value={p.answers["intake-note"]}
            onChange={(e) => setAnswer("intake-note", e.target.value)}
          />
        </Section>
      )}
    </>
  );
}
function ReferenceAnswer({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  let v = { url: "", why: "", take: "" };
  try {
    v = { ...v, ...JSON.parse(value || "{}") };
  } catch {
    /* Blank legacy value. */
  }
  return (
    <div className="reference-answer">
      <input
        aria-label="Reference URL"
        type="url"
        placeholder="https://youtube.com/…"
        value={v.url}
        onChange={(e) =>
          onChange(JSON.stringify({ ...v, url: e.target.value }))
        }
      />
      <input
        aria-label="Why do you like this reference?"
        placeholder="Why do you like this?"
        value={v.why}
        onChange={(e) =>
          onChange(JSON.stringify({ ...v, why: e.target.value }))
        }
      />
      <input
        aria-label="What exactly should I take?"
        placeholder="What exactly should I take from it?"
        value={v.take}
        onChange={(e) =>
          onChange(JSON.stringify({ ...v, take: e.target.value }))
        }
      />
    </div>
  );
}
