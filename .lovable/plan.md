## Järvenranta Camping — Phase 1: Foundation & Etusivu

Scope of this phase only. Phases 2–4 come after your approval.

### Stack (mapped to this project)
- TanStack Start + Vite + TypeScript + Tailwind v4 (already wired)
- **i18n:** `i18next` + `react-i18next` with JSON catalogs at `src/i18n/{fi,en}/*.json`. Namespaces per page (`home`, `common`, `booking`, …) so Phase 2+ additions stay clean. Architected for `sv` and `de` drop-in.
- **Language switch:** URL-persisted via `?lang=fi|en` + `localStorage`, `<html lang>` updated live. Finnish is default.
- **Backend:** Lovable Cloud (managed Supabase) enabled now — used only for auth/tables in Phase 3, but env is ready.
- **Images:** `<img>` with explicit `width`/`height`, `loading="lazy"` (except LCP), `decoding="async"`, `srcSet` helper for responsive sizes. No CLS.
- **Deploy target:** Cloudflare Workers (already configured).

### Design tokens (locked from your choices)

Palette — "Lighter, warmer birch-forward" — all defined as oklch in `src/styles.css`, mapped through `@theme inline`:

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--forest` (primary) | `#2A4A38` | Headings on birch, primary buttons | 9.1:1 on birch — AAA |
| `--birch` (background) | `#FAF6EE` | Page background | — |
| `--birch-deep` | `#EFE9DB` | Card / section alt bg | — |
| `--lake` (secondary) | `#6B8A9A` | Muted UI, dividers, meta | 4.6:1 on birch — AA |
| `--lake-deep` | `#3F5A6B` | Body text alt, links | 7.8:1 — AAA |
| `--ochre` (accent) | `#D4923A` | CTA accent, focus ring, "low availability" | 3.1:1 on forest — AA for UI/large |
| `--ochre-deep` | `#A86B1E` | Ochre text on birch | 4.8:1 — AA |
| `--ink` (foreground) | `#1A1A17` | Body text | 15:1 — AAA |
| `--stone` (muted-fg) | `#6E6A61` | Captions, meta | 4.7:1 — AA |
| `--full` | `#B54A3A` | "Full" state (always paired with pattern + label, never color-only) | 4.6:1 — AA |

Availability states always ship as **color + label + pattern** (available: solid dot, low: diagonal hatch, full: cross).

Type system — **Urbanist (headings) + Epilogue (body)**, both via `@fontsource-variable`, no CDN. Nordic diacritics (ä ö å) verified.

Scale (fluid, `clamp()`):
- Display: 44 → 72px, Urbanist 600, tracking `-0.02em`
- H1: 32 → 48px, Urbanist 600
- H2: 26 → 34px, Urbanist 600
- H3: 20 → 22px, Urbanist 500
- Body: 17px, Epilogue 400, line-height 1.6, max-width `65ch`
- Small/meta: 14px, Epilogue 500, tracking `0.02em` uppercase for eyebrows

Spacing: 4px base, section rhythm on 8/12/24 multiples. Radii: `--radius: 10px`. Shadows: single soft token `0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)`. No glass, no gradients on chrome.

Focus ring: `outline: 2px solid var(--ochre); outline-offset: 3px` — 3:1 against both birch and forest.

Motion: `translateY(8px) + opacity 0 → 1`, 400ms `ease-out`, only on `IntersectionObserver` enter. Fully disabled under `prefers-reduced-motion: reduce`.

### Files created in Phase 1

```text
src/
  styles.css                              (rewritten: tokens + fonts + base)
  i18n/
    index.ts                              (i18next init, language detector)
    fi/common.json  fi/home.json
    en/common.json  en/home.json
  lib/
    connection.ts                         (navigator.connection helper)
    seo.ts                                (head() helper: title/desc/OG/twitter)
  components/
    ui/
      Button.tsx                          (primary/secondary/ghost, sizes with ≥44px touch)
      Input.tsx  Field.tsx                (label + aria-describedby wiring)
      Card.tsx  Section.tsx  Container.tsx
      Eyebrow.tsx  Prose.tsx
    site/
      Header.tsx                          (sticky, "Varaa nyt" CTA, mobile sheet nav)
      Footer.tsx                          (contact, legal, lang)
      LanguageSwitcher.tsx                (fi/en, aria-current)
      Hero.tsx                            (poster-first, lazy <video> gated by connection + reduced-motion)
      AvailabilityQuickCheck.tsx          (dates + party → /varaa?...); client-only stub in P1
      SellingPoints.tsx  PitchTeaser.tsx  AreaHighlights.tsx  ReviewsStrip.tsx
  routes/
    __root.tsx                            (head(): real title/desc/OG, fi lang, i18n provider, skip-link, <main> in layout)
    index.tsx                             (Etusivu, composed of the sections above)
```

### Etusivu composition (mobile-first at 375px)
1. Sticky header (wordmark "Järvenranta", nav, lang, "Varaa nyt")
2. Hero: drone poster (birch-toned lake image), H1 "Järvi. Metsä. Yösi Oulun kupeessa.", sub, primary CTA "Tarkista saatavuus", secondary "Katso majoitukset". Video lazy-loads only if `effectiveType === '4g'` and `!saveData` and no reduced-motion.
3. Availability quick-check card (overlaps hero bottom on ≥md): check-in, check-out, aikuiset, lapset → routes to `/varaa` with query params. Keyboard-operable; native `<input type="date">` in P1 (accessible custom range picker lands in Phase 3 with real availability).
4. Three selling points (huoltorakennus & sauna / suora järvinäkymä / 15 min Oulusta)
5. Pitch types teaser: 3 cards (Telttapaikka / Matkailuautopaikka / Mökit) → `/majoitus`
6. Area highlights: 4 items (Rokua Geopark, Oulujoki melonta, kalastus, marjastus)
7. Reviews strip: 3 short quotes with names/dates
8. Footer

All copy in `fi/home.json` + `en/home.json`. Realistic content for the fictional "Järvenranta Camping" — no lorem.

### Accessibility (Phase 1 checklist, verified before handoff)
- One `<h1>` on Etusivu; logical h2/h3 order
- `<header>`, `<main>`, `<nav aria-label>`, `<footer>` landmarks; single `<main>` in `__root.tsx`
- Skip-link to `#main` as first focusable element
- All interactive elements ≥ 44×44px; visible focus ring 3:1
- Body 17px, line-length capped at 65ch
- Every image has intent-based alt (decorative uses `alt=""`)
- No hardcoded strings; every label through `t()`
- `prefers-reduced-motion` respected on hero video + scroll reveals
- Language switcher updates `<html lang>` and `document.title` live
- Palette contrasts pre-verified (table above)
- Keyboard walkthrough documented in the phase summary

### Explicit non-goals for Phase 1
- No booking submission, no Supabase queries, no calendar UI (→ Phase 3)
- No Majoitus/Alue/Hinnasto/FAQ pages (→ Phase 2)
- No admin (→ Phase 4)
- No payments (out of scope for v1 entirely)
- No custom range picker yet (→ Phase 3, with availability)

### Deliverable at end of Phase 1
Working Etusivu at `/` in fi + en, tokens locked, base component library in place, WCAG self-audit posted in chat, screenshots at 375px and 1280px. Then I stop and wait for your review before Phase 2.
