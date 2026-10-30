import { z } from "zod";
const id = z.string().min(1),
  str = z.string(),
  color = z.string().regex(/^#[0-9a-f]{6}$/i),
  strings = z.array(str);
const annotation = z.object({
  id,
  kind: z.enum(["note", "box", "arrow"]),
  x: z.number().finite(),
  y: z.number().finite(),
  text: str,
});
const question = z.object({
  id,
  section: str,
  label: str,
  kind: z.enum(["text", "scale", "reference"]),
  required: z.boolean(),
});
const priority = z.object({
  id,
  text: str,
  level: z.enum(["Must", "Should", "Avoid"]),
});
const reference = z.object({
  id,
  url: str,
  title: str,
  reason: str,
  take: str,
  avoid: str,
  media: str.optional(),
  tag: str,
  annotations: z.array(annotation),
});
const board = z.object({
  id,
  kind: z.enum(["note", "image", "swatch", "font", "arrow", "frame", "link"]),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().min(1).max(10000),
  h: z.number().min(1).max(10000),
  text: str,
  color,
  media: str.optional(),
});
export const projectSchema = z.object({
  id,
  name: str,
  client: str,
  niche: str,
  type: str,
  deadline: str,
  deliverables: z.number().int().min(1),
  status: z.enum([
    "Intake",
    "Analysis",
    "Style Draft",
    "Client Review",
    "Approved",
    "Editing",
  ]),
  archived: z.boolean(),
  updated: str,
  palette: z.array(color).min(4).max(20),
  background: z.enum(["dark", "light"]),
  rationale: str,
  fonts: z.tuple([str, str, str]),
  questions: z.array(question),
  answers: z.record(str, str),
  references: z.array(reference),
  priorities: z.array(priority),
  quantity: z.number().min(0).max(100),
  vision: str,
  board: z.array(board),
  checklist: strings,
  versions: z.array(
    z.object({
      id,
      at: str,
      label: str,
      content: str.refine((s) => {
        try {
          return !!JSON.parse(s) && typeof JSON.parse(s) === "object";
        } catch {
          return false;
        }
      }, "Invalid version JSON"),
    }),
  ),
  feedback: str,
  reused: strings,
  environment: str.optional(),
});
export const backupSchema = z.object({
  format: z.literal("style-foundry"),
  version: z.literal(1),
  created: str,
  projects: z.array(projectSchema),
  library: z.array(
    z.object({
      id,
      name: str,
      description: str,
      category: str,
      tags: str,
      color,
      pacing: str,
      type: str,
      source: str,
      notes: str,
      media: str.optional(),
    }),
  ),
  fonts: z.array(
    z.object({
      id,
      name: str,
      path: str,
      favorite: z.boolean(),
      classification: str,
    }),
  ),
  settings: z
    .array(
      z.object({
        id,
        brand: str,
        accent: color,
        portfolio: str,
        logo: str.regex(/^data:image\/(png|jpeg|webp);base64,/).optional(),
        theme: z.enum(["light", "dark"]),
        categories: strings,
      }),
    )
    .refine((s) => s.some((s) => s.id === "main"), "Missing main settings"),
  templates: z.array(z.object({ id, name: str, questions: z.array(question) })),
  media: z.array(
    z.object({
      id,
      blob: str.regex(
        /^data:(image\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+);base64,/i,
      ),
      thumb: str.regex(/^data:image\/[a-z0-9.+-]+;base64,/i).optional(),
      name: str,
      type: str,
    }),
  ),
});
