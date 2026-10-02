// UI-only. Content is SSR'd by Zola — no data, no templates.

// Theme toggle (light default, persisted)
const themeToggle = document.getElementById("themeToggle");
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) {}
}
themeToggle?.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

// Smooth scroll + close mobile menu
document.querySelectorAll("[data-scroll]").forEach(btn => {
  btn.addEventListener("click", () => {
    const el = document.getElementById(btn.getAttribute("data-scroll"));
    el?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("mobileMenu")?.classList.remove("open");
  });
});

// Mobile menu toggle
document.getElementById("mobileToggle")?.addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});

// Work filters (DOM already SSR'd)
const workGrid = document.getElementById("workGrid");
const filters = document.getElementById("filters");
filters?.addEventListener("click", e => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  filters.querySelectorAll(".filter").forEach(f => f.classList.toggle("active", f === btn));
  const cat = btn.dataset.filter;
  workGrid.querySelectorAll(".project-card").forEach(card => {
    card.style.display = cat === "All" || card.dataset.category === cat ? "" : "none";
  });
});

// Testimonial slider (slides SSR'd; dots SSR'd)
const track = document.getElementById("testimonialTrack");
const dots = document.getElementById("testimonialDots");
let current = 0;
const slideCount = track ? track.children.length : 0;
function go(i) {
  current = (i + slideCount) % slideCount;
  track.style.transform = `translateX(-${current * 100}%)`;
  dots?.querySelectorAll("button").forEach((b, j) => b.classList.toggle("active", j === current));
}
dots?.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => go(i)));
if (slideCount > 1) setInterval(() => go(current + 1), 4000);

// Contact form -> /api/contact (Netlify edge function -> Slack)
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const formSubmit = document.getElementById("formSubmit");

contactForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const say = (msg, kind = "") => {
    formStatus.textContent = msg;
    formStatus.className = "form-note" + (kind ? " " + kind : "");
  };
  const field = id => document.getElementById(id).value;
  // Surface the real cause instead of one generic message for every failure.
  const explain = (res, data) => {
    if (data?.error) return data.error;
    if (res.status === 404) return "Not deployed yet — endpoint missing.";
    if (res.status === 401 || res.status === 403) return "Blocked by auth. Try again.";
    if (res.status === 429) return "Too many attempts. Wait a minute.";
    return `Send failed (${res.status}).`;
  };
  say("Sending…");
  formSubmit.disabled = true;
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: field("name"),
        email: field("email"),
        message: field("message"),
        website: field("website"),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(explain(res, data));
    contactForm.reset();
    say("Sent — we'll reply within 24h.", "ok");
  } catch (err) {
    say(err.message || "Could not send. Please try again.", "err");
  } finally {
    formSubmit.disabled = false;
  }
});
