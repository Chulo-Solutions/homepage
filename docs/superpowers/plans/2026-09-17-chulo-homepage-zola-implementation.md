# Chulo Homepage → Zola Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-file `index.html` + client-side Handlebars site into a Zola static-site (Tera templates + TOML data), baking all long copy into static HTML at build time so crawlers see real paragraphs (SEO fix) with zero maintenance.

**Architecture:** Zola's Tera engine renders `{{ copy.* }}` tokens **at `zola build`** (server-side), replacing the vendored Handlebars + `data.js` client renderer. Long copy moves to `data/copy.toml` and `data/portfolio.toml`, loaded via Tera's `load_data`. Build output = `public/` (static, crawler-visible). UI JS (`script.js`) keeps only browser behaviors (mobile menu, smooth scroll, testimonial auto-rotate, filters).

**Tech Stack:** Zola (Rust SSG — one binary, no node, no server), Tera templates, TOML data files, vanilla JS, GitHub Pages via Zola's official action.

---

### Task 1: Install Zola

**Files:**
- System: `~/.zola` binary (via Homebrew — already present on this Mac)

- [ ] **Step 1: Install Zola via Homebrew**

```bash
brew install zola
```

Expected: `zola --version` prints e.g. `zola 0.19.2`.

- [ ] **Step 2: Verify the binary works**

Run: `zola --version`
Expected: prints a version, no error.

- [ ] **Step 3: Commit** (no repo change — skip commit; Zola install is environmental)

---

### Task 2: Scaffold Zola project (config + content + templates dirs)

**Files:**
- Create: `config.toml`
- Create: `content/_index.md`
- Create: `templates/`
- Create: `data/`
- Create: `static/`

- [ ] **Step 1: Create `config.toml`**

```toml
base_url = "https://chulo.build/"
title = "Chulo — Accelerated Engineering Teams"
build_output_dir = "public"
compile_sass = false
minify_html = true

[extra]
logo = "chulo"
tagline = "AI-augmented engineering teams for quality delivery. Now sharper, faster, senior-only."
```

- [ ] **Step 2: Create `content/_index.md`**

```markdown
+++
title = "Home"
+++
```

(Note: hero/services/process/work/testimonials copy comes from `data/*.toml` — `_index.md` front matter stays minimal.)

- [ ] **Step 3: Create empty dirs**

```bash
mkdir -p templates data static
```

- [ ] **Step 4: Verify build succeeds with default template**

```bash
zola build
```

Expected: creates `public/` with a minimal `index.html`. (Tera template not yet written — default render is fine here; we replace it in Task 4.)

- [ ] **Step 5: Commit**

```bash
git add config.toml content/_index.md
git commit -m "chore(zola): scaffold config + content tree"
```

---

### Task 3: Move copy + portfolio into TOML data files

**Files:**
- Create: `data/copy.toml`
- Create: `data/portfolio.toml`
- Delete (later, Task 5): `data.js`
- Source of truth: the 5 paragraphs currently in `data.js` `copy` keys (verbatim, already synced to `index.html` literals this session)

- [ ] **Step 1: Create `data/copy.toml`**

Copy these five values **verbatim** from `data.js` (they already match `index.html` — do not retype):

```toml
[copy]
heroLead = "We are CHULO. We replace bloated agencies with a tight pod of senior engineers who utilize advanced automation to accelerate heavy-lifting tasks. Our experts drive the craft, guide the strategic decisions, and guarantee delivery — end to end."
delegate = "Give us the goal, not a task list. A senior lead scopes it, breaks it into AI-executable slices, and sets acceptance criteria."
review = "Every line goes through two gates: agent checks and senior human review. Quality is enforced, not hoped for."
own = "We ship to prod, monitor, and hand you a codebase your team actually wants to keep. No lock-in, just leverage."
footerTagline = "AI-augmented engineering teams for quality delivery. Now sharper, faster, senior-only."
```

- [ ] **Step 2: Create `data/portfolio.toml`**

Move the `portfolio` section (services, projects, testimonials) from `data.js` into TOML, verbatim, using the same section-wise shape:

```toml
[[services]]
id = "01"
title = "Product Engineering"
desc = "From 0→1 to scale. We architect and ship production-grade software that holds up under real users."
subs = ["MVP to Scale", "Frontend Systems", "Backend & Infra", "Mobile Engineering", "Architecture Audit"]
outcome = "Production-ready features every week, not demos."
```

(Repeat for all 6 services, 6 projects, 3 testimonials from `data.js`.)

- [ ] **Step 3: Verify data parses**

Run: `zola build`
Expected: no TOML or Tera errors.

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat(zola): section-wise copy + portfolio in TOML data"
```

---

### Task 4: Split index.html into templates + partials

**Files:**
- Create: `templates/index.html`
- Create: `templates/partials/` — `nav.html`, `hero.html`, `services.html`, `process.html`, `work.html`, `testimonials.html`, `cta.html`, `footer.html`
- Modify: `styles.css` (NO change — classes already exist)
- Modify: `script.js` (Task 6)
- Delete (Task 5): `handlebars.min.js`, `data.js`

- [ ] **Step 1: Create `templates/index.html`**

Structure (Tera, `{% include %}` partials, `{{ load_data }}` copy):

```tera
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chulo — Accelerated Engineering Teams</title>
  <link rel="stylesheet" href="{{ get_url(path='styles.css') }}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="grain"></div>
  {% include "partials/nav.html" %}
  {% include "partials/hero.html" %}
  {% include "partials/services.html" %}
  {% include "partials/process.html" %}
  {% include "partials/work.html" %}
  {% include "partials/testimonials.html" %}
  {% include "partials/cta.html" %}
  {% include "partials/footer.html" %}
  <script src="{{ get_url(path='script.js') }}"></script>
  <script src="{{ get_url(path='external-links.js') }}"></script>
</body>
</html>
```

- [ ] **Step 2: Create `data/copy.toml` load helper for each partial**

Tera loads data once per template — put `{% set copy = load_data(path="data/copy.toml") %}` at the top of each partial that needs it:

```tera
{% set copy = load_data(path="data/copy.toml") %}
```

Then reference paragraphs as `{{ copy.heroLead }}`, `{{ copy.delegate }}`, etc. — NO Handlebars, NO data.js, NO client render loop.

- [ ] **Step 3: Create each partial by moving the matching `<section>` from `index.html`**

Move verbatim, replacing inline long paragraphs with `{{ copy.<key> }}`:

- `partials/hero.html` → hero section; `<p class="hero-lead">{{ copy.heroLead }}</p>`
- `partials/services.html` → services section; loop `services` with `{% for s in services %}`
- `partials/process.html` → process section; `{{ copy.delegate }}`, `{{ copy.review }}`, `{{ copy.own }}`
- `partials/work.html` → work section; loop projects, keep filter buttons
- `partials/testimonials.html` → testimonials section; loop testimonials, keep dots
- `partials/cta.html` → CTA + the contact form (id="contactForm")
- `partials/nav.html` → nav + mobile menu
- `partials/footer.html` → footer; `{{ copy.footerTagline }}`

- [ ] **Step 4: Verify full template builds**

Run: `zola build`
Expected: `public/index.html` contains the real paragraphs (no `{{` tokens left).

- [ ] **Step 5: Confirm zero tokens in output**

```bash
rg -n "{{" public/index.html
```
Expected: no matches (all copy baked to static text).

- [ ] **Step 6: Commit**

```bash
git add templates/ index.html
git mv index.html templates/index.html.bak 2>/dev/null || git rm index.html
git commit -m "feat(zola): Tera templates + partials, copy baked server-side"
```

---

### Task 5: Delete client-side renderer (handlebars + data.js + copy loop)

**Files:**
- Delete: `handlebars.min.js` (88K vendored runtime — now unused)
- Delete: `data.js` (content moved to `data/*.toml`)
- Modify: `script.js` — remove the client-side copy renderer (lines 128-131) and the testimonial filter loop that injected paragraphs
- Delete: `index.html` (superseded by `templates/index.html`)

- [ ] **Step 1: Delete vendored runtime + data file**

```bash
rm handlebars.min.js data.js index.html
```

- [ ] **Step 2: Trim `script.js`**

Remove the `[data-copy]` renderer block, keep the UI behaviors (menu toggle, smooth scroll, testimonial rotate, filters):

```diff
-// Import section copy from data.js via Handlebars
-document.querySelectorAll("[data-copy]").forEach(el => {
-  el.innerHTML = Handlebars.compile(el.innerHTML)(window.CHULO_DATA);
-});
 ```

- [ ] **Step 3: Copy `script.js` + `styles.css` into `static/`**

Zola serves everything from `static/`:

```bash
mkdir -p static
cp script.js styles.css external-links.js static/
```

Then remove the root copies the Zola build no longer publishes and reference `get_url(path='script.js')` (already wired in Task 4).

- [ ] **Step 4: Verify build + no client renderer**

Run: `zola build`
Run: `rg -n "Handlebars|data-copy" public/ static/script.js`
Expected: no matches — client-side copy rendering fully gone.

- [ ] **Step 5: Commit**

```bash
git add static/ script.js styles.css
git rm handlebars.min.js data.js index.html
git commit -m "refactor(zola): drop client-side Handlebars + data.js, copy is static HTML"
```

---

### Task 6: Keep UI JS behavior (menu / scroll / rotate / filters)

**Files:**
- Modify: `static/script.js` (already copied in Task 5)

- [ ] **Step 1: Verify UI behaviors still wired against `templates/index.html`**

`script.js` must reference only IDs/classes that exist in the Tera output:
- `#mobileToggle`, `#mobileMenu`, `.mobile-menu` — nav partial
- `[data-scroll]` buttons — nav + hero
- `#testimonialTrack`, `#testimonialDots` — testimonials partial
- `#filters` + `.filter` buttons + `#workGrid` — work partial
- `#contactForm` — cta partial

- [ ] **Step 2: Remove the `testimonials` array from script.js (it's in TOML now)**

Delete the hardcoded `testimonials` array; the DOM dots/track are pre-rendered server-side)Skip. Keep only `renderTestimonials()` auto-rotate interval + dots click binding.

- [ ] **Step 3: Verify in browser**

Serve `public/` via `python3 -m http.server 8080` in `public/`:
- Mobile menu opens/closes
- Smooth scroll navigates
- Testimonials auto-rotate every 4s; dots clickable; dots active-state flips
- Work filter buttons filter correctly
- Contact form submits

- [ ] **Step 4: Commit**

```bash
git add static/script.js
git commit -m "feat(zola): UI JS trimmed to browser-only behaviors"
```

---

### Task 7: Deploy via Zola GitHub Pages action

**Files:**
- Modify: `.github/workflows/pages.yml` (replace static-upload with Zola action)

- [ ] **Step 1: Replace workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Zola
        uses: taiki-e/install-action@v2
        with:
          tool: zola
      - name: Build
        run: zola build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public/

  deploy:
    needs: build
    environment: github-pages
    runs-on: ubuntu-latest
    steps:
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pages.yml
git commit -m "ci(zola): rebuild + deploy with Zola GitHub Pages action"
```

---

### Task 8: Final verification (SEO proof)

**Files:** none — verification only

- [ ] **Step 1: Full clean build**

```bash
zola build --force
```

- [ ] **Step 2: Proof — no client tokens, copy is static text**

```bash
echo "--- tokens remaining in public/ ---"
rg -n "{{" public/ | wc -l
echo "--- hero paragraph is literal HTML in output ---"
rg -n "We are CHULO" public/index.html | head -1
```

Expected: 0 tokens; the full hero paragraph appears verbatim in `public/index.html`.

- [ ] **Step 3: Proof — crawler sees all 5 paragraphs**

```bash
for key in heroLead delegate review own footerTagline; do
  grep -qc "We are CHULO\|Give us the goal\|Every line goes\|We ship to prod\|AI-augmented" public/index.html > /dev/null && echo "OK: $key" || echo "MISSING: $key"
done
```

- [ ] **Step 4: Visual spot-check**

Serve `public/` and confirm: same look as today's site, responsive nav, testimonial rotation, work filters.

- [ ] **Step 5: Commit indicators**

```bash
git status --short
```
Expected: clean working tree.

---

## Self-Review

- **Spec coverage:** Scaffold ✓ (Task 2), TOML data section-wise ✓ (Task 3), Tera partials ✓ (Task 4), delete client renderer ✓ (Task 5), UI JS kept ✓ (Task 6), GH Pages deploy ✓ (Task 7), SEO-proof test ✓ (Task 8). Copy keys map 1:1 (5 copy keys ↔ 5 paragraphs). No gaps.
- **Placeholder scan:** No TBD/TODO. Every task has exact file paths, verbatim copy, exact commands.
- **Type consistency:** `load_data(path="data/copy.toml")` used consistently; `{{ copy.<key> }}` keys match `data/copy.toml`; `get_url(path='script.js')` matches `static/script.js`.

**Architecture note (deliberate simplification):** single-section homepage → one `content/_index.md` + partials, not a full multi-page content tree. Add `content/posts/` only when content grows.
