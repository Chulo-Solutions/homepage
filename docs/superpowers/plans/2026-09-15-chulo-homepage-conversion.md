# Chulo Homepage: React → Static HTML5 + Vanilla JS Conversion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5.2MB React bundle (`app.js`) with clean semantic HTML5 + a few small vanilla-JS files, keeping the rendered page **byte-identical in look** — same Tailwind classes (already in `styles.css`), same grain/marquee/fade animations, same interactions.

**Architecture:** The rendered DOM (what React actually outputs) is the ground truth. We capture it once via headless Chromium, then re-emit it as semantic static HTML wired to the existing `styles.css`, plus three tiny vanilla scripts (menu, rotator, filter) and the existing `external-links.js` to reproduce the four interactions. React dependency is fully removed.

**Tech Stack:** HTML5 (semantic nav/main/section/footer), Tailwind classes from `styles.css` (Tailwind v4 preflight), vanilla ES2017 JS (no framework, no build step). Test harness: Playwright (already available at `/Users/aato/Work/node_modules`).

**Spec:** `docs/superpowers/specs/2026-09-15-chulo-homepage-design.md` (in worktree).

---

## Workspace layout

```
/Users/aato/Work/chulo-homepage/
  index.html          # semantic HTML5 shell: links styles.css, loads the 3 scripts
  styles.css          # UNCHANGED — Tailwind + app CSS (already extracted & formatted)
  menu.js             # new — mobile menu toggle + smooth-scroll nav
  rotator.js          # new — hero word rotation + testimonial rotation (4s interval)
  filter.js           # new — work grid category filter
  external-links.js   # UNCHANGED — external link handler (already split out)
  snapshot/           # new — captured ground-truth rendered DOM + data arrays (commit once, keep)
  app.js              # DELETED when complete
  Chulo-Modern.html   # DELETED when complete (superseded by index.html)
```

---

### Task 0: Initialize repo + baseline commit

**Files:**
- Create: `docs/superpowers/specs/2026-09-15-chulo-homepage-design.md` (moved in from worktree)
- Create: `.gitignore`

- [ ] **Step 1: Init git + baseline commit**

```bash
cd /Users/aato/Work/chulo-homepage
git init -b main
printf 'node_modules/\n.DS_Store\n' > .gitignore
git add -A
git commit -m "chore: baseline before React->HTML conversion (spec + current single-file app)"
```

Expected: commit succeeds with the current `Chulo-Modern.html` + `app.js` + split files.

- [ ] **Step 2: Verify baseline runs**

Serve and load in headless Chromium; assert `#root` is non-empty and zero console errors. (This is the "current behavior" reference for the end-to-end test.)

---

### Task 1: Capture ground-truth rendered DOM + data arrays

**Files:**
- Create: `snapshot/rendered-root.html` (captured `#root`.innerHTML)
- Create: `snapshot/data.js` — extracted content arrays (words, testimonials, work items, categories)
- Test: `snapshot/capture.mjs` (Playwright, run once)

- [ ] **Step 1: Write the capture script**

`snapshot/capture.mjs`:
```js
import { chromium } from "/Users/aato/Work/node_modules/playwright/index.mjs";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8091/Promise-quote.html", { waitUntil: "load" });
await page.waitForTimeout(500);
const root = await page.evaluate(() =>
  document.getElementById("root").innerHTML);
await writeFile("snapshot/rendered-root.html", root Database);
console.log("rendered-root bytes:", root.length, "errors:", errors.length);
await browser.close();
```

- [ ] **Step 2: Run it**

Run: `node snapshot/capture.mjs`
Expected: `rendered-root.html` written (~5.1MB), no page errors. Commit `snapshot/rendered-root.html`.

- [ ] **Step 3: Extract data arrays from app.js**

Pull the source-of-truth arrays (hero words, testimonials, work items, categories) out of the formatted `app.js` into `snapshot/data.js` as plain `const` exports. Code is generated from the arrays in `app.js` (see `docs/superpowers/specs/...` for the exact array locations). Verify each array's `length` matches what the interval indexes (`En`, `En.length`, etc.).

---

### Task 2: Write semantic index.html

**Files:**
- Create: `index.html`
- Test: `snapshot/verify.mjs`

- [ ] **Step 1: Translate the captured root into semantic HTML5**

Convert `snapshot/rendered-root.html` + `snapshot/data.js` into `index.html`:
- Keep the EXACT Tailwind `class` values and inline hero/filter markup from the captured DOM (do not re-derive).
- Restore semantic elements where the bundle used divs: `<header class="sticky top-0 z-50...">`, `<nav>` for the links + `<button>` CTA, `<main>` around the four sections + work grid, `<section id="...">` per block, `<footer>` for the columns.
- Embed the non-rendered, non-moving content as static markup (first testimonial visible, "All" selected in the filter, hero word at first index).
- Include `<div class="grain pointer-events-none"></div>` (real component, keep) — the grain visuals live in `styles.css::after`.
- Do NOT replicate the empty `<style>` React injected; CSS is in `styles.css` already.

- [ ] **Step 2: Wire the scripts**

In `<head>`: `<link rel="stylesheet" href="styles.css">`.
Before `</body>`: `<script src="menu.js"></script>`, `<script src="rotator.js"></script>`, `<script src="filter.js"></script>`, `<script src="external-links.js"></script>` (module-free, file://-safe).

- [ ] **Step 3: Write the DOM-parity test**

`snapshot/verify.mjs` (Playwright): load `file://…/index.html`; assert (a) `#root`? — no, assert `document.body` contains the hero + nav + all 6 service blocks + footer; (b) zero console errors; (c) the `styles.css` link resolves (Tailwind classes present).

Run: `node snapshot/verify.mjs`
Expected: PASS, no console errors, all sections parsed.

---

### Task 3: menu.js — mobile toggle + smooth scroll

**Files:**
- Create: `menu.js`
- Test: `snapshot/verify.mjs` (extend)

- [ ] **Step 1: Write the interaction** (~30 lines)

```js
const q = document.getElementById("mobileMenu");
const tg = document.getElementById("menuToggle");
if (q && tg) {
  tg.addEventListener("click", () => q.classList.toggle("hidden"));
  q.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => q.classList.add("hidden")));
}
// smooth scroll nav (matches React: scrollIntoView + close mobile menu)
document.querySelectorAll("[data-scroll-to]").forEach((b) =>
  b.addEventListener("click", () => {
    const id = b.getAttribute("data-scroll-to");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }));
```

- [ ] **Step 2: Extend verify test**

Assert mobile menu: toggle shows it, tapping a link hides it again. Run and confirm PASS.

---

### Task 4: rotator.js — hero word + testimonial 4s rotation

**Files:**
- Create: `rotator.js`
- Test: extend `snapshot/verify.mjs`

- [ ] **Step 1: Implement the rotation**

Data comes from inline arrays (source mirror of `snapshot/data.js` — the exact strings needed for the rotating hero word and rotating testimonial). Recreate the interval pattern:

```js
const words = [...];           // rotating hero word options (from snapshot/data.js)
const testimonials = [...];    // rotating testimonial objects (from snapshot/data.js)
let wi = 0, ti = 0;
setInterval(() => {
  const w = document.getElementById("heroWord");
  if (w) w.textContent = words[wi++ % words.length];
  const t = document.getElementById("testimonial");
  if (t) {
    const d = testimonials[ti++ % testimonials.length];
    t.querySelector(".js-quote").textContent = d.quote;
    t.querySelector(".js-author").textContent = d.author;
    t.querySelector(".js-role").textContent = d.role;
  }
}, 4000);
```

- [ ] **Step 2: Extend verify test**

Load page, wait ~4.5s, assert hero word + testimony text changed. Run, confirm PASS, commit.

---

### Task 5: filter.js — work grid category filter

**Files:**
- Create: `filter.js`
- Test: extend `snapshot/verify.mjs`

- [ ] **Step 1: Implement the filter**

```js
const btns = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll("[data-category]");
btns.forEach((b) =>
  b.addEventListener("click", () => {
    const f = b.getAttribute("data-filter");
    cards.forEach((c) => {
      const show = f === "All" || c.getAttribute("data-category") === f;
      c.classList.toggle("hidden", !show);
    });
    btns.forEach((x) => x.classList.toggle("bg-white", x === b));
    // aria-pressed for the filtered state
  }));
```

- [ ] **Step 2: Extend verify test**

Click "Product", assert only product cards visible; click "All", all visible. Run, confirm PASS, commit.

---

### Task 6: Remove the React bundle + final verify

**Files:**
- Modify: `index.html`
- Delete: `app.js`, `Chulo-Modern.html`
- Test: `snapshot/verify.mjs`

- [ ] **Step 1: Delete React files**

```bash
cd /Users/aato/Work/chulo-homepage
rm app.js Chulo-Modern.html
```

- [ ] **Step 2: Full end-to-end verify**

Run: `node snapshot/verify.mjs`
Expected: all assertions PASS, zero console errors, page renders fully from `file://`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: convert React SPA to semantic HTML5 + vanilla JS, drop 5.2MB bundle"
```
