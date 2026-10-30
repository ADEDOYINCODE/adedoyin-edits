import { test, expect } from "@playwright/test";
test("production caches every workspace and reloads offline without network services", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const remote: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("blob:") &&
      !r.url().startsWith("data:")
    )
      remote.push(r.url());
  });
  await page.goto("http://127.0.0.1:4173");
  await expect(page.getByRole("heading", { name: /^Projects/ })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((r) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => r(),
          { once: true },
        ),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /^Projects/ })).toBeVisible();
  await page
    .getByRole("button", {
      name: "The business of being different",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Color Lab", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Auto-extract palette" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await expect(
    page
      .frameLocator("iframe")
      .getByRole("heading", { name: "Direction", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Settings & backup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Full backup · JSON" }),
  ).toBeVisible();
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});
