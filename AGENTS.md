# Recipebook Agent Guide

## Product intent

This repository is building a self-hosted recipe manager that feels cohesive, practical, and polished.

The core user experience is:

- Store recipes
- Search recipes
- Organize recipes into cookbooks
- Share cookbooks with other users
- Collaborate inside shared cookbooks with role-based permissions

The project should feel closer to a real self-hosted product like Navidrome, Jellyfin, or Immich than to a one-off class demo. Favor clean architecture, maintainability, and a smooth user experience over feature sprawl.

## Architecture direction

Treat the system as a set of clear responsibilities:

- `web/`: React + TypeScript frontend for recipe browsing, cookbook management, collaboration UI, and job status polling
- `server/`: Python backend API for auth, recipes, cookbooks, permissions, search, storage, and orchestration
- `db/`: database setup and initialization assets
- `docker-compose.yml`: local self-hosted orchestration entrypoint

When adding features, preserve separation of concerns:

- Frontend should focus on presentation, local interaction state, and calling typed API helpers
- API routers should stay thin and delegate business logic
- Business rules should live in services or similarly structured backend modules
- Database access should not be spread across unrelated layers
- Slow ingestion or ML-related work should be designed so it can move toward asynchronous/background job execution cleanly

## Engineering priorities

Optimize for these qualities:

- Clear structure so multiple teammates can work in parallel
- Mobile-friendly flows, especially for viewing and using recipes
- Docker-based local setup that stays easy to run
- Readable code over clever code
- Incremental improvements that do not break existing behavior

Prefer small, well-explained changes that fit the current architecture. If the existing structure is awkward, improve it in a way that makes future work easier rather than layering on more special cases.

## Collaboration model

Assume this is a shared student/team project where contributors may be newer to Git, architecture, or cross-service coordination.

When making changes:

- Explain risky or destructive git actions in plain language before doing them
- Do not delete branches, stashes, or local files unless explicitly asked
- Preserve unrelated local changes
- Keep explanations practical and supportive, especially around merge conflicts or team workflows
- Prefer patterns that reduce merge pain and cross-team coupling

## Backend guidance

In `server/`:

- Keep routers focused on HTTP concerns such as validation, dependency wiring, and response handling
- Put business logic in service-layer code instead of route handlers
- Keep auth and permission checks explicit
- Prefer consistent request/response schemas
- Design cookbook sharing around clear roles like view, edit/contributor, and admin/owner as the product evolves
- If adding long-running ingestion work, expose status in a way the frontend can poll reliably

Avoid tightly coupling routers, storage logic, and ML-specific logic together in one place.

## Frontend guidance

In `web/`:

- Keep components focused and reusable
- Prefer mobile-friendly layouts and interactions by default
- Make recipe creation, reading, and navigation easy on narrow screens
- Keep API access centralized rather than scattering fetch logic across components
- Preserve the existing app style unless the task is explicitly a UI redesign

For cookbook and sharing flows, prioritize clarity over visual density. Users should quickly understand what they can view, edit, or manage.

## ML and ingestion guidance

Recipe ingestion is important, but the UX should remain resilient even when OCR or LLM steps are slow or imperfect.

Prefer designs where:

- Upload and ingestion can be asynchronous
- Failures are visible and recoverable
- Structured recipe output is normalized before it reaches the main user flows
- Provider-specific logic is isolated so OpenAI, Ollama, or OCR implementation details do not leak through the whole codebase

## Docker and self-hosting

Protect the self-hosted development story:

- Keep `docker-compose.yml` easy to understand
- Prefer configuration through documented environment variables
- Do not hardcode machine-specific paths or secrets
- Keep `.env.example` aligned with real required configuration

The ideal setup remains: clone the repo, configure env vars, run Docker Compose, and get a working local stack.

## Testing and verification

After making meaningful changes:

- Run the smallest relevant verification you can
- Mention clearly what you tested and what you could not test
- Flag any cross-service assumptions

When touching API contracts or shared data shapes, check both backend and frontend impact.

## Codex-specific guidance

Use this file for shared project rules. Personal preferences should usually live in `~/.codex/AGENTS.md` and `~/.codex/config.toml`.

Inside this repo:

- Treat `.codex/` as local-only unless the team explicitly decides to commit project config there
- Keep instructions here focused on durable team conventions
- If a task suggests a broader repo reorganization, propose the direction clearly before making sweeping changes
