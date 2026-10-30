import type { Project } from "./model";
import { checklistLabels } from "./model";
export const workflowTabs = [
  "Intake",
  "Intake",
  "References",
  "Color Lab",
  "Typography",
  "Board",
  "Brief",
];
const workflowActions = [
  "Send the questionnaire",
  "Enter the client’s answers",
  "Review the references",
  "Choose and lock colors",
  "Set the font stack",
  "Finish the mood board",
  "Send the brief for approval",
];
export function nextStep(p: Project) {
  const index = checklistLabels.findIndex(
    (label) => !p.checklist.includes(label),
  );
  return {
    action: index < 0 ? "Review the approved brief" : workflowActions[index],
    label: index < 0 ? "Review the approved brief" : checklistLabels[index],
    tab: index < 0 ? "Brief" : workflowTabs[index],
    index: index < 0 ? 7 : index,
  };
}
export const previewMedia = (p: Project) =>
  p.board.find((b) => b.kind === "image" && b.media)?.media ||
  p.references.find((r) => r.media)?.media ||
  p.environment;
export const completedSteps = (p: Project) =>
  checklistLabels.filter((l) => p.checklist.includes(l)).length;
export function deadlineLabel(deadline: string) {
  return deadline
    ? new Date(deadline + "T12:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "No deadline";
}
