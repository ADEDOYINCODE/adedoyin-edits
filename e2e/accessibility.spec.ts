import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("workspace controls remain accessible across modules and themes", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "The business of being different",
      exact: true,
    })
    .click();
  for (const tab of [
    "Overview",
    "Intake",
    "References",
    "Priorities",
    "Color Lab",
    "Typography",
    "Board",
    "Brief",
  ]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(150);
    const a = await new AxeBuilder({ page })
      .exclude(".preview-grid")
      .exclude(".canvas-wrap")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      tab,
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Switch to light" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  const a = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    a.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
