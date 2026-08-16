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

### 2. Public links require auth — anonymous gets 404
- `POST /api/public-links` → **409** if the target room is `PRIVATE` (message
  `Room must be public to create a public link`). A link can no longer be created for a private room.
- `GET /api/public/:token`, `GET /api/public/:token/folders/:folderId` **only work for authenticated
  users**. Anonymous requests (no `Authorization` header) → **404**. These endpoints are still marked
  public (no 401 from the guard), but the server returns 404 when no valid token is present.
- If the link's room was flipped back to `PRIVATE`, even a logged-in user gets **404**.

### 3. Join endpoint (explicit, NOT automatic)
`POST /api/public/:token/join` — **requires auth** (401 without a token). Idempotent.
- Adds the current user as a member of the room (creates a `DATAROOM` share) if they're not already in.
- Returns the room: `{ ...DataRoom, users: RoomUser[], activeUsers: RoomUser[], userCount }` (201).
- 404 if the link is invalid or its room is private.
- ⚠️ **Do NOT call it automatically when opening a link.** Opening a public link is a **read-only**
  view. A viewer must NOT appear in the invited (`users`) list. Only call `join` on an explicit user
  action (e.g. a "Join this room" button), if you decide to surface one.

### 4. Public open payload — two distinct lists
`GET /api/public/:token` for a **DATAROOM** link:
```ts
type FolderStats = { folders: number; files: number; sizeBytes: number }

// each folder in the public contents list carries its own subtree stats:
type PublicFolderItem = Folder & { stats: FolderStats }

type PublicFolderContents = { folders: PublicFolderItem[]; files: File[]; total: number }

type PublicPayload =
  | {
      type: 'DATAROOM'
      room: { id; name }
      contents: PublicFolderContents
      stats: FolderStats            // whole-room subtree stats
      users: RoomUser[]        // INVITED members only: owner + people explicitly shared/joined
      activeUsers: RoomUser[]  // currently in the room right now (members AND logged-in link viewers)
    }
  | { type: 'FOLDER'; folder: { id; name }; roomId: string; contents: PublicFolderContents; stats: FolderStats }
  | { type: 'FILE'; file: File; roomId: string; url: string }   // NEW: presigned download/preview URL

type RoomUser = { id: string; email: string; name: string }
```
Key semantics:
- `users` = people with **invited access** (owner + shared/joined members). Opening a link does **not**
  add you here.
- `activeUsers` = who is **currently in the room**, refreshed automatically by the server when someone
  opens the link (logged-in) or fetches room/folder contents. This list is the "right place" for a
  logged-in link viewer to appear.
- `stats` = subtree counts (folders/files/sizeBytes) **including the folder itself** — same semantics
  as the authenticated `GET /folders/:id/stats`. Available on the public payload **without** calling
  the auth-only `GET /folders/:id/stats` (which returns 404 for non-members).
- **Per-folder stats:** every item in `contents.folders` also carries its own `stats`
  (`{ folders, files, sizeBytes }`, subtree including that folder). So each folder card can render
  "N folders · M files · size" directly from the list — no per-folder requests needed.
- `roomId` exists on the FOLDER and FILE variants (the room the link belongs to).

### 6. Public file download / preview (NEW)
Guests can now open files through a link, just like the owner:
- `GET /api/public/:token/files/:fileId/download` — **auth required** (404 for anonymous). Returns
  `{ url, name }` with a presigned S3 URL (works inline in `<img>/<video>/<iframe>`, and as a download
  link). Scope is enforced: the file must belong to the link's room and, for a FOLDER link, be inside
  the shared folder (ancestor check). For a FILE link, only that exact file.
- The **FILE** link payload now also includes `url` directly (no extra call needed to preview it).
- For files shown in DATAROOM/FOLDER contents lists, call the download endpoint on demand (e.g. on a
  click), like the owner's `GET /files/:id/download`.

### 5. Presence is automatic — no client heartbeats
The server marks a user as "currently in the room" automatically when:
- they open a public link (`GET /api/public/:token` or `/folders/:folderId`) — always requires auth, so
  every opener is a known logged-in user, or
- they fetch a folder/file listing inside the room (`GET /data-rooms/:id/contents`,
  `GET /data-rooms/:id/contents/:folderId`, `GET /folders/:id/contents`).
The marker expires server-side after **5 minutes** without further activity
(`PRESENCE_TTL_SECONDS`, default 300). **There is no heartbeat endpoint and no polling needed on the
client.** The client just reads `activeUsers` (and `users`) from the responses.

⚠️ **Important for the public endpoints:** the public `open`/`openFolder` requests MUST carry the
`Authorization: Bearer <token>` header — without it the server returns **404** (anonymous access to
links is disabled). Fix in `client/src/api/index.ts`: `publicLinkApi.open` and `publicLinkApi.openFolder`
currently pass `{ auth: false }`, which suppresses the token and makes every open fail. **Remove
`auth: false`** so the token is attached whenever the user is logged in. On 404 from a public link,
treat it as "log in to view this link" and route to login.

## Client tasks

### A. Room settings — Public/Private toggle (replaces "just copy the link")
In the room share/settings UI (the screen where the owner copies the public link):
- Add a toggle **Public room / Private room**, persisted via
  `PATCH /api/data-rooms/:id` `{ visibility }`. Show the current value from the room object.
- If the room is `PRIVATE`, the "create public link" action must be disabled (or show the server's 409
  message). Only `PUBLIC` rooms can have a link.
- When the owner toggles a room back to `PRIVATE`, warn them that any existing public link stops working
  (server returns 404 for old links).

### B. PublicViewer — read-only view, NO auto-join
In `client/src/components/blocks/PublicViewer/index.tsx` (and `publicLinkApi`):
- `open(token)` and `openFolder(token, folderId)` already return everything needed. **Remove any code
  that calls `join` after opening the link.** A viewer is not added to the room by opening it.
- Render two clearly-separated lists for `type === 'DATAROOM'`:
  - **Invited** (`users`) — everyone with invited access.
  - **Currently in the room** (`activeUsers`) — who's online/here right now.
- Update the `PublicPayload` type (in `client/src/types.ts`): DATAROOM variant gets
  `users: RoomUser[]` and `activeUsers: RoomUser[]`; FOLDER and FILE variants get `roomId: string`;
  add `RoomUser`; extend the client `DataRoom` type with `visibility` and `activeUsers`.

### C. Normal app room view
- The room page should show the same two groups from `GET /api/data-rooms/:id`:
  `users` (invited) and `activeUsers` (currently in the room). No polling — just re-read on navigation
  and after contents fetches (the server refreshes presence on each contents/list request the client
  already makes).
- `DataRoom` type on the client should carry `visibility` (for the settings toggle) and the existing
  `users`/`userCount`, plus `activeUsers`.

## Verification checklist
- Toggling a room to PRIVATE then creating a link → error is surfaced.
- Opening a public link while logged in (NOT shared) → user appears in **Currently in the room** only,
  and is **NOT** in **Invited**.
- Opening a public link while logged out → **404**, route to login.
- Flipping room back to PRIVATE → old link returns 404 on open (logged in).
- A member who just fetched room/folder contents appears in `activeUsers` on the room page; someone who
  stopped interacting drops off after ~5 minutes.
- A link viewer can download/preview any file inside the link's scope; files outside a FOLDER link's
  folder → 404; anonymous download → 404.
