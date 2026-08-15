import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, registerUser, startTestApp, uploadFile, type TestApp } from './helpers/test-app';

interface Room {
    id: string;
    ownerId: string;
    name: string;
}
interface Folder {
    id: string;
    dataRoomId: string;
    parentFolderId: string | null;
    name: string;
}

async function createRoom(baseUrl: string, token: string, name: string, description?: string): Promise<Room> {
    const { status, body } = await api(baseUrl, 'POST', '/api/data-rooms', {
        token,
        body: { name, description },
    });
    if (status >= 400) {
        throw new Error(`createRoom failed ${status}: ${JSON.stringify(body)}`);
    }
    return body as Room;
}

async function createFolder(
    baseUrl: string,
    token: string,
    roomId: string,
    name: string,
    parentId?: string,
): Promise<Folder> {
    const { status, body } = await api(baseUrl, 'POST', `/api/data-rooms/${roomId}/folders`, {
        token,
        body: { name, parentId },
    });
    if (status >= 400) {
        throw new Error(`createFolder failed ${status}: ${JSON.stringify(body)}`);
    }
    return body as Folder;
}

describe('Data Rooms routes', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let other: { token: string; id: string };

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'dr-owner@test.com');
        other = await registerUser(ctx.baseUrl, 'dr-other@test.com');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    describe('POST /api/data-rooms', () => {
        it('creates a data room', async () => {
            const { status, body } = await api(base(), 'POST', '/api/data-rooms', {
                token: owner.token,
                body: { name: 'Room A', description: 'desc' },
            });
            assert.equal(status, 201);
            assert.equal((body as Room).name, 'Room A');
        });

        it('rejects empty name with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/data-rooms', {
                token: owner.token,
                body: { name: '   ' },
            });
            assert.equal(status, 400);
        });

        it('rejects missing name with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/data-rooms', {
                token: owner.token,
                body: {},
            });
            assert.equal(status, 400);
        });

        it('rejects unauthenticated request with 401', async () => {
            const { status } = await api(base(), 'POST', '/api/data-rooms', {
                body: { name: 'No Auth' },
            });
            assert.equal(status, 401);
        });
    });

    describe('GET /api/data-rooms', () => {
        it('lists only own rooms (paginated)', async () => {
            const { status, body } = await api(base(), 'GET', '/api/data-rooms', {
                token: owner.token,
            });
            assert.equal(status, 200);
            const page = body as { items: Room[]; total: number };
            assert.ok(Array.isArray(page.items));
            assert.equal(page.total, page.items.length);
            assert.ok(page.items.every((r) => r.ownerId === owner.id));
        });

        it('honors limit/offset', async () => {
            const room = await createRoom(base(), owner.token, 'Room Pagination');
            const { body } = await api(base(), 'GET', '/api/data-rooms?limit=1&offset=0', {
                token: owner.token,
            });
            const page = body as { items: Room[]; total: number };
            assert.equal(page.items.length, 1);
            assert.ok(page.total >= 1);
            assert.equal(page.items[0].id, room.id);
        });
    });

    describe('GET /api/data-rooms/:id', () => {
        it('returns own room', async () => {
            const room = await createRoom(base(), owner.token, 'Room Get');
            const { status, body } = await api(base(), 'GET', `/api/data-rooms/${room.id}`, {
                token: owner.token,
            });
            assert.equal(status, 200);
            assert.equal((body as Room).id, room.id);
        });

        it('VULNERABILITY: returns 404 for other users room (no leak) — expected GOOD', async () => {
            const room = await createRoom(base(), owner.token, 'Room Secret');
            const { status } = await api(base(), 'GET', `/api/data-rooms/${room.id}`, {
                token: other.token,
            });
            assert.equal(status, 404);
        });

        it('returns 404 for unknown id', async () => {
            const { status } = await api(base(), 'GET', '/api/data-rooms/nonexistent-id', {
                token: owner.token,
            });
            assert.equal(status, 404);
        });
    });

    describe('PATCH /api/data-rooms/:id', () => {
        it('renames own room', async () => {
            const room = await createRoom(base(), owner.token, 'Room Rename');
            const { status, body } = await api(base(), 'PATCH', `/api/data-rooms/${room.id}`, {
                token: owner.token,
                body: { name: 'Renamed' },
            });
            assert.equal(status, 200);
            assert.equal((body as Room).name, 'Renamed');
        });

        it('rejects rename to empty with 400 (validation)', async () => {
            const room = await createRoom(base(), owner.token, 'Room ToEmpty');
            const { status } = await api(base(), 'PATCH', `/api/data-rooms/${room.id}`, {
                token: owner.token,
                body: { name: '   ' },
            });
            assert.equal(status, 400);
        });

        it('VULNERABILITY: returns 404 for other user (no 403/leak) — expected GOOD', async () => {
            const room = await createRoom(base(), owner.token, 'Room NotYours');
            const { status } = await api(base(), 'PATCH', `/api/data-rooms/${room.id}`, {
                token: other.token,
                body: { name: 'Hacked' },
            });
            assert.equal(status, 404);
        });
    });

    describe('Folders', () => {
        it('creates a nested folder', async () => {
            const room = await createRoom(base(), owner.token, 'Room Folders');
            const parent = await createFolder(base(), owner.token, room.id, 'parent');
            const { status, body } = await api(base(), 'POST', `/api/data-rooms/${room.id}/folders`, {
                token: owner.token,
                body: { name: 'child', parentId: parent.id },
            });
            assert.equal(status, 201);
            assert.equal((body as Folder).parentFolderId, parent.id);
        });

        it('duplicate folder name at room root gets auto-suffix (NULL trap fixed)', async () => {
            const room = await createRoom(base(), owner.token, 'Room Dupe Folder');
            await createFolder(base(), owner.token, room.id, 'dup');
            const { status, body } = await api(base(), 'POST', `/api/data-rooms/${room.id}/folders`, {
                token: owner.token,
                body: { name: 'dup' },
            });
            assert.equal(status, 201);
            assert.equal((body as Folder).name, 'dup (1)');
        });

        it('duplicate folder name in a non-root parent gets auto-suffix', async () => {
            const room = await createRoom(base(), owner.token, 'Room Dupe Folder Nested');
            const parent = await createFolder(base(), owner.token, room.id, 'parent');
            await createFolder(base(), owner.token, room.id, 'dup', parent.id);
            const { status, body } = await api(base(), 'POST', `/api/data-rooms/${room.id}/folders`, {
                token: owner.token,
                body: { name: 'dup', parentId: parent.id },
            });
            assert.equal(status, 201);
            assert.equal((body as Folder).name, 'dup (1)');
        });

        it('VULNERABILITY: same folder name in different parents is OK (expected GOOD)', async () => {
            const room = await createRoom(base(), owner.token, 'Room Same Name');
            const b = await createFolder(base(), owner.token, room.id, 'other');
            const result = await api(base(), 'POST', `/api/data-rooms/${room.id}/folders`, {
                token: owner.token,
                body: { name: 'dup', parentId: b.id },
            });
            assert.equal(result.status, 201);
            assert.equal((result.body as Folder).parentFolderId, b.id);
        });

        it('VULNERABILITY: creating folder in other room returns 404 (expected GOOD)', async () => {
            const room = await createRoom(base(), owner.token, 'Room Protected');
            const { status } = await api(base(), 'POST', `/api/data-rooms/${room.id}/folders`, {
                token: other.token,
                body: { name: 'intrude' },
            });
            assert.equal(status, 404);
        });

        it('VULNERABILITY: parent folder from another room is rejected', async () => {
            const roomA = await createRoom(base(), owner.token, 'Room Parent A');
            const roomB = await createRoom(base(), owner.token, 'Room Parent B');
            const parent = await createFolder(base(), owner.token, roomA.id, 'p');
            const { status } = await api(base(), 'POST', `/api/data-rooms/${roomB.id}/folders`, {
                token: owner.token,
                body: { name: 'child', parentId: parent.id },
            });
            assert.equal(status, 404);
        });

        it('duplicate file name in same folder gets auto-suffix', async () => {
            const room = await createRoom(base(), owner.token, 'Room Dupe File');
            const folder = await createFolder(base(), owner.token, room.id, 'f');
            const opts = {
                token: owner.token,
                dataRoomId: room.id,
                folderId: folder.id,
                name: 'report.pdf',
                mimeType: 'application/pdf',
            };
            const first = await uploadFile(base(), opts);
            assert.equal(first.status, 201);
            const { status, body } = await uploadFile(base(), opts);
            assert.equal(status, 201);
            assert.equal((body as { name: string }).name, 'report (1).pdf');
        });

        it('VULNERABILITY: duplicate file name in different folders is OK', async () => {
            const room = await createRoom(base(), owner.token, 'Room Dupe File 2');
            const f1 = await createFolder(base(), owner.token, room.id, 'f1');
            const f2 = await createFolder(base(), owner.token, room.id, 'f2');
            await uploadFile(base(), {
                token: owner.token,
                dataRoomId: room.id,
                folderId: f1.id,
                name: 'report.pdf',
                mimeType: 'application/pdf',
            });
            const { status } = await uploadFile(base(), {
                token: owner.token,
                dataRoomId: room.id,
                folderId: f2.id,
                name: 'report.pdf',
                mimeType: 'application/pdf',
            });
            assert.equal(status, 201);
        });
    });

    describe('DELETE /api/data-rooms/:id', () => {
        it('deletes an empty room', async () => {
            const room = await createRoom(base(), owner.token, 'Room Delete Empty');
            const { status } = await api(base(), 'DELETE', `/api/data-rooms/${room.id}`, {
                token: owner.token,
            });
            assert.equal(status, 200);
        });

        it('deleting a room with nested folders/files cascades cleanly', async () => {
            const room = await createRoom(base(), owner.token, 'Room Delete Full');
            const folder = await createFolder(base(), owner.token, room.id, 'f');
            await uploadFile(base(), {
                token: owner.token,
                dataRoomId: room.id,
                folderId: folder.id,
                name: 'x.pdf',
                mimeType: 'application/pdf',
            });
            const before = await api(base(), 'GET', `/api/data-rooms/${room.id}/contents`, {
                token: owner.token,
            });
            assert.equal((before.body as { folders: unknown[] }).folders.length, 1);
            const { status } = await api(base(), 'DELETE', `/api/data-rooms/${room.id}`, {
                token: owner.token,
            });
            assert.equal(status, 200);
            const after = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
            assert.equal(after.status, 404);
        });

        it('VULNERABILITY: other user cannot delete (404 expected GOOD)', async () => {
            const room = await createRoom(base(), owner.token, 'Room Keep');
            const { status } = await api(base(), 'DELETE', `/api/data-rooms/${room.id}`, {
                token: other.token,
            });
            assert.equal(status, 404);
        });
    });
});
