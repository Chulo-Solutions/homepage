const WEBHOOK = Deno.env.get("SLACK_WEBHOOK_URL");
const COOLDOWN_MS = 60_000;

// ponytail: in-memory Map, resets on cold start / redeploy. Move to a shared store
// (Netlify Blobs, Upstash) only if spam becomes a real problem.
const lastPost = new Map();

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const clean = (s, max) => String(s ?? "").trim().slice(0, max);

export default async function contact(request) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!WEBHOOK) return json({ error: "Not configured" }, 500);

  const ip = request.headers.get("x-nf-client-connection-ip") ?? "unknown";
  const prev = lastPost.get(ip) ?? 0;
  if (Date.now() - prev < COOLDOWN_MS) {
    return json({ error: "Please wait a minute before sending again." }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  // Honeypot: bots fill every input they find; humans never see this one.
  if (clean(body.website, 100)) return json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, 4000);
  if (!name || !email || !message) {
    return json({ error: "Name, email, and message are required." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please provide a valid email." }, 400);
  }

  let res;
  try {
    res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `New build enquiry from ${name} (${email})`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*New build enquiry*\n*Name:* ${name}\n*Email:* ${email}\n\n${message}`,
            },
          },
        ],
      }),
    });
  } catch {
    // Network/DNS/timeout failure talking to Slack.
    return json({ error: "Could not reach us. Please try again." }, 502);
  }

  lastPost.set(ip, Date.now());
  if (!res.ok) return json({ error: "Could not deliver. Email us instead." }, 502);
  return json({ ok: true });
}