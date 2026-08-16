# Switch auth from localStorage Bearer token to httpOnly cookie (server side DONE)

> For the agent building `acme-data-room/client`. The server half is implemented and tested
> (101/101 tests). This file is the client spec for C1/C2.

## What the server now does
- `POST /api/auth/verify-code` and `POST /api/auth/verify-login` set an **httpOnly cookie** named
  `access_token` with the JWT:
  - `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=7d`, `Secure` only when `NODE_ENV=production`.
- `AuthGuard` and the public-link optional-auth read the token from **either** the
  `Authorization: Bearer <token>` header **or** the `access_token` cookie.
- `POST /api/auth/logout` (authenticated) clears the cookie via `Set-Cookie: access_token=; Max-Age=0`.
- CORS already has `credentials: true`.

## Client tasks
1. **Stop persisting the token.** Remove `getToken`/`setToken`/`clearToken` and the localStorage key
   (e.g. from `client/src/config.ts` and anywhere it's used). The `accessToken` returned by
   verify-code/verify-login can be ignored — the browser stores the cookie automatically.
2. **Send cookies on every request.** In `client/src/api/client.ts`, add `credentials: 'include'` to
   every `fetch`. Remove the manual `Authorization: Bearer ...` injection (the `auth` flag / header
   logic can go away, or keep the option but stop attaching a header).
3. **Public endpoints still work** (`/public/:token`, `/public/:token/folders/:folderId`,
   `/public/:token/files/:fileId/download`): the server now also recognizes the cookie for the
   optional user id, so no Authorization header is needed there either. Keep sending credentials.
4. **Logout:** call `POST /api/auth/logout` (cookie clears). Handle 401 after logout as "signed out".
5. **Re-login:** existing users must sign in again (the previous Bearer tokens were invalidated when
   the JWT secret was rotated in the security hardening step).

## Verification
- After verify-code/verify-login, a `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax` header is
  returned; subsequent `/api/auth/me` works with **no** Authorization header (cookie only).
- Public link open marks the logged-in user as "Active now" via the cookie (no header needed).
- Logout clears the cookie and `/api/auth/me` returns 401.
- Cross-origin: both client and API on `localhost` (different ports) is **same-site**, so
  SameSite=Lax cookies are sent. If the production client and API are on different registrable
  domains (cross-site), SameSite=Lax will NOT be sent on fetch — you'd need a same-site reverse proxy,
  or the API to emit `SameSite=None; Secure` and the cookie to be partitioned/third-party allowed.
  Confirm the deploy topology before locking the client.
