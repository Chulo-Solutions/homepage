# Chulo Homepage — React → Static HTML5 Conversion

**Date:** 2026-09-15
**Status:** Design — awaiting implementation plan

## Goal

Replace the 5.2MB React bundle (`app.js`, ~9,400 lines of React/ReactDOM vendor)
with a static, semantic HTML5 page that reproduces the site **byte-for-byte
visually**. Same Tailwind classes, same CSS (styles.css), same grain/marquee
animations. All interactivity moves to a tiny vanilla-JS file.

## Ground Truth

The rendered React DOM is the source of truth. We capture exactly what React
produces (via a headless-browser pass on the current single-file page), then
re-emit it as clean HTML5. Visual identity is therefore guaranteed; we do not
hand-redraw sections (deferred to a later cleanup pass if requested).

## Files

| File | State | Contents |
|------|-------|----------|
| `index.html` | **rewritten** | Semantic HTML5: `header/nav`, `main` (hero, services, process, work, testimonials, cta), `footer`. Static markup with the current Tailwind arbitrary-value classes. Rotated content (hero word, testimonial) rendered from the first item + driven by `rotator.js`. |
| `styles.css` | unchanged | Tailwind CSS + app CSS (keyframes, grain, marquee). Already extracted & formatted. |
| `external-links.js` | unchanged | External-link handling (already split). |
| `menu.js` | new (replaces app.js) | Mobile menu toggle + smooth-scroll nav. |
| `rotator.js` | new (replaces app.js) | Testimonial auto-rotation + hero word rotation. |
| `filter.js` | new (replaces app.js) | Work-grid category filter. |
| `app.js` | **deleted** | Superseded by the three vanilla scripts + static HTML. |

## Interactivity inventory (driving the vanilla JS)

React only runs these four behaviors — everything else is static DOM:

1. **Mobile menu toggle** — `useState(n)` open/close; hamburger ↔ close icon; closing also happens on nav click.
2. **Smooth scroll** — nav buttons `scrollIntoView({behavior:"smooth"})` to anchored sections; hero CTA scrolls to `cta`.
3. **Hero word rotation** — `setInterval` 4s cycles a small array of words.
4. **Work filter** — `t=t==="All"?"All":filter` over the work items; shows/hides grid cards.

**Note (parity check):** the original had TWO 4s intervals (testimonials and hero
word) plus a testimonial quote array. During the rewrite these arrays move into
`rotator.js` as data and render from static HTML; the visuals are unchanged.

## Approach (chosen: A — Generate from rendered DOM)

Capture finished React DOM → clean into semantic HTML5 → small vanilla JS
restores the four interactions → `styles.css` + `external-links.js` unchanged.

**Verification before completion:**
- Render final `file://index.html` in headless playwright.
- Assert no console errors.
- Compare rendered DOM substantially (structure/classes) against the original
  single-file page artifact; diff must be limited to the intended React→DOM
  boundary (rotator state, no whitespace/structural regressions).

## Out of scope (future)
- Hand-trimming per-section HTML (Approach B cleanup).
- Removing the external-links script.
- Mobile menu nav backdrop/border dynamics beyond the current toggle.
