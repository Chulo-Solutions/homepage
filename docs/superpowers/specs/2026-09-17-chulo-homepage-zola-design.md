# CHULO Homepage → Zola SSG — Design

**Date:** 2026-09-17
**Status:** Approved design (user: "Full Zola (Recommended)" + "TOML data files (Recommended)")

## Problem

The current page renders its five long paragraphs client-side: `index.html` holds
`{{copy.*}}` tokens, vendored Handlebars + `data.js` substitute real text into the DOM
only after JS runs (in `script.js`'s `[data-copy]` loop). Crawlers and non-JS visitors
fetch static HTML containing empty `<p>`s. This hurts SEO — which is the exact reason
we're migrating.

Fix at the root: move copy rendering off the client and into the **build step**. The
output of the build is static HTML where every paragraph is a real, fetchable string.

## Decision

Zola (Rust SSG, single binary, maintenance-free) with content in TOML data files.

### Why Zola

- **Tera server-side rendering.** Zola's template engine uses the same `{{ }}` token
  syntax already present, but compiles it to plain HTML at `zola build`. The five
  paragraphs become baked-in, crawler-visible strings. The Handlebars runtime, `data.js`,
  and the client-side renderer all get **deleted** — their job is done at build time.
- **Maintenance-free:** one `zola` binary, `zola build` → `public/`, deploy via the
  official GH Pages action. No node, no runtime, no build server.
- **Content-in-data workflow preserved:** the "section-wise copy keys" structure survives
  as TOML files. Editing copy = editing `data/copy.toml`, same mental model as `data.js`.

## Architecture

```
chulo-homepage/
  config.toml            # [base_url, title, build dir; [extra] site-wide values]
  content/
    _index.md            # homepage section stub — renders templates/index.html
  templates/
    index.html           # main template: Tera + partial includes
    partials/
      nav.html           # nav + mobile menu
      hero.html          # hero-lead, stats, editor visual
      services.html      # service cards (pod/ship) — section header lives here
      process.html       # Delegate / Review / Own cards
      work.html          # work grid + filters
      testimonials.html  # testimonial slider + dots
      cta.html           # CTA + contact form
      footer.html        # footer incl. footerTagline
  data/
    copy.toml            # section-wise copy keys (heroLead, delegate, review, own, footerTagline …)
    portfolio.toml       # services + projects + testimonials arrays
  static/
    styles.css           # unchanged
    script.js            # trimmed: menu, smooth-scroll, auto-rotate, dots, filters
    external-links.js    # changed from external-links.js
    img/                 # moved PNGs (hero PNGs, work images)
  handlebars.min.js      # DELETED
  data.js                # DELETED (content → data/*.toml)
  index.html             # → templates/index.html
  script.js              # trimmed (see above)
  docs/                  # unchanged (specs/plans live here)
  .github/workflows/     # replace pages.yml with Zola GH Pages action
```

### Mapping from current state

| Current | New |
|---|---|
| `index.html` single file | `templates/index.html` + `templates/partials/*` |
| `data.js` `copy.*` | `data/copy.toml`, via `load_data(path="copy.toml")` |
| `data.js` services/projects/testimonials | `data/portfolio.toml`, via `load_data` |
| `handlebars.min.js` + `[data-copy]` loop | deleted; Tera renders `{{ }}` at build |
| `script.js` inline-copy renderer | deleted |
| `script.js` UI behavior | kept: mobile menu, smooth scroll, auto-rotate, dots, filters |
| `bookit.png` etc. (root) | `static/img/` |

### Tera rendering (the part doing the SEO fix)

```tera
<!-- templates/partials/hero.html -->
<p class="hero-lead">{{ copy.heroLead }}</p>
```
```toml
# data/copy.toml
[main]
heroLead = "We are CHULO. …"
```

The value of `{{ copy.heroLead }}` in the built HTML is the literal paragraph. No token
survives to the browser. This is the whole point of the migration — verify at build that
zero `{{` remains in `public/`.

### script.js after trims

- mobile menu toggle
- smooth scroll on `[data-scroll]`
- testimonial auto-rotate `setInterval` + dots (existing)
- work filter buttons (`[data-filter]`)

Render of the five paragraphs, work grid, and testimonial slides **moves out** of JS into
the template's `{% for %}` loops over `load_data` results.

## Build & deploy

- `config.toml`: `base_url = "https://<org>.github.io/chulo-homepage/"` (org name TBD at
  build, matches the Pages URL), `build_output_dir = "public"`.
- GitHub Actions `pages.yml` → Zola's official action (`getzola/zola@actions` style build
  + `actions/upload-pages-artifact` + `deploy-pages`). Trigger: push to `main`.
- Local: `zola build` → `public/`; serve with `zola serve` for dev + `zola build` output
  is the deploy artifact.

## Test plan

1. `zola build` completes with zero errors.
2. `rg '{{' public/` returns nothing — no tokens survive to served HTML.
3. Serve `public/`; verify the five paragraphs + work grid + testimonials are byte-identical
   to today's rendered output.
4. `data/copy.toml` edits require only `zola build` — confirm by changing one string and
   re-building; the running page reflects it with no JS.

## Deletions (net code removed)

- `handlebars.min.js` (88 KB vendored runtime — gone)
- `data.js`
- `script.js` copy-renderer loop (client side)
- `index.html`'s inline-copy mechanism (moved to template partials)

## Out of scope (deferred)

- Multi-page content tree (`content/*.md` per page) — one-section homepage maps to one
  `_index.md` + partials. Add a `content/posts/` tree only if content grows beyond a
  single page.
- i18n, pagination, sitemap.xml, RSS — add only if asked.
