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
