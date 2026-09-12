# PrintLib — 3D Printer Model Library

A personal, self-hosted library for 3D printer model files: search, browse, categorize,
group multi-file models, keep print notes/photos, and (eventually) send jobs straight
to a printer.

## Status (2026-09-12)

Phase 1 MVP is implemented and running: upload (single file or zip, auto-grouped),
library search/filter, categories + tags, an in-browser STL viewer, and print logs
with notes + a photo. Deployed as the `printlib` container in `~/dev/home_nginx`,
reachable at `http://printlib.jonesie.home` (LAN-only, added to `/etc/hosts`).
Not yet done from Phase 1: FTS5-based search (currently simple `LIKE` matching,
fine at personal-library scale) and 3MF/OBJ preview (STL only for now).

## Goals

- Upload models as a single file (`.stl`, `.3mf`, `.obj`, `.gcode`, ...) or as a `.zip`
  containing several related files, and have them grouped as one "Model".
- Browse/search the library by name, tag, category, and file type.
- View models in-browser (3D preview) without downloading first.
- Record notes and a photo against a model when a print succeeds (or fails), building
  a print history over time.
- Import models found on sites like Printables, Thingiverse, MyMiniFactory directly
  into the library.
- Send a model to a printer to print, eventually.
- Usable as an installable PWA now, and as an Android app later, without maintaining
  two separate frontends.

## Non-goals (for now)

- Multi-user / accounts / sharing. This is a single-user personal library. Auth can be
  added later (even just a simple passphrase) if it's ever exposed outside the LAN.
- Slicing models in-app. Phase 4 assumes either pre-sliced `.gcode` uploads or a
  separate CLI slicer integration — it's a project of its own.

## Architecture

Monorepo, npm workspaces:

```
printlib/
  apps/
    web/       React + TypeScript + Vite SPA/PWA (the only UI; wrapped for Android later)
    api/       Node.js + TypeScript + Fastify backend
  packages/
    shared/    Shared TypeScript types/schemas (Zod) used by both web and api
  data/        (gitignored) uploaded files + sqlite db, for local/dev running
  docker/      Dockerfiles + docker-compose.yml for self-hosted deployment
```

**Frontend** — React + TypeScript + Vite, `vite-plugin-pwa` for installability/offline
shell, Tailwind CSS for styling, `@react-three/fiber` + `three-stdlib` loaders for
in-browser STL/3MF/OBJ preview.

**Backend** — Fastify (TypeScript), SQLite via `better-sqlite3` + Drizzle ORM, SQLite
FTS5 virtual table for full-text search over name/description/tags. Uploaded files
live on disk under `data/models/<model-id>/`; the DB only stores metadata + paths.
Zip uploads are extracted server-side and each contained file becomes a `ModelFile`
row under one `Model`.

**Why SQLite, not Postgres:** single user, single host, low write volume — SQLite
removes a whole service to run/back up. Easy to swap for Postgres later since Drizzle
abstracts the dialect if this ever needs to run multi-user.

**Deployment** — Docker Compose, run on a home server/NAS. Self-hosting (rather than a
cloud host) is the natural choice here because Phase 4 needs to reach a printer
(OctoPrint/Moonraker) on the LAN — a cloud-hosted backend would need a tunnel back
into the house anyway.

**Android** — Capacitor wrapping the same web build for Phase 2, rather than a second
native codebase. If native-only capabilities are ever needed (e.g. direct USB/serial
to a printer) that can be added as a Capacitor plugin without a rewrite.

## Data model (initial sketch)

- `Model` — id, name, description, createdAt, category (FK), primaryFileId (for
  thumbnail/preview selection)
- `ModelFile` — id, modelId (FK), filename, path, sizeBytes, fileType (stl/3mf/obj/gcode/other)
- `Category` — id, name (single category per model, like a folder)
- `Tag` / `ModelTag` — free-form many-to-many tags
- `PrintLog` — id, modelId (FK), date, success (bool), notes, photoPath, printerName?,
  material?, settings notes?

## Phases

### Phase 1 — MVP library (this repo's first milestone)
- Monorepo scaffold, shared types, Fastify API, SQLite schema + migrations
- Upload: single file or zip (auto-extract, group under one Model)
- Library grid/list view, search (name/tag/category), filters
- Category + tag CRUD, assign to models
- In-browser 3D viewer for STL/3MF/OBJ
- Print log: add notes + a photo per model, mark success/fail, view history per model
- PWA installability (manifest, service worker, works offline for already-loaded data)
- Docker Compose for self-hosted run

### Phase 2 — Android
- Capacitor wrapper around the Phase 1 web build
- Mobile-friendly upload flow (camera → photo for print logs, share-to-app for files)
- Improve search (combined filters, sort by last printed/added)

### Phase 3 — Web import
- "Import from URL" flow: paste a Printables/Thingiverse/MyMiniFactory link, fetch
  metadata + files via each site's *official* API where one exists, and drop the
  result straight into the library as a new Model
- In-app search across those sites (using their APIs, not scraping HTML) as a
  convenience layer before committing to a manual download
- Respect each site's terms of service and rate limits; this is for personal
  archiving of models the user has the right to download, not bulk mirroring

### Phase 4 — Send to printer (the dream feature)
- Printer registry (name, connection type, base URL) for OctoPrint/Moonraker instances
  on the LAN
- Upload a `.gcode` file already in the library straight to the printer's queue and
  start a print
- For non-gcode models: either require a pre-sliced file first, or integrate a CLI
  slicer (e.g. PrusaSlicer/OrcaSlicer command-line mode) with saved per-printer
  slicing profiles — scope this properly once Phases 1–3 are solid

## Immediate next steps after this scaffold

1. Define the Drizzle schema for `Model`/`ModelFile`/`Category`/`Tag`/`PrintLog`
2. Build the upload endpoint (handles zip extraction) and the library list/search endpoint
3. Build the library grid UI and the model detail page with the 3D viewer
4. Wire up print log entry (notes + photo) on the model detail page
