# infra

Оркестрация Acme Data Room: локальный запуск одной командой и деплой на Render.

## Вариант 1 — Локальный запуск (docker compose)

Запускает Postgres + MinIO + API (NestJS) + frontend (Vite) одной командой.

```bash
# из корня репозитория
docker compose -f infra/docker-compose.yml up --build
```

После старта:

| Сервис   | URL                        | Доступ                  |
| -------- | -------------------------- | ----------------------- |
| API      | http://localhost:4000      | регистрация: `/api/auth/register` |
| Frontend | http://localhost:5173      | браузер                 |
| MinIO UI | http://localhost:9001      | `minioadmin` / `minioadmin` |

Первая регистрация возвращает 6-значный OTP-код прямо в ответе API
(почта не настроена локально) — вставьте его на шаге подтверждения.

Остановка:

```bash
docker compose -f infra/docker-compose.yml down
```

Переменные (`POSTGRES_USER`, `S3_BUCKET`, `JWT_SECRET`, ...) переопределяются
через `.env` рядом с compose-файлом или окружением. Дефолты подходят для старта.

> Образы собираются в Docker, Node.js не требуется. Порты 5433/9000/9001/4000/5173
> должны быть свободны.

## Вариант 2 — Деплой на Render

Архитектура деплоя — **один origin**: nginx-шлюз `acme-dataroom-web` раздаёт
собранный фронтенд и проксирует `/api` на API-сервис. Браузер общается только
со шлюзом, поэтому auth-cookie (`SameSite=Lax`) сохраняется и работает —
разнесение фронта и API на разные поддомены её ломает (Chrome блокирует
`SameSite=Lax` куку на кросс-поддоменный запрос).

### Способ A — скрипт (рекомендуется, одна команда)

```bash
./infra/render-deploy.sh
```

Скрипт идемпотентен: создаёт/«усыновляет» три ресурса и сам связывает их URL:

- PostgreSQL `acme-dataroom-postgres`
- Web service (API) `acme-dataroom-api`
- Gateway (nginx + frontend) `acme-dataroom-web`

Требует переменных из корневого `.env` (подхватываются автоматически) или окружения:

```
RENDER_API_KEY
S3_ENDPOINT / S3_REGION / S3_ACCESS_KEY / S3_SECRET_KEY / S3_BUCKET   # Backblaze B2
JWT_SECRET        # опционально; генерируется
GMAIL_*/GOOGLE_*  # опционально (email OTP)
```

Скрипт использует только Node.js (в репозитории он уже есть), **python/jq не нужны**.

Gateway проксирует `/api` на публичный URL API (`API_HOST`), т.к. free-план Render
не даёт private-network ingress, а порт 10000 для него зарезервирован.

### Способ B — Blueprint `render.yaml`

- Render Dashboard → **New Blueprint Instance** → выбрать репозиторий → указать `infra/render.yaml`
  (или перенести файл в корень как `render.yaml`).

Секреты (`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `GMAIL_*`, `GOOGLE_*`)
запросятся при первом создании (`sync: false`) — значения не попадают в git.
Внутри blueprint `API_HOST`/`CORS_ORIGINS`/`PUBLIC_BASE_URL` резолвятся через
`fromService` + `RENDER_EXTERNAL_*` переменные Render.

## Как это устроено

- `docker-compose.yml` + `Dockerfile.server` + `Dockerfile.client` + `Dockerfile.gateway`
  — локальный стек. Server-образ в рантайме запускает `prisma migrate deploy`.
  Gateway (nginx) отдаёт фронт на `http://localhost:5173` и проксирует `/api` на `server:4000`.
- `render.yaml` — декларативный blueprint для Render (Postgres + API + gateway).
- `render-deploy.sh` — идемпотентный деплой через Render API с автовязкой URL.

## Текущий деплой на Render

- App (единый origin): https://acme-dataroom-web.onrender.com
- API (напрямую):       https://acme-dataroom-api-16fy.onrender.com
- Database: Postgres `acme-dataroom-postgres` (plan free, region oregon)

Обновляется повторным запуском `./infra/render-deploy.sh`.
