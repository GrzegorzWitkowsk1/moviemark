# MovieMark

MovieMark is a personal movie and TV series tracking web app. It lets you browse content from TMDB, mark films and shows as watched, keep a "want to watch" list, and track your episodes season by season — all in a fast, modern, fully internationalized interface.

Built as a **Turborepo monorepo** and managed with **Bun**.

## Screenshots

| Home | Search |
| --- | --- |
| ![Home](docs/screenshots/home.png) | ![Search](docs/screenshots/search.png) |

| Collection | Settings | Dark mode |
| --- | --- | --- |
| ![Collection](docs/screenshots/collection.png) | ![Settings](docs/screenshots/settings.png) | ![Dark mode](docs/screenshots/dark-mode.png) |

## Project

- **Account system** — register, log in, and manage your profile and password using JWT authentication (access token in memory + httpOnly refresh cookie, with "remember me" support).
- **Browse & search** — pull new releases, upcoming movies, and trending titles from TMDB, and search across films and series with debounced live results.
- **Watched tracking** — mark movies as watched (grouped by month, sortable by recency/rating/alphabet), and track TV series episode by episode across seasons.
- **Want to watch** — build a dedicated list of movies and series you plan to watch later.
- **Custom entries** — add your own titles when something isn't found in TMDB (stored with negative custom IDs).
- **Settings** — switch between light/dark/system themes, change your language (English / Polish), update your details, and change your password.
- **i18n** — fully localized in English (UK) and Polish.

## Architecture

A Turborepo monorepo with three kinds of workspaces. The React SPA talks to a Fastify API over HTTP; the API owns the database and proxies TMDB so the TMDB token never touches the browser. Both apps share their request/response contracts from a single `packages/shared` source.

```mermaid
graph LR
    subgraph Turborepo["Turborepo monorepo (Bun)"]
        subgraph web["apps/web"]
            React["Vite + React 19"]
        end
        subgraph api["apps/api"]
            Fastify["Fastify 5"]
        end
        subgraph shared["packages/shared"]
            Types["Shared TypeScript types"]
        end
    end

    React -- "HTTP / fetch" --> Fastify
    Fastify -- "Mongoose" --> MongoDB[("MongoDB 7")]
    Fastify -- "Proxy (server-side token)" --> TMDB[("TMDB API")]
    React -. "contract types" .-> Types
    Fastify -. "contract types" .-> Types
```

Key points:

- **`apps/web`** is a single-page app. It sends `fetch` requests to the API with a `Bearer` access token and auto-refreshes on expiry.
- **`apps/api`** exposes REST routes grouped by domain (auth, collection, future, custom, tmdb). It is the **only** component that reaches TMDB or MongoDB.
- **`packages/shared`** holds the shared request/response types so the frontend and backend stay in sync.
- The API applies security hardening: Helmet headers, CORS restricted to the web origin, per-route rate limiting, and passwords hashed with bcrypt.

### Architectural Decisions

| Technology | Why? |
|------------|------|
| Turborepo | Monorepo structure and shared code |
| TanStack Query | Server-state management and caching |
| Fastify | Lightweight, TypeScript-friendly backend |
| JWT + HttpOnly refresh cookie | Stateless authentication with protected refresh tokens |
| MongoDB | Flexible document-oriented data model |
| Shared package | Shared TypeScript contracts between frontend and backend |

### Authentication

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as apps/web
    participant A as apps/api
    participant M as MongoDB

    U->>W: Register (name, surname, email, password)
    W->>A: POST /auth/register
    A->>M: Create user (bcrypt hash)
    A-->>W: 201 Created
    Note over W,A: No tokens issued on registration

    U->>W: Login (email, password, remember)
    W->>A: POST /auth/login
    A->>M: Find user + verify password
    A-->>W: 200 { user, accessToken }
    Note over W: accessToken -> in-memory<br/>refreshToken -> httpOnly cookie

    U->>W: Authenticated action
    W->>A: GET /resource (Authorization: Bearer)
    A-->>W: 401 Unauthorized
    W->>A: POST /auth/refresh (cookie sent automatically)
    A-->>W: 200 { accessToken }
    W->>A: GET /resource (new Bearer token)
    A-->>W: 200 OK
    Note over W,A: Refresh is deduplicated for concurrent 401s

    U->>W: Logout
    W->>A: POST /auth/logout
    A-->>W: Clear refresh cookie
    Note over W: Clear access token from memory
```

> The access token lives only in memory and is lost on reload. The first request after a reload gets a 401, which triggers a transparent refresh from the httpOnly cookie so the session resumes automatically.

## Tech stack

| Category | Technology |
| --- | --- |
| Monorepo | Turborepo, workspace packages |
| Language | TypeScript 6 |
| Package manager | Bun |
| Frontend | React 19 · Vite 8 · MUI 9 · TanStack Query · react-router 7 · react-hook-form + Zod · lucide-react |
| Backend | Fastify 5 · Mongoose 8 · MongoDB 7 |
| Auth | JWT (`@fastify/jwt`) · bcrypt · httpOnly cookies (`@fastify/cookie`) |
| API proxy | TMDB via `apps/api` (`@fastify/cors`, rate-limit, Helmet) |
| i18n | i18next · react-i18next (en-GB, pl-PL) |
| Tooling | ESLint · Prettier · shared TS configs |

## Tests

Testing is split across the two apps and runs through the root script.

- **Frontend unit/component (`apps/web`)** — **Vitest** + **Testing Library** in jsdom, with **MSW** mocking the API and TMDB. Tests are colocated with source as `.test.ts(x)` files and cover hooks, components, pages, forms/schemas, API/token/tmdb utilities, and full unauthorized flows.
- **Backend (`apps/api`)** — **`bun:test`** integration tests that spin up the Fastify app with an **in-memory MongoDB** (`mongodb-memory-server`) and exercise real request/response cycles via `app.inject()`. Covers auth, collections, future/watch-later, custom entries, and the TMDB proxy.
- **Frontend e2e (`apps/web`)** — **Playwright** end-to-end tests in `apps/web/tests/e2e`, driving a real Chromium browser against the **actual API and MongoDB** (Playwright's `webServer` starts both dev servers automatically). TMDB responses are mocked at the browser level with `page.route()`, so the suite runs offline and deterministically on top of real auth and database flows. Coverage includes register/login, session persistence and token refresh, search (results, detail navigation, no-results), collection add/remove, custom movie creation with negative IDs, user data isolation between accounts, protected-route redirects, and logout.

```sh
# Run all unit/integration tests across workspaces
bun run test

# Run a single workspace
bun exec turbo test --filter=web

# Run e2e tests (requires a running MongoDB, e.g. `docker compose up -d`;
# first-time setup: `cd apps/web && bunx playwright install chromium`)
cd apps/web && bun run test:e2e
```

## Running

1. Install dependencies:

   ```sh
   bun install
   ```

2. Start MongoDB (MongoDB 7 on port `27017`):

   ```sh
   docker compose up -d
   ```

3. Configure the environment files (copy from the provided examples):

   ```sh
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   Set `MONGO_URI` (and `JWT_SECRET`) in `apps/api/.env`:

   ```
   MONGO_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
   JWT_SECRET=some-long-random-secret
   ```

4. Run all apps in dev mode:

   ```sh
   bun run dev
   ```

   Or a single workspace:

   ```sh
   bun exec turbo dev --filter=web
   ```

5. Open the web app at `http://localhost:5173`.

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Run all dev servers |
| `bun run build` | Build all workspaces |
| `bun run lint` | Lint all workspaces |
| `bun run check-types` | Type-check all workspaces |
| `bun run test` | Run all unit/integration tests |
| `bun run test:e2e` | Run Playwright e2e tests (`apps/web`) |
| `bun run format` | Format with Prettier |
| `bun run check:translations` | Validate en/pl translation key parity |

### Runtimes

- Web dev server: `http://localhost:5173`
- API server: `http://localhost:3000`
- MongoDB: `localhost:27017`

## Deployment

The web app is deployed to Cloudflare Pages and the API runs separately (e.g. on Render), so `moviemark.pages.dev` and the API host are **different origins**. Cross-origin sessions rely on the refresh cookie, which the API sends with:

- `SameSite=None; Secure` when `NODE_ENV=production`,
- `SameSite=Lax` otherwise (sufficient when API and web share a site, e.g. localhost).

Required environment variables on the deployed API:

```sh
NODE_ENV=production
MONGO_URI=mongodb://admin:password@db-host:27017/moviemark?authSource=admin
CORS_ORIGIN=https://<exact web host, no trailing slash>  # e.g. https://moviemark.pages.dev
JWT_SECRET=<long random secret>
TMDB_TOKEN=<your TMDB api token>
```

Production web builds must point the API base at the deployed host, not localhost:

```sh
VITE_API_BASE=https://<your-render-host>
```

> The `/auth/refresh` endpoint rejects requests whose `Origin` header doesn't match `CORS_ORIGIN`, so other sites can't replay refresh cookies cross-site.

## Live demo

🔗 **Live demo:** https://moviemark.grzegorz-witkowski.workers.dev
