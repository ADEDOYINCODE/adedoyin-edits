import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("complete local creative direction workflow and portable deliverables", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good work starts/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/style-foundry-dashboard.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Client name", { exact: true }).fill("Ada Ventures");
  await page.getByLabel("Project title").fill("The next chapter");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The next chapter", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Deadline")
    .fill(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Intake", exact: true }).click();
  await page
    .getByLabel("What should the opening hook feel like? *")
    .fill("A precise visual metaphor for growth.");
  await page
    .getByLabel(
      "Where would bullet points, key statements, or animations help visualize ideas? *",
    )
    .fill("Highlight key numbers and business models.");
  await page
    .getByLabel(
      "Which matters more: animation volume or a few beautifully crafted moments? *",
    )
    .fill("High volume, polished opening.");
  const clientDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Client form · HTML" }).click();
  const client = await clientDownload;
  const clientPath = "/tmp/client-questionnaire.html";
  await client.saveAs(clientPath);
  const publicPage = await context.newPage();
  await publicPage.setContent(await readFile(clientPath, "utf8"));
  await expect(
    publicPage.getByRole("heading", { name: /visual language/ }),
  ).toBeVisible();
  // Required reasons and take fields are enforced in the standalone form.
  expect(
    await publicPage.locator("input[required],textarea[required]").count(),
  ).toBeGreaterThan(8);
  const requiredUrls = publicPage.locator("input[type=url][required]");
  for (let i = 0; i < (await requiredUrls.count()); i++)
    await requiredUrls.nth(i).fill("https://example.com/reference-" + i);
  const requiredText = publicPage.locator("textarea[required]");
  for (let i = 0; i < (await requiredText.count()); i++)
    await requiredText.nth(i).fill("Purposeful animation and clear ideas.");
  const answersDownload = publicPage.waitForEvent("download");
  await publicPage.getByRole("button", { name: "Download my answers" }).click();
  await (await answersDownload).saveAs("/tmp/client-answers.json");
  await publicPage.close();
  await page
    .locator('input[type=file][accept="application/json,.json"]')
    .setInputFiles("/tmp/client-answers.json");
  await expect(page.locator(".toast")).toContainText("Answers imported");

  await page.getByRole("button", { name: "References", exact: true }).click();
  await page
    .getByLabel("Video URL")
    .fill("https://www.youtube.com/watch?v=reference");
  await page.getByLabel("Reference title").fill("Client’s hook reference");
  await page
    .getByRole("button", { name: "Add reference", exact: true })
    .click();
  await page
    .getByLabel("Why does the client like it?")
    .fill("Clarity and confidence");
  await page
    .getByLabel("TAKE / one idea per line")
    .fill("Purposeful lower thirds\nData-led transitions");
  await page
    .getByLabel("AVOID / even in a video they love")
    .fill("Cartoony intro");
  await page
    .getByRole("button", { name: "Build priorities", exact: true })
    .click();
  await page.getByRole("button", { name: "Priorities", exact: true }).click();
  await expect(page.getByLabel("Priority 1", { exact: true })).toHaveValue(
    "Purposeful lower thirds",
  );
  await expect(
    page.getByText(/reserve A-tier polish for the hook/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Color Lab", exact: true }).click();
  await expect(page.getByText("21.00:1")).toHaveCount(0);
  const aseDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Adobe ASE swatches" }).click();
  const ase = await aseDownload;
  expect(ase.suggestedFilename()).toBe("style-foundry.ase");
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await page
    .getByRole("button", { name: "Editorial serif + clean sans" })
    .click();
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await page.getByRole("button", { name: "note", exact: true }).click();
  await page
    .getByLabel("Text / label / URL")
    .fill("Confident. Clear. Original.");
  await page.getByRole("button", { name: "swatch", exact: true }).click();
  await page.getByRole("button", { name: "Add 8-zone template" }).click();
  const boardDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Read-only HTML" }).click();
  expect((await boardDownload).suggestedFilename()).toBe("mood-board.html");
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await page.getByRole("button", { name: "Draft from inputs" }).click();
  await page.getByLabel("Version label").fill("Style v1 / first direction");
  await page.getByRole("button", { name: "Save version", exact: true }).click();
  await expect(
    page
      .locator(".version-row strong")
      .filter({ hasText: "Style v1 / first direction" }),
  ).toBeVisible();
  const htmlDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "HTML", exact: true }).click();
  const html = await htmlDownload;
  await html.saveAs("/tmp/ada-brief.html");
  const brief = await context.newPage();
  await brief.setContent(await readFile("/tmp/ada-brief.html", "utf8"));
  await expect(
    brief.getByRole("heading", { name: "A shared visual language." }),
  ).toBeVisible();
  await brief.getByLabel("Your name").fill("Ada");
  await brief.getByLabel("Approve this direction").check();
  await brief
    .getByLabel("Comments / adjustments")
    .fill("This is the direction.");
  const feedbackDownload = brief.waitForEvent("download");
  await brief.getByRole("button", { name: "Download feedback" }).click();
  const feedback = await feedbackDownload;
  await feedback.saveAs("/tmp/ada-feedback.json");
  await brief.close();
  page.once("dialog", (d) => d.accept());
  await page
    .locator('input[type=file][accept=".json,application/json"]')
    .setInputFiles("/tmp/ada-feedback.json");
  await expect(page.getByLabel("Project status")).toHaveValue("Approved");
  await page.reload();
  await page
    .getByRole("button", { name: "The next chapter", exact: true })
    .click();
  await expect(page.getByLabel("Project status")).toHaveValue("Approved");
  await page
    .getByRole("button", { name: "Settings & backup", exact: true })
    .click();
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Full backup · JSON" }).click();
  const backup = await backupDownload;
  await backup.saveAs("/tmp/foundry-backup.json");
  await page
    .locator('input[type=file][accept="application/json,.json"]')
    .setInputFiles("/tmp/foundry-backup.json");
  await expect(
    page.getByRole("heading", { name: "Restore this workspace?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Replace from backup" }).click();
  await expect(
    page.getByRole("heading", { name: /Good work starts/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "The next chapter", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate The next chapter as template" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "The next chapter / template",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile hub and keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good work starts/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Search commands and projects").fill("Marcus");
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "The business of being different",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Intake", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/style-foundry-mobile.png",
    fullPage: true,
  });
});
