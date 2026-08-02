# Trickster

**Trickster** is a Valorant talent decision-support platform for scouts, analysts, and roster builders who don't want to rely on subjective opinions.

The design pairs a stark brutalist/editorial look with a rigorous, math-heavy product underneath. Emil-Kowalski-style micro-interactions run the interface; underneath, statistical models do the actual analysis.

## What's new

We overhauled the look and the engine underneath it.

- **Editorial & brutalist UI overhaul**: Moved off the generic "AI startup" template to a magazine-style brutalist design.
- **Micro-interactions**: Framer Motion now drives the animations, with hand-tuned cubic-bezier curves for the "Emil" feel, plus Lenis for smooth scrolling.
- **Leaner dashboard API**: The Consistency Tracker and Meta Shift algorithms now run leaner. Global caching is separate from user-specific telemetry now, so tracked players update in real time instead of waiting on a shared cache.
- **Removed unused boilerplate**: Cut unused testing scaffolding to keep the monorepo smaller and faster to deploy.

## Core features

- **Automated telemetry (VLR.gg scraper)**: Pulls and normalizes match histories automatically, weighted for opponent strength, map bias, and patch changes.
- **SMART Engine**: A multi-criteria, weighted evaluation that maps ACS, KAST, ADR, and role efficiency to a single Fit score.
- **Transfer simulation (The Lab)**: Drag players into roster slots and see the statistical deltas, including how a new signing changes your team's projected performance.
- **Meta Explorer**: Tracks S-Tier and A-Tier agents across patches and maps, so you can adjust scouting weights as the meta shifts.

## Architecture

Built as a split monolith with a clear frontend/backend separation:

- **Backend (`/backend`)**: Laravel 11+ handles REST APIs, async scraping queues, and database caching.
- **Frontend (`/frontend`)**: React 18, Vite, and Tailwind CSS v4, built to be fast and strictly typed.

### Our 3-layer design philosophy

1. **Marketing layer**: High-contrast brutalism, bold typography, thick borders, and constant motion.
2. **Product layer**: Vercel-inspired data density. Clean canvas, aligned `tabular-nums`, readability first.
3. **Admin layer**: Pure utility, no decoration, built for speed and fast data entry.

## Quick start

### Backend (Laravel)
\```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan queue:work # Run the background scraper
php artisan serve
\```

### Frontend (React / Vite)
\```bash
cd frontend
npm install
npm run dev
\```

## Tech stack

- **Core**: Laravel 11, React 18
- **Styling**: Tailwind CSS v4
- **Motion**: Framer Motion, Lenis (smooth scroll)
- **Database**: Supabase/PostGRESSQL
