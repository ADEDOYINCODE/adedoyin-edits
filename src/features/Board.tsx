import { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Text,
  Image as KImage,
  Arrow,
} from "react-konva";
import type Konva from "konva";
import { useLiveQuery } from "dexie-react-hooks";
import { db, addMedia } from "../db";
import type { BoardItem, Project } from "../model";
import { uid } from "../model";
import { Field, UploadButton, MediaView, Section } from "../components";
import { notify } from "../store";
import {
  blobData,
  download,
  escapeHtml as e,
  safeUrl,
  cssFont,
} from "../utils";
import { openPrint, wrapDocument } from "../documents";
import type { Update } from "./Questionnaire";
export async function boardDocument(p: Project, mode = "Canvas") {
  if (mode === "Pinterest") {
    const cards = await Promise.all(
      p.board
        .filter((b) => b.kind !== "frame" && b.kind !== "arrow")
        .map(async (b) => {
          const m = b.media ? await db.media.get(b.media) : undefined;
          const src =
            m && m.type.startsWith("image/")
              ? await blobData(m.thumb || m.blob)
              : "";
          return `<article style="break-inside:avoid;margin-bottom:18px;border-radius:7px;overflow:hidden;background:${e(b.kind === "swatch" ? b.color : "#252b22")};color:${b.kind === "swatch" ? "#111" : "#e8ebde"}">${src ? `<img src="${src}" alt="${e(b.text)}" style="width:100%;max-height:none;display:block">` : `<p style="padding:25px;white-space:pre-wrap;font-family:${b.kind === "font" ? e(cssFont(p.fonts[0])) : "Arial"}">${e(b.text)}</p>`}</article>`;
        }),
    );
    return wrapDocument(
      p.client + " / Pinterest board",
      `<main><header><small>STYLE FOUNDRY / SHORT-FORM DIRECTION</small><h1>${e(p.client)} / the feeling</h1><p>${e(p.fonts.join(" / "))}</p><div class="palette">${p.palette.map((c) => `<div style="background:${e(c)}"><span>${e(c)}</span></div>`).join("")}</div><button class="no-print" onclick="print()">Print / Save PDF</button></header><div class="masonry-export">${cards.join("")}</div></main>`,
      "",
      ".masonry-export{columns:3 220px;column-gap:18px}@media print{.masonry-export{columns:3}}",
    );
  }
  const minX = Math.min(0, ...p.board.map((b) => b.x)),
    minY = Math.min(0, ...p.board.map((b) => b.y));
  const w = Math.max(1000, ...p.board.map((b) => b.x + b.w)) - minX + 50,
    h = Math.max(700, ...p.board.map((b) => b.y + b.h)) - minY + 50;
  const items = await Promise.all(
    p.board.map(async (b) => {
      const m = b.media ? await db.media.get(b.media) : undefined;
      const media = m ? await blobData(m.thumb || m.blob) : "";
      const style = `position:absolute;left:${b.x - minX}px;top:${b.y - minY}px;width:${b.w}px;height:${b.h}px;overflow:hidden;white-space:pre-wrap;`;
      return `<div style="${style}${b.kind === "frame" ? "border:1px dashed #697259;background:transparent;" : "background:" + (b.kind === "swatch" ? e(b.color) : "#252b22") + ";"}border-radius:6px;padding:${b.kind === "image" ? 0 : 16}px;color:${b.kind === "swatch" ? "#111" : "#e8ebde"};font-family:${b.kind === "font" ? e(cssFont(p.fonts[0])) : "Arial"}">${b.kind === "image" && media ? `<img src="${media}" style="width:100%;height:100%;object-fit:contain" alt="${e(b.text)}">` : b.kind === "arrow" ? `<svg width="100%" height="100%" viewBox="0 0 200 100"><path d="M10 80L180 20L160 20M180 20L174 40" fill="none" stroke="${e(b.color)}" stroke-width="4"/></svg>` : b.kind === "link" ? `<a href="${e(safeUrl(b.text))}" style="color:inherit">${e(b.text)}</a>` : e(b.text)}</div>`;
    }),
  );
  return wrapDocument(
    p.client + " / Mood board",
    `<main style="max-width:none"><header><small>STYLE FOUNDRY / READ-ONLY MOOD BOARD</small><h1>${e(p.client)} / Color, type & feeling.</h1><p>${e(p.vision)}</p><button class="no-print" onclick="print()">Print / Save PDF</button></header><div style="position:relative;width:${w}px;height:${h}px;background:#171c17;color:#e8ebde">${items.join("")}</div></main>`,
    "",
    "@media print{@page{size:A3 landscape;margin:10mm}main>div{zoom:.5}}",
  );
}
export function Board({ p, update }: { p: Project; update: Update }) {
  const [mode, setMode] = useState(p.answers["board-mode"] || "Canvas");
  const [selected, setSelected] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState(false);
  const [size, setSize] = useState({ w: 900, h: 640 });
  const stage = useRef<Konva.Stage>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const item = p.board.find((b) => b.id === selected);
  useEffect(() => {
    const o = new ResizeObserver((es) =>
      setSize({
        w: es[0].contentRect.width,
        h: Math.max(500, Math.min(720, window.innerHeight - 230)),
      }),
    );
    if (wrapper.current) o.observe(wrapper.current);
    return () => o.disconnect();
  }, []);
  const patch = (id: string, v: Partial<BoardItem>) =>
    update({ board: p.board.map((b) => (b.id === id ? { ...b, ...v } : b)) });
  const add = (kind: BoardItem["kind"], media?: string, text?: string) => {
    const b: BoardItem = {
      id: uid(),
      kind,
      x: (70 - pos.x) / scale + Math.random() * 20,
      y: (80 - pos.y) / scale + Math.random() * 20,
      w: kind === "frame" ? 360 : kind === "image" ? 320 : 250,
      h: kind === "frame" ? 290 : kind === "image" ? 220 : 160,
      text:
        text ||
        {
          note: "An idea worth keeping.",
          image: "Reference frame",
          swatch: p.palette[0],
          font: "Make it matter.",
          arrow: "",
          frame: "New section",
          link: "https://",
        }[kind],
      color: p.palette[0],
      media,
    };
    update({ board: [...p.board, b] });
    setSelected(b.id);
  };
  const upload = async (files: File[]) => {
    const items: BoardItem[] = [];
    for (const f of files.filter((f) => f.type.startsWith("image/"))) {
      const id = await addMedia(f, f.name);
      items.push({
        id: uid(),
        kind: "image",
        media: id,
        text: f.name,
        x: 60 + (items.length % 3) * 340,
        y: 100 + Math.floor(items.length / 3) * 240,
        w: 320,
        h: 220,
        color: p.palette[0],
      });
    }
    update({ board: [...p.board, ...items] });
    notify(items.length + " images added");
  };
  useEffect(() => {
    const el = host.current;
    const paste = (ev: ClipboardEvent) => {
      if ((ev.target as HTMLElement).matches("input,textarea")) return;
      const fs = Array.from(ev.clipboardData?.files || []);
      if (fs.length) {
        ev.preventDefault();
        void upload(fs);
      }
    };
    el?.addEventListener("paste", paste);
    return () => el?.removeEventListener("paste", paste);
  }, [p.board]);
  const zones = () => {
    const labels = [
      "Questionnaire Extraction",
      "Reference Footage",
      "Client Background",
      "Color Direction",
      "Style References",
      "Fonts",
      "Animation Priorities",
      "Notes for the Editor",
    ];
    update({
      board: [
        ...labels.map((text, i) => ({
          id: uid(),
          kind: "frame" as const,
          x: (i % 4) * 400 + 30,
          y: Math.floor(i / 4) * 340 + 40,
          w: 370,
          h: 310,
          text,
          color: p.palette[0],
        })),
        ...p.board,
      ],
    });
    setScale(0.45);
    setPos({ x: 0, y: 0 });
  };
  const exportBoard = async (format: "html" | "pdf" | "png") => {
    try {
      if (format === "png") {
        if (mode === "Pinterest") {
          const { toBlob } = await import("html-to-image");
          const blob = await toBlob(
            document.getElementById("pinterest-board")!,
            { backgroundColor: "#141814", pixelRatio: 2 },
          );
          if (blob) download("mood-board.png", blob);
        } else if (stage.current) {
          const st = stage.current;
          const old = {
            x: st.x(),
            y: st.y(),
            scale: st.scaleX(),
            width: st.width(),
            height: st.height(),
          };
          const minX = Math.min(0, ...p.board.map((b) => b.x)) - 30,
            minY = Math.min(0, ...p.board.map((b) => b.y)) - 30;
          const w = Math.max(900, ...p.board.map((b) => b.x + b.w)) - minX + 30,
            h = Math.max(600, ...p.board.map((b) => b.y + b.h)) - minY + 30;
          if (w * h > 24000000) {
            notify(
              "Board is too large for one PNG. Use HTML or reduce its bounds.",
            );
            return;
          }
          st.scale({ x: 1, y: 1 });
          st.position({ x: -minX, y: -minY });
          st.size({ width: w, height: h });
          try {
            const data = st.toDataURL({ pixelRatio: 1.5 });
            download("mood-board.png", await (await fetch(data)).blob());
          } finally {
            st.position({ x: old.x, y: old.y });
            st.scale({ x: old.scale, y: old.scale });
            st.size({ width: old.width, height: old.height });
          }
        }
      } else {
        const html = await boardDocument(p, mode);
        if (format === "pdf") openPrint(html);
        else download("mood-board.html", html, "text/html");
      }
    } catch (err) {
      notify("Export failed: " + String(err));
    }
  };
  return (
    <div
      ref={host}
      tabIndex={-1}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="section-head">
        <div>
          <span className="eyebrow">CONNECT THE DOTS</span>
          <h2>A place for the direction to take shape.</h2>
        </div>
        <div className="row">
          {["Canvas", "Pinterest"].map((x) => (
            <button
              className={mode === x ? "primary" : ""}
              key={x}
              onClick={() => {
                setMode(x);
                update({ answers: { ...p.answers, "board-mode": x } });
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="board-toolbar row">
        <UploadButton label="Images" onFiles={upload} />
        {(["note", "swatch", "font", "arrow", "frame", "link"] as const).map(
          (kind) => (
            <button key={kind} onClick={() => add(kind)}>
              {kind}
            </button>
          ),
        )}
        <button onClick={zones}>Add 8-zone template</button>
        <button onClick={() => setPan(!pan)} className={pan ? "primary" : ""}>
          {pan ? "Pan on" : "Pan"}
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => setScale(Math.max(0.15, scale - 0.1))}
        >
          −
        </button>
        <span className="small">{Math.round(scale * 100)}%</span>
        <button
          aria-label="Zoom in"
          onClick={() => setScale(Math.min(2.5, scale + 0.1))}
        >
          +
        </button>
        <button
          onClick={() => {
            setPos({ x: 0, y: 0 });
            setScale(0.65);
          }}
        >
          Reset view
        </button>
      </div>
      <Field label="Board object navigator">
        <select
          value={selected || ""}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          <option value="">Select an object to edit with the keyboard…</option>
          {p.board.map((b, i) => (
            <option key={b.id} value={b.id}>
              {i + 1} / {b.kind} / {b.text || "Arrow"}
            </option>
          ))}
        </select>
      </Field>
      <p className="subtle">
        Drag objects to arrange. Enable Pan to move the canvas; scroll to zoom.
        Select an object to edit. Images are original or supplied by you.
      </p>
      {mode === "Canvas" ? (
        <div ref={wrapper} className="canvas-wrap">
          <Stage
            ref={stage}
            width={size.w}
            height={size.h}
            scaleX={scale}
            scaleY={scale}
            x={pos.x}
            y={pos.y}
            draggable={pan}
            onDragEnd={(e) => {
              if (e.target === e.target.getStage())
                setPos({ x: e.target.x(), y: e.target.y() });
            }}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelected(null);
            }}
            onWheel={(e) => {
              e.evt.preventDefault();
              const st = stage.current!,
                pointer = st.getPointerPosition()!;
              const newScale = Math.max(
                0.15,
                Math.min(2.5, e.evt.deltaY > 0 ? scale / 1.08 : scale * 1.08),
              );
              const point = {
                x: (pointer.x - pos.x) / scale,
                y: (pointer.y - pos.y) / scale,
              };
              setScale(newScale);
              setPos({
                x: pointer.x - point.x * newScale,
                y: pointer.y - point.y * newScale,
              });
            }}
          >
            <Layer>
              {p.board.map((b) => (
                <BoardObject
                  key={b.id}
                  b={b}
                  selected={b.id === selected}
                  font={p.fonts[0]}
                  pan={pan}
                  onSelect={() => setSelected(b.id)}
                  onMove={(x, y) => patch(b.id, { x, y })}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      ) : (
        <div className="pinterest-board" id="pinterest-board">
          <header>
            <h2 style={{ fontFamily: p.fonts[0] }}>{p.client} / the feeling</h2>
            <p>{p.fonts.join(" / ")}</p>
            <div className="palette">
              {p.palette.map((c) => (
                <span key={c} style={{ background: c, flex: 1 }} />
              ))}
            </div>
          </header>
          <div className="masonry">
            {p.board
              .filter((b) => b.kind !== "frame" && b.kind !== "arrow")
              .map((b) => (
                <button
                  key={b.id}
                  className="masonry-item"
                  style={{
                    background: b.kind === "swatch" ? b.color : undefined,
                  }}
                  onClick={() => setSelected(b.id)}
                >
                  {b.media ? (
                    <MediaView id={b.media} />
                  ) : (
                    <span
                      style={{
                        fontFamily: b.kind === "font" ? p.fonts[0] : undefined,
                        color: b.kind === "swatch" ? "#111" : undefined,
                      }}
                    >
                      {b.text}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
      {item && (
        <Section
          title="Selected object"
          action={
            <button
              className="danger"
              onClick={() => {
                update({ board: p.board.filter((b) => b.id !== item.id) });
                setSelected(null);
              }}
            >
              Remove object
            </button>
          }
        >
          <div className="grid-3">
            <Field label="Text / label / URL">
              <textarea
                value={item.text}
                onChange={(e) => patch(item.id, { text: e.target.value })}
              />
            </Field>
            <Field label="X position">
              <input
                type="number"
                value={item.x}
                onChange={(e) => patch(item.id, { x: Number(e.target.value) })}
              />
            </Field>
            <Field label="Y position">
              <input
                type="number"
                value={item.y}
                onChange={(e) => patch(item.id, { y: Number(e.target.value) })}
              />
            </Field>
            <Field label="Width">
              <input
                type="number"
                min={50}
                max={2000}
                value={item.w}
                onChange={(e) =>
                  patch(item.id, { w: Math.max(50, Number(e.target.value)) })
                }
              />
            </Field>
            <Field label="Height">
              <input
                type="number"
                min={40}
                max={2000}
                value={item.h}
                onChange={(e) =>
                  patch(item.id, { h: Math.max(40, Number(e.target.value)) })
                }
              />
            </Field>
          </div>
          <div className="row">
            <input
              type="color"
              aria-label="Object color"
              value={item.color}
              onChange={(e) => patch(item.id, { color: e.target.value })}
            />
            <button
              onClick={() =>
                update({
                  board: [...p.board.filter((b) => b.id !== item.id), item],
                })
              }
            >
              Bring to front
            </button>
            <button
              onClick={() =>
                update({
                  board: [item, ...p.board.filter((b) => b.id !== item.id)],
                })
              }
            >
              Send to back
            </button>
            <button
              onClick={() =>
                update({
                  board: [
                    ...p.board,
                    { ...item, id: uid(), x: item.x + 25, y: item.y + 25 },
                  ],
                })
              }
            >
              Duplicate
            </button>
            {item.kind === "link" && safeUrl(item.text) && (
              <a href={safeUrl(item.text)} target="_blank" rel="noreferrer">
                Open link ↗
              </a>
            )}
          </div>
        </Section>
      )}
      <div className="row" style={{ marginTop: 20 }}>
        <button className="primary" onClick={() => void exportBoard("png")}>
          Export PNG
        </button>
        <button onClick={() => void exportBoard("pdf")}>Print / PDF</button>
        <button onClick={() => void exportBoard("html")}>Read-only HTML</button>
        <button
          onClick={() => {
            update({
              checklist: [...new Set([...p.checklist, "Board complete"])],
            });
            notify("Mood board marked complete");
          }}
        >
          Mark board done
        </button>
      </div>
    </div>
  );
}
function BoardObject({
  b,
  selected,
  font,
  pan,
  onSelect,
  onMove,
}: {
  b: BoardItem;
  selected: boolean;
  font: string;
  pan: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const media = useLiveQuery(
    () => (b.media ? db.media.get(b.media) : undefined),
    [b.media],
  );
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!media) return;
    const url = URL.createObjectURL(media.thumb || media.blob);
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [media]);
  const common = { width: b.w, height: b.h };
  return (
    <Group
      x={b.x}
      y={b.y}
      draggable={!pan}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(ev) => {
        ev.cancelBubble = true;
        onMove(ev.target.x(), ev.target.y());
      }}
    >
      <Rect
        {...common}
        fill={
          b.kind === "frame"
            ? "#1a201530"
            : b.kind === "swatch"
              ? b.color
              : "#272e24"
        }
        stroke={
          selected ? "#e7f2ad" : b.kind === "frame" ? "#637052" : "#3e4736"
        }
        strokeWidth={selected ? 2 : 1}
        dash={b.kind === "frame" ? [8, 8] : undefined}
        cornerRadius={6}
      />
      {b.kind === "image" && image ? (
        <KImage image={image} {...common} />
      ) : b.kind === "arrow" ? (
        <Arrow
          points={[15, b.h - 20, b.w - 20, 20]}
          stroke={b.color}
          fill={b.color}
          strokeWidth={4}
          pointerLength={12}
          pointerWidth={12}
        />
      ) : (
        <Text
          text={b.text}
          x={16}
          y={16}
          width={b.w - 32}
          height={b.h - 24}
          fill={
            b.kind === "swatch"
              ? "#141811"
              : b.kind === "frame"
                ? "#a3b38c"
                : "#e5eadb"
          }
          fontSize={b.kind === "font" ? 32 : b.kind === "frame" ? 14 : 18}
          fontFamily={b.kind === "font" ? font : "Arial"}
          lineHeight={1.5}
        />
      )}
    </Group>
  );
}
