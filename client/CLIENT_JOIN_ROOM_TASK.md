# Public links + room visibility + join (server changes are done — client tasks below)

> For the agent building `acme-data-room/client`. Server-side changes in `acme-data-room/server` are
> **already implemented and tested**. This file is the client spec. Do not re-implement or second-guess
> the server API — use it exactly as described.

## What changed on the server

### 1. Rooms now have a visibility setting
`DataRoom` gained `visibility: 'PUBLIC' | 'PRIVATE'` (default `PRIVATE`).
- Set on create (optional): `POST /api/data-rooms` body may include `visibility`.
- Set/change via: `PATCH /api/data-rooms/:id` body `{ visibility: 'PUBLIC' }` or `'PRIVATE'`.
- `GET /api/data-rooms/:id` and list responses now include `visibility`.

### 2. Public links only work for PUBLIC rooms
- `POST /api/public-links` → **409** if the target room is `PRIVATE` (message
  `Room must be public to create a public link`). A link can no longer be created for a private room.
- `GET /api/public/:token`, `GET /api/public/:token/folders/:folderId` → **404** if the link's room is
  not `PUBLIC` anymore (e.g. owner flipped the room back to private — the link dies).

### 3. Join endpoint (new)
`POST /api/public/:token/join` — **requires auth** (401 without a token). Idempotent.
- Adds the current user as a member of the room (creates a `DATAROOM` share) if they're not already in.
- Returns the room: `{ ...DataRoom, users: RoomUser[], userCount: number }` (201).
- Owner joining their own link: no-op, still returns the room.
- 404 if the link is invalid or its room is private.

### 4. Public open payload now includes members
`GET /api/public/:token` for a **DATAROOM** link returns an extra field:
```ts
type PublicPayload =
  | { type: 'DATAROOM'; room: { id; name }; contents: FolderContents; users: RoomUser[] }  // NEW: users
  | { type: 'FOLDER'; folder: { id; name }; contents: FolderContents }
  | { type: 'FILE'; file: File }

type RoomUser = { id: string; email: string; name: string }
```
`users` = owner + shared members. FOLDER/FILE link payloads unchanged.

## Client tasks

### A. Room settings — Public/Private toggle (replaces "just copy the link")
In the room share/settings UI (the screen where the owner copies the public link):
- Add a toggle **Public room / Private room**, persisted via
  `PATCH /api/data-rooms/:id` `{ visibility }`. Show the current value from the room object.
- If the room is `PRIVATE`, the "create public link" action must be disabled (or show the server's 409
  message). Only `PUBLIC` rooms can have a link.
- When the owner toggles a room back to `PRIVATE`, warn them that any existing public link stops working
  (server returns 404 for old links).

### B. PublicViewer — join the room on open
In `client/src/components/blocks/PublicViewer/index.tsx` (and `publicLinkApi`):
- Add `join` to `publicLinkApi`:
  ```ts
  join: (token: string) => api.post<RoomPayload>(`/public/${token}/join`) // sends Authorization header
  ```
- After `publicLinkApi.open(token)` succeeds:
  - If the user is **authenticated** → call `join(token)` (fire-and-forget is fine; it's idempotent).
    Handle 404 (link no longer valid / room private) and 401 (session expired) gracefully.
  - If **not authenticated** → skip join; optionally show a "Log in to join this room" hint.
- Render the member list for `type === 'DATAROOM'`: show `users` (name/email) under the room header —
  "People in this room". The requirement: when a public room is entered, its members are displayed.
- Update the `PublicPayload` type (in `client/src/types.ts`) to include `users: RoomUser[]` on the
  DATAROOM variant; add `RoomUser` and extend the `DataRoom` client type with `visibility`.

### C. Normal app room view
- `DataRoom` type on the client should carry `visibility` (for the settings toggle) and the existing
  `users`/`userCount` — `GET /api/data-rooms/:id` already returns them; no server change needed.

## Verification checklist
- Toggling a room to PRIVATE then creating a link → error is surfaced.
- Opening a public link logged-in → user appears in `users` on the next open, and can open the room in
  the app.
- Opening a public link anonymously → members still visible, no join call made.
- Flipping room back to PRIVATE → old link returns 404 on open.
