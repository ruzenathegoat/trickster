# Trickster — Valorant Talent Decision-Support Platform

<div align="center">

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v13-EA4C89?style=flat&logo=framer&logoColor=white)](https://motion.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Discord](https://img.shields.io/badge/Discord-Alerts-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.com/)

**Data-driven Valorant talent decision-support platform for scouts, analysts, and roster builders who don't want to rely on subjective opinions.**

[Platform Architecture](#key-features--interactive-systems) · [Design System](#design-philosophy--aesthetic-foundation) · [Testing Platform](#6-automated-e2e-qa--testing-dashboard-testing-dashboard) · [Getting Started](#getting-started)

</div>

---

## Overview

**Trickster** is a rigorous, math-heavy product wrapped in a high-contrast editorial and brutalist aesthetic. The platform leverages Emil-Kowalski-style micro-interactions to run the interface while statistical models perform deep talent analysis in the background.

- **Frontend**: A fast, strictly typed React 18 SPA powered by Vite.
- **Backend**: Laravel 11 handles REST APIs, async scraping queues, and database caching.
- **Testing Engine**: Standalone local Playwright test platform with live visual runner, real-time SSE log streaming, dual Excel/PDF reporting, and Discord webhook alerting.

---

## Key Features & Interactive Systems

### 1. Automated Telemetry (VLR.gg Scraper)
- Pulls and normalizes match histories automatically via async queues.
- Data is dynamically weighted for opponent strength, map bias, and patch changes.

### 2. SMART Engine Evaluation
- A multi-criteria, weighted evaluation algorithm.
- Maps core performance metrics (ACS, KAST, ADR) and role efficiency to a single, actionable **Fit score**.

### 3. Transfer Simulation (The Lab)
- Interactive drag-and-drop player roster slots.
- Real-time statistical deltas to project how a new signing changes your team's overall performance.

### 4. Meta Explorer
- Tracks S-Tier and A-Tier agents across patches and maps.
- Dynamically adjust scouting weights in response to the latest meta shifts.

### 5. High-Performance Dashboard API
- Lean telemetry fetching with separate global caching and user-specific trackers.
- Tracked players update in real time instead of waiting on shared cache invalidation.

### 6. Automated E2E QA & Testing Dashboard (`/testing-dashboard`)
- **Visual Suite Runner**: Real-time test orchestration across 151 test cases categorized by `@auth`, `@admin`, and `@user`.
- **Live Terminal Streaming**: Server-Sent Events (SSE) pipe real-time Playwright terminal logs directly to the brutalist console.
- **SQLite Historical Persistence**: Tracks runs, pass rates, durations, and status chronologically via Node.js native `DatabaseSync`.
- **Dual Enterprise Reporting**:
  - **Excel QA Matrix (`.xlsx`)**: Full traceability matrix with preconditions, expected/actual outputs, and pass metrics.
  - **Printable / PDF QA Sign-off Report**: Clean printable layout with embedded screenshot failure evidence.
- **Documentation Centralized**: `TESTCASES.md` and `PRD_TESTING_PLATFORM.md` located in `testing-dashboard/`.

### 7. Discord QA Sentinel Alert System
- Outbound webhook integration pushing automated alerts directly to Discord channels upon test run completion.
- Dynamic visual embeds: 🟢 Neon Green for 100% passes, 🔴 Neon Red for failures with instant error snippets and failure breakdowns.
- One-click testing trigger badge in the dashboard navigation header.

---

## Design Philosophy & Aesthetic Foundation

Trickster employs a stark 3-layer design philosophy, pairing brutalism with mathematical precision:

- **1. Marketing Layer**: High-contrast brutalism, magazine-style layout, bold typography, thick borders, and constant motion driven by Framer Motion.
- **2. Product Layer**: Vercel-inspired data density. Clean canvas, strictly aligned `tabular-nums`, and uncompromised readability for complex telemetry.
- **3. Admin Layer**: Pure utility and zero decoration, engineered solely for speed and fast data entry.

### Motion & Kinematics
- **Micro-interactions**: Powered by Framer Motion with hand-tuned cubic-bezier curves for a premium physical feel.
- **Smooth Scrolling**: Lenis implemented globally for frictionless vertical navigation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Backend API & Queues** | [Laravel 11](https://laravel.com/) |
| **Bundler & Dev Server** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Motion & Scrolling** | [Framer Motion](https://motion.dev/) + [Lenis](https://github.com/darkroomengineering/lenis) |
| **Database** | [Supabase](https://supabase.com/) / PostgreSQL |
| **End-to-End Testing** | [Playwright](https://playwright.dev/) |
| **Testing Platform** | Node.js, [Express](https://expressjs.com/), SQLite (`node:sqlite`), [ExcelJS](https://github.com/exceljs/exceljs) |
| **Alerts & Integrations** | Discord Webhooks |

---

## Getting Started

Built as a split monolith. You will need to spin up both the backend and frontend.

### Prerequisites
- PHP 8.2+, Composer
- Node.js 20.x+, npm / yarn / pnpm

### Backend (Laravel)

1. **Setup API & Environment**:
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

2. **Database & Migrations**:
   ```bash
   php artisan migrate --seed
   ```

3. **Run Services**:
   ```bash
   php artisan serve
   # In a separate terminal, start the background scraper:
   php artisan queue:work
   ```

### Frontend (React / Vite)

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   # App runs at: http://localhost:5173
   ```

### Testing Platform (Optional)

1. **Start Dashboard Server**:
   ```bash
   cd testing-dashboard
   npm install
   npm run dev
   # Dashboard runs at: http://localhost:3500
   ```

2. **Discord Webhook Configuration** (Optional):
   Create `testing-dashboard/.env` and add:
   ```env
   DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
   ```

---

## 📂 Project Structure

```text
trickster/
├── backend/                    # Laravel 11 REST API & Queues
│   ├── app/
│   │   ├── Console/            # Scraper commands & scheduler
│   │   ├── Http/Controllers/   # API endpoints
│   │   └── Models/             # Database architecture
│   ├── database/               # Migrations & seeders
│   └── routes/                 # api.php (Stateless routes)
├── frontend/                   # React 18 SPA
│   ├── src/
│   │   ├── components/         # Reusable brutalist & product UI
│   │   ├── pages/              # Dashboard, The Lab, Meta Explorer, Admin
│   │   ├── lib/                # Utility functions & API clients
│   │   └── styles/             # Tailwind v4 configuration & tokens
│   ├── package.json
│   └── vite.config.ts
├── e2e/                        # Playwright automated test suites
│   ├── tests/
│   │   ├── auth/               # @auth: Login, Register, Gateways, Route Protection
│   │   ├── admin/              # @admin: Scraper, Ratings, Users, Players
│   │   └── user/               # @user: Dashboard, Players, Teams, The Lab, Meta
│   └── playwright.config.ts
├── testing-dashboard/          # Visual runner, history & reporting platform (:3500)
│   ├── TESTCASES.md            # Complete 151 E2E test cases specification
│   ├── PRD_TESTING_PLATFORM.md # Product Requirement Document for testing engine
│   ├── lib/
│   │   ├── testcase-registry.js# Parser for TESTCASES.md metadata
│   │   ├── report-generator.js # Excel (.xlsx) QA matrix generator
│   │   ├── html-report.js      # Printable / PDF QA sign-off renderer
│   │   └── discord-notify.js   # Discord Incoming Webhook alert dispatcher
│   ├── public/                 # Brutalist dashboard web client
│   └── server.js               # Express + SSE runner server
└── README.md                   # Project documentation
```

---

## 📄 License

Proprietary & Confidential © Trickster. All rights reserved.
