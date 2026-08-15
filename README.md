# Acme Data Room

Full-stack Data Room MVP — a take-home project for Acme Corp. virtual due diligence.
An organized, secure repository for storing and distributing documents (Google Drive / Dropbox / Box inspired).

Full task text: [TASK.md](../TASK.md)

## Highlights

- **Real backend, real database, working end to end.** NestJS + Prisma + PostgreSQL + S3-compatible
  object storage. Uploads stream **directly to S3 via presigned PUT** — the API never proxies bytes.
- **Validated API.** Global `ValidationPipe` + `class-validator` DTOs return 400 on bad input,
  never a 500 crash; auth endpoints are rate-limited.
- **External APIs behind interfaces.** `integrations/` wraps S3 (`FILE_STORAGE`) and Google OAuth
  (`GOOGLE_OAUTH`) so services are provider-agnostic and unit-testable.
- **No existence leak.** Unauthorized access returns 404, never 403; wrong credentials return 401.

## Stack

| Layer      | Tech                                                              |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React + TypeScript + Vite + CSS Modules (in progress)              |
| Backend    | NestJS + Prisma + PostgreSQL                                      |
| File store | S3-compatible object storage (MinIO locally, Backblaze B2 in prod) |
| Auth       | Email/password, bcrypt + JWT (Bearer)                             |
| Integrations | `integrations/s3-storage.ts`, `integrations/google-oauth.client.ts` |

## Project layout

```
acme-data-room/
├── client/            # React frontend (Vite + CSS Modules)
├── server/            # NestJS backend (REST API, Prisma, S3 uploads)
│   ├── controller/    # HTTP adapters (routes → controller → service)
│   ├── routes/        # @Controller route definitions + DTO validation
│   ├── services/      # business logic
│   ├── repository/    # data access (Prisma)
│   ├── integrations/  # external API adapters (S3 storage, Google OAuth)
│   ├── middleware/    # guards + rate limiting
│   ├── dto/           # class-validator DTOs
│   ├── interfaces/    # response/entity TS types
│   ├── prisma/        # schema + migrations
│   └── tests/         # server tests + TESTS.md (every test described)
└── infra/
    └── CREDENTIALS.md # where to obtain every credential, status
```

## Local development

Requirements: Node 20+, Docker Desktop, npm.

```bash
# 1. start Postgres + MinIO
docker compose up -d

# 2. env files
cp .env.example .env
cp .env.example server/.env    # API reads DATABASE_URL, S3_*, JWT_SECRET

# 3. install, migrate
cd server && npm install
npx prisma migrate dev

# 4. run the API
npm run start:dev
#   API  → http://localhost:4000
#   MinIO console → http://localhost:9001 (minioadmin / minioadmin)

# 5. server tests (build + reset test DB + boot compiled server + HTTP tests)
cd server && npm test
```

Every server test is documented in `server/tests/TESTS.md` — what it does, what it verifies, and
the expected error/response shape. Requests are validated with `class-validator` DTOs (400 on
invalid input); auth routes are rate-limited.

## Design decisions

- **Layered architecture.** `routes/` (HTTP + DTO validation) → `controller/` → `services/`
  (business logic) → `repository/` (Prisma) → PostgreSQL. External APIs live in `integrations/`
  behind interfaces (`FILE_STORAGE`, `GOOGLE_OAUTH`) so services never call providers directly.
- **Request validation.** Global `ValidationPipe` + `class-validator` DTOs (`server/dto/`) — invalid
  input returns 400, never a 500 crash.
- **Presigned PUT upload.** The client uploads straight to S3 (Backblaze B2 / MinIO); NestJS only
  issues presigned URLs and records metadata after success. Gives real per-file progress without
  proxying bytes.
- **Polymorphic sharing.** One `Share` table covers rooms, folders, and files (`shareableType` +
  `shareableId`); public access is a separate token-based `PublicLink` (unauthenticated,
  read-only). Sharing endpoints are defined but not yet implemented (return 501).
- **No existence leak.** Authenticated users with no access get 404, never 403; wrong credentials
  get 401. Auth: email/password, bcrypt + JWT (Bearer), `AuthGuard` as a global guard.
- **No dead UI / no dead code.** Only implemented features are exposed.
- **Edge cases.** Ownership is checked in the service layer (`assertOwned`), folder membership in
  `assertFolderInRoom`; `RateLimitMiddleware` protects `/api/auth/*`.

## Data model / ERD

Prisma schema: [server/prisma/schema.prisma](./server/prisma/schema.prisma) — User, DataRoom,
Folder (self-relation tree), File, Share, PublicLink. Migrations in `server/prisma/migrations/`.

## How it scales

- **Folder subtree size/count**: currently computed per query; the schema is ready for denormalized
  aggregates (`Folder.sizeBytes`/`itemCount`) maintained transactionally, with a recursive-CTE
  fallback for audit/self-heal.
- **100k files**: add keyset pagination (cursor) on folder contents plus indexes on
  `(dataRoomId, parentFolderId)` — both are already indexed.
- **Sharing → roles**: `Share` currently stores the tuple; add a `role` column
  (`READONLY` → `EDITOR`) without remodeling.

## AI usage

Built with heavy AI assistance (claude-based coding agent driving a CLI) across the whole stack,
then reviewed and adjusted manually. Where AI was used:

- **Workspace & scaffolding.** Initial project skeleton (NestJS app, Prisma schema, route
  surfaces) and the docs (`API_GUIDE.md`, `infra/CREDENTIALS.md`, `server/tests/TESTS.md`) were
  drafted by the agent from the task text.
- **Backend implementation.** NestJS modules (auth, data-rooms, folders, files, shares, public
  links) and services/repositories were written iteratively with the agent: bottom-up from the
  database (Prisma schema + migrations) through repositories → services → controllers → route
  DTOs. This included presigned S3 uploads (`integrations/s3-storage.ts`), Google OAuth
  (`integrations/google-oauth.client.ts`), name-conflict auto-suffix, cascade deletes, and the
  read-only share access model.
- **Testing.** The server test suite (`server/tests/*.test.ts`, 73 tests) was generated by the
  agent, including deliberate error-provocations that surfaced validation gaps (raw 500s), the
  NULL-trap, missing cascade deletes, and missing read-only access for share recipients — all
  then fixed.
- **Frontend.** The React client (`client/`) is being built the same way, against the live API
  (`API_GUIDE.md`).
- **Code review / refactors.** The agent ran dedup passes (DTO vs interfaces, shared mappers,
  shared request types) and verified every change by building and running the tests.

No claim that every line is hand-written; no claim it's all AI. Business decisions (data model,
access model, conflict handling) were reviewed and validated by a human throughout.

## Deployment

> TODO(builder): live URLs go here once deployed. Recommended: Vercel (web) + Render (NestJS +
> managed Postgres) + Backblaze B2 (object storage). Credentials checklist in
> [infra/CREDENTIALS.md](./infra/CREDENTIALS.md).

- Frontend: <url>
- Backend: <url>
- Demo login: `demo@acme.com` / `demo1234`
