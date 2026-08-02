# Trickster

**Trickster** isn't just another stats tracker. It’s an elite, data-driven Valorant talent decision-support platform built for scouts, analysts, and roster builders who refuse to rely on subjective opinions.

We pair a **bold, unapologetic brutalist/editorial aesthetic** with a highly structured, mathematically rigorous product system. From fluid Emil-Kowalski-inspired micro-interactions to complex statistical algorithms running under the hood, Trickster is built to feel premium, responsive, and incredibly exact.

## What's New
We recently rolled out a massive overhaul to both our aesthetic and underlying engine:
- **Editorial & Brutalist UI Overhaul**: We shed the generic "AI startup" look for a striking, magazine-style brutalist design.
- **Premium Micro-interactions**: Animations are now powered by Framer Motion using meticulously tuned cubic-bezier curves for that "Emil" feel, combined with seamless Lenis smooth scrolling.
- **Smarter Dashboard API**: The Consistency Tracker and Meta Shift algorithms now run leaner. We've separated global caching from user-specific telemetry so your favorite players sync perfectly in real-time.
- **Bloat Removal**: We stripped out unused testing boilerplate to keep our monorepo incredibly clean and fast to deploy.

## Core Features
- **Automated Telemetry (VLR.gg Scraper)**: Automatically ingest and normalize raw match histories against opponent strength, map biases, and patch metas.
- **SMART Engine**: A multi-criteria, weighted evaluation algorithm mapping ACS, KAST, ADR, and role efficiency to give you a single "Fit" score.
- **Transfer Simulation (The Lab)**: Drag and drop players into your roster slots. Instantly see statistical deltas and how a new signing changes your team's projected performance.
- **Meta Explorer**: Track shifting S-Tier and A-Tier agents across patches and maps to adjust your scouting weightings before the meta leaves you behind.

## Architecture
Built as a highly decoupled split-monolith:
- **Backend (`/backend`)**: **Laravel 11+** handles the heavy lifting—RESTful APIs, asynchronous scraping queues, and robust database caching.
- **Frontend (`/frontend`)**: **React 18 + Vite + Tailwind CSS v4** delivers a blazing-fast, strictly-typed client experience.

### Our 3-Layer Design Philosophy
1. **Marketing Layer**: High-contrast brutalism, bold typography, unapologetic borders, and dynamic motion.
2. **Product Layer**: Vercel-inspired data density. Clean canvas, strictly aligned `tabular-nums`, and pure readability.
3. **Admin Layer**: Pure utility. Zero decoration. Built solely for speed and curating data fast.

## Quick Start

### Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan queue:work # Run the background scraper
php artisan serve
```

### Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Core**: Laravel 11, React 18
- **Styling**: Tailwind CSS v4
- **Motion**: Framer Motion, Lenis (Smooth Scroll)
- **Database**: SQLite / MySQL

## License
MIT
