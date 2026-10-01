// Verifies the guards that actually matter: honeypot, cooldown, validation,
// and that no webhook URL ever reaches a response body.
//   SLACK_WEBHOOK_URL=https://example.invalid/test node --experimental-strip-types test/contact.test.js
import assert from "node:assert/strict";

const assertEquals = assert.deepStrictEqual;
globalThis.Deno ??= { env: { get: (k) => process.env[k] } };

const { default: contact } = await import("../netlify/edge-functions/contact.js");

const post = (body, ip = "1.2.3.4") =>
  contact(
    new Request("https://x/api/contact", {
      method: "POST",
      headers: { "x-nf-client-connection-ip": ip },
      body: JSON.stringify(body),
    }),
  );

const realFetch = globalThis.fetch;
let called = 0;
globalThis.fetch = () => {
  called++;
  return Promise.resolve(new Response("ok", { status: 200 }));
};

const good = { name: "Alex", email: "alex@co.com", message: "Need a pod" };

// 1. non-POST rejected
assertEquals((await contact(new Request("https://x/api/contact"))).status, 405);

// 2. bad JSON rejected
assertEquals(
  (
    await contact(
      new Request("https://x/api/contact", { method: "POST", body: "not json" }),
    )
  ).status,
  400,
);

// 3. missing fields rejected
assertEquals((await post({ name: "Alex" })).status, 400);

// 4. malformed email rejected
assertEquals((await post({ ...good, email: "nope" })).status, 400);

// 5. honeypot returns 200 (silently dropped) and never calls Slack
called = 0;
assertEquals((await post({ ...good, website: "http://spam" })).status, 200);
assertEquals(called, 0);

// 6. valid submission delivers
assertEquals((await post(good, "9.9.9.9")).status, 200);
assertEquals(called, 1);

// 7. same IP is rate limited
assertEquals((await post(good, "9.9.9.9")).status, 429);

// 8. a different IP is not
assertEquals((await post(good, "8.8.8.8")).status, 200);

// 9. no secret leaks in any response
const leaks = await Promise.all([
  contact(new Request("https://x/api/contact")),
  post({ name: "Alex" }),
  post({ ...good, website: "x" }),
]);
for (const r of leaks) {
  const t = await r.text();
  assert(!t.includes("hooks.slack.com"), `leaked webhook URL: ${t}`);
  assert(!t.includes(Deno.env.get("SLACK_WEBHOOK_URL") ?? "@@none"), "leaked env value");
}

globalThis.fetch = realFetch;
console.log("all contact-function guards passed");