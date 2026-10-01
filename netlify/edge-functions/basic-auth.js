const USER = "chulo";
const PASS = "password";

export default async function basicAuth(request, context) {
  // The contact endpoint must stay reachable without credentials so the form
  // works on the public site once this block is removed.
  if (new URL(request.url).pathname.startsWith("/api/")) return context.next();

  const expected = "Basic " + btoa(`${USER}:${PASS}`);
  if (request.headers.get("authorization") !== expected) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": `Basic realm="${USER}", charset="UTF-8"` },
    });
  }
  return context.next();
}