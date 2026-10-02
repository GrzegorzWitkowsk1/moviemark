# Project instructions

This is a Turborepo monorepo.

## Package manager

Use Bun only.
Do not use npm or yarn.

## Structure

apps/web:
- React
- Vite
- TypeScript

apps/api:
- Fastify
- MongoDB
- Mongoose

packages/shared:
- Shared TypeScript types

## Rules

- Always use TypeScript.
- Prefer existing patterns over introducing new libraries.
- Reuse types from packages/shared.
- Keep frontend and backend contracts synchronized.
- Do not modify unrelated files.
- Explain changes before applying them.
- Create TODO list for every job.

## Verification workflow

Turbo caches `build`, `lint` and `check-types` but not `test`, and the web unit
suite is the slowest check in the repo, so avoid running it on every edit.

While implementing:

```sh
bun run check-types                        # both workspaces, usually cached
bun run lint
cd apps/web && bun run test -- src/path/to/file.test.tsx   # only the touched specs
cd apps/api && bun test --preload ./tests/preload.ts tests/<file>.test.ts
```

Once, before declaring the job done:

```sh
bun run lint
bun run check-types
bun run check:translations
bun run test          # api + web
cd apps/web && bun run test:e2e
```

Environment notes for a fresh checkout or machine:

- API tests use `mongodb-binaries`, which downloads `mongod` on first run. That
  download can outrun Bun's 5s test hook timeout and kill the run; warm it up
  first with a single small API test before running the full suite.
- E2E needs MongoDB: run `docker compose up -d` first.
- `apps/web/playwright.config.ts` sets `reuseExistingServer: true`, so a dev
  server already listening on `:3000` is reused and its old environment wins.
  Kill stale listeners before `test:e2e`, otherwise changed env values (e.g.
  `GUEST_RATE_LIMIT_MAX`) silently do not apply and tests fail with confusing
  timeouts:

  ```sh
  netstat -ano | grep LISTENING | grep -E ":3000|:5173" | awk '{print $5}' | sort -u |
    while read pid; do taskkill //PID $pid //F; done
  ```
- The repo is not Prettier-clean, so `bunx prettier --check` flags many untouched
  files (on Windows mostly CRLF vs prettier's LF, plus web sources mixing single
  and double quotes). Treat `bun run lint` as the gate; if you do run Prettier,
  limit it to the files you changed and diff against `HEAD` to avoid unrelated
  reformatting.
