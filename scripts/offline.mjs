import { readdir, writeFile } from "node:fs/promises";
const list = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map(async (e) =>
        e.isDirectory() ? list(dir + "/" + e.name) : dir + "/" + e.name,
      ),
    )
  ).flat();
const assets = (await list("dist"))
  .filter((p) => !p.endsWith("sw.js"))
  .map((p) => "/" + p.slice(5));
// Precached assets are generated same-origin files, invariant across Origin headers.
const version = "foundry-" + Date.now();
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(assets)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('foundry-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request,{ignoreVary:true}).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('/index.html'):Response.error())))});`,
);
