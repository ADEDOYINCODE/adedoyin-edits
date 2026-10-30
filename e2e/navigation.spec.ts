import { test, expect } from "@playwright/test";
test("dashboard view controls and resume action use real project state", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /^Projects/ })).toBeVisible();
  await expect(page.locator(".resume-project")).toContainText(
    "3 of 7 steps complete",
  );
  await page
    .getByRole("button", { name: "Continue project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Client background", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All projects", exact: true }).click();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "List view", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".project-list .project-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Duplicate The business of being different as template",
    })
    .click();
  await expect(page.locator(".project-list .project-card")).toHaveCount(2);
  await page.getByLabel("Sort projects").selectOption("client");
  await page.getByLabel("Search projects").fill("/ template");
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Grid view", exact: true }).click();
  await expect(page.locator(".project-list")).toHaveCount(0);
});
