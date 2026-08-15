# CREDENTIALS.md

Where to get every credential the project needs, and its current status. Actual secret values live
in the git-ignored `.env` (never commit them). Keys below map 1:1 to `.env.example`.

Legend: **PROVIDED** = value present and verified in `.env` · **REQUIRED** = must obtain before
deploy · **OPTIONAL** = only needed if the feature is used.

---

## 1. Backblaze B2 — object storage (S3-compatible)

Used by the server for file upload/download (`server/integrations/s3-storage.ts`, `FILE_STORAGE`).

| Env key | How to get it |
| ------- | ------------- |
| `S3_ENDPOINT` | Backblaze dashboard → Buckets → click bucket → shows `s3.<region>.backblazeb2.com` (e.g. `https://s3.us-east-005.backblazeb2.com`) |
| `S3_REGION` | Same bucket page, region segment (`us-east-1` is accepted by the S3 API) |
| `S3_ACCESS_KEY` | Dashboard → **App Keys** → Create Key → *keyID* |
| `S3_SECRET_KEY` | Same App Key dialog → *applicationKey* (shown once). **Never use the master key.** |
| `S3_BUCKET` | Name you chose when creating the bucket, e.g. `acme-dataroom` |

**Status: PROVIDED** — round-trip (presigned PUT → GET → DELETE) verified against B2.

---

## 2. PostgreSQL (managed, prod)

Used via `DATABASE_URL` (Prisma).

| Env key | How to get it |
| ------- | ------------- |
| `DATABASE_URL` | Render dashboard → your Postgres service → **Connect** → External/Internal connection string (`postgresql://USER:PASS@HOST:PORT/DB?schema=public`). Note: local dev uses Docker Postgres on `localhost:5433` (see `server/.env`). |

**Status:** local **PROVIDED** (Docker `dataroom:dataroom@localhost:5433/dataroom`). Prod DB not yet
created — obtain from Render when deploying.

---

## 3. JWT secret — auth

| Env key | How to get it |
| ------- | ------------- |
| `JWT_SECRET` | Generate yourself: `openssl rand -base64 48`. Must be set in prod (app will still run with empty, but tokens are forgeable — do not ship like that). |

**Status:** local **PROVIDED** (`dev-secret-change-me`, dev only). Prod must use a fresh random value.

---

## 4. Google OAuth — optional social login

Only needed if you implement Google login. Current auth is email/password, so these are **OPTIONAL**.

| Env key | How to get it |
| ------- | ------------- |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → **APIs & Services → Credentials → Create Credentials → OAuth client ID** (Web application). Copy the `Client ID`. |
| `GOOGLE_CLIENT_SECRET` | Same page → `Client secret` column. |
| `WEB_APP_URL` | Frontend origin for the OAuth redirect callback, e.g. `http://localhost:5173` (dev) or the deployed Vercel URL (prod). Must be added to the OAuth client's **Authorized redirect URIs**. |

**Status: PROVIDED** in `.env` (verified values), but not used by the app yet.

---

## 5. Render — API deployment + Postgres

Used by deploy tooling to create/update the backend service.

| Env key | How to get it |
| ------- | ------------- |
| `RENDER_API_KEY` | Render dashboard → top-right avatar → **Account Settings → API Keys → New API Key** → copy. |

**Status: PROVIDED.**

---

## 6. Vercel — frontend deployment

Used by deploy tooling to push the web client.

| Env key | How to get it |
| ------- | ------------- |
| `VERCEL_TOKEN` | Vercel dashboard → avatar → **Settings → Tokens → Create**. Scope: the target team/project. |

**Status: PROVIDED.**

---

## 7. GitHub — optional automation token

Used by deploy tooling for repo automation (pushing, triggers).

| Env key | How to get it |
| ------- | ------------- |
| `GH_TOKEN` | GitHub → avatar → **Settings → Developer settings → Personal access tokens → Tokens (classic)** → fine-grained PAT with `repo` scope. |

**Status: PROVIDED.**

---

## Where values live

| File | Purpose |
| ---- | ------- |
| `.env` (repo root) | Deploy-tooling tokens + S3 + OAuth. Git-ignored. |
| `server/.env` | Runtime env the API reads at boot (`dotenv/config` in `server/main.ts`): `DATABASE_URL`, `JWT_SECRET`, `S3_*`. Git-ignored. |
| `.env.example` | Template with docs per key (commit-safe). |

## Before deploying — checklist

- [ ] Create a managed Postgres on Render; put its URL in `DATABASE_URL`.
- [ ] Run `npx prisma migrate deploy` against that DB.
- [ ] Generate a fresh `JWT_SECRET` (not the dev value).
- [ ] Confirm `S3_BUCKET` exists on B2 and the App Key has bucket access.
- [ ] If Google login is enabled: create OAuth client, add the deployed frontend URL to redirects, set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`WEB_APP_URL`.
- [ ] `RENDER_API_KEY` and `VERCEL_TOKEN` scoped to the accounts that own the deploy.
