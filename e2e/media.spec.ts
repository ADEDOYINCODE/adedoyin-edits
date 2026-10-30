import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("image workflow, color extraction, font scan, annotations and raster exports", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "The business of being different",
      exact: true,
    })
    .click();
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 180;
    const x = c.getContext("2d")!;
    x.fillStyle = "#EFC94C";
    x.fillRect(0, 0, 150, 180);
    x.fillStyle = "#527DDA";
    x.fillRect(150, 0, 150, 180);
    return c.toDataURL();
  });
  const buffer = Buffer.from(png.split(",")[1], "base64");
  const file = {
    name: "Original two-tone study.png",
    mimeType: "image/png",
    buffer,
  };
  await page.getByRole("button", { name: "Color Lab", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(page.locator(".sample-canvas")).toHaveJSProperty("width", 300);
  await page.locator(".sample-canvas").click({ position: { x: 20, y: 20 } });
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#efc94c",
  );
  await page.getByRole("button", { name: "Auto-extract palette" }).click();
  await expect(
    page.getByRole("button", { name: "Use first two colors" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use first two colors" }).click();
  await page.getByRole("button", { name: "References", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(
    page.getByRole("heading", {
      name: "Original two-tone study.png",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Annotate frame" }).last().click();
  await page.getByLabel("Annotation note").fill("Use the strong color split");
  await page
    .locator(".annotated-frame")
    .click({ position: { x: 150, y: 100 } });
  await expect(page.getByLabel("Annotation text").last()).toHaveValue(
    "Use the strong color split",
  );
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await page
    .locator('input[type=file][accept=".ttf,.otf,.woff,.woff2"]')
    .setInputFiles("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
  await expect(
    page.getByRole("button", { name: "DejaVu Sans", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favorite DejaVu Sans" }).click();
  await page.getByRole("button", { name: "Go-to fonts", exact: true }).click();
  await page.getByRole("button", { name: "DejaVu Sans", exact: true }).click();
  await expect(page.getByLabel("Primary / headlines")).toHaveValue(
    "DejaVu Sans",
  );
  await page.getByRole("button", { name: "Board", exact: true }).click();
  const boardPNG = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG", exact: true }).click();
  const b = await boardPNG;
  await b.saveAs("/tmp/foundry-board.png");
  expect(
    (await readFile("/tmp/foundry-board.png")).subarray(1, 4).toString(),
  ).toBe("PNG");
  await page.getByRole("button", { name: "Pinterest", exact: true }).click();
  await expect(page.locator(".masonry-item")).toHaveCount(4);
  await page.getByRole("button", { name: "Brief", exact: true }).click();
  await expect(
    page
      .frameLocator("iframe")
      .getByRole("heading", { name: "A shared visual language." }),
  ).toBeVisible();
  const briefPNG = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  await (await briefPNG).saveAs("/tmp/foundry-brief.png");
  expect(
    (await readFile("/tmp/foundry-brief.png")).subarray(1, 4).toString(),
  ).toBe("PNG");
  const md = page.waitForEvent("download");
  await page.getByRole("button", { name: "MD", exact: true }).click();
  expect((await md).suggestedFilename()).toContain(".md");
  await context.addInitScript(() => {
    window.print = () => {};
  });
  const print = page.waitForEvent("popup");
  await page.getByRole("button", { name: "PDF", exact: true }).click();
  const printPage = await print;
  await printPage.waitForLoadState();
  await printPage.pdf({
    path: "/tmp/foundry-guide.pdf",
    format: "A4",
    printBackground: true,
  });
  expect(
    (await readFile("/tmp/foundry-guide.pdf")).subarray(0, 4).toString(),
  ).toBe("%PDF");
  await printPage.close();
  await page
    .getByRole("button", { name: "Style library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /make you look twice/ }),
  ).toBeVisible();
  const files = Array.from({ length: 50 }, (_, i) => ({
    ...file,
    name: `Original study ${i}.png`,
  }));
  await page.locator("input[type=file]").setInputFiles(files);
  await expect(page.getByText("51 of 51 styles", { exact: false })).toBeVisible(
    { timeout: 30000 },
  );
  await page
    .getByLabel("Send to project")
    .selectOption({ label: "Marcus Cole / The business of being different" });
  await page
    .getByRole("button", { name: "Send to board", exact: false })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Sent to Marcus");
  expect(errors).toEqual([]);
});
test("virtualized 2,000 images and 10,000 indexed fonts remain searchable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good work starts/ }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("style-foundry");
      r.onsuccess = () => resolve(r.result);
      r.onerror = reject;
    });
    const tx = database.transaction(["library", "media", "fonts"], "readwrite");
    const media = tx.objectStore("media");
    const svg = new Blob(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="#527DDA"/></svg>',
      ],
      { type: "image/svg+xml" },
    );
    for (let i = 0; i < 2000; i++) {
      media.put({
        id: "stress-media-" + i,
        blob: svg,
        thumb: svg,
        name: "Original blue study",
        type: "image/svg+xml",
      });
      tx.objectStore("library").put({
        id: "stress-" + i,
        name: "Blue study " + i,
        description: "Original generated benchmark",
        category: "Dark documentary",
        tags: "blue,original",
        color: "#527DDA",
        pacing: "Measured",
        type: "Long-form YouTube",
        source: "",
        notes: "",
        media: "stress-media-" + i,
      });
    }
    for (let i = 0; i < 10000; i++)
      tx.objectStore("fonts").put({
        id: "stress-font-" + i,
        name: "Indexed family " + i,
        path: "benchmark/" + i + ".otf",
        favorite: i % 1000 === 0,
        classification: "Unknown",
      });
    await new Promise<void>((r, j) => {
      tx.oncomplete = () => r();
      tx.onerror = j;
    });
    database.close();
  });
  const start = Date.now();
  await page
    .getByRole("button", { name: "Style library", exact: true })
    .click();
  await expect(
    page.getByText("2001 of 2001 styles", { exact: false }),
  ).toBeVisible();
  expect(await page.locator(".library-card").count()).toBeLessThan(40);
  await page.getByLabel("Search library").fill("Blue study 1999");
  await expect(
    page.getByRole("button", { name: "Blue study 1999", exact: true }),
  ).toBeVisible();
  const libraryMs = Date.now() - start;
  await page.getByRole("button", { name: /^Projects/ }).click();
  await page
    .getByRole("button", {
      name: "The business of being different",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Typography", exact: true }).click();
  await expect(
    page.getByText("10000 indexed families", { exact: false }),
  ).toBeVisible();
  expect(await page.locator(".font-row").count()).toBeLessThan(30);
  const fontStart = Date.now();
  await page.getByLabel("Search fonts").fill("Indexed family 9999");
  await expect(
    page.getByRole("button", { name: "Indexed family 9999", exact: true }),
  ).toBeVisible();
  console.log(
    JSON.stringify({
      libraryOpenAndSearchMs: libraryMs,
      fontSearchMs: Date.now() - fontStart,
      images: 2000,
      fontMetadata: 10000,
    }),
  );
});
