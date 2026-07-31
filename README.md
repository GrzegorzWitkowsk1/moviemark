# MovieMark

A movie-marking web app built as a Turborepo monorepo, managed with Bun.

## Structure

| Workspace | Description |
| --- | --- |
| `apps/web` | React 19 + Vite 8 + TypeScript SPA |
| `apps/api` | Fastify 5 + Mongoose 8 (MongoDB) API, runs on Bun |
| `packages/shared` | Shared TypeScript types |
| `packages/ui` | React component library (`Button`, `Card`, `Code`) |
| `packages/eslint-config` | Shared ESLint configurations |
| `packages/typescript-config` | Shared TypeScript configurations |

## Getting started

1. Install dependencies:

   ```sh
   bun install
   ```

2. Start MongoDB (MongoDB 7 on port `27017`):

   ```sh
   docker compose up -d
   ```

3. Configure the API connection string in `apps/api/.env`:

   ```
   MONGO_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin
   ```

4. Run all apps in dev mode:

   ```sh
   bun run dev
   ```

   Or a single workspace:

   ```sh
   bun exec turbo dev --filter=web
   ```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Run all dev servers |
| `bun run build` | Build all workspaces |
| `bun run lint` | Lint all workspaces |
| `bun run check-types` | Type-check all workspaces |
| `bun run format` | Format with Prettier |

## Runtime

- Web dev server: `http://localhost:5173` (CORS origin for the API)
- API server: `http://localhost:3000`
- MongoDB: `localhost:27017`
