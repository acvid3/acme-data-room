# TESTS.md

Every server test and what it verifies. Run with `npm test` from `server/` (builds, resets the
`dataroom_test` database, boots the compiled server as a subprocess, and hits real HTTP routes).

Status: **73 tests, all passing.** Tests that expose a weakness are marked `VULNERABILITY` /
`GAP` and assert the *current* behavior so regressions surface later.

## Running

```bash
cd server
npm test
```

`npm test` runs: `nest build` → `prisma migrate reset --force` on `dataroom_test` → boots
`dist/main.js` per test file → executes `tests/*.test.ts` via `node --test`.

## Auth — `tests/auth.test.ts`

| Test | Route | Expected | Notes |
| ---- | ----- | -------- | ----- |
| registers a user | POST /api/auth/register | 201 + token | happy path |
| duplicate email | POST /api/auth/register | 409 | ConflictException works |
| **VULNERABILITY** invalid email format | register | 201 | no email format validation, `not-an-email` accepted |
| rejects empty name | register | 400 | validation (Matches \S) |
| rejects missing password | register | 400 | validation |
| rejects empty body | register | 400 | validation |
| rejects too-short password | register | 400 | validation (MinLength 8) |
| logs in correctly | POST /api/auth/login | 201 + token | happy path |
| wrong password | login | 401 | good |
| unknown email | login | 401 | good, no user-exists leak |
| rejects empty password | login | 400 | validation |
| rejects short password | login | 400 | validation |
| me with token | GET /api/auth/me | 200 | happy path |
| me without token | me | 401 | guard works |
| me garbage token | me | 401 | good |
| me forged token | me | 401 | good |
| rate limit exceeded | POST /api/auth/* | 429 | RateLimitMiddleware on auth (100 req / 60s) |

**Auth fixed:** global `ValidationPipe` + DTOs (class-validator) now return 400 instead of 500s;
email format, non-empty names, password length enforced; rate limit added on `/api/auth/*`.

## Data Rooms — `tests/data-rooms.test.ts`

| Test | Route | Expected | Notes |
| ---- | ----- | -------- | ----- |
| creates room | POST /api/data-rooms | 201 | happy path |
| rejects empty name | create | 400 | validation (Matches \S) |
| rejects missing name | create | 400 | validation |
| no auth | create | 401 | guard works |
| lists own rooms only | GET /api/data-rooms | 200 | ownerId filter |
| get own room | GET /api/data-rooms/:id | 200 | happy path |
| other user's room | get | 404 | no existence leak (good) |
| unknown id | get | 404 | good |
| rename own room | PATCH /api/data-rooms/:id | 200 | good |
| rejects rename to empty | PATCH | 400 | validation |
| other user rename | PATCH | 404 | no 403/leak (good) |
| nested folder | POST /:id/folders | 201 | parentId wiring |
| dup name at room root | folders | 201 | auto-suffix (`dup (1)`) — NULL trap fixed by partial unique index |
| dup name in non-root parent | folders | 201 | auto-suffix (`dup (1)`) |
| same name different parents | folders | 201 | unique constraint scoped correctly (good) |
| other user creates folder | folders | 404 | ownership check (good) |
| parent from another room | folders | 404 | cross-room parent rejected (good) |
| dup file name in folder | files | 201 | auto-suffix (`report (1).pdf`) |
| dup file name different folders | files | 201 | scoped correctly (good) |
| deletes empty room | DELETE /api/data-rooms/:id | 200 | good |
| delete room with contents | DELETE | 200 | cascade delete works (FK ON DELETE CASCADE) |
| other user delete | DELETE | 404 | good |

## Files / Folders / Shares / Public links — `tests/features.test.ts`

Full functional coverage of the formerly-501 routes.

| Test | Route | Expected | Notes |
| ---- | ----- | -------- | ----- |
| upload file | POST /api/files | 201 + presigned URL | returns `{file, uploadUrl}` (S3 presigned PUT) |
| duplicate file name | upload | 201 | auto-suffix |
| upload to other's room | upload | 404 | ownership check |
| get file | GET /api/files/:id | 200 | returns File |
| download file | GET /api/files/:id/download | 200 | returns presigned GET URL |
| rename + move file | PATCH /api/files/:id | 200 | name + folderId |
| delete file | DELETE /api/files/:id | 200 | removes from DB + S3 |
| create folder | POST /api/folders | 201 | standalone with dataRoomId |
| rename folder | PATCH /api/folders/:id | 200 | conflict-safe |
| folder contents | GET /api/folders/:id/contents | 200 | nested files+folders |
| delete folder with contents | DELETE /api/folders/:id | 200 | returns `DeleteFolderResult` counts (folders=2, files=1) |
| other user folder op | PATCH folder | 404 | ownership check |
| create permissioned share | POST /api/shares | 201 | DATAROOM/FOLDER/FILE |
| duplicate share | shares | 409 | ConflictException |
| list shares | GET /api/shares | 200 | by shareableType+Id |
| non-owner share | shares | 404 | ownership check |
| revoke share | DELETE /api/shares/:id | 200 | |
| create public link | POST /api/public-links | 201 + token | returns same token for same item |
| open public link | GET /api/public/:token | 200 | unauthenticated read |
| revoke public link | DELETE /api/public-links/:token | 200 | then GET → 404 |

### Read-only shared access — `tests/features.test.ts` ("Read-only shared access")

Per TASK: *"the recipient gets read-only access to the shared item (including its nested content)"*.
Implemented via `services/access.service.ts` (`canRead`: owner OR share recipient, with ancestor
resolution for nested folders/files).

| Test | Expected |
| ---- | -------- |
| guest reads shared room contents | 200 |
| guest reads shared folder contents | 200 |
| guest reads + downloads shared file | 200 |
| guest rename/create-folder/upload/delete-file | 404 (write blocked) |
| non-shared user reads room | 404 |

Also verified manually against Backblaze B2 (prod): presigned PUT → GET round-trip → DELETE works,
including browser-style PUT without checksum headers.

## Findings summary

1. ~~**No request validation anywhere**~~ **FIXED**: global `ValidationPipe` + DTOs (`dto/*.dto.ts`)
   return 400 instead of 500; email format, non-empty names, password length, file `size`/`mimeType`
   now validated.
2. ~~**No email format validation**~~ **FIXED**: `@IsEmail()` on register/login.
3. ~~**Duplicate names crash with 500**~~ **FIXED**: auto-suffix resolver
   (`utils/name-conflicts.ts`) → `report (1).pdf`, `dup (1)`.
4. ~~**NULL trap at room root**~~ **FIXED**: partial unique indexes
   (`Folder_root_name_key`, `File_root_name_key`) in migration `20260815132900_root_partial_unique`.
5. ~~**No cascade delete**~~ **FIXED**: FK `ON DELETE CASCADE` on Folder/File → DataRoom and
   Folder self-relation; `FoldersService.remove` returns `DeleteFolderResult` subtree counts.
6. ~~**Folders/Files/Sharing routes unimplemented**~~ **FIXED**: full feature set live in
   `tests/features.test.ts`.
7. **Rate limit is in-memory** (per-process) — fine for single instance, reset on restart; swap for a
   distributed store if scaling horizontally.
