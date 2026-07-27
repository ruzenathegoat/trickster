# Trickster

**Trickster** is a Valorant talent decision-support platform. It features a bold, playful neobrutalist marketing layer combined with a highly structured, data-dense product and admin system.

## 🌟 Features
- **Automated VLR.gg Scraping:** Keep up with the latest player stats effortlessly.
- **SMART Scoring Model:** Multi-criteria, weighted evaluation of players (ACS, KAST, ADR).
- **Team Simulations:** Swap players in and out of rosters and instantly see projected statistical deltas.
- **Role & Meta Analysis:** Track changes across patches (e.g. Patch 9.08) and adjust talent scouting weights accordingly.

## 🏗 Architecture
The project is built as a split monolith/monorepo:
- `/backend`: **Laravel 11+** providing the API, Jobs, and Database interaction.
- `/frontend`: **React 18 + Vite + Tailwind CSS v4** providing the client application.

### Design System (3-Layer Architecture)
- **Layer 1 (Marketing):** Playful neobrutalism, 100% bold aesthetic, cut corners, and dynamic motion.
- **Layer 2 (Product):** Minimalist, Vercel-inspired data density. Clean `#fafafa` canvas, tabular-nums for strict data alignment.
- **Layer 3 (Admin):** Pure utility and speed. Zero decoration. Focus purely on curating and manipulating data quickly.

## 🚀 Quick Start

### Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```

## 🛠 Tech Stack
- Laravel
- React
- TailwindCSS v4
- GSAP / Framer Motion
- SQLite / MySQL

## 📄 License
MIT
