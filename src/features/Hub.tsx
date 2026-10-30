import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowUpRight,
  ArrowRight,
  Copy,
  Archive,
  Search,
  Plus,
  LayoutGrid,
  List,
  FileImage,
  Check,
} from "lucide-react";
import { db } from "../db";
import { newProject, statuses, checklistLabels } from "../model";
import { duplicate } from "../utils";
import { useUI, notify } from "../store";
import { Modal, Field, Palette, Empty, MediaView } from "../components";
import {
  previewMedia,
  nextStep,
  completedSteps,
  deadlineLabel,
} from "../project-view";
import type { Project } from "../model";
export function ProjectPreview({ p }: { p: Project }) {
  const media = previewMedia(p);
  return media ? (
    <MediaView id={media} className="project-preview-image" />
  ) : (
    <div
      className="project-type-preview"
      style={{
        background: p.background === "dark" ? p.palette[2] : p.palette[3],
        color: p.background === "dark" ? p.palette[3] : p.palette[2],
      }}
    >
      <span>Palette & type study</span>
      <strong style={{ fontFamily: p.fonts[0], color: p.palette[0] }}>
        {p.client}
      </strong>
      <div>
        {p.palette.map((c, i) => (
          <i key={i} style={{ background: c }} />
        ))}
      </div>
      <small>
        {p.fonts[0]} / {p.fonts[1]}
      </small>
    </div>
  );
}
export function Hub() {
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Active projects");
  const [create, setCreate] = useState(false);
  const [client, setClient] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Long-form YouTube");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("updated");
  const ui = useUI();
  const active = projects.filter((p) => !p.archived);
  const shown = projects
    .filter(
      (p) =>
        (filter === "Archived" ? p.archived : !p.archived) &&
        (filter === "Active projects" ||
          filter === "Archived" ||
          p.status === filter) &&
        `${p.name} ${p.client} ${p.niche}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "client"
        ? a.client.localeCompare(b.client)
        : sort === "deadline"
          ? (a.deadline || "9999").localeCompare(b.deadline || "9999")
          : b.updated.localeCompare(a.updated),
    );
  const recent = [...active].sort((a, b) =>
    b.updated.localeCompare(a.updated),
  )[0];
  return (
    <>
      <div className="page-heading hub-heading">
        <div>
          <span className="eyebrow">WORKSPACE / PROJECTS</span>
          <h1>
            Projects<span className="heading-count">{active.length}</span>
          </h1>
          <p>Client briefs, references, and approved directions.</p>
        </div>
        <button className="primary" onClick={() => setCreate(true)}>
          <Plus size={17} />
          New project
        </button>
      </div>
      {recent && !search && filter === "Active projects" && (
        <section
          className="resume-project"
          aria-label="Continue your latest project"
        >
          <div className="resume-image">
            <ProjectPreview p={recent} />
            <span className="image-caption">
              <FileImage size={13} />
              {previewMedia(recent)
                ? "From your project board"
                : "Your current palette & type"}
            </span>
          </div>
          <div className="resume-details">
            <div className="section-head">
              <span className="eyebrow">RECENTLY UPDATED</span>
              <span className="status" data-status={recent.status}>
                {recent.status}
              </span>
            </div>
            <span className="client-label">{recent.client}</span>
            <h2>{recent.name}</h2>
            <p className="resume-vision">
              {recent.vision ||
                "Collect the client’s answers, then work through references, colors, and type."}
            </p>
            <div className="resume-meta">
              <span>{recent.type}</span>
              <span>
                {recent.deadline
                  ? "Due " + deadlineLabel(recent.deadline)
                  : "Deadline not set"}
              </span>
            </div>
            <div className="resume-progress">
              <div className="row">
                <span>{completedSteps(recent)} of 7 steps complete</span>
                <span>{nextStep(recent).action}</span>
              </div>
              <div className="workflow-ticks">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      recent.checklist.includes(checklistLabels[i])
                        ? "done"
                        : ""
                    }
                  />
                ))}
              </div>
            </div>
            <button
              className="primary"
              onClick={() =>
                ui.set({ project: recent.id, tab: nextStep(recent).tab })
              }
            >
              Continue project
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}
      <div className="section-head projects-toolbar">
        <div className="filter-tabs">
          {["Active projects", "Client Review", "Approved", "Archived"].map(
            (f) => (
              <button
                key={f}
                className={filter === f ? "selected" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
                <span>
                  {
                    projects.filter((p) =>
                      f === "Archived"
                        ? p.archived
                        : !p.archived &&
                          (f === "Active projects" || p.status === f),
                    ).length
                  }
                </span>
              </button>
            ),
          )}
        </div>
        <div className="view-toggle" role="group" aria-label="Project view">
          <button
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      <div className="project-controls">
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Search projects"
            placeholder="Search client or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="sort-control">
          Sort by
          <select
            aria-label="Sort projects"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="deadline">Deadline</option>
            <option value="client">Client name</option>
          </select>
        </label>
      </div>
      <div
        className={"project-grid " + (view === "list" ? "project-list" : "")}
      >
        {shown.map((p) => (
          <article className="project-card" key={p.id}>
            <button
              className="project-art"
              onClick={() => ui.set({ project: p.id, tab: "Overview" })}
              aria-label={"Open " + p.name}
            >
              <ProjectPreview p={p} />
              <span className="preview-open">
                <ArrowUpRight size={18} />
              </span>
            </button>
            <div className="project-body">
              <div className="section-head">
                <span className="client-label">{p.client}</span>
                <span className="status" data-status={p.status}>
                  {p.status}
                </span>
              </div>
              <button
                className="text-button project-title"
                onClick={() => ui.set({ project: p.id, tab: "Overview" })}
              >
                {p.name}
              </button>
              <p>
                {p.type} · {p.deliverables} deliverable
                {p.deliverables !== 1 ? "s" : ""}
              </p>
              <div className="card-direction">
                <Palette colors={p.palette} />
                <span>{p.fonts.slice(0, 2).join(" / ")}</span>
              </div>
              <div className="card-footer">
                <span>
                  {p.deadline
                    ? "Due " + deadlineLabel(p.deadline)
                    : "Deadline not set"}
                </span>
                <div>
                  <button
                    className="icon"
                    title="Duplicate as template"
                    aria-label={"Duplicate " + p.name + " as template"}
                    onClick={async () => {
                      await db.projects.add(duplicate(p));
                      notify(
                        "Project duplicated. Client answers and approval history cleared.",
                      );
                    }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    className="icon"
                    title={p.archived ? "Restore project" : "Archive project"}
                    aria-label={
                      p.archived ? "Restore project" : "Archive project"
                    }
                    onClick={() =>
                      db.projects.update(p.id, { archived: !p.archived })
                    }
                  >
                    <Archive size={15} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={search ? "No matching projects" : "No projects in this view"}
          detail={
            search
              ? "Try a client name or clear your search."
              : "Create a project to collect intake and build a direction."
          }
        >
          {!search && (
            <button onClick={() => setCreate(true)}>
              Create project
              <Plus size={15} />
            </button>
          )}
        </Empty>
      )}
      <div className="bottom-note">
        <Check size={14} />
        <span>
          {shown.length} project{shown.length !== 1 ? "s" : ""} · Stored on this
          device
        </span>
        <button
          className="text-button"
          onClick={() => ui.set({ page: "settings", project: null })}
        >
          Back up workspace
          <ArrowUpRight size={13} />
        </button>
      </div>
      {create && (
        <Modal title="New project" close={() => setCreate(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = newProject(client.trim());
              p.name = name.trim() || `${client.trim()} / Creative direction`;
              p.type = type;
              await db.projects.add(p);
              setCreate(false);
              ui.set({ project: p.id, tab: "Overview" });
            }}
          >
            <Field label="Client name">
              <input
                autoFocus
                required
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Client or channel name"
              />
            </Field>
            <Field label="Project title">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project or series title"
              />
            </Field>
            <Field label="Project type">
              <select value={type} onChange={(e) => setType(e.target.value)}>
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
            <button className="primary" type="submit">
              Create project <ArrowUpRight size={16} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      aria-label="Project status"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {statuses.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}
