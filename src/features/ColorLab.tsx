import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, addMedia } from "../db";
import type { Project } from "../model";
import type { Update } from "./Questionnaire";
import { Section, Field, UploadButton, Palette } from "../components";
import { notify } from "../store";
import { ase, harmonies, hsl, fromHsl, contrast, rgb, hex } from "../color";
import { download } from "../utils";
export function ColorLab({ p, update }: { p: Project; update: Update }) {
  const media = useLiveQuery(
    () => (p.environment ? db.media.get(p.environment) : undefined),
    [p.environment],
  );
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState(0);
  const [base, setBase] = useState(p.palette[0]);
  const [error, setError] = useState("");
  useEffect(() => {
    const w = new Worker(new URL("../color.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = (e) => {
      setSuggested(e.data);
      setBusy(false);
    };
    w.onerror = () => {
      setError(
        "Color extraction failed. Try a smaller image or sample a color manually.",
      );
      setBusy(false);
    };
    return () => w.terminate();
  }, []);
  useEffect(() => {
    if (!media || !canvas.current) return;
    const url = URL.createObjectURL(media.blob);
    const image = new Image();
    image.onload = () => {
      const c = canvas.current;
      if (!c) return;
      const scale = Math.min(1, 900 / image.width);
      c.width = image.width * scale;
      c.height = image.height * scale;
      c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError(
        "This image could not be decoded. Use a JPEG, PNG, or WebP photo.",
      );
      URL.revokeObjectURL(url);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [media]);
  const setColor = (i: number, color: string) => {
    const colors = [...p.palette];
    colors[i] = color;
    update({ palette: colors });
    if (i === 0) {
      setBase(color);
      setTone(0);
    }
  };
  const extract = () => {
    const c = canvas.current;
    if (!c || !media) return;
    const small = document.createElement("canvas");
    small.width = 180;
    small.height = Math.max(1, Math.round((c.height / c.width) * 180));
    small.getContext("2d")!.drawImage(c, 0, 0, small.width, small.height);
    setBusy(true);
    worker.current?.postMessage(
      small.getContext("2d")!.getImageData(0, 0, small.width, small.height)
        .data,
    );
  };
  const bg =
    p.background === "dark"
      ? p.palette[2] || "#121519"
      : p.palette[3] || "#F0EDE5";
  const text =
    contrast(bg, "#FFFFFF") >= contrast(bg, "#111111") ? "#FFFFFF" : "#111111";
  return (
    <>
      <div className="grid-2">
        <Section title="Client background" eyebrow="01 / CLIENT BACKGROUND">
          <UploadButton
            multiple={false}
            label="Upload set, studio, logo, or thumbnail"
            onFiles={async (files) => {
              if (files[0]) {
                const id = await addMedia(files[0], files[0].name);
                update({ environment: id });
                setSuggested([]);
              }
            }}
          />
          <p>
            Click the image to sample your primary color. Nothing leaves this
            browser.
          </p>
          <canvas
            ref={canvas}
            className="sample-canvas"
            style={{ display: media ? undefined : "none" }}
            aria-label="Client photo color sampler"
            tabIndex={0}
            onClick={(e) => {
              const c = e.currentTarget;
              const r = c.getBoundingClientRect();
              const [red, green, blue] = c
                .getContext("2d")!
                .getImageData(
                  Math.min(
                    c.width - 1,
                    Math.floor(((e.clientX - r.left) * c.width) / r.width),
                  ),
                  Math.min(
                    c.height - 1,
                    Math.floor(((e.clientY - r.top) * c.height) / r.height),
                  ),
                  1,
                  1,
                ).data;
              setColor(0, hex(red, green, blue));
              notify("Primary sampled from client background");
            }}
          />
          {!media && (
            <div className="drop-zone">
              <p>A photo gives the palette a reason.</p>
              <span className="subtle">
                Upload an image above, or set colors manually.
              </span>
            </div>
          )}
          <button disabled={!media || busy} onClick={extract}>
            {busy ? "Finding dominant colors…" : "Auto-extract palette"}
          </button>
          {error && <p className="danger">{error}</p>}
          {suggested.length > 0 && (
            <>
              <Palette colors={suggested} large />
              <button
                onClick={() => {
                  update({
                    palette: [
                      suggested[0],
                      suggested[1] || p.palette[1],
                      p.palette[2],
                      p.palette[3],
                    ],
                  });
                  setBase(suggested[0]);
                  notify("Dominant palette applied");
                }}
              >
                Use first two colors
              </button>
            </>
          )}
          <Field label="Background mode">
            <select
              value={p.background}
              onChange={(e) =>
                update({ background: e.target.value as Project["background"] })
              }
            >
              <option value="dark">Dark / black</option>
              <option value="light">White / light</option>
            </select>
          </Field>
          <Field label="The rationale">
            <textarea
              value={p.rationale}
              onChange={(e) => update({ rationale: e.target.value })}
            />
          </Field>
        </Section>
        <Section title="Project palette" eyebrow="02 / PALETTE SYSTEM">
          {p.palette.map((color, i) => (
            <div className="color-row" key={i}>
              <input
                aria-label={
                  [
                    "Primary color",
                    "Secondary color",
                    "Dark background",
                    "Light background",
                  ][i] || "Palette color"
                }
                type="color"
                value={color}
                onChange={(e) => setColor(i, e.target.value)}
              />
              <div>
                <span className="eyebrow">
                  {["PRIMARY", "SECONDARY", "DARK", "LIGHT"][i] || "ACCENT"}
                </span>
                <input
                  aria-label={"HEX color " + (i + 1)}
                  value={color}
                  pattern="#[0-9a-fA-F]{6}"
                  onChange={(e) => {
                    if (/^#[0-9a-f]{6}$/i.test(e.target.value))
                      setColor(i, e.target.value);
                  }}
                  onBlur={(e) => {
                    e.target.value = p.palette[i];
                  }}
                />
              </div>
              <span className="subtle">{rgb(color).join(" / ")}</span>
            </div>
          ))}
          <Field label={`Shift primary tone / ${tone > 0 ? "+" : ""}${tone}`}>
            <input
              type="range"
              min={-35}
              max={35}
              value={tone}
              onChange={(e) => {
                const n = Number(e.target.value);
                setTone(n);
                const [h, s, l] = hsl(base);
                const colors = [...p.palette];
                colors[0] = fromHsl(
                  h,
                  s,
                  Math.max(0.05, Math.min(0.95, l + n / 100)),
                );
                update({ palette: colors });
              }}
            />
          </Field>
          <h3>Color relationships</h3>
          <p className="subtle">
            Computed in HSL. Click a suggestion to use it as the secondary.
          </p>
          {Object.entries(harmonies(p.palette[0])).map(([name, colors]) => (
            <div className="harmony-row" key={name}>
              <span>{name}</span>
              {colors.map((c) => (
                <button
                  key={c}
                  style={{
                    background: c,
                    color:
                      contrast(c, "#000000") >= contrast(c, "#FFFFFF")
                        ? "#000000"
                        : "#FFFFFF",
                  }}
                  onClick={() => setColor(1, c)}
                  title={"Use " + c}
                >
                  {c}
                </button>
              ))}
            </div>
          ))}
        </Section>
      </div>
      <Section title="Graphic previews" eyebrow="03 / LIVE DIRECTION PREVIEW">
        <div
          className="preview-grid"
          style={
            {
              "--p": p.palette[0],
              "--s": p.palette[1],
              "--b": bg,
              "--t": text,
            } as React.CSSProperties
          }
        >
          <div className="preview lower-third">
            <small>LOWER THIRD</small>
            <div>
              <b>{p.client}</b>
              <span>{p.niche}</span>
            </div>
          </div>
          <div className="preview bullet-preview">
            <small>KEY STATEMENT</small>
            <strong>{p.name}</strong>
            <p>
              <i />
              {p.priorities.find((x) => x.level !== "Avoid")?.text ||
                "Key statement preview"}
            </p>
          </div>
          <div className="preview chart-preview">
            <small>CHART PREVIEW</small>
            <div>
              {[25, 48, 40, 70, 92].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: h,
                    background: i === 4 ? "var(--p)" : "var(--s)",
                  }}
                />
              ))}
            </div>
            <p>Sample chart / color preview</p>
          </div>
          <div className="preview title-preview">
            <small>TITLE CARD</small>
            <strong style={{ fontFamily: p.fonts[0] }}>{p.name}</strong>
            <b>01 / TITLE STUDY</b>
          </div>
          <div className="preview transition-preview">
            <small>TRANSITION FRAME</small>
            <div />
            <strong>Next chapter ↗</strong>
          </div>
        </div>
        <div className="grid-3" style={{ marginTop: 20 }}>
          {[
            [p.palette[0], bg, "Primary on background"],
            [p.palette[1], bg, "Secondary on background"],
            [text, bg, "Text on background"],
          ].map(([a, b, label]) => {
            const ratio = contrast(a, b);
            return (
              <div className="contrast-card" key={label}>
                <span style={{ color: a, background: b }}>Aa</span>
                <div>
                  <b>{ratio.toFixed(2)}:1</b>
                  <p>
                    {label}
                    <br />
                    {ratio >= 4.5
                      ? "AA normal text ✓"
                      : ratio >= 3
                        ? "AA large text only"
                        : "Fails AA — use as decoration"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Export palette" eyebrow="04 / EXPORT">
        <div className="row">
          <button
            onClick={() => download("palette-hex.txt", p.palette.join("\n"))}
          >
            HEX
          </button>
          <button
            onClick={() =>
              download(
                "palette-rgb.txt",
                p.palette.map((c) => `rgb(${rgb(c).join(", ")})`).join("\n"),
              )
            }
          >
            RGB
          </button>
          <button
            onClick={() =>
              download(
                "foundry-colors.css",
                `:root {\n${p.palette.map((c, i) => `  --foundry-${["primary", "secondary", "dark", "light"][i] || i}: ${c};`).join("\n")}\n}`,
                "text/css",
              )
            }
          >
            CSS variables
          </button>
          <button
            onClick={() =>
              download(
                "palette.json",
                JSON.stringify(
                  p.palette.map((c) => ({ hex: c, rgb: rgb(c) })),
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            JSON
          </button>
          <button
            className="primary"
            onClick={() => download("style-foundry.ase", ase(p.palette))}
          >
            Adobe ASE swatches
          </button>
        </div>
        <p className="subtle">
          Import .ase via Swatches → Load Swatches in Photoshop / Illustrator.
          For After Effects and Premiere, use the HEX handoff notes in the
          brief; direct ASE support varies by application.
        </p>
      </Section>
    </>
  );
}
