export type Status =
  | "Intake"
  | "Analysis"
  | "Style Draft"
  | "Client Review"
  | "Approved"
  | "Editing";
export const statuses: Status[] = [
  "Intake",
  "Analysis",
  "Style Draft",
  "Client Review",
  "Approved",
  "Editing",
];
export const uid = () => crypto.randomUUID();
export interface Question {
  id: string;
  section: string;
  label: string;
  kind: "text" | "scale" | "reference";
  required: boolean;
}
export interface Priority {
  id: string;
  text: string;
  level: "Must" | "Should" | "Avoid";
}
export interface Reference {
  id: string;
  url: string;
  title: string;
  reason: string;
  take: string;
  avoid: string;
  media?: string;
  tag: string;
  annotations: Annotation[];
}
export interface Annotation {
  id: string;
  kind: "note" | "box" | "arrow";
  x: number;
  y: number;
  text: string;
}
export interface BoardItem {
  id: string;
  kind: "note" | "image" | "swatch" | "font" | "arrow" | "frame" | "link";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  media?: string;
}
export interface Version {
  id: string;
  at: string;
  label: string;
  content: string;
}
export interface Project {
  id: string;
  name: string;
  client: string;
  niche: string;
  type: string;
  deadline: string;
  deliverables: number;
  status: Status;
  archived: boolean;
  updated: string;
  palette: string[];
  background: "dark" | "light";
  rationale: string;
  fonts: string[];
  questions: Question[];
  answers: Record<string, string>;
  references: Reference[];
  priorities: Priority[];
  quantity: number;
  vision: string;
  board: BoardItem[];
  checklist: string[];
  versions: Version[];
  feedback: string;
  reused: string[];
  environment?: string;
}
export interface Media {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  thumb?: Blob;
}
export interface LibraryEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  color: string;
  pacing: string;
  type: string;
  source: string;
  notes: string;
  media?: string;
}
export interface FontEntry {
  id: string;
  name: string;
  path: string;
  favorite: boolean;
  classification: string;
}
export interface Settings {
  id: string;
  brand: string;
  accent: string;
  portfolio: string;
  logo?: string;
  theme: "dark" | "light";
  categories: string[];
}
export interface Template {
  id: string;
  name: string;
  questions: Question[];
}
export const categories = [
  "Clean simple / Tomnowski-style",
  "Simplistic UI explainer",
  "Collage style",
  "Future UI explainer",
  "Minimalist infographic",
  "Short-form (aesthetic / fast-paced)",
  "Dark documentary",
  "Kinetic typography",
];
export const defaultQuestions: Question[] = [
  ...[
    "Pacing: calm → fast",
    "Production: raw → highly produced",
    "Cut density: spacious → rapid",
    "Music: none → prominent",
    "Sound design: subtle → layered",
    "Humor: serious → playful",
    "Visuals: aesthetic → cartoonish",
    "Background: dark → light",
    "Composition: minimal → busy",
  ].map((label, i) => ({
    id: "taste" + i,
    section: "Taste & feel",
    label,
    kind: "scale" as const,
    required: true,
  })),
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: "ref" + n,
    section: "Reference videos",
    label: `Reference ${n} — URL, why you like it, and exactly what to take`,
    kind: "reference" as const,
    required: n <= 3,
  })),
  {
    id: "dislikes",
    section: "Dislikes",
    label:
      "Not too important — dump anything you don’t like. Heavy zooms? Cartoony intros? Tell me here.",
    kind: "text",
    required: false,
  },
  {
    id: "animation",
    section: "Animation expectations",
    label:
      "Which matters more: animation volume or a few beautifully crafted moments?",
    kind: "text",
    required: true,
  },
  {
    id: "hook",
    section: "Animation expectations",
    label: "What should the opening hook feel like?",
    kind: "text",
    required: true,
  },
  {
    id: "text",
    section: "Animation expectations",
    label:
      "Where would bullet points, key statements, or animations help visualize ideas?",
    kind: "text",
    required: true,
  },
];
export const newProject = (client = "New client"): Project => ({
  id: uid(),
  name: `${client} / Creative direction`,
  client,
  niche: "Business & entrepreneurship",
  type: "Long-form YouTube",
  deadline: "",
  deliverables: 1,
  status: "Intake",
  archived: false,
  updated: new Date().toISOString(),
  palette: ["#EFC94C", "#527DDA", "#121519", "#F0EDE5"],
  background: "dark",
  rationale: "Keep graphics connected to the client’s environment.",
  fonts: ["Arial", "Georgia", "Courier New"],
  questions: structuredClone(defaultQuestions),
  answers: {},
  references: [],
  priorities: [],
  quantity: 65,
  vision: "",
  board: [],
  checklist: [],
  versions: [],
  feedback: "",
  reused: [],
});
export const checklistLabels = [
  "Questionnaire sent",
  "Answers returned",
  "References reviewed",
  "Colors locked",
  "Fonts locked",
  "Board complete",
  "Client approved",
];
