import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Shield, HardDrive } from "lucide-react";
import { db } from "../db";
import { backup, restore, validateBackup } from "../backup";
import { blobData, download } from "../utils";
import { Field, Section, UploadButton, Modal } from "../components";
import { notify, useUI } from "../store";
export function Settings() {
  const settings = useLiveQuery(() => db.settings.get("main"));
  const [pending, setPending] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("");
  const [storage, setStorage] = useState("");
  if (!settings) return null;
  const edit = (v: Partial<typeof settings>) => db.settings.update("main", v);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>Settings</h1>
          <p>Branding, appearance, backups, and library categories.</p>
        </div>
        <Shield size={38} color="var(--accent)" />
      </div>
      <div className="grid-2">
        <Section title="Document branding" eyebrow="BRANDING">
          <Field label="Studio / editor name">
            <input
              value={settings.brand}
              onChange={(e) => void edit({ brand: e.target.value })}
            />
          </Field>
          <Field label="Brand accent">
            <input
              type="color"
              value={settings.accent}
              onChange={(e) => void edit({ accent: e.target.value })}
            />
          </Field>
          <Field label="Portfolio link">
            <input
              type="url"
              value={settings.portfolio}
              onChange={(e) => void edit({ portfolio: e.target.value })}
            />
          </Field>
          <UploadButton
            label="Brand logo"
            multiple={false}
            accept="image/png,image/jpeg,image/webp"
            onFiles={async (fs) => {
              if (!fs[0]) return;
              if (fs[0].size > 2e6) {
                notify("Choose a logo smaller than 2 MB.");
                return;
              }
              await edit({ logo: await blobData(fs[0]) });
              notify("Brand logo saved");
            }}
          />
          {settings.logo && (
            <div className="row" style={{ marginTop: 15 }}>
              <img
                src={settings.logo}
                alt="Studio logo"
                style={{ maxHeight: 70, maxWidth: 180 }}
              />
              <button onClick={() => void edit({ logo: undefined })}>
                Remove logo
              </button>
            </div>
          )}
          <Field label="Workspace theme">
            <select
              value={settings.theme}
              onChange={(e) =>
                void edit({ theme: e.target.value as "light" | "dark" })
              }
            >
              <option value="dark">Dark / editing suite</option>
              <option value="light">Light / studio daylight</option>
            </select>
          </Field>
          <p className="subtle">
            Your studio name, logo, and portfolio appear on client documents.
            Their color system comes from the project palette.
          </p>
        </Section>
        <Section title="Backup & restore" eyebrow="LOCAL DATA">
          <p>
            Projects, versions, questionnaires, styles, media, font metadata,
            and branding live in this browser’s IndexedDB. No account, tracking,
            or remote storage.
          </p>
          <div className="notice">
            Back up before clearing browser data or changing devices. Font files
            are excluded; re-select your licensed local folder to reconnect
            them.
          </div>
          <div className="row">
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                try {
                  setBusy(true);
                  download(
                    `style-foundry-backup-${new Date().toISOString().slice(0, 10)}.json`,
                    JSON.stringify(await backup()),
                    "application/json",
                  );
                  notify("Full backup downloaded. Store it somewhere safe.");
                } catch (e) {
                  notify(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={15} />
              {busy ? "Preparing…" : "Full backup · JSON"}
            </button>
            <UploadButton
              label="Restore backup"
              accept="application/json,.json"
              multiple={false}
              onFiles={async (fs) => {
                try {
                  if (!fs[0]) return;
                  const value = JSON.parse(await fs[0].text());
                  validateBackup(value);
                  setPending(value);
                } catch (e) {
                  notify("Backup rejected: " + String(e));
                }
              }}
            />
          </div>
          <button
            style={{ marginTop: 18 }}
            onClick={async () => {
              const s = await navigator.storage.estimate();
              setStorage(
                `${((s.usage || 0) / 1048576).toFixed(1)} MB used / ${((s.quota || 0) / 1073741824).toFixed(1)} GB available`,
              );
              const granted = await navigator.storage.persist?.();
              notify(
                granted
                  ? "Persistent storage enabled."
                  : "Browser manages storage. Keep regular backups.",
              );
            }}
          >
            <HardDrive size={15} />
            Check & protect storage
          </button>
          {storage && <p>{storage}</p>}
          <p className="subtle">
            Standalone client documents contain exported data. Share them
            intentionally. Nothing is sent automatically. Offline support
            becomes available after the first successful production load.
          </p>
        </Section>
      </div>
      <Section title="Library categories" eyebrow="STYLE CATEGORIES">
        <p>
          Rename a category to move its entries with it. Remove only empty
          categories.
        </p>
        {settings.categories.map((c, i) => (
          <div className="row category-row" key={i}>
            <input
              aria-label={"Category " + (i + 1)}
              defaultValue={c}
              onBlur={async (e) => {
                const name = e.target.value.trim();
                if (!name || name === c || settings.categories.includes(name)) {
                  e.target.value = c;
                  return;
                }
                await db.transaction(
                  "rw",
                  db.settings,
                  db.library,
                  async () => {
                    await db.library
                      .where("category")
                      .equals(c)
                      .modify({ category: name });
                    await edit({
                      categories: settings.categories.map((x) =>
                        x === c ? name : x,
                      ),
                    });
                  },
                );
                notify("Category renamed");
              }}
            />
            <button
              className="danger"
              onClick={async () => {
                if (await db.library.where("category").equals(c).count()) {
                  notify(
                    "Move entries out of this category before removing it.",
                  );
                  return;
                }
                await edit({
                  categories: settings.categories.filter((x) => x !== c),
                });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              category.trim() &&
              !settings.categories.includes(category.trim())
            ) {
              void edit({
                categories: [...settings.categories, category.trim()],
              });
              setCategory("");
            }
          }}
        >
          <input
            aria-label="New category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="A new category"
            required
          />
          <button type="submit">Add category</button>
        </form>
      </Section>
      {pending !== undefined && (
        <Modal
          title="Restore this workspace?"
          close={() => setPending(undefined)}
        >
          <p>
            This replaces the data in this browser with the selected backup.
            Download a current backup first if you need to keep it.
          </p>
          <div className="row">
            <button
              disabled={busy}
              className="primary"
              onClick={async () => {
                try {
                  setBusy(true);
                  await restore(pending);
                  setPending(undefined);
                  useUI.getState().set({ project: null, page: "projects" });
                  notify("Backup restored. Your directions are back.");
                } catch (e) {
                  notify(
                    "Restore failed; existing data preserved: " + String(e),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Replace from backup
            </button>
            <button onClick={() => setPending(undefined)}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}
