// Local dev server: serves public/ and runs the real edge function, so the
// contact form works offline against the same code Netlify deploys.
//   cp .env.example .env      # fill in the webhook URL
//   node --env-file=.env --experimental-strip-types dev-server.js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("./public/", import.meta.url).pathname;
const PORT = process.env.PORT ?? 8888;

// Shim Deno.env, then load the function via dynamic import so the shim exists
// first (static imports are hoisted and would run before it).
globalThis.Deno = { env: { get: (k) => process.env[k] } };
const { default: contact } = await import("./netlify/edge-functions/contact.js");

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json",
};

createServer(async (req, res) => {
  if (req.url.split("?")[0] === "/api/contact") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: Object.entries(req.headers).map(([k, v]) => [k, String(v)]),
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const out = await contact(request);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(await out.text());
    return;
  }

  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const path = join(ROOT, rel.endsWith("/") ? `${rel}index.html` : rel);
  try {
    const body = await readFile(path);
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
}).listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));