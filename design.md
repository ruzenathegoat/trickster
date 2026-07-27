---
name: Trickster
description: Valorant talent decision-support platform — bold, playful neobrutalist marketing feel combined with a highly structured, data-dense product and admin system.
version: 1.1.0
source: visual-audit (Crypko + Linear/Vercel dashboard influences)
mode: light
default-mode: light
style-direction: "Soft Neobrutalism + Minimalist/Editorial restraint"
mood: playful, bold, energetic on marketing; functional and dense on data surfaces
comparable-to: "Marketing: Playground AI / Ideogram. Product: Vercel Dashboard. Data: Bloomberg / Notion Database."
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

# ============================================
# PHILOSOPHY & RULES
# ============================================

# 📖 OVERVIEW
Trickster's visual identity operates on a **3-Layer Architecture**. It transitions from a bold, loud "marketing" aesthetic for landing pages to a restrained, highly-functional "data" aesthetic for admin tools. Across all layers, it maintains the same core tokens (colors, borders, radius, typography) but adjusts the *density* and *decoration*. 

# 🏛 PHILOSOPHY: THE CORE PILLARS

## 1. Color Philosophy (90 / 8 / 2)
The dashboard remains clean and readable because colors are heavily restricted:
* **90% Cream (`#F4F1E1`)**: The vast canvas that lets the data breathe.
* **8% Black (`#111111`)**: The structural anchor. Used for borders, text, and depth cues.
* **2% Accent Yellow (`#F5D90A`)**: Used ONLY for interaction (hover states), main CTAs, or the absolute most important data point (e.g., #1 Rank). 
* **Never** use 30% yellow or multiple colors that make the dashboard noisy. Data visualization must remain clear.

## 2. Depth Comes from Borders, Not Blur
* **Shadows:** No blurred drop-shadows. Depth is created strictly through `Border` → `Layering` → `Spacing`.
* **Solid Shadows:** If a shadow is needed for a floating element, it is a hard-edge black offset (e.g., `4px 4px 0px #111111`), never a soft blur.

## 3. Shape Language
All elements in Trickster derive from 4 fundamental shapes. No random or messy shapes. This strict constraint guarantees consistency:
1. **Pill** (Full rounded badges, small buttons)
2. **Rounded Rectangle** (Standard cards, inputs)
3. **Circle** (Avatars, icons)
4. **Cut Corner** (Signature branding element, reserved for Marketing surfaces)

# 🏢 3-LAYER VISUAL ARCHITECTURE
To prevent the dashboard from looking like a loud marketing page, Trickster is separated into three distinct visual layers:

### Layer 1: Marketing Surface (Crypko style)
* **Scope:** Hero, Landing, About, Features, CTA.
* **Style:** 100% playful neobrutalism. Heavy use of cut corners, floating seals, bold yellow highlights, sticker-style elements, and high decoration.

### Layer 2: Product Surface (Linear + Vercel Dashboard + touch of Crypko)
* **Scope:** Dashboard, Leaderboards, Player Profile, Team Simulation.
* **Style:** Minimalist. Cream background → White Cards → Thin separation borders. Yellow is strictly reserved for *interaction* (e.g., hover, active filters) and primary focus. Not every card gets a "hero" treatment.

### Layer 3: Data Surface (Bloomberg / Notion / Linear Issue)
* **Scope:** Admin Dashboard, Curations, Scraper Logs.
* **Style:** Minimal, Functional, Dense, Fast. Zero decoration. The focus is purely on curating and manipulating data quickly. 

# 🔠 TYPOGRAPHY SYSTEM
A heavily editorial approach using stark contrast: *Huge Display* → *Tiny Navigation* → *Medium Body* → *Micro Caption*.

* **Display Layer (Archivo Black):** Used for Landing pages, Hero sections, and Big Numbers (KPIs). Heavy, condensed, uppercase.
* **Functional Layer (Inter):** Used for Dashboards, Tables, Forms, and Filters. Neutral, highly legible.
* **Data Layer (JetBrains Mono):** Used for SMART Scores, ACS, ADR, KAST, Rankings. Everything that is a stat must use a monospaced/tabular-nums font so columns align perfectly.

# 🌀 MOTION SYSTEM
Motion brings the interface to life, tailored to the surface:
* **Landing:** Large reveal → Parallax scrolling → Sticker motion → Magnetic buttons → Floating rotating seals.
* **Dashboard:** Subtle Fade-ins → Number Counter animations (for KPIs) → Filter transitions → Sortable list animations → Chart rendering animations.
* **Simulation:** Roster Swap animations → Score morphing (numbers ticking up/down) → Progress bar interpolation.
* **Admin:** Zero decoration. Instant feedback. Extremely fast transitions (or none at all) to prioritize speed.

# 📏 DASHBOARD DENSITY RULES
Not all cards are equal. The dashboard uses strict hierarchical sizing to prevent overwhelming the user:
* **Level 1 (Hero KPI):** The largest, most prominent metrics (e.g., top player of the week, highest overall SMART score).
* **Level 2 (Charts):** Medium-large containers for Radar charts, trend lines.
* **Level 3 (Tables):** High density, strictly functional rows for leaderboards and match history.
* **Level 4 (Metadata):** Tiny chips, timestamps, source references, patch versions.

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
- **Buttons:** One primary yellow button per view. Everything else is secondary (white/cream) or ghost (text only).
- **Inputs:** Label above field. Focus ring (`{shadow.focus}`) is mandatory for accessibility.
- **Tables:** Hover state mandatory on rows. Sticky headers for long scrolling. Empty states must be illustrated, not just text.
- **Modals:** Must trap focus. Clicking backdrop closes them. 

# 🚫 RULES TO NEVER BREAK
- Never use a drop shadow with blur. Hard edge or nothing.
- Never use more than one accent color (yellow). 
- Never use the "cut-corner" shape on Data/Admin surfaces or dense tables.
- Never use proportional fonts (Inter) for statistical data (use JetBrains Mono).
- Never make the Admin panel playful or decorated. Keep it dense and fast.

# ✅ RULES TO ALWAYS FOLLOW
- Stick strictly to the 90% Cream, 8% Black, 2% Yellow color philosophy.
- Apply `tabular-nums` to every single statistic and metric.
- Ensure the hierarchy is always clear: Huge Display → Tiny Nav → Medium Body → Micro Caption.
- Use Skeleton loaders for data (never spinners), especially during scraper cycles.
- Integrate GSAP & Lenis for silky smooth 60fps scrolling and entry animations. 
- Use Framer Motion/Motion.dev for micro-interactions (hover, swap, morph).