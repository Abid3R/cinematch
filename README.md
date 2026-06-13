# CineMatch

> Discover movies that match your taste.

CineMatch is a production-ready movie discovery and recommendation platform built on the TMDB catalog. It learns your taste from a four-step onboarding flow plus the likes, ratings, and watchlist signals you generate while browsing, then surfaces personalized picks with a transparent reason for every recommendation.

---

## Features

- **TMDB-powered discovery** — trending, popular, top-rated, now-playing, upcoming, and genre/year/rating filtered feeds with infinite scroll.
- **Hybrid content-based recommendations** — weighted scoring across genre fit, cast overlap, director affinity, keyword similarity, and popularity. Every pick ships with a human-readable reason.
- **Hidden gems** — high-rating, low-popularity surfacing so you find titles the algorithm circuit normally buries.
- **Taste-profile onboarding** — pick favorite genres, actors, directors, and seed movies. Persisted on-device, no account required.
- **Movie details** — full cast, crew, trailer modal, runtime, ratings, reviews, and similar/recommended picks.
- **Watchlist + likes + ratings** — Zustand stores with `localStorage` persistence under the `cinematch:` namespace.
- **Analytics** — Recharts visualizations of your taste profile (genre breakdown, decade distribution, rating history).
- **Cinematic UI** — Tailwind 3.4, Framer Motion choreography, glassmorphism surfaces, brand color `#ff2d55` on a near-black canvas.
- **SEO-ready** — per-route metadata, dynamic OG cards for movie pages, `robots.ts`, `sitemap.ts`, and a PWA `manifest.ts`.

---

## Tech stack

| Layer            | Library                          |
| ---------------- | -------------------------------- |
| Framework        | Next.js 15 (App Router)          |
| UI               | React 19 RC, TypeScript (strict) |
| Styling          | Tailwind CSS 3.4                 |
| Animation        | Framer Motion 11                 |
| State (client)   | Zustand 5 (persist middleware)   |
| Data fetching    | TanStack Query 5.59              |
| Charts           | Recharts 2.13                    |
| Icons            | lucide-react                     |
| Catalog          | The Movie Database (TMDB) v3     |
| Lint / typecheck | ESLint 9, TypeScript 5.6         |

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A TMDB **API Read Access Token** (v4 auth). Get one free at <https://www.themoviedb.org/settings/api>.

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```bash
# Required — TMDB v4 read access token (Bearer)
NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN=your_token_here

# Optional — used for canonical URLs, OG card URLs, sitemap, robots
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

### 4. Run

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint
npm run type-check   # tsc --noEmit
```

---

## Project layout

```
src/
├── app/                    # Next.js App Router routes
│   ├── page.tsx            # Home — hero, trending rails, taste teaser
│   ├── discover/           # Filterable catalog
│   ├── movie/[id]/         # Movie details (client) + metadata layout
│   ├── recommendations/    # Personalized picks (noindex)
│   ├── onboarding/         # 4-step taste profile builder
│   ├── robots.ts           # Crawler directives
│   ├── sitemap.ts          # Static public-route sitemap
│   └── manifest.ts         # PWA manifest
├── components/
│   ├── ui/                 # Primitives (Button, Card, Modal, Skeleton, …)
│   ├── movie/              # Movie card, grid, hero, cast, trailer modal
│   ├── recommendations/    # Pick card, reason badge, score bar
│   ├── analytics/          # Recharts visualizations
│   └── layout/             # Navbar, footer, container
├── services/
│   ├── tmdb/               # TMDB v3 client (movies, search, genres, person)
│   └── recommendation/     # Scoring engine + weights
├── store/                  # Zustand stores (watchlist, likes, ratings, onboarding)
├── hooks/                  # React Query hooks per resource
├── providers/              # QueryClient + theme providers
├── constants/              # Site metadata, recommendation weights, TMDB enums
├── types/                  # TMDB + domain types
└── utils/                  # Image URLs, formatting, classnames
```

---

## Recommendation engine

CineMatch ships a hybrid content-based recommender. Candidate movies are scored against your taste profile across five components, weighted to sum to 1.0:

| Component           | Weight |
| ------------------- | -----: |
| Genre fit           |   0.40 |
| Actor overlap       |   0.20 |
| Director affinity   |   0.15 |
| Keyword similarity  |   0.15 |
| Popularity / rating |   0.10 |

Weights live in `src/services/recommendation/weights.ts`. Each pick is shipped with the dominant component(s) as a human-readable reason ("Because you love *Denis Villeneuve* + *sci-fi*"). Already-rated, already-liked, and watchlisted titles are excluded from the candidate pool.

Taste signals consumed:

- Onboarding picks (genres, actors, directors, seed movies)
- Likes / dislikes (binary)
- Ratings (1–10)
- Watchlist (positive weak signal)

All signals are persisted client-side in `localStorage` under the `cinematch:` namespace — no server, no account.

---

## SEO & sharing

- **Per-route metadata** via App Router `layout.tsx` files (page components are client components for motion / store wiring).
- **Dynamic OG cards** for `/movie/[id]` via `generateMetadata` — fetches the same `MovieDetails` payload the page hydrates from cache, so it costs nothing extra.
- **`/recommendations`** is `noindex, follow` — personalized output has no value for crawlers.
- **`robots.ts`** disallows `/recommendations` and `/api/`.
- **`sitemap.ts`** lists `/`, `/discover`, `/onboarding`.
- **`manifest.ts`** delivers a standalone PWA shell with brand color `#0a0a0f`.

---

## Deployment

Vercel is the recommended host (zero-config for Next.js 15 App Router). Required env vars on the deployment:

- `NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN` — TMDB v4 read token
- `NEXT_PUBLIC_SITE_URL` — production origin (used by sitemap, robots, canonical, OG)

Build command: `npm run build`. Output: `.next` (default).

---

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie metadata, posters, and backdrops © The Movie Database (TMDB).
