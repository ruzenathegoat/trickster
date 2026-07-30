---
name: Trickster
description: Valorant talent decision-support platform — bold, playful neobrutalist marketing feel combined with a highly structured, data-dense product and admin system.
version: 1.2.0
source: visual-audit (Crypko + Linear/Vercel dashboard influences)
mode: light
default-mode: light
style-direction: "Soft Neobrutalism + Minimalist/Editorial restraint"
mood: playful, bold, energetic on marketing; functional and dense on data surfaces
comparable-to: "Marketing: Playground AI / Ideogram / Crypko. Product: Vercel Dashboard. Data: Bloomberg / Notion Database."
screen-type: "Multi-layered: Marketing (Landing) → Product (Dashboard/Simulation) → Data (Admin)"
target-platform: Laravel 13 + React + Tailwind v4

# ============================================
# DESIGN TOKENS
# (Consumed by UI framework / Tailwind)
# ============================================

colors:
  # The 90/8/2 Rule implementation
  primary: "#F5D90A"             # 2% Accent Yellow (Interaction, CTAs, Highlights)
  primary-hover: "#E5C908"

  background: "#F4F1E1"          # 90% Cream Canvas
  surface: "#FFFFFF"             # White cards
  surface-hover: "#F9F9F9"

  # NEW — inverse surface, needed for navbar, seals, dark chips.
  surface-inverse: "#111111"
  text-on-inverse: "#FFFFFF"

  text-primary: "#111111"        # 8% Black (Structural anchor, Text)
  text-secondary: "#555555"
  text-muted: "#888888"
  text-on-primary: "#111111"

  border: "#111111"
  border-strong: "#111111"

  # Semantic
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"

typography:
  font-family-display: "'Archivo Black', sans-serif"
  font-family-body: "'Inter', sans-serif"
  font-family-mono: "'JetBrains Mono', monospace"

  display:
    size: "4rem"
    weight: 900
    line-height: 1.0
    text-transform: "uppercase"
  h1:
    size: "3rem"
    weight: 900
    line-height: 1.1
    text-transform: "uppercase"
  h2:
    size: "2rem"
    weight: 800
    line-height: 1.2
  h3:
    size: "1.5rem"
    weight: 700
    line-height: 1.3
  body-lg:
    size: "1.125rem"
    weight: 500
    line-height: 1.5
  body:
    size: "1rem"
    weight: 400
    line-height: 1.5
  label:
    size: "0.75rem"
    weight: 600
    line-height: 1.4
    letter-spacing: "0.05em"
    text-transform: "uppercase"
  numeric:
    feature: "tabular-nums"
    weight: 600
  # NEW — used only on Layer 1, for circular seal ring-text (e.g. "START GENERATE")
  ring-label:
    size: "0.65rem"
    weight: 700
    letter-spacing: "0.08em"
    text-transform: "uppercase"

spacing:
  base: 8
  scale:
    "1": "0.25rem"
    "2": "0.5rem"
    "3": "0.75rem"
    "4": "1rem"
    "6": "1.5rem"
    "8": "2rem"
    "12": "3rem"
    "16": "4rem"

radius:
  none: "0"
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "9999px"

success-bg: "#ECFDF5"   warning-bg: "#FFFBEB"   error-bg: "#FEF2F2"

chart:
  hero-series: primary          # SATU series/titik data terpenting → yellow
  neutral-1: text-primary       # #111111
  neutral-2: text-secondary     # #555555
  neutral-3: text-muted         # #888888
  neutral-4: "#D6D3C4"          # NEW — grid lines/axis, lebih terang dari muted
  delta-positive: success
  delta-negative: error

modal:
  backdrop: "rgba(17,17,17,0.6)"
  container: surface, border-strong, shadow: "8px 8px 0px #111111" (lebih besar dari card biasa)
  radius: radius.lg
  shape: rounded-rectangle ONLY — never cut-corner, meski muncul di Layer 1
  close-button: ghost, top-right

dropzone:
  default: border-strong dashed, background surface
  hover/dragover: border → primary (solid), background surface-hover
  error: border → error, error-bg background
  uploaded-file-chip: rounded-rect row, filename + size (mono) + remove icon

list:
  divider: border, 1px (bukan border-strong)
  row-hover: surface-hover
  density: looser than table, 1-2 line items, avatar/icon-left, action-right
  numeric: masih wajib tabular-nums kalau ada angka

pagination:
  page-pill-active: background primary, text-on-primary
  page-pill-inactive: ghost, text-secondary
  admin-variant: compact, mono "1 / 24" style, no pills — sesuai rule dense/fast

search-input:
  shape: rounded-full (Layer 1) atau rounded-md (Layer 2/3)
  icon-left: Phosphor MagnifyingGlass
  focus: shadow.focus (mandatory)
  layer1: border-strong + shadow.brutalist
  layer2/3: border tipis, no shadow

slider:
  track: background border/neutral-4
  fill: primary (khusus Layer 2 — active filter, dsb.)
  thumb: circle, surface + border-strong
  admin-variant: grayscale only, NO yellow fill — admin tetap harus zero-decoration

tabs:
  layer2: underline style, active = text-primary bold + yellow underline 2-3px, inactive = text-muted
  layer3: segmented/pill background-chip switch, monochrome, no yellow indicator

state:
  disabled: opacity 0.4, cursor not-allowed
  hover: shadow.brutalist-hover (di elemen dengan shadow) atau surface-hover (di elemen flat)


shadow:
  none: "none"
  brutalist: "4px 4px 0px 0px #111111"
  brutalist-hover: "2px 2px 0px 0px #111111"
  focus: "0 0 0 3px rgba(245, 217, 10, 0.5)"

layout:
  max-content-width: "1440px"
  sidebar-width: "280px"
  topbar-height: "80px"
  card-padding: "1.5rem"
  # NEW — optional outer app-shell frame, Layer 1 only. See note under
  # "PAGE SHELL (OPTIONAL)" below before implementing.
  page-shell-margin: "24px"
  page-shell-radius: "32px"

# ============================================
# NEW — COMPONENT TOKENS
# Added from Crypko reference audit. These are structural specs, not
# just color/spacing primitives, so they're grouped separately.
# ============================================

components:

  navbar:
    scope: "Layer 1 (Marketing) only"
    background: surface-inverse
    text-color: text-on-inverse
    height: layout.topbar-height
    shape: "cut-corner-top-right"      # diagonal cut, other corners follow radius.lg
    logo: text-on-inverse, font-family-display or body-bold
    nav-links:
      color: text-on-inverse
      hover: primary
    cta:
      style: pill, surface + border-strong
      position: "floating-overlap"      # sits half-in/half-out of navbar's bottom edge
      offset-y: "-50%"                  # roughly half its own height above the fold line

  seal-badge:
    description: "Rotating circular seal, e.g. 'START GENERATE'. Signature Layer 1 element."
    scope: "Layer 1 (Marketing) only — never on Product/Admin"
    diameter: "140px-160px"
    background: surface-inverse
    center-label:
      color: primary
      typography: label or h3, bold
    ring-text:
      typography: typography.ring-label
      path: circular (textPath / SVG circular text)
      color: text-on-inverse
    decoration: small star glyphs between ring-text repeats
    animation:
      type: rotate
      duration: "25s-30s"
      easing: linear
      loop: infinite

  sticker-badge:
    description: "Small circular action sticker overlapping a card corner, e.g. 'CREATE ANIME' + dice icon."
    scope: "Layer 1 (Marketing) only"
    diameter: "72px-96px"
    background: primary
    border: "2px solid var(--border-strong)"
    position: absolute
    overlap-offset: "-12px to -16px"     # negative offset so it hangs off the parent card's corner
    content: icon (Phosphor, weight=bold) + micro-label (typography.label, 2 lines max)
    hover: scale(1.05) + shadow.brutalist-hover

  button:
    primary:
      background: primary
      text: text-on-primary
      shadow: shadow.brutalist
      hover: shadow.brutalist-hover
      rule: "max one per view"
    secondary:
      background: surface
      border: border-strong
    ghost:
      background: transparent
      text: text-primary
    # NEW — compound button variant
    compound:
      description: "Two fused segments: a dark label pill + an attached accent icon-circle. E.g. 'Download' + arrow-down circle."
      label-segment:
        background: surface-inverse
        text: text-on-inverse
        shape: pill (rounded left, square-ish right where it joins)
      icon-segment:
        background: primary
        shape: circle
        icon-color: text-on-primary
        attachment: "no gap, directly fused to label segment's edge"

  promo-card:
    description: "Layer 1 secondary banner pattern, e.g. app-download promo strip beneath the hero."
    scope: "Layer 1 (Marketing) only"
    background: surface
    border: border-strong
    shadow: shadow.brutalist
    radius: radius.lg
    structure:
      - label: typography.label, uppercase, small, top-left
      - body: typography.body, text-secondary, 1-2 lines max
      - action-row: icon-button(s) [circle, size 32-40px] + button.compound, bottom
      - overflow-menu: "three-dot icon, top-right corner, ghost style"

  # NEW — clarified/extended cut-corner usage (see Shape Language rule update below)
  image-container:
    scope: "Layer 1 (Marketing) only"
    shape: cut-corner (one or two corners, matches navbar's corner logic)
    border: border-strong
    radius: radius.lg (on non-cut corners)
    decoration-strip:
      description: "Optional vertical accent strip along one edge, primary yellow, with star glyphs and directional arrow."
      width: "40px-56px"
      background: primary
      usage: "Exception to the 2% yellow rule — permitted ONLY as a thin decorative strip on Layer 1 hero imagery, never as a fill on cards, tables, or any Layer 2/3 surface."

  # NEW — optional, needs confirmation before implementing (see note below)
  page-shell:
    status: "PROPOSED — confirm with stakeholder before building"
    description: "Outer rounded dark frame wrapping the entire page, giving an app-like/device-mockup feel even on web."
    background: "#D9D9D9 (neutral gray, sits behind/around the cream canvas)"
    frame:
      border: border-strong, thick (~6-8px)
      radius: layout.page-shell-radius
    scope: "If adopted: Layer 1 only, or possibly global — decide before use"

# ============================================
# PHILOSOPHY & RULES
# ============================================

# 📖 OVERVIEW
Trickster's visual identity operates on a **3-Layer Architecture**. It transitions from a bold, loud "marketing" aesthetic for landing pages to a restrained, highly-functional "data" aesthetic for admin tools. Across all layers, it maintains the same core tokens (colors, borders, radius, typography) but adjusts the *density* and *decoration*.

# 🏛 PHILOSOPHY: THE CORE PILLARS

## 1. Color Philosophy (90 / 8 / 2)
The dashboard remains clean and readable because colors are heavily restricted:
* **90% Cream (`#F4F1E1`)**: The vast canvas that lets the data breathe.
* **8% Black (`#111111`)**: The structural anchor. Used for borders, text, depth cues, **and now also as an inverse fill** (`surface-inverse`) for navbar, seals, and dark chips. This is still the same ink color — using it as a fill does not count as a second accent.
* **2% Accent Yellow (`#F5D90A`)**: Used ONLY for interaction (hover states), main CTAs, the absolute most important data point (e.g., #1 Rank), or — on Layer 1 only — a thin decorative accent strip on hero imagery.
* **Never** use 30% yellow or multiple colors that make the dashboard noisy. Data visualization must remain clear. The yellow decorative strip exception is Layer 1 only and must never appear on Layer 2/3 surfaces.

## 2. Depth Comes from Borders, Not Blur
* **Shadows:** No blurred drop-shadows. Depth is created strictly through `Border` → `Layering` → `Spacing`.
* **Solid Shadows:** If a shadow is needed for a floating element, it is a hard-edge black offset (e.g., `4px 4px 0px #111111`), never a soft blur.

## 3. Shape Language
All elements in Trickster derive from 4 fundamental shapes. No random or messy shapes. This strict constraint guarantees consistency:
1. **Pill** (Full rounded badges, small buttons, compound button label segment)
2. **Rounded Rectangle** (Standard cards, inputs, promo cards)
3. **Circle** (Avatars, icons, seal badges, sticker badges, compound button icon segment)
4. **Cut Corner** (Signature branding element, reserved for Marketing surfaces — applies not only to small cards but also to structural elements like the **navbar** and **hero image containers**)

> **Update:** Cut-corner is not limited to small decorative cards. On Layer 1, it can anchor large structural elements (navbar, hero image frames) as long as it never appears on Layer 2 (Product) or Layer 3 (Admin/Data) surfaces, where corners stay strictly `radius.md`/`radius.lg` rounded rectangles.

# 🏢 3-LAYER VISUAL ARCHITECTURE
To prevent the dashboard from looking like a loud marketing page, Trickster is separated into three distinct visual layers:

### Layer 1: Marketing Surface (Crypko style)
* **Scope:** Hero, Landing, About, Features, CTA.
* **Style:** 100% playful neobrutalism. Heavy use of cut corners, floating seals, bold yellow highlights, sticker-style elements, and high decoration.
* **Signature components:** `navbar` (inverse/cut-corner), `seal-badge`, `sticker-badge`, `promo-card`, `image-container` with decoration strip, `button.compound`.

### Layer 2: Product Surface (Linear + Vercel Dashboard + touch of Crypko)
* **Scope:** Dashboard, Leaderboards, Player Profile, Team Simulation.
* **Style:** Minimalist. Cream background → White Cards → Thin separation borders. Yellow is strictly reserved for *interaction* (e.g., hover, active filters) and primary focus. Not every card gets a "hero" treatment. No cut corners, no seals, no stickers, no decoration strips.

### Layer 3: Data Surface (Bloomberg / Notion / Linear Issue)
* **Scope:** Admin Dashboard, Curations, Scraper Logs.
* **Style:** Minimal, Functional, Dense, Fast. Zero decoration. The focus is purely on curating and manipulating data quickly.

# 🔠 TYPOGRAPHY SYSTEM
A heavily editorial approach using stark contrast: *Huge Display* → *Tiny Navigation* → *Medium Body* → *Micro Caption*.

* **Display Layer (Archivo Black):** Used for Landing pages, Hero sections, and Big Numbers (KPIs). Heavy, condensed, uppercase.
* **Functional Layer (Inter):** Used for Dashboards, Tables, Forms, and Filters. Neutral, highly legible.
* **Data Layer (JetBrains Mono):** Used for SMART Scores, ACS, ADR, KAST, Rankings. Everything that is a stat must use a monospaced/tabular-nums font so columns align perfectly.
* **Ring Label (new):** Small circular-path uppercase text used exclusively inside `seal-badge` on Layer 1.

# 🌀 MOTION SYSTEM
Motion brings the interface to life, tailored to the surface:
* **Landing:** Large reveal → Parallax scrolling → Sticker motion → Magnetic buttons → Floating rotating seals (`seal-badge`, 25-30s linear infinite rotation).
* **Dashboard:** Subtle Fade-ins → Number Counter animations (for KPIs) → Filter transitions → Sortable list animations → Chart rendering animations.
* **Simulation:** Roster Swap animations → Score morphing (numbers ticking up/down) → Progress bar interpolation.
* **Admin:** Zero decoration. Instant feedback. Extremely fast transitions (or none at all) to prioritize speed.

# 📏 DASHBOARD DENSITY RULES
Not all cards are equal. The dashboard uses strict hierarchical sizing to prevent overwhelming the user:
* **Level 1 (Hero KPI):** The largest, most prominent metrics (e.g., top player of the week, highest overall SMART score).
* **Level 2 (Charts):** Medium-large containers for Radar charts, trend lines.
* **Level 3 (Tables):** High density, strictly functional rows for leaderboards and match history.
* **Level 4 (Metadata):** Tiny chips, timestamps, source references, patch versions.

# 🌟 ICONOGRAPHY (PHOSPHOR ICONS)
Trickster exclusively uses **Phosphor Icons (`@phosphor-icons/react`)**. No Lucide, no Material Symbols, no exceptions.
* **Layer 1 (Marketing):** Use `weight="bold"` or `weight="fill"` to match the neobrutalist, chunky aesthetic. Applies to icons inside `sticker-badge`, `promo-card` action row, and `button.compound`.
* **Layer 2 & 3 (Product & Admin):** Use `weight="regular"` to keep the interface highly legible and dense.
* **Sizing:** `size={16}` for inline metadata, `size={20}` for standard buttons/nav, `size={24}` or larger for marketing hero sections.

# ⭐ KEY EXPERIENCES (VISION)

## 1. Player Profile (Editorial Magazine)
This page is the iconic centerpiece of Trickster. It feels like an editorial sports magazine layout, not a standard admin dashboard.
* Layout flow: Header (Huge PLAYER name, Role) → Hero Stat (Current Form with a floating "Verified Meta" seal) → Core Stats → Visualizations (Radar Chart, Timeline) → Footer.

## 2. Recommendation Result (AI Decision Support)
Instead of a boring table of suggested players, the recommendation output feels like an AI Decision Support card:
* Rank #1 Player Name | Selection Score: 94 | WHY (Checklist) | Confidence Level: 93% | [Run Simulation] Button.

## 3. Team Simulation
The interactive pinnacle of the app.
* Flow: Current Roster → Smooth Swap Animation (dragging a new player in) → New Roster renders → Animated Delta (showing stat changes in green/red) → AI Insight text generation → Final Recommendation.

# 🧩 COMPONENT BEHAVIOR RULES
- **Buttons:** One primary yellow button per view. Everything else is secondary (white/cream), ghost (text only), or `compound` (dark pill + yellow icon-circle, used for secondary actions like downloads/links on Layer 1).
- **Inputs:** Label above field. Focus ring (`{shadow.focus}`) is mandatory for accessibility.
- **Tables:** Hover state mandatory on rows. Sticky headers for long scrolling. Empty states must be illustrated, not just text.
- **Modals:** Must trap focus. Clicking backdrop closes them.
- **Navbar (new):** Layer 1 only. Inverse background, cut-corner top-right, floating overlap CTA. Layer 2/3 use a plain surface navbar/topbar instead (not covered by this component — define separately if needed).
- **Seals & Stickers (new):** Decorative-only, never carry critical actions users must complete (a sticker can trigger a shortcut, but the same action must also exist as a normal button/link elsewhere).

# 🚫 RULES TO NEVER BREAK
- Never use a drop shadow with blur. Hard edge or nothing.
- Never use more than one accent color (yellow) — the Layer-1-only decorative strip and `surface-inverse` fills are not exceptions to this, they are the same ink/accent reused, not new colors.
- Never use the "cut-corner" shape on Data/Admin surfaces or dense tables — this now explicitly includes the navbar and image containers when they appear on Layer 2/3.
- Never use proportional fonts (Inter) for statistical data (use JetBrains Mono).
- Never make the Admin panel playful or decorated. Keep it dense and fast.
- Never mix icon libraries. Phosphor Icons are the sole permitted icon set.
- Never place a `seal-badge`, `sticker-badge`, decoration strip, or `page-shell` outside Layer 1.
- Never use emojis anywhere in the interface.
- Never place an icon before every heading. Avoid decorative icons. Use icons only when they improve comprehension.
- Avoid unnecessary badges and labels. Use labels only when they carry meaningful information.
- Avoid placeholder content. Use realistic domain-specific copy.
- Do not use generic 3D illustrations, blob graphics, or floating abstract shapes.

# ✅ RULES TO ALWAYS FOLLOW
- Stick strictly to the 90% Cream, 8% Black, 2% Yellow color philosophy.
- Apply `tabular-nums` to every single statistic and metric.
- Ensure the hierarchy is always clear: Huge Display → Tiny Nav → Medium Body → Micro Caption.
- Use Skeleton loaders for data (never spinners), especially during scraper cycles.
- Integrate GSAP & Lenis for silky smooth 60fps scrolling and entry animations.
- Use Framer Motion/Motion.dev for micro-interactions (hover, swap, morph, seal rotation).
- Avoid colorful gradients. Use solid colors with intentional accents.
- Do not solve every section using identical cards. Mix layouts: editorial, split sections, full-bleed imagery, asymmetric compositions, horizontal modules.
- Each section should have its own visual rhythm. Avoid repeating identical content structures.
- Use expressive typography. Create hierarchy through scale, weight, tracking, and spacing instead of only font size.
- Not every component should animate. Use motion only to communicate hierarchy, state, or interaction.
- Create clear button hierarchy. Only one primary action should dominate each viewport.
- Limit accent colors. Use one primary accent and one secondary accent consistently.

# 📝 CHANGELOG (v1.1.0 → v1.2.0)
- Added `surface-inverse` / `text-on-inverse` color tokens.
- Added `ring-label` typography token for seal ring-text.
- Added `components:` block: `navbar`, `seal-badge`, `sticker-badge`, `button.compound`, `promo-card`, `image-container` (with decoration-strip exception), and proposed `page-shell`.
- Clarified cut-corner usage to explicitly cover structural elements (navbar, hero image containers), not just small cards.
- Documented the yellow decoration-strip as a scoped exception to the 2% rule (Layer 1 hero imagery only).
- `page-shell` is marked PROPOSED — confirm whether the outer device-mockup frame is an intentional brand element or just a presentation artifact before implementing.