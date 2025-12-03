# Copilot / AI Agent Instructions — TimeIsTicking_newVersion

Quick orientation for an AI coding agent working in this repository. Focus on discoverable, actionable patterns and commands that make you productive immediately.

## Big picture
- Frontend: `timeticking/frontend` — Next.js (app directory), React + TypeScript. UI calls backend APIs; `components/calendar/api.ts` shows client usage and `NEXT_PUBLIC_API_URL` override.
- Backend: `timeticking/backend` — Express + TypeScript (ESM). Server entry: `server.ts` loads `src/app.ts` and uses `dotenv`. Backend exposes JSON REST APIs under `/api/*` (see `src/app.ts`).
- Shared: `timeticking/shared` contains cross-cutting `types.ts` used by both sides.

Key runtime facts: backend listens on port `4000` by default (`server.ts`). Frontend expects backend at `http://localhost:4000` unless `NEXT_PUBLIC_API_URL` is set.

## How code is organized (patterns you should follow)
- Controllers: `timeticking/backend/src/controllers/*Controller.ts` export handler functions that operate on `Request, Response`. Example: `calendarController.ts` defines parsing/import logic and an in-memory `eventStore` (NOT persisted).
- Routes: `timeticking/backend/src/routes/*Routes.ts` import controller functions and export a router. These are mounted in `src/app.ts` with `app.use('/api/...', ...)`.
- Middleware: place shared middleware in `timeticking/backend/src/middleware` (see `errorHandler.ts`). Middleware uses the Express `(err, req, res, next)` signature.
- Config: `timeticking/backend/src/config` for infra stuff (DB connector `db.ts` exists but currently empty). Use `dotenv` in `server.ts` for env vars.
- Frontend API helpers: `timeticking/frontend/components/calendar/api.ts` — uses `fetch` to call backend. Mirror backend endpoints and payload shapes when changing routes.

## Important implementation notes & caveats
- The backend currently stores calendar events in-memory (`eventStore` in `calendarController.ts`). Adding/removing events affects only the running process — there's no persistence yet.
- Backend TypeScript files import `.js` extensions (e.g. `import app from './src/app.js'`) because project runs using `tsx` and `type: module` in `package.json`. Respect ESM import patterns when editing.
- The backend may use `fetch` in server-side code (`calendarController.ts`); this requires a Node runtime with built-in `fetch` (Node 18+). Keep this in mind when running/tests in older containers.
- ICS parsing uses `node-ical` and may expand recurring events into multiple instances (see `parseIcsText`). Be careful when modifying recurrence logic.

## Common tasks & exact commands
- Start backend dev (hot-reload):
  - `cd timeticking/backend && npm install && npm run dev`  # runs `tsx watch server.ts`
- Build backend for production:
  - `cd timeticking/backend && npm run build && npm start`  # compiles with `tsc -p .` then `node dist/server.js`
- Start frontend dev:
  - `cd timeticking/frontend && npm install && npm run dev`  # Next.js dev server (default port 3000)
- Lint/build frontend:
  - `cd timeticking/frontend && npm run build` (Next build)

If you need to run both locally for development, start backend on `4000` and frontend on `3000`. The frontend will call `http://localhost:4000` unless `NEXT_PUBLIC_API_URL` is set.

## How to add or change an API route (follow this pattern)
1. Add or update handler(s) in `timeticking/backend/src/controllers/<name>Controller.ts` exporting functions that accept `(req, res)`.
2. Create or update `timeticking/backend/src/routes/<name>Routes.ts` to import handlers and register endpoints on a `Router()`.
3. Mount the router in `timeticking/backend/src/app.ts` (example: `app.use('/api/calendar', calendarRoutes)`).
4. Update `timeticking/frontend/components/*/api.ts` (or create one) to call the new endpoint; prefer reusing `fetchEvents`/`request` helper pattern.

## Files to inspect for examples
- Backend entry: `timeticking/backend/server.ts`
- Backend app & routes: `timeticking/backend/src/app.ts`, `timeticking/backend/src/routes/*Routes.ts`
- Calendar example (parsing, imports, in-memory store): `timeticking/backend/src/controllers/calendarController.ts`
- Middleware example: `timeticking/backend/src/middleware/errorHandler.ts`
- Frontend API wiring: `timeticking/frontend/components/calendar/api.ts`

## When you modify code, keep these constraints in mind
- Preserve ESM patterns and `.js` extensions in TypeScript imports.
- Avoid relying on persistence for calendar data — tests or dev runs will lose data on restart.
- If you change public API paths or payload shapes, update frontend API helpers in `timeticking/frontend/components/*/api.ts` and any components that consume them (calendar components under `components/calendar`).

## Minimal PR checklist for code changes
- Update or add route/controller tests (none exist now — describe expected behavior in PR).
- If API shape changes, update `components/*/api.ts` and `shared/types.ts` where appropriate.
- Ensure `npm run dev` still works for both `backend` and `frontend`.

---
If any of the above is unclear or you want additional examples (e.g., a concrete PR example, sample request/response payloads, or a minimal integration test harness), tell me which area and I'll expand this file accordingly.
