import { useEffect, useState, Suspense, lazy } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LayoutGrid,
  Layers,
  Settings,
  Command,
  PanelRight,
  Sun,
  Moon,
  Search,
  ShieldCheck,
} from "lucide-react";
import { db } from "./db";
import { useUI } from "./store";
import { Hub } from "./features/Hub";
import { Modal } from "./components";
const Workspace = lazy(() =>
  import("./features/Workspace").then((m) => ({ default: m.Workspace })),
);
const Library = lazy(() =>
  import("./features/Library").then((m) => ({ default: m.Library })),
);
const SettingsPage = lazy(() =>
  import("./features/Settings").then((m) => ({ default: m.Settings })),
);
export default function App() {
  const ui = useUI();
  const [query, setQuery] = useState("");
  const settings = useLiveQuery(() => db.settings.get("main"));
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || "dark";
  }, [settings?.theme]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUI.getState().set({ command: !useUI.getState().command });
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  return (
    <div className="app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => ui.set({ project: null, page: "projects" })}
        >
          <svg
            className="brand-mark"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 8H20M8 14H17M8 20H14"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>
            Style Foundry<small>Studio workspace</small>
          </span>
        </button>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {[
            { id: "projects", label: "Projects", icon: LayoutGrid },
            { id: "library", label: "Style library", icon: Layers },
            { id: "settings", label: "Settings & backup", icon: Settings },
          ].map((n) => (
            <button
              key={n.id}
              className={ui.page === n.id ? "active" : ""}
              onClick={() => ui.set({ page: n.id, project: null })}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "projects" && (
                <span>{projects.filter((p) => !p.archived).length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="recent-projects">
          <div className="workspace-label">RECENT PROJECTS</div>
          {[...projects]
            .filter((p) => !p.archived)
            .sort((a, b) => b.updated.localeCompare(a.updated))
            .slice(0, 5)
            .map((p) => (
              <button
                className={ui.project === p.id ? "current" : ""}
                key={p.id}
                onClick={() =>
                  ui.set({ page: "projects", project: p.id, tab: "Overview" })
                }
              >
                <span style={{ background: p.palette[0] }} />
                <span>
                  {p.client}
                  <small>{p.name}</small>
                </span>
              </button>
            ))}
          {!projects.length && <p>No projects yet</p>}
        </div>{" "}
        <div className="sidebar-bottom">
          <div>
            <ShieldCheck size={15} />
            <span>Stored on this device</span>
            <i />
          </div>
          <button
            onClick={() =>
              db.settings.update("main", {
                theme: settings?.theme === "dark" ? "light" : "dark",
              })
            }
          >
            {settings?.theme === "dark" ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
            Switch to {settings?.theme === "dark" ? "light" : "dark"}
          </button>
          <p>
            <span className="avatar">
              {(settings?.brand || "Studio")
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </span>
            <span>
              {settings?.brand}
              <small>Local workspace</small>
            </span>
          </p>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {ui.project
                ? projects.find((p) => p.id === ui.project)?.client
                : ui.page === "projects"
                  ? "Projects"
                  : ui.page === "library"
                    ? "Style library"
                    : "Settings"}
            </strong>
          </div>
          <div>
            <span className="local-dot" />
            Local workspace
            <button
              className="command-button"
              onClick={() => ui.set({ command: true })}
            >
              <Search size={15} />
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </header>
        <main>
          <Suspense fallback={<p role="status">Opening your workspace…</p>}>
            {ui.project ? (
              projects.find((p) => p.id === ui.project) ? (
                <Workspace p={projects.find((p) => p.id === ui.project)!} />
              ) : (
                <p>Project unavailable.</p>
              )
            ) : ui.page === "projects" ? (
              <Hub />
            ) : ui.page === "library" ? (
              <Library />
            ) : (
              <SettingsPage />
            )}
          </Suspense>
        </main>
        <footer>
          <span>Style Foundry</span>
          <span>Project data stays in your browser.</span>
          <button
            className="text-button"
            onClick={() => ui.set({ page: "settings", project: null })}
          >
            Backup & settings
          </button>
        </footer>
      </div>
      {ui.toast && (
        <div className="toast" role="status">
          {ui.toast}
        </div>
      )}
      {ui.command && (
        <Modal title="Where to next?" close={() => ui.set({ command: false })}>
          <input
            autoFocus
            aria-label="Search commands and projects"
            placeholder="Search projects or jump to a workspace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="command-list" style={{ marginTop: 15 }}>
            {["projects", "library", "settings"]
              .filter((page) => page.includes(query.toLowerCase()))
              .map((page) => (
                <button
                  key={page}
                  onClick={() =>
                    ui.set({ page, project: null, command: false })
                  }
                >
                  <Command size={16} />
                  {page}
                </button>
              ))}
            {projects
              .filter((p) =>
                `${p.name} ${p.client}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    ui.set({ project: p.id, page: "projects", command: false })
                  }
                >
                  <PanelRight size={16} />
                  {p.name}
                </button>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
