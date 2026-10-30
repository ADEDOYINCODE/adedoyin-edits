import { useEffect, useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { notify } from "./store";
import { Plus, Upload, X } from "lucide-react";
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Empty({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-mark">✳</div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {children}
    </div>
  );
}
export function Section({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = dialog.current?.querySelector<HTMLElement>(
      "[autofocus],input:not([type=hidden]),textarea,select,button",
    );
    target?.focus();
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([hidden]),select,textarea,[tabindex="0"]',
          ) || [],
        ).filter((el) => el.offsetParent !== null);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", f);
    return () => {
      document.removeEventListener("keydown", f);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        ref={dialog}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-head">
          <h2>{title}</h2>
          <button className="icon" aria-label="Close dialog" onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function UploadButton({
  label = "Upload images",
  multiple = true,
  accept = "image/*",
  onFiles,
}: {
  label?: string;
  multiple?: boolean;
  accept?: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="button file-button">
      <Upload size={15} />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />
    </label>
  );
}
export function MediaView({
  id,
  full = false,
  className = "",
  style,
}: {
  id?: string;
  full?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const m = useLiveQuery(() => (id ? db.media.get(id) : undefined), [id]);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!m) return;
    const u = URL.createObjectURL(!full && m.thumb ? m.thumb : m.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [m, full]);
  if (!m)
    return (
      <div className={"media-placeholder " + className} style={style}>
        NO FRAME
      </div>
    );
  return m.type.startsWith("video/") ? (
    <video
      className={className}
      src={url}
      controls={full}
      preload="metadata"
      style={style}
    />
  ) : (
    <img
      className={className}
      src={url}
      alt={m.name}
      loading="lazy"
      style={style}
    />
  );
}
export function Palette({
  colors,
  large = false,
}: {
  colors: string[];
  large?: boolean;
}) {
  return (
    <div className={"palette " + (large ? "large" : "")}>
      {colors.map((c, i) => (
        <button
          key={i}
          style={{ background: c }}
          title={`Copy ${c}`}
          aria-label={`Copy ${c}`}
          onClick={() =>
            navigator.clipboard
              .writeText(c)
              .then(() => notify(c + " copied"))
              .catch(() => notify("Clipboard unavailable. Color: " + c))
          }
        >
          {large && <span>{c}</span>}
        </button>
      ))}
    </div>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="primary" onClick={onClick}>
      <Plus size={16} />
      {children}
    </button>
  );
}
