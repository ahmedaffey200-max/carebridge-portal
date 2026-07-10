# Carebridge International — Design System

A complete brand & UI design system for **Carebridge International**, a premier medical-travel and healthcare consultancy headquartered in Mogadishu, Somalia. Carebridge is a trusted bridge between Somali / East-African patients and internationally accredited hospitals, providing end-to-end support — medical report reviews, hospital selection, travel coordination, and post-treatment follow-up — with compassionate, culturally sensitive guidance.

This system encodes that promise as design: **navy for trust, teal for care, generous calm whitespace, and crystal-clear hierarchy.** It should read like a top-tier international hospital network crossed with a modern fintech/SaaS platform — future-forward but reassuring. Nothing flashy; trust comes first.

> **Sources.** This system was built from a written brand brief (no codebase or Figma was attached). There is **no official logo file yet** — the lockups in `assets/logo/` are clean *placeholders* built from the brand palette and motifs. Replace them with the official Carebridge logo when available (see Caveats at the bottom).

---

## How to use this system

Link the single global stylesheet from any page:

```html
<link rel="stylesheet" href="styles.css">
```

That file `@import`s every token + font file. Reference everything through CSS custom properties (`var(--navy-600)`, `var(--space-8)`, `var(--shadow-md)`) — never hard-code hex values. React components are bundled automatically into `_ds_bundle.js`; consume them via `window.CarebridgeDesignSystem_1211a8.<Component>`.

---

## CONTENT FUNDAMENTALS — how Carebridge writes

The voice is **warm, professional, reassuring, and trustworthy** — a calm expert sitting beside a family at a hard moment. We speak directly to patients and their families, never down to them.

**Person & address.** Second person, "you / your family." First person plural "we / our coordinators" for Carebridge. Never the cold third-person institutional "the patient." Example: *"We'll review your medical reports and walk you through every option — at no cost, with no pressure."*

**Tone register.** Confident but never boastful; soft but never vague. Lead with reassurance, follow with specifics. Avoid hype words ("revolutionary," "world-beating"). Prefer grounded trust words: *trusted, accredited, transparent, every step, end-to-end, by your side.*

**Clarity over jargon.** No untranslated medical or bureaucratic jargon. If a clinical term is unavoidable, explain it in plain language. Short sentences. One idea per sentence. Numbers and steps are written out clearly (Step 1, Step 2 …).

**Casing.** Sentence case for headlines and buttons ("Start your journey," not "Start Your Journey" and not ALL CAPS). UPPERCASE is reserved *only* for small eyebrow/kicker labels with wide letter-spacing (e.g. `HOW IT WORKS`). Never set body copy or long headlines in caps.

**Headline style.** Editorial and confident, 4–9 words, often a promise or a destination. Examples:
- *"Your trusted bridge to world-class medical care."*
- *"Driven by compassion, guided by our purpose."*
- *"From first report to full recovery — we're with you."*

**Supporting copy.** One or two calm sentences that add concrete reassurance (cost, accreditation, support, language). Example: *"From accredited hospitals abroad to a coordinator who speaks your language, we handle the details so your family can focus on getting well."*

**CTAs.** Action + outcome, friendly and low-pressure: *"Start your journey," "Speak to a coordinator," "Book a free consultation," "Review my reports."* Avoid aggressive commerce verbs ("Buy now," "Sign up free").

**Emoji.** Never. Carebridge does not use emoji — it undermines credibility for life-or-death decisions. Use refined line icons instead (see Iconography).

**Numbers & proof.** Use real, specific reassurance when available (e.g. "12+ accredited partner hospitals across 4 countries"). Never invent precise statistics as filler — vague big numbers erode trust. Placeholders in this system are clearly marked.

---

## VISUAL FOUNDATIONS

**Overall feel.** Airy, editorial, premium. Lots of breathing room (sections use `--section-y`, ~64–128px vertical). Strong typographic hierarchy carries the page; decoration is minimal and purposeful. Calm, not busy.

**Color.** Navy (`--navy-600 #1B3A6B`) is dominant — nav, headlines, primary buttons, dark CTA/footer bands. Teal (`--teal-500 #1CA89C`) is the energizing accent — links, highlights, icon accents, the heartbeat motif, and the second half of brand gradients. Sky/steel blue (`--sky-500 #A8C0D6`) is a supporting tint for subtle backgrounds, dividers, and soft texture. The page background is warm off-white (`--warm-white #F7F5F0`); cards are pure white. Text is near-black navy (`--ink-900 #152A47`) on light, white on dark. **No off-brand hues.** Status colors are deliberately on-brand and muted (success = teal).

**Gradients.** Used *sparingly* and only for hero / CTA moments: `--grad-bridge` (navy→teal, ~120°) and the deeper `--grad-bridge-deep`. Never gradient body text, never rainbow or purple gradients. Light areas may use the barely-there `--grad-tint` (white→sky-100).

**Type.** Display = **Plus Jakarta Sans** (600–800) for headlines and eyebrows; Body = **Source Sans 3** (400–600) for paragraphs and UI. Headlines are large and confident with tight tracking (`--ls-snug`/`--ls-tight`) and balanced wrapping. Body is 17px, line-height 1.6, comfortable measure (~`--container-text` 720px). Eyebrows are 13px uppercase, `0.14em` tracking, teal, prefixed by a short heartbeat dash.

**Spacing & layout.** 8px base grid. Containers max 1200px (1320 wide, 720 for text). Generous gutters (`--gutter`, clamps 20→56px). Prefer flex/grid with `gap`. Whitespace is a feature, not waste.

**Backgrounds & textures.** Mostly flat warm-white and white. Three subtle brand textures, always low-opacity and never loud:
- **Heartbeat/ECG line** (`.cb-heartbeat`) — a thin teal pulse used as a section divider or accent.
- **Globe / connectivity grid** (`.cb-globe-texture`) — faint grid + radial glow on dark navy panels, evoking global reach.
- **Dot field** (`.cb-dot-texture`) — soft navy dots on sunken light areas.
A subtle bridge-arc silhouette echoes the logo in hero/CTA art.

**Imagery.** Warm and human — patients, families, care — paired with a sense of international reach (airports, world maps, hospital exteriors). Color grade is warm and natural, never cold or clinical-blue, never heavy grain. Images sit in soft-rounded cards (`--radius-lg`/`--radius-xl`) with a faint navy-tinted shadow. Use the `<image-slot>` primitive (`assets/image-slot.js`) for user-supplied photos; styled gradient/texture panels stand in as placeholders.

**Corner radii.** Soft and consistent. Buttons & inputs `--radius-sm` (10px) to pill; cards `--radius-lg` (20px) to `--radius-xl` (28px); large media `--radius-2xl`. Pills (`--radius-pill`) for badges, tags, and the nav CTA.

**Cards.** White surface, 1px warm hairline border (`--border-subtle`), soft low-spread navy-tinted shadow (`--shadow-sm`/`--shadow-md`), 20–28px radius, generous internal padding (`--space-6`/`--space-8`). On hover, a card lifts gently (translateY ~ -4px) and the shadow deepens to `--shadow-lg`.

**Shadows.** Soft, low, navy-tinted (never pure-black, never harsh). Scale `--shadow-xs → --shadow-xl`, plus `--shadow-teal` for teal CTA glow and `--shadow-focus` for focus rings. No hard 1px drop shadows; no neumorphism.

**Borders.** Hairline (1px). Warm `--border-subtle` on paper, cool `--border-default` on tinted areas, `--border-on-dark` (translucent white) on navy. Dividers are quiet.

**Motion.** Subtle and calm — *gentle* fades and short upward slides on scroll (`.cb-reveal`, 16px rise, ~640ms, `--ease-out`). Hover transitions 140–240ms. **No bounce, no spring, no parallax theatrics.** Everything respects `prefers-reduced-motion` (animations collapse to instant).

**Hover states.** Buttons darken one navy/teal step and lift slightly with a deeper shadow; links gain a teal underline (3px offset); cards lift and deepen shadow; icon buttons get a soft tinted background. Transitions are quick and smooth.

**Press / active states.** A small scale-down (`scale(0.98)`) and shadow reduction — a gentle "press," never a hard jump. Focus-visible always shows a 2px teal outline (or `--shadow-focus` ring on filled controls) for accessibility.

**Transparency & blur.** Used lightly: a frosted sticky nav (white at ~80% with `backdrop-filter: blur`), translucent white borders/overlays on imagery and navy panels, and soft protection gradients over photos behind text. Blur is restrained — never a glassmorphism showpiece.

**Accessibility.** Strong contrast (navy/near-black text on warm-white passes AA; white on navy passes AA). Visible focus on everything interactive. Hit targets ≥ 44px. Color is never the sole signifier.

---

## ICONOGRAPHY

Carebridge uses **refined line-style (stroke) icons** — calm, even ~1.75px stroke weight, rounded caps/joins, no fills. This matches the medical / travel / globe / bridge theme without feeling clinical or heavy.

- **System:** [**Lucide**](https://lucide.dev) via CDN (`https://unpkg.com/lucide@latest`). Lucide's consistent 24px grid, rounded line style, and large medical/travel/globe/shield/heart set fit the brand exactly. Render with `data-lucide="…"` + `lucide.createIcons()`.
- **Default stroke:** set `stroke-width="1.75"` on the SVG (1.5 for large hero icons). Icon color is usually `--teal-600` for accents or `--navy-600`/`currentColor` in context.
- **Common icons:** `heart-pulse`, `stethoscope`, `globe`, `plane`, `shield-check`, `file-text`, `hospital`, `hand-heart`, `languages`, `map-pin`, `bed-double`, `phone-call`, `users`, `badge-check`, `route`, `arrow-right`.
- **No emoji. No multicolor / 3D / filled icon packs.** Do not hand-draw bespoke SVG icons for UI — use Lucide so weight and style stay consistent. The bridge/heartbeat **logo mark** is the one bespoke brand glyph (`assets/logo/carebridge-mark.svg`).
- **Icon chips:** icons often sit in a soft rounded-square tint chip (teal-50 or sky-100 background, `--radius-md`) at the top of service/value cards.

> **Substitution flag:** Lucide is a substitute icon set chosen to match the brief's "refined line-style iconography" — no proprietary Carebridge icon set was provided. Swap if the brand later standardizes on another line set.

---

## Index / manifest

**Root**
- `styles.css` — global entry (imports only)
- `readme.md` — this file
- `SKILL.md` — Agent-Skills wrapper

**`tokens/`** — `fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `base.css`

**`assets/`**
- `logo/` — `carebridge-logo.svg`, `carebridge-logo-white.svg`, `carebridge-mark.svg` *(placeholders)*
- `image-slot.js` — user-fillable image placeholder primitive

**`guidelines/`** — foundation specimen cards (Type, Colors, Spacing, Brand) shown in the Design System tab.

**`components/`** — reusable React primitives (see each directory's `.prompt.md`):
- `core/` — Button, IconButton, Badge, Tag, Avatar, Card
- `forms/` — Input, Select, Textarea, Checkbox, Radio, Switch
- `navigation/` — Tabs
- `feedback/` — Accordion
- `brand/` — Eyebrow, ServiceCard, ValueCard, StepCard, StatCard, TestimonialCard, HeartbeatDivider

**`ui_kits/website/`** — the Carebridge marketing site recreation (`index.html` + section JSX). Hero, Trust bar, Philosophy, How it works, Services, Why Carebridge, Partner hospitals, Testimonials, CTA band, Footer.

---

## Caveats / open questions

1. **No official logo file** was provided — `assets/logo/*` are flagged placeholders built from the brand mark concept (bridge span + heartbeat pulse). **Please upload the real Carebridge logo** (and a white/mono version) to replace them.
2. **Fonts** are loaded from Google Fonts (Plus Jakarta Sans + Source Sans 3). If the official brand uses a licensed face, send the files and we'll self-host.
3. **Imagery** uses styled placeholders / `<image-slot>` — drop in real warm patient/family + international-reach photography when ready.
4. Stats, testimonials, and partner-hospital names are **placeholders** — replace with verified content (never ship invented numbers).
