# Public link viewer: render the shared contents (stop showing the stub)

> For the agent building `acme-data-room/client`. `PublicViewer` already fetches the public payload
> correctly, but its body is a hardcoded stub — render the actual contents.

## Current state
`client/src/components/blocks/PublicViewer/index.tsx`:
- Route `/public/:token` → `PublicViewer` (wired, works)
- Calls `publicLinkApi.open(token)` → gets `PublicPayload`
- Shows the name correctly ("191919") and the line "Shared with you via public link"
- BUT the body is: `<p>Public viewer coming soon.</p>` — replace this with the real contents

## The payload shape (from `GET /api/public/:token`)
```ts
type PublicPayload =
  | { type: 'DATAROOM'; room: { id; name }; contents: { folders: Folder[]; files: File[]; total: number } }
  | { type: 'FOLDER'; folder: { id; name }; contents: { folders: Folder[]; files: File[]; total: number } }
  | { type: 'FILE'; file: File }
```
This endpoint is **public** (no auth) — the data is already on the client. It returns only the
**first level**, paginated.

## Pagination (same as the owner's room)
Public endpoints accept `?limit` (default 50, max 100) and `?offset` (default 0):
- `GET /public/:token?limit=10&offset=0` → `{ folders, files, total }`
- `GET /public/:token/folders/:folderId?limit=10&offset=20` → nested folder page
Use `total` for "1–10 of 27" and `offset += limit` for the next page — same as the room list.

## Nested folders
To drill into a subfolder on the public page, call the nested-folder endpoint (public, no auth):
```
GET /public/:token/folders/:folderId?limit=10&offset=0
→ { type: 'FOLDER', folder: { id, name }, contents: { folders, files, total } }
```
- Works for DATAROOM and FOLDER links
- Returns 404 if the folder is outside the link's scope
- Add it to `publicLinkApi`:
  ```ts
  openFolder: (token: string, folderId: string, limit?: number, offset?: number) => {
      const q = new URLSearchParams()
      if (limit !== undefined) q.set('limit', String(limit))
      if (offset !== undefined) q.set('offset', String(offset))
      const query = q.toString()
      return api.get<PublicPayload>(`/public/${token}/folders/${folderId}${query ? '?' + query : ''}`, { auth: false })
  },
  ```

## What to implement
Replace the stub block with a read-only viewer:
- **DATAROOM / FOLDER**: render the list of `contents.folders` and `contents.files`
  - folders: name + icon; clicking a folder calls `openFolder(token, folder.id)` and shows that
    folder's contents (breadcrumb / back navigation recommended)
  - files: name, `mimeType`, `sizeBytes` (format bytes → KB/MB)
  - pagination with `total` (page indicator + prev/next or infinite scroll)
- **FILE**: render file preview or a download link (the payload has the `File` metadata)
- No auth required; this is a **read-only** view — no edit controls, no upload, no share buttons.

## Reference
- `PublicPayload` type in `client/src/types.ts`
- `Folder` / `File` types in `client/src/types.ts`
- API: [API_GUIDE.md](../API_GUIDE.md) — "Public links" section
