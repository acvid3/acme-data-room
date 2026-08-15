-- Enforce unique names among siblings at the room root.
-- Postgres treats NULLs as distinct, so the composite unique index on
-- (dataRoomId, parentFolderId, name) does not fire when parentFolderId IS NULL.
-- These partial unique indexes cover the root level.

CREATE UNIQUE INDEX "Folder_root_name_key" ON "Folder"("dataRoomId", "name") WHERE "parentFolderId" IS NULL;
CREATE UNIQUE INDEX "File_root_name_key" ON "File"("dataRoomId", "name") WHERE "folderId" IS NULL;
