#!/usr/bin/env bash
#
# Deploy Acme Data Room to Render in one command.
#
#   ./infra/render-deploy.sh
#
# Requires (from root .env or environment):
#   RENDER_API_KEY      Render account API key
#   S3_*                Backblaze B2 object storage (S3-compatible)
#   JWT_SECRET          optional; generated if unset
#   GMAIL_*/GOOGLE_*    optional (email OTP)
#
# Only Node.js (>= 18, used by this repo anyway) is required — no python/jq.
#
# Idempotent: reuses existing Render resources by name, so it is safe to
# run repeatedly. It creates (or adopts) three resources:
#   - PostgreSQL database     acme-dataroom-postgres
#   - Web service (API)       acme-dataroom-api
#   - Gateway (nginx+front)   acme-dataroom-web   (docker; serves SPA + proxies /api)
#
# The gateway serves the built frontend AND proxies /api to the API over
# Render's private network, so the whole app lives on ONE origin. That keeps
# the SameSite=Lax auth cookie working (frontend+API on separate subdomains
# breaks it). Env vars are wired BEFORE the first deploy so nginx always has
# API_UPSTREAM set.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- Load secrets from the git-ignored root .env if present ----
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

# Gmail OTP credentials live in server/.env — load them too.
if [ -f "$REPO_ROOT/server/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/server/.env"
  set +a
fi

: "${RENDER_API_KEY:?RENDER_API_KEY must be set (root .env or environment)}"

# A tiny JSON helper: reads JSON from stdin and prints a nested path.
# Usage: echo '{"a":{"b":1}}' | jqget a.b
jqget() {
  node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(raw);
        const path = process.argv[1].split(".");
        let v = j;
        for (const k of path) v = v == null ? undefined : v[k];
        console.log(v == null || v === "" ? "" : String(v));
      } catch { console.log(""); }
    });
  ' "$1" 2>/dev/null
}

API="https://api.render.com/v1"
OWNER_ID="${RENDER_OWNER_ID:-}"
REGION="${RENDER_REGION:-oregon}"
POSTGRES_NAME="${RENDER_POSTGRES_NAME:-acme-dataroom-postgres}"
API_SERVICE_NAME="${RENDER_API_SERVICE_NAME:-acme-dataroom-api}"
WEB_SERVICE_NAME="${RENDER_WEB_SERVICE_NAME:-acme-dataroom-web}"
REPO_URL="${RENDER_REPO_URL:-https://github.com/acvid3/acme-data-room}"
BRANCH="${RENDER_BRANCH:-main}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

: "${S3_ENDPOINT:?S3_ENDPOINT must be set}"
: "${S3_REGION:?S3_REGION must be set}"
: "${S3_ACCESS_KEY:?S3_ACCESS_KEY must be set}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY must be set}"
: "${S3_BUCKET:?S3_BUCKET must be set}"

say() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

render_get() {
  curl -sS -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" "$API$1"
}
render_post() {
  curl -sS -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" \
    -H "Content-Type: application/json" -d "$2" "$API$1"
}
render_delete() {
  curl -sS -X DELETE -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" "$API$1"
}
render_put_env() {
  curl -sS -X PUT -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" \
    -H "Content-Type: application/json" -d "$2" "$API$1"
}

wait_deploy() {
  local service_id="$1" deploy_id="$2" what="$3"
  say "Waiting for $what deploy $deploy_id ..."
  for _ in $(seq 1 90); do
    st=$(render_get "/services/$service_id/deploys/$deploy_id" | jqget status)
    case "$st" in
      live) say "$what is live."; return 0;;
      build_failed|deploy_failed|update_failed|canceled) die "$what deploy failed (status=$st)";;
    esac
    sleep 10
  done
  die "Timed out waiting for $what deploy."
}

# ---------------------------------------------------------------- owner
if [ -z "$OWNER_ID" ]; then
  OWNER_ID=$(render_get "/owners" | jqget "0.owner.id")
fi
[ -n "$OWNER_ID" ] || die "Could not resolve Render workspace ID."
say "Using workspace $OWNER_ID"

# ---------------------------------------------------------------- helpers
service_info_by_name() {
  # prints "id|type" for a service with the given name, or "" if not found
  local name="$1"
  render_get "/services?limit=100" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        const list = JSON.parse(raw);
        const name = process.argv[1];
        for (const entry of list) {
          if (entry.service && entry.service.name === name) {
            console.log(entry.service.id + "|" + entry.service.type);
            return;
          }
        }
      } catch {}
      console.log("");
    });
  ' "$name"
}
service_id_by_name() { service_info_by_name "$1" | cut -d'|' -f1; }
service_type_by_name() { service_info_by_name "$1" | cut -d'|' -f2; }

postgres_id_by_name() {
  local name="$1"
  render_get "/postgres?limit=100" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      try {
        const list = JSON.parse(raw);
        const name = process.argv[1];
        for (const entry of list) {
          if (entry.postgres && entry.postgres.name === name) {
            console.log(entry.postgres.id);
            return;
          }
        }
      } catch {}
      console.log("");
    });
  ' "$name"
}

# ---------------------------------------------------------------- Postgres
PG_ID=$(postgres_id_by_name "$POSTGRES_NAME")
if [ -z "$PG_ID" ]; then
  say "Creating Postgres '$POSTGRES_NAME' (free, $REGION)..."
  PG_ID=$(render_post "/postgres" "$(cat <<JSON
{
  "name": "$POSTGRES_NAME",
  "plan": "free",
  "ownerId": "$OWNER_ID",
  "region": "$REGION",
  "version": "16",
  "databaseName": "dataroom",
  "databaseUser": "dataroom",
  "ipAllowList": [{"cidrBlock": "0.0.0.0/0", "description": "everywhere"}]
}
JSON
)" | jqget id)
  [ -n "$PG_ID" ] || die "Failed to create Postgres."
fi
say "Postgres ready: $PG_ID"

PG_STATUS=""
for _ in $(seq 1 30); do
  PG_STATUS=$(render_get "/postgres/$PG_ID" | jqget status)
  [ "$PG_STATUS" = "available" ] && break
  sleep 6
done
[ "$PG_STATUS" = "available" ] || die "Postgres not available (status=$PG_STATUS)."

DATABASE_URL=$(render_get "/postgres/$PG_ID/connection-info" | jqget internalConnectionString)
say "DATABASE_URL resolved."

# ---------------------------------------------------------------- API service
API_SERVICE_ID=$(service_id_by_name "$API_SERVICE_NAME")
if [ -z "$API_SERVICE_ID" ]; then
  say "Creating web service '$API_SERVICE_NAME'..."
  API_SERVICE_ID=$(render_post "/services" "$(cat <<JSON
{
  "type": "web_service",
  "name": "$API_SERVICE_NAME",
  "ownerId": "$OWNER_ID",
  "repo": "$REPO_URL",
  "branch": "$BRANCH",
  "rootDir": "server",
  "autoDeploy": "no",
  "serviceDetails": {
    "runtime": "node",
    "plan": "free",
    "region": "$REGION",
    "numInstances": 1,
    "envSpecificDetails": {
      "buildCommand": "npm install --include=dev && npx prisma generate && npm run build",
      "startCommand": "npx prisma migrate deploy && npm run start"
    },
    "healthCheckPath": "/"
  }
}
JSON
)" | jqget service.id)
  [ -n "$API_SERVICE_ID" ] || die "Failed to create API service."
else
  say "Adopting existing API service: $API_SERVICE_ID"
fi
API_URL=$(render_get "/services/$API_SERVICE_ID" | jqget serviceDetails.url)
[ -n "$API_URL" ] || die "Could not resolve API public URL."
say "API URL: $API_URL"

# ---------------------------------------------------------------- Gateway service
# If an old static_site occupies the gateway name, remove it (can't change type in place).
EXISTING_TYPE=$(service_type_by_name "$WEB_SERVICE_NAME")
if [ "$EXISTING_TYPE" = "static_site" ]; then
  OLD_ID=$(service_id_by_name "$WEB_SERVICE_NAME")
  say "Replacing legacy static site '$WEB_SERVICE_NAME' with the nginx gateway (removing $OLD_ID)..."
  render_delete "/services/$OLD_ID" >/dev/null
  for _ in $(seq 1 20); do
    [ -z "$(service_id_by_name "$WEB_SERVICE_NAME")" ] && break
    sleep 5
  done
fi

GATEWAY_ID=$(service_id_by_name "$WEB_SERVICE_NAME")
if [ -z "$GATEWAY_ID" ]; then
  say "Creating gateway '$WEB_SERVICE_NAME' (nginx + frontend)..."
  GATEWAY_ID=$(render_post "/services" "$(cat <<JSON
{
  "type": "web_service",
  "name": "$WEB_SERVICE_NAME",
  "ownerId": "$OWNER_ID",
  "repo": "$REPO_URL",
  "branch": "$BRANCH",
  "autoDeploy": "no",
  "serviceDetails": {
    "runtime": "docker",
    "plan": "free",
    "region": "$REGION",
    "numInstances": 1,
    "envSpecificDetails": {
      "dockerfilePath": "infra/Dockerfile.gateway",
      "dockerContext": "."
    },
    "healthCheckPath": "/"
  }
}
JSON
)" | jqget service.id)
  [ -n "$GATEWAY_ID" ] || die "Failed to create gateway service."
else
  say "Adopting existing gateway service: $GATEWAY_ID"
fi

# ---------------------------------------------------------------- wire env vars (BEFORE first deploy)
say "Wiring env vars before first deploy..."

# Optional email-OTP (Gmail) / Google OAuth vars — only when provided in .env.
# Build a JSON fragment with node (safe escaping); empty if no vars present.
# The fragment starts with "," and appends each entry, e.g.:
#   ,\n  {"key": "GOOGLE_CLIENT_ID", "value": "..."},\n  ...
GMAIL_ENV=$(node -e '
const env = process.env;
const keys = ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","GMAIL_REFRESH_TOKEN","GMAIL_FROM"];
const arr = keys.filter((k) => env[k] && env[k] !== "").map((k) => ({ key: k, value: env[k] }));
if (arr.length === 0) { console.log(""); process.exit(0); }
const lines = arr.map((o) => "  " + JSON.stringify(o)).join(",\n");
console.log(",\n" + lines);
' 2>/dev/null || true)

render_put_env "/services/$API_SERVICE_ID/env-vars" "$(cat <<JSON
[
  {"key": "DATABASE_URL", "value": "$DATABASE_URL"},
  {"key": "JWT_SECRET", "value": "$JWT_SECRET"},
  {"key": "NODE_ENV", "value": "production"},
  {"key": "S3_ENDPOINT", "value": "$S3_ENDPOINT"},
  {"key": "S3_REGION", "value": "$S3_REGION"},
  {"key": "S3_ACCESS_KEY", "value": "$S3_ACCESS_KEY"},
  {"key": "S3_SECRET_KEY", "value": "$S3_SECRET_KEY"},
  {"key": "S3_BUCKET", "value": "$S3_BUCKET"}
  $GMAIL_ENV
]
JSON
)" >/dev/null

# Gateway proxies /api to the API's public URL. The browser only ever talks to
# the gateway (ONE origin), so the SameSite=Lax cookie works; the gateway reaches
# the API over the public internet (Render's free plan doesn't allow private
# network ingress, and port 10000 is reserved anyway).
API_HOST=${API_URL#https://}
API_HOST=${API_HOST#http://}
render_put_env "/services/$GATEWAY_ID/env-vars" "$(cat <<JSON
[
  {"key": "API_HOST", "value": "$API_HOST"},
  {"key": "API_SCHEME", "value": "https"},
  {"key": "RESOLVER", "value": "8.8.8.8 1.1.1.1"}
]
JSON
)" >/dev/null

# ---------------------------------------------------------------- deploy (both)
say "Deploying API and gateway..."
API_DEPLOY_ID=$(render_post "/services/$API_SERVICE_ID/deploys" '{}' | jqget id)
GATEWAY_DEPLOY_ID=$(render_post "/services/$GATEWAY_ID/deploys" '{}' | jqget id)

wait_deploy "$API_SERVICE_ID" "$API_DEPLOY_ID" "API"
wait_deploy "$GATEWAY_ID" "$GATEWAY_DEPLOY_ID" "gateway"

# ---------------------------------------------------------------- resolve URLs + CORS
API_URL=$(render_get "/services/$API_SERVICE_ID" | jqget serviceDetails.url)
WEB_URL=$(render_get "/services/$GATEWAY_ID" | jqget serviceDetails.url)
say "API URL: $API_URL"
say "Web URL: $WEB_URL"

# CORS_ORIGINS / PUBLIC_BASE_URL depend on the gateway's public URL; update + redeploy API.
say "Setting CORS_ORIGINS / PUBLIC_BASE_URL on the API..."
render_put_env "/services/$API_SERVICE_ID/env-vars" "$(cat <<JSON
[
  {"key": "DATABASE_URL", "value": "$DATABASE_URL"},
  {"key": "JWT_SECRET", "value": "$JWT_SECRET"},
  {"key": "NODE_ENV", "value": "production"},
  {"key": "S3_ENDPOINT", "value": "$S3_ENDPOINT"},
  {"key": "S3_REGION", "value": "$S3_REGION"},
  {"key": "S3_ACCESS_KEY", "value": "$S3_ACCESS_KEY"},
  {"key": "S3_SECRET_KEY", "value": "$S3_SECRET_KEY"},
  {"key": "S3_BUCKET", "value": "$S3_BUCKET"},
  {"key": "CORS_ORIGINS", "value": "$WEB_URL"},
  {"key": "PUBLIC_BASE_URL", "value": "$WEB_URL"}
  $GMAIL_ENV
]
JSON
)" >/dev/null

say "Redeploying API to apply CORS_ORIGINS / PUBLIC_BASE_URL..."
API_DEPLOY_ID=$(render_post "/services/$API_SERVICE_ID/deploys" '{}' | jqget id)
wait_deploy "$API_SERVICE_ID" "$API_DEPLOY_ID" "API"

say "Done!"
printf '\n  App (single origin): %s\n  API (direct):        %s\n  Database:            %s\n\n' "$WEB_URL" "$API_URL" "$DATABASE_URL"
printf '  Register: %s/api/auth/register\n\n' "$WEB_URL"
