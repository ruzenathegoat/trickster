# Trickster — Valorant Talent Decision-Support Platform

<div align="center">

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v13-EA4C89?style=flat&logo=framer&logoColor=white)](https://motion.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**Data-driven Valorant talent decision-support platform for scouts, analysts, and roster builders who don't want to rely on subjective opinions.**

[Platform Architecture](#key-features--interactive-systems) · [Design System](#design-philosophy--aesthetic-foundation) · [Getting Started](#getting-started)

</div>

---

## Overview

**Trickster** is a rigorous, math-heavy product wrapped in a high-contrast editorial and brutalist aesthetic. The platform leverages Emil-Kowalski-style micro-interactions to run the interface while statistical models perform deep talent analysis in the background.

- **Frontend**: A fast, strictly typed React 18 SPA powered by Vite.
- **Backend**: Laravel 11 handles REST APIs, async scraping queues, and database caching.

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

---

## Getting Started

Built as a split monolith. You will need to spin up both the backend and frontend.

### Prerequisites
- PHP 8.2+, Composer
- Node.js 18.x+, npm / yarn / pnpm

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
│   │   ├── pages/              # Dashboard, The Lab, Meta Explorer
│   │   ├── lib/                # Utility functions & API clients
│   │   └── styles/             # Tailwind v4 configuration & tokens
│   ├── package.json
│   └── vite.config.ts
└── README.md                   # Project documentation
```

---

## 📄 License

Proprietary & Confidential © Trickster. All rights reserved.
