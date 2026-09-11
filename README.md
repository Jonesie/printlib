# PrintLib

A personal, self-hosted library for 3D printer model files — search, browse,
categorize, group multi-file models, keep print notes/photos, and eventually send
jobs to a printer.

See [PLAN.md](./PLAN.md) for the full design and phased roadmap.

## Layout

```
apps/web/      React + TypeScript + Vite PWA frontend
apps/api/      Node.js + TypeScript + Fastify backend
packages/shared/  Shared types/schemas used by both
docker/        Self-hosted deployment (Docker Compose)
```

## Status

Scaffold only — see PLAN.md "Immediate next steps" for what's being built first.
