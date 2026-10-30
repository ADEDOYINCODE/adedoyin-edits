import { projectSchema, backupSchema } from "./schemas";
import { db } from "./db";
import { blobData } from "./utils";
export async function backup() {
  return {
    format: "style-foundry",
    version: 1,
    created: new Date().toISOString(),
    projects: await db.projects.toArray(),
    library: await db.library.toArray(),
    fonts: await db.fonts.toArray(),
    settings: await db.settings.toArray(),
    templates: await db.templates.toArray(),
    media: await Promise.all(
      (await db.media.toArray()).map(async (m) => ({
        ...m,
        blob: await blobData(m.blob),
        thumb: m.thumb ? await blobData(m.thumb) : undefined,
      })),
    ),
  };
}
export function validateBackup(value: unknown) {
  const result = backupSchema.safeParse(value);
  if (!result.success)
    throw Error(
      "Invalid backup: " +
        result.error.issues
          .slice(0, 3)
          .map((x) => x.path.join(".") + " " + x.message)
          .join("; "),
    );
  const b = result.data;
  for (const collection of [
    b.projects,
    b.library,
    b.fonts,
    b.settings,
    b.templates,
    b.media,
  ]) {
    const ids = new Set<string>();
    for (const entry of collection) {
      if (ids.has(entry.id)) throw Error("Duplicate IDs in backup.");
      ids.add(entry.id);
    }
  }
  const mediaIds = new Set(b.media.map((m) => m.id));
  for (const p of b.projects) {
    for (const v of p.versions) {
      const result = projectSchema.safeParse({
        ...p,
        ...JSON.parse(v.content),
        versions: [],
      });
      if (!result.success) throw Error("Invalid guide version snapshot.");
    }
    for (const ref of [...p.references, ...p.board])
      if (ref.media && !mediaIds.has(ref.media))
        throw Error("Backup references missing media.");
    if (p.environment && !mediaIds.has(p.environment))
      throw Error("Missing client background.");
  }
  for (const l of b.library)
    if (l.media && !mediaIds.has(l.media))
      throw Error("Missing library media.");
  return b;
}
export async function restore(value: unknown) {
  const b = validateBackup(value);
  const media = await Promise.all(
    b.media.map(async (m) => ({
      ...m,
      blob: await (await fetch(m.blob)).blob(),
      thumb: m.thumb ? await (await fetch(m.thumb)).blob() : undefined,
    })),
  );
  await db.transaction(
    "rw",
    [db.projects, db.library, db.fonts, db.settings, db.templates, db.media],
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.library.clear(),
        db.fonts.clear(),
        db.settings.clear(),
        db.templates.clear(),
        db.media.clear(),
      ]);
      await db.projects.bulkPut(b.projects);
      await db.library.bulkPut(b.library);
      await db.fonts.bulkPut(b.fonts);
      await db.settings.bulkPut(b.settings);
      await db.templates.bulkPut(b.templates);
      await db.media.bulkPut(media);
    },
  );
}
