# Trickster — User Dashboard Structure

**Companion document to:** Trickster PRD v1.0 + `design.md` v1.1.0 (3-Layer Visual Architecture)
**Scope:** Registered **user** (coach/analyst/fan) experience — **Layer 2: Product Surface** per `design.md`.
**Out of scope here:** Layer 1 (Marketing/Landing) and Layer 3 (Admin/Data Surface) are separate documents — referenced only where a boundary matters.

---

## 1. Layer Mapping — Where This Dashboard Sits

| Layer (design.md) | Surfaces | Covered in this doc? |
|---|---|---|
| **Layer 1 — Marketing** | Landing, About, public pre-login pages | ❌ Not covered — separate landing-page structure |
| **Layer 2 — Product** | Dashboard, Leaderboard, Player Profile, Talent Recommendation, Team Simulation | ✅ **This document** |
| **Layer 3 — Data/Admin** | Agent/patch curation, scraper logs, user management | ❌ Not covered — separate admin structure (admin/super_admin only) |

🔶 **Assumption:** "Dashboard user" = the full authenticated product experience for the `user` role (Section 3 of the PRD persona set), not a single page. This document maps that entire experience, since Talent Recommendation, Team Simulation, and Weight Profiles are interdependent flows, not standalone screens.

---

## 2. Sitemap

```
/ (Layer 1 — marketing, not detailed here)
├── /login
├── /register
│
└── /app  (authenticated shell — sidebar + topbar, Layer 2)
    ├── /app/dashboard                     → Home
    ├── /app/leaderboard                   → Global Rating leaderboard
    ├── /app/players                       → Player explorer (search/filter)
    │   └── /app/players/:playerId         → Player Profile (editorial layout)
    ├── /app/teams                         → Team explorer
    │   └── /app/teams/:teamId             → Team detail + roster
    ├── /app/recommend                     → Talent Recommendation flow
    │   ├── /app/recommend/filters         → Step 1: Hard filters
    │   ├── /app/recommend/weights         → Step 2: Weight profile (select or build)
    │   └── /app/recommend/results         → Step 3: Ranked results
    ├── /app/simulation                    → Team Simulation (Roster Simulation tool)
    ├── /app/meta                          → Patch & Meta Explorer (read-only view of curated data)
    ├── /app/profiles                      → My Weight Profiles (saved, manage)
    └── /app/account                       → Account settings
```

---

## 3. App Shell (persists across all `/app/*` routes)

| Zone | Content | Key tokens/components used |
|---|---|---|
| **Sidebar** (`260px`, collapsible to `72px`) | Logo mark, nav items (Dashboard, Leaderboard, Players, Teams, Recommend, Simulation, Meta, My Profiles), Account at bottom | `sidebar-nav` — active item gets `primary-subtle` bg + `primary` left border, per design.md's "2% yellow reserved for interaction" rule |
| **Topbar** (`72px`) | Global search (players/teams), current patch indicator, user avatar menu | `nav-bar` tokens, but **Layer 2 styling** — no cut-corner, no black fill; topbar here is `surface` bg with a `border-bottom` only, since cut-corner/dark-fill is a Layer 1 (marketing) device only |
| **Main content area** | Route-specific content, `max-content-width` not enforced (dashboard can use full width unlike marketing's 1200px cap) | `page-padding-x/y` tokens |

🔶 **Design note:** Per `design.md`'s explicit Layer separation, the app shell must **not** borrow Layer 1's loud nav-bar treatment (black fill, cut-corner). The sidebar/topbar here follow Layer 2's "Cream background → White cards → thin separation borders" restraint.

---

## 4. Screen-by-Screen Breakdown

### 4.1 `/app/dashboard` — Home

**Purpose:** Orientation landing spot after login; surfaces what's new/relevant without requiring a search.

**Density hierarchy (per design.md Dashboard Density Rules):**
- **Level 1 (Hero KPI):** One large `kpi-stat-card` — e.g., "Top Rated Player This Patch" or, if the user has a saved weight profile, "Your Top Match: [Player]" pulled from their default profile's last computed `player_smart_results`.
- **Level 2 (Charts):** 2 medium `chart-container` blocks — e.g., "Meta Shift This Patch" (agents trending up in `agent_pick_rate_snapshots`) and a mini consistency trend for a followed player.
- **Level 3 (Table):** Compact "Recent Match Results" table (last 5-10 `matches`, normalized `stage_label`).
- **Level 4 (Metadata):** Current patch version + effective date chip, last scrape timestamp.

**Components:** `kpi-stat-card`, `chart-container`, `leaderboard-table` (compact variant), `chip-filter` (patch chip), `badge-tier`.

**Empty state:** New user with no saved weight profile → CTA card "Build your first Talent Recommendation search" linking to `/app/recommend`.

**Data sources (ERD):** `player_smart_results` (mode=global), `agent_pick_rate_snapshots`, `matches`/`maps`, `patches`.

---

### 4.2 `/app/leaderboard` — Global Rating

**Purpose:** Browse-all view using **Global Rating** (global min/max normalization per PRD), not Selection Score.

**Layout:**
- Filter bar (top): role, region, event tier, patch — `chip-filter` components, live-updating.
- **Level 3 density** `leaderboard-table`: rank, player (avatar + name + team), role, ACS, KAST, ADR, Consistency Index (`badge-tier`), Global SMART score.
- Sticky header, hover row, click → `/app/players/:playerId`.

**States:** Loading → skeleton rows (never spinner, per design.md rule). Empty → "No players match these filters" illustrated empty state.

**Data sources:** `player_criteria_scores`, `player_smart_results` (mode=global), `players`, `teams`.

---

### 4.3 `/app/players` — Player Explorer

**Purpose:** Search/browse entry point distinct from the Leaderboard — lighter-weight, name/role/team search rather than full ranked table.

**Layout:** Search input + role/region quick-filter chips → grid of `player-card` components (avatar, name, role, team, current-season headline stat).

**Data sources:** `players`, `teams`, latest `player_criteria_scores`.

---

### 4.4 `/app/players/:playerId` — Player Profile
*(design.md Key Experience #1 — "Editorial Magazine" — the most distinctive screen in the product)*

**Layout flow (top to bottom):**
1. **Header** — Large player name (display font per design.md typography), role badge, team + country.
2. **Hero Stat** — "Current Form" score, large numeric (`typography.numeric`), with a `seal-badge` ("Verified Meta Fit" or similar) shown **only when applicable** (per design.md: seal is sparingly used, max 1 per screen).
3. **Core Stats row** — 4 `kpi-stat-card`s: ACS | ADR | KAST | Rating.
4. **Visualizations** (Level 2 density, stacked or 2-column):
   - Agent Pool → `chart-container` radar chart (Recharts), one highlighted candidate/current-view player only (per design.md chart rule: `primary` reserved for the single highlighted series).
   - Consistency → timeline/line chart, sample-size gated (20-match minimum per PRD — if below threshold, show a "Not enough season data yet" state instead of a misleading chart).
   - Patch Impact → before/after relative-performance chart, cross-referenced with `agent_patch_ratings` direction (buffed/nerfed) shown as an annotation.
   - Tournament Pressure → grouped bar: regular season vs. playoffs vs. grand final performance.
5. **Footer:**
   - Match History table (Level 3 density, `leaderboard-table` styling but scoped to one player).
   - "Team Fit Preview" teaser — mini version of the Recommendation Result card (see 4.6) if the user has an active search context, letting them jump straight into "Run Simulation with this player."

**Components:** `kpi-stat-card`, `chart-container`, `seal-badge`, `leaderboard-table`, `badge-tier`.

**Data sources:** `players`, `player_map_stats`, `player_criteria_scores`, `agent_patch_ratings`, `agent_map_ratings`, `stage_label_mapping` (via `matches`).

---

### 4.5 `/app/teams` and `/app/teams/:teamId` — Team Explorer

**Purpose:** Supports Team Fit Score context and feeds the Team Simulation tool with a starting roster.

**`/app/teams` layout:** Grid of team cards (logo, name, region, current roster count).

**`/app/teams/:teamId` layout:**
- Header: team name, region, logo.
- Current roster: 5 `player-card`s.
- Agent pool coverage map (which roles/agents the roster collectively covers — highlights gaps, directly useful for Talent Recommendation targeting).
- Inline "Check Fit" — pick any player from search to preview their **Team Fit Score** against this roster without leaving the page.

**Data sources:** `teams`, `players`, computed Team Fit Score (derived, not a stored ERD table — computed from `agent_role_map` + `player_criteria_scores` at request time).

---

### 4.6 `/app/recommend` — Talent Recommendation (3-step flow)
*(Core DSS feature — PRD US-1, US-2; design.md Key Experience #2)*

**Step 1 — `/app/recommend/filters` (Hard Filter Engine):**
- Role selector (required).
- `chip-filter` components for each hard filter (min sample size — system default, editable; Consistency Index threshold; region/event tier).
- **Live candidate-count feedback** as filters change (per PRD explicit UX requirement) — a persistent counter, e.g. "23 players match" updating in real time, styled as a small `kpi-stat-card`-like pill anchored at the bottom of the filter panel.
- If pool narrows below 5 → warning banner (low-sample-size caveat per PRD).

**Step 2 — `/app/recommend/weights` (Weight Profile Builder):**
- Choose: an existing saved profile (from `/app/profiles`) OR "Build new."
- Build new → `weight-profile-drag-item` list (via @dnd-kit): drag criteria into priority order; "Skip" toggle per criterion (per PRD US-2 — skip = zero weight, not forced ranking).
- Rank Sum Weighting computed live as a small preview (e.g., a horizontal weight-distribution bar) so the user sees the effect of their ranking before submitting.
- Save profile (name it) — optional, not required to proceed.

**Step 3 — `/app/recommend/results`:**
- Ranked list of **Recommendation Result cards** (design.md Key Experience #2), not a plain table:
  - Rank # + Player name
  - **Selection Score** (candidate-pool-relative, per PRD's dual-perspective scoring)
  - **"WHY" checklist** — short reasons derived from top-contributing criteria (e.g., `✓ Strong Meta Fit`, `✓ Highly Consistent`, `✓ Fits Initiator Role`) — generated from which criteria scored highest for this player under the active weight profile, not a separate AI/LLM call. 🔶 *Assumption: "WHY" checklist is deterministic (rule-based from criteria scores), not an LLM-generated explanation — flag if an actual generative explanation layer is wanted instead.*
  - **Confidence indicator** — 🔶 *Open Question: PRD does not currently define a formal "confidence" metric. Proposed default: derive from `sample_size` adequacy + how many criteria had valid (non-null) scores for this player, expressed as a percentage. Needs explicit confirmation before implementation.*
  - Action: `[Run Simulation]` → sends this player into Team Simulation as the candidate; `[View Profile]` → `/app/players/:playerId`.
- Excluded players accessible via an expandable "X players excluded" section, each with an `exclusion-reason-tooltip`-style inline reason (per PRD's transparency requirement — never silently hidden).

**Data sources:** `player_criteria_scores`, `smart_weight_profiles`, `smart_weight_values`, `smart_filter_criteria`, `search_query_filters`, `player_smart_results` (mode=selection, computed on demand, not long-cached per ERD notes).

---

### 4.7 `/app/simulation` — Team Simulation
*(design.md Key Experience #3)*

**Flow:**
1. **Select current roster** — pick a team (from `/app/teams`) or build a custom 5-player set.
2. **Swap** — drag a candidate (own search, or arrived via `[Run Simulation]` from Recommendation Results) into one roster slot.
3. **Animated delta view** — before/after Team Fit Score and relevant stat deltas, shown with color-coded up/down deltas (green improvement / red decline) and number-morph animation (per design.md Motion System — "Score morphing, ticking up/down").
4. **Insight text** — short generated summary of the change (e.g., "Agent pool overlap increased for Controller role, but Consistency Index dropped slightly"). 🔶 *Assumption: rule-based summary from the same criteria deltas, not an LLM call — consistent with the Recommendation "WHY" checklist approach above, for cost/complexity reasons at MVP stage.*

**Persistence:** 🔶 *Open Question: PRD does not specify whether simulations should be saved/shareable. Default assumption for Phase 1: **ephemeral/session-only** — no `roster_simulations` table in the current ERD. If persistence is wanted (e.g., "save this simulation to compare later"), this needs a new table and should be scoped explicitly before backend work starts.*

**Components:** `player-card` (draggable), `kpi-stat-card` (delta variant), `floating-cta` ("Run Simulation" trigger).

---

### 4.8 `/app/meta` — Patch & Meta Explorer

**Purpose:** Read-only, user-facing view of the same curated data admins maintain (per PRD's Admin Curation Panel) — lets coaches/fans see *why* the system rates agents/players the way it does, supporting the "transparent, not black-box" positioning from the PRD's Executive Summary.

**Layout:**
- Patch timeline selector (horizontal scroller of `patches`, current one highlighted).
- Agent tier board per role, per map — pulls `agent_map_ratings` (with `confidence_level` shown as a small label: "Confirmed" vs. "Early/Speculative").
- Cross-reference strip: "Fastest Adapters This Patch" — mini leaderboard of players ranked by Meta Conformity/Meta Innovation score.

**Data sources:** `patches`, `agent_patch_ratings`, `agent_map_ratings`, `agent_pick_rate_snapshots`, `player_criteria_scores` (Meta Conformity/Innovation criteria).

---

### 4.9 `/app/profiles` — My Weight Profiles

**Purpose:** Standalone management view for saved `smart_weight_profiles`, separate from the in-flow builder in `/app/recommend/weights` (a profile is reusable across many searches, per PRD).

**Layout:** List of profile cards — name, mini ranked-criteria preview (top 3 criteria shown as small labeled chips), created date. Actions: Edit (reopens the drag-rank builder), Duplicate, Delete.

**Data sources:** `smart_weight_profiles`, `smart_weight_values`.

---

### 4.10 `/app/account` — Account Settings

**Purpose:** Standard account management — email/password, and (per PRD's confirmed requirement that all visitors must have an account) a summary of the user's activity: number of saved profiles, recent searches.

**Out of scope per PRD Section 8:** no social/sharing settings for weight profiles in Phase 1 (`is_public` toggle exists in the schema for future use but has no UI here yet).

---

## 5. Cross-Cutting States (apply to every screen above)

| State | Treatment |
|---|---|
| **Loading** | Skeleton loaders matching the final layout shape — never a spinner (explicit design.md rule, especially relevant given the hourly scrape/recompute cycle). |
| **Empty** | Illustrated + one clear next action (e.g., no search results → "Try loosening a filter"; no saved profiles → "Build your first profile"). |
| **Low sample size** | Inline warning banner wherever a 20-match-minimum-gated stat would otherwise mislead (Player Profile Consistency chart, Leaderboard rows, Recommendation Results). |
| **Stale data** | Small metadata chip showing last successful scrape timestamp, visible near any data-heavy view — ties to PRD's scraper-reliability transparency goal. |
| **Error** | Toast (per design.md `toast` component) for transient errors; full-page error state only for broken routes (e.g., invalid `:playerId`). |

---

## 6. Open Questions / Assumptions Introduced in This Document

- 🔵 **Confidence indicator** on Recommendation Result cards — no formal definition exists yet in the PRD; a default (sample-size + criteria-completeness based) is proposed above but needs sign-off.
- 🔵 **"WHY" checklist and Simulation insight text** — assumed to be rule-based/deterministic (derived from criteria scores), not LLM-generated. If generative explanations are desired instead, this changes both the tech stack (would need an LLM API call) and the design.md motion/loading treatment for that moment.
- 🔵 **Team Simulation persistence** — assumed ephemeral/session-only for Phase 1; flag if save/share is actually wanted, since it requires a new schema table not currently in the ERD.
- 🔵 Whether `/app/players` (explorer) and `/app/leaderboard` are redundant enough to merge into one screen with a view toggle (grid vs. table) — kept separate here since they serve slightly different intents (casual browse vs. structured ranking), but worth revisiting once wireframes are in front of real users.