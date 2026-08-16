import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, registerUser, startTestApp, uploadFile, type TestApp } from './helpers/test-app';

interface Room {
    id: string;
}
interface Folder {
    id: string;
    dataRoomId: string;
    parentFolderId: string | null;
    name: string;
}

async function createRoom(baseUrl: string, token: string, name: string): Promise<Room> {
    const { status, body } = await api(baseUrl, 'POST', '/api/data-rooms', {
        token,
        body: { name },
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

async function makeRoomPublic(baseUrl: string, token: string, roomId: string): Promise<void> {
    const { status } = await api(baseUrl, 'PATCH', `/api/data-rooms/${roomId}`, {
        token,
        body: { visibility: 'PUBLIC' },
    });
    if (status >= 400) {
        throw new Error(`makeRoomPublic failed ${status}`);
    }
}

describe('Files routes', () => {
    let ctx: TestApp;
    let user: { token: string; id: string };
    let other: { token: string; id: string };
    let room: Room;
    let folder: Folder;

    before(async () => {
        ctx = await startTestApp();
        user = await registerUser(ctx.baseUrl, 'files-owner@test.com');
        other = await registerUser(ctx.baseUrl, 'files-other@test.com');
        room = await createRoom(ctx.baseUrl, user.token, 'Files Room');
        folder = await createFolder(ctx.baseUrl, user.token, room.id, 'docs');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('uploads a file and returns the File metadata', async () => {
        const { status, body } = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'report.pdf',
            mimeType: 'application/pdf',
            data: Buffer.from('pdf-content'),
        });
        assert.equal(status, 201);
        const b = body as { id: string; name: string };
        assert.equal(b.name, 'report.pdf');
        assert.ok(b.id);
    });

    it('rejects a disallowed file type with 400', async () => {
        const form = new FormData();
        form.append('dataRoomId', room.id);
        form.append('file', new Blob([Buffer.from('evil')], { type: 'application/x-msdownload' }), 'evil.exe');
        const { status } = await api(base(), 'POST', '/api/files', { token: user.token, body: form });
        assert.equal(status, 400);
    });

    it('auto-suffixes a duplicate file name', async () => {
        await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'report.pdf',
            mimeType: 'application/pdf',
        });
        const { status, body: second } = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'report.pdf',
            mimeType: 'application/pdf',
        });
        assert.equal(status, 201);
        assert.equal((second as { name: string }).name, 'report (2).pdf');
    });

    it('rejects upload to another user room with 404', async () => {
        const { status } = await uploadFile(base(), {
            token: other.token,
            dataRoomId: room.id,
            name: 'x.pdf',
            mimeType: 'application/pdf',
        });
        assert.equal(status, 404);
    });

    it('gets a file', async () => {
        const created = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            name: 'view.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (created.body as { id: string }).id;
        const { status, body } = await api(base(), 'GET', `/api/files/${fileId}`, { token: user.token });
        assert.equal(status, 200);
        assert.equal((body as { name: string }).name, 'view.pdf');
    });

    it('returns a download URL', async () => {
        const created = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            name: 'dl.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (created.body as { id: string }).id;
        const { status, body } = await api(base(), 'GET', `/api/files/${fileId}/download`, { token: user.token });
        assert.equal(status, 200);
        assert.ok((body as { url: string }).url.includes('X-Amz-Signature'));
    });

    it('renames and moves a file', async () => {
        const created = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            name: 'move.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (created.body as { id: string }).id;
        const { status, body } = await api(base(), 'PATCH', `/api/files/${fileId}`, {
            token: user.token,
            body: { name: 'moved.pdf', folderId: folder.id },
        });
        assert.equal(status, 200);
        assert.equal((body as { name: string }).name, 'moved.pdf');
        assert.equal((body as { folderId: string | null }).folderId, folder.id);
    });

    it('deletes a file', async () => {
        const created = await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            name: 'del.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (created.body as { id: string }).id;
        const { status } = await api(base(), 'DELETE', `/api/files/${fileId}`, { token: user.token });
        assert.equal(status, 200);
        const gone = await api(base(), 'GET', `/api/files/${fileId}`, { token: user.token });
        assert.equal(gone.status, 404);
    });
});

describe('Folders routes', () => {
    let ctx: TestApp;
    let user: { token: string; id: string };
    let other: { token: string; id: string };
    let room: Room;

    before(async () => {
        ctx = await startTestApp();
        user = await registerUser(ctx.baseUrl, 'folders-owner@test.com');
        other = await registerUser(ctx.baseUrl, 'folders-other@test.com');
        room = await createRoom(ctx.baseUrl, user.token, 'Folders Room');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('creates a folder', async () => {
        const { status, body } = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'fin' },
        });
        assert.equal(status, 201);
        assert.equal((body as Folder).name, 'fin');
    });

    it('renames a folder', async () => {
        const created = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'old' },
        });
        const folderId = (created.body as Folder).id;
        const { status, body } = await api(base(), 'PATCH', `/api/folders/${folderId}`, {
            token: user.token,
            body: { name: 'new' },
        });
        assert.equal(status, 200);
        assert.equal((body as Folder).name, 'new');
    });

    it('moves a folder into another folder', async () => {
        const a = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'source' },
        });
        const b = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'target' },
        });
        const sourceId = (a.body as Folder).id;
        const targetId = (b.body as Folder).id;
        const { status, body } = await api(base(), 'PATCH', `/api/folders/${sourceId}`, {
            token: user.token,
            body: { parentId: targetId },
        });
        assert.equal(status, 200);
        assert.equal((body as Folder).parentFolderId, targetId);
    });

    it('rejects moving a folder into itself (409)', async () => {
        const created = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'self-move' },
        });
        const folderId = (created.body as Folder).id;
        const { status } = await api(base(), 'PATCH', `/api/folders/${folderId}`, {
            token: user.token,
            body: { parentId: folderId },
        });
        assert.equal(status, 409);
    });

    it('rejects moving a folder into its own child (409 cycle)', async () => {
        const parent = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'cycle-parent' },
        });
        const child = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'cycle-child', parentId: (parent.body as Folder).id },
        });
        const { status } = await api(base(), 'PATCH', `/api/folders/${(parent.body as Folder).id}`, {
            token: user.token,
            body: { parentId: (child.body as Folder).id },
        });
        assert.equal(status, 409);
    });

    it('rejects moving a folder into a folder of another room (404)', async () => {
        const otherRoom = await api(base(), 'POST', '/api/data-rooms', {
            token: user.token,
            body: { name: 'Other Room' },
        });
        const otherFolder = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: (otherRoom.body as { id: string }).id, name: 'elsewhere' },
        });
        const created = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'move-me' },
        });
        const { status } = await api(base(), 'PATCH', `/api/folders/${(created.body as Folder).id}`, {
            token: user.token,
            body: { parentId: (otherFolder.body as Folder).id },
        });
        assert.equal(status, 404);
    });

    it('lists folder contents', async () => {
        const created = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'parent' },
        });
        const folderId = (created.body as Folder).id;
        await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            folderId,
            name: 'inside.pdf',
            mimeType: 'application/pdf',
        });
        const { status, body } = await api(base(), 'GET', `/api/folders/${folderId}/contents`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const contents = body as { folders: Folder[]; files: { name: string }[] };
        assert.equal(contents.files[0].name, 'inside.pdf');
    });

    it('deletes a folder with contents and returns counts', async () => {
        const parent = await createFolder(base(), user.token, room.id, 'subtree');
        const child = await createFolder(base(), user.token, room.id, 'child', parent.id);
        await uploadFile(base(), {
            token: user.token,
            dataRoomId: room.id,
            folderId: child.id,
            name: 'a.pdf',
            mimeType: 'application/pdf',
        });
        const { status, body } = await api(base(), 'DELETE', `/api/folders/${parent.id}`, {
            token: user.token,
        });
        assert.equal(status, 200);
        assert.deepEqual(body as { deletedFolders: number; deletedFiles: number }, {
            deletedFolders: 2,
            deletedFiles: 1,
        });
        const gone = await api(base(), 'GET', `/api/folders/${parent.id}`, { token: user.token });
        assert.equal(gone.status, 404);
    });

    it('rejects operations on another user folder with 404', async () => {
        const created = await api(base(), 'POST', '/api/folders', {
            token: user.token,
            body: { dataRoomId: room.id, name: 'private' },
        });
        const folderId = (created.body as Folder).id;
        const { status } = await api(base(), 'PATCH', `/api/folders/${folderId}`, {
            token: other.token,
            body: { name: 'hacked' },
        });
        assert.equal(status, 404);
    });
});

describe('Read-only shared access', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let guest: { token: string; id: string };
    let room: Room;
    let folder: Folder;
    let fileId: string;

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'ro-owner@test.com');
        guest = await registerUser(ctx.baseUrl, 'ro-guest@test.com');
        room = await createRoom(ctx.baseUrl, owner.token, 'RO Room');
        folder = await createFolder(ctx.baseUrl, owner.token, room.id, 'docs');
        const file = await uploadFile(ctx.baseUrl, {
            token: owner.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'doc.pdf',
            mimeType: 'application/pdf',
        });
        fileId = (file.body as { id: string }).id;
        await api(ctx.baseUrl, 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('guest can read shared room contents', async () => {
        const { status, body } = await api(base(), 'GET', `/api/data-rooms/${room.id}/contents`, {
            token: guest.token,
        });
        assert.equal(status, 200);
        assert.equal((body as { folders: unknown[] }).folders.length, 1);
    });

    it('guest can read shared folder contents', async () => {
        const { status, body } = await api(base(), 'GET', `/api/folders/${folder.id}/contents`, {
            token: guest.token,
        });
        assert.equal(status, 200);
        assert.equal((body as { files: unknown[] }).files.length, 1);
    });

    it('guest can read and download a shared file', async () => {
        const getRes = await api(base(), 'GET', `/api/files/${fileId}`, { token: guest.token });
        assert.equal(getRes.status, 200);
        const dlRes = await api(base(), 'GET', `/api/files/${fileId}/download`, { token: guest.token });
        assert.equal(dlRes.status, 200);
    });

    it('guest cannot write to the shared room', async () => {
        const rename = await api(base(), 'PATCH', `/api/data-rooms/${room.id}`, {
            token: guest.token,
            body: { name: 'hacked' },
        });
        assert.equal(rename.status, 404);
        const createFolder = await api(base(), 'POST', '/api/folders', {
            token: guest.token,
            body: { dataRoomId: room.id, name: 'x' },
        });
        assert.equal(createFolder.status, 404);
        const upload = await uploadFile(base(), {
            token: guest.token,
            dataRoomId: room.id,
            name: 'y.pdf',
            mimeType: 'application/pdf',
        });
        assert.equal(upload.status, 404);
        const deleteFile = await api(base(), 'DELETE', `/api/files/${fileId}`, { token: guest.token });
        assert.equal(deleteFile.status, 404);
    });

    it('non-shared user still gets 404', async () => {
        const outsider = await registerUser(base(), 'ro-outsider@test.com');
        const { status } = await api(base(), 'GET', `/api/data-rooms/${room.id}/contents`, {
            token: outsider.token,
        });
        assert.equal(status, 404);
    });
});

describe('Shares routes', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let guest: { token: string; id: string };
    let outsider: { token: string; id: string };
    let room: Room;

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'shares-owner@test.com');
        guest = await registerUser(ctx.baseUrl, 'shares-guest@test.com');
        outsider = await registerUser(ctx.baseUrl, 'shares-outsider@test.com');
        room = await createRoom(ctx.baseUrl, owner.token, 'Shares Room');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('creates a permissioned share', async () => {
        const { status, body } = await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
        assert.equal(status, 201);
        assert.equal((body as { userId: string }).userId, guest.id);
    });

    it('rejects duplicate share with 409', async () => {
        const second = await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
        assert.equal(second.status, 409);
    });

    it('lists shares', async () => {
        const { status, body } = await api(base(), 'GET', '/api/shares?shareableType=DATAROOM&shareableId=' + room.id, {
            token: owner.token,
        });
        assert.equal(status, 200);
        assert.equal((body as unknown[]).length, 1);
    });

    it('rejects sharing by non-owner with 404', async () => {
        const { status } = await api(base(), 'POST', '/api/shares', {
            token: outsider.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
        assert.equal(status, 404);
    });

    it('revokes a share', async () => {
        const created = await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: outsider.id },
        });
        const shareId = (created.body as { id: string }).id;
        const { status } = await api(base(), 'DELETE', `/api/shares/${shareId}`, { token: owner.token });
        assert.equal(status, 200);
        const list = await api(base(), 'GET', '/api/shares?shareableType=DATAROOM&shareableId=' + room.id, {
            token: owner.token,
        });
        assert.equal((list.body as unknown[]).length, 1);
    });
});

describe('Public links routes', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let room: Room;

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'links-owner@test.com');
        room = await createRoom(ctx.baseUrl, owner.token, 'Links Room');
        await makeRoomPublic(ctx.baseUrl, owner.token, room.id);
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('creates a public link', async () => {
        const { status, body } = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        assert.equal(status, 201);
        assert.ok((body as { token: string }).token);
        assert.ok((body as { url: string }).url.includes('/api/public/'));
    });

    it('returns the same link for the same item', async () => {
        const first = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const second = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        assert.equal((first.body as { token: string }).token, (second.body as { token: string }).token);
    });

    it('rejects opening a public link without auth (404)', async () => {
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status } = await api(base(), 'GET', `/api/public/${token}`);
        assert.equal(status, 404);
    });

    it('opens a public link while authenticated', async () => {
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status, body } = await api(base(), 'GET', `/api/public/${token}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        assert.equal((body as { type: string }).type, 'DATAROOM');
    });

    it('revokes a public link', async () => {
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status } = await api(base(), 'DELETE', `/api/public-links/${token}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        const gone = await api(base(), 'GET', `/api/public/${token}`, { token: owner.token });
        assert.equal(gone.status, 404);
    });

    it('rejects creating a public link for a private room (409)', async () => {
        const privateRoom = await createRoom(base(), owner.token, 'Private Room');
        const { status } = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: privateRoom.id },
        });
        assert.equal(status, 409);
    });

    it('includes the member list when opening a public room (emails masked)', async () => {
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status, body } = await api(base(), 'GET', `/api/public/${token}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        const payload = body as { users: Array<{ id: string; email: string }> };
        assert.ok(payload.users.length >= 1);
        assert.ok(payload.users.every((u) => u.email.includes('***')), 'emails must be masked');
        assert.ok(
            payload.users.every((u) => u.email !== 'links-owner@test.com'),
            'full email must not leak',
        );
    });

    it('includes subtree stats in the public folder payload', async () => {
        const folder = await createFolder(base(), owner.token, room.id, 'Stats Folder');
        await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'a.pdf',
            mimeType: 'application/pdf',
            data: Buffer.alloc(100),
        });
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'FOLDER', shareableId: folder.id },
        });
        const token = (created.body as { token: string }).token;
        const { status, body } = await api(base(), 'GET', `/api/public/${token}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        const stats = (body as { stats: { folders: number; files: number; sizeBytes: number } }).stats;
        assert.equal(stats.folders, 1);
        assert.equal(stats.files, 1);
        assert.equal(stats.sizeBytes, 100);
    });

    it('includes per-folder stats in the public contents list', async () => {
        const folderA = await createFolder(base(), owner.token, room.id, 'Folder A');
        await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            folderId: folderA.id,
            name: 'a.pdf',
            mimeType: 'application/pdf',
            data: Buffer.alloc(100),
        });
        const child = await createFolder(base(), owner.token, room.id, 'Child', folderA.id);
        await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            folderId: child.id,
            name: 'c.pdf',
            mimeType: 'application/pdf',
            data: Buffer.alloc(200),
        });
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status, body } = await api(base(), 'GET', `/api/public/${token}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        const folders = (body as {
            contents: { folders: Array<{ id: string; stats: { folders: number; files: number; sizeBytes: number } }> };
        }).contents.folders;
        const target = folders.find((f) => f.id === folderA.id);
        assert.ok(target, 'folder must be present in the public list');
        assert.equal(target.stats.folders, 2);
        assert.equal(target.stats.files, 2);
        assert.equal(target.stats.sizeBytes, 300);
    });

    it('lets a link viewer download a file in the room', async () => {
        const folder = await createFolder(base(), owner.token, room.id, 'Download Folder');
        const uploaded = await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            folderId: folder.id,
            name: 'dl.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (uploaded.body as { id: string }).id;
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const guest = await registerUser(base(), 'links-downloader@test.com');
        const { status, body } = await api(base(), 'GET', `/api/public/${token}/files/${fileId}/download`, {
            token: guest.token,
        });
        assert.equal(status, 200);
        assert.ok((body as { url: string }).url.includes('X-Amz-Signature'));
    });

    it('rejects download of a file outside the link scope (404)', async () => {
        const folderA = await createFolder(base(), owner.token, room.id, 'Scope A');
        const folderB = await createFolder(base(), owner.token, room.id, 'Scope B');
        const uploaded = await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            folderId: folderA.id,
            name: 'outside.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (uploaded.body as { id: string }).id;
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'FOLDER', shareableId: folderB.id },
        });
        const token = (created.body as { token: string }).token;
        const guest = await registerUser(base(), 'links-scope@test.com');
        const { status } = await api(base(), 'GET', `/api/public/${token}/files/${fileId}/download`, {
            token: guest.token,
        });
        assert.equal(status, 404);
    });

    it('rejects download without auth (404)', async () => {
        const uploaded = await uploadFile(base(), {
            token: owner.token,
            dataRoomId: room.id,
            name: 'anon.pdf',
            mimeType: 'application/pdf',
        });
        const fileId = (uploaded.body as { id: string }).id;
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        const { status } = await api(base(), 'GET', `/api/public/${token}/files/${fileId}/download`);
        assert.equal(status, 404);
    });
});

describe('User search', () => {
    let ctx: TestApp;
    let user: { token: string; id: string };

    before(async () => {
        ctx = await startTestApp();
        user = await registerUser(ctx.baseUrl, 'search-owner@test.com');
        await registerUser(ctx.baseUrl, 'alice@example.com', 'Alice');
        await registerUser(ctx.baseUrl, 'alice2@example.com', 'Alice 2');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('finds a user only by exact email match', async () => {
        const exact = await api(base(), 'GET', `/api/users?email=${encodeURIComponent('alice@example.com')}`, {
            token: user.token,
        });
        assert.equal(exact.status, 200);
        const users = exact.body as Array<{ id: string; email: string; name: string }>;
        assert.equal(users.length, 1);
        assert.equal(users[0].email, 'alice@example.com');
        assert.ok(users.every((u) => !('passwordHash' in u)));

        const substring = await api(base(), 'GET', '/api/users?email=alice', {
            token: user.token,
        });
        assert.equal((substring.body as unknown[]).length, 0);
    });

    it('returns empty for empty query', async () => {
        const { status, body } = await api(base(), 'GET', '/api/users?email=', {
            token: user.token,
        });
        assert.equal(status, 200);
        assert.deepEqual(body as unknown[], []);
    });

    it('requires auth', async () => {
        const { status } = await api(base(), 'GET', '/api/users?email=alice');
        assert.equal(status, 401);
    });
});

describe('Share recipient info', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let guest: { token: string; id: string };
    let room: Room;

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'sinfo-owner@test.com');
        guest = await registerUser(ctx.baseUrl, 'sinfo-guest@example.com', 'Guest User');
        room = await createRoom(ctx.baseUrl, owner.token, 'Share Info Room');
        await api(ctx.baseUrl, 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('includes recipient user info in the share list', async () => {
        const { status, body } = await api(base(), 'GET', `/api/shares?shareableType=DATAROOM&shareableId=${room.id}`, {
            token: owner.token,
        });
        assert.equal(status, 200);
        const shares = body as Array<{
            userId: string;
            user?: { id: string; email: string; name: string };
        }>;
        assert.equal(shares[0].user?.email, 'sinfo-guest@example.com');
        assert.equal(shares[0].user?.name, 'Guest User');
    });

    it('includes user info on share creation', async () => {
        const other = await registerUser(base(), 'sinfo-other@example.com', 'Other');
        const { body } = await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: other.id },
        });
        assert.equal((body as { user?: { email: string } }).user?.email, 'sinfo-other@example.com');
    });
});

describe('Pagination and search', () => {
    let ctx: TestApp;
    let user: { token: string; id: string };
    let room: Room;
    let folder: Folder;

    before(async () => {
        ctx = await startTestApp();
        user = await registerUser(ctx.baseUrl, 'paging@test.com');
        room = await createRoom(ctx.baseUrl, user.token, 'Paging Room');
        folder = await createFolder(ctx.baseUrl, user.token, room.id, 'Alpha');
        for (let i = 1; i <= 5; i++) {
            await uploadFile(ctx.baseUrl, {
                token: user.token,
                dataRoomId: room.id,
                folderId: folder.id,
                name: `document-${i}.pdf`,
                mimeType: 'application/pdf',
                data: Buffer.alloc(i * 100),
            });
        }
        await api(ctx.baseUrl, 'POST', '/api/data-rooms', { token: user.token, body: { name: 'Second' } });
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('returns total + paginated files in folder contents', async () => {
        const { status, body } = await api(base(), 'GET', `/api/folders/${folder.id}/contents?limit=2`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const contents = body as { folders: unknown[]; files: unknown[]; total: number };
        assert.equal(contents.files.length, 2);
        assert.equal(contents.total, 5);
    });

    it('honors offset', async () => {
        const { body } = await api(base(), 'GET', `/api/folders/${folder.id}/contents?limit=2&offset=4`, {
            token: user.token,
        });
        const contents = body as { files: Array<{ name: string }>; total: number };
        assert.equal(contents.files.length, 1);
        assert.equal(contents.files[0].name, 'document-5.pdf');
    });

    it('searches files across the room', async () => {
        const { status, body } = await api(base(), 'GET', `/api/data-rooms/${room.id}/search?q=document-3`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const result = body as { files: Array<{ name: string }>; folders: unknown[]; total: number };
        assert.equal(result.files.length, 1);
        assert.equal(result.files[0].name, 'document-3.pdf');
    });

    it('searches folders across the room', async () => {
        const { status, body } = await api(base(), 'GET', `/api/data-rooms/${room.id}/search?q=alph`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const result = body as { files: unknown[]; folders: Array<{ name: string }>; total: number };
        assert.equal(result.folders.length, 1);
        assert.equal(result.folders[0].name, 'Alpha');
    });

    it('returns room subtree stats', async () => {
        const { status, body } = await api(base(), 'GET', `/api/data-rooms/${room.id}/stats`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const stats = body as { folders: number; files: number; sizeBytes: number };
        assert.equal(stats.folders, 1);
        assert.equal(stats.files, 5);
        assert.equal(stats.sizeBytes, 1500);
    });

    it('returns folder subtree stats', async () => {
        const { status, body } = await api(base(), 'GET', `/api/folders/${folder.id}/stats`, {
            token: user.token,
        });
        assert.equal(status, 200);
        const stats = body as { folders: number; files: number; sizeBytes: number };
        assert.equal(stats.folders, 1);
        assert.equal(stats.files, 5);
        assert.equal(stats.sizeBytes, 1500);
    });
});

describe('Presence (auto-marking)', () => {
    let ctx: TestApp;
    let owner: { token: string; id: string };
    let guest: { token: string; id: string };

    before(async () => {
        ctx = await startTestApp();
        owner = await registerUser(ctx.baseUrl, 'presence-owner@test.com');
        guest = await registerUser(ctx.baseUrl, 'presence-guest@test.com');
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    it('listing room contents marks the user as active', async () => {
        const room = await createRoom(base(), owner.token, 'Presence Contents');
        await api(base(), 'GET', `/api/data-rooms/${room.id}/contents`, { token: owner.token });
        const { body } = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
        const active = body as { activeUsers: Array<{ id: string }> };
        assert.ok(active.activeUsers.some((u) => u.id === owner.id));
    });

    it('separates invited users from currently-active users', async () => {
        const room = await createRoom(base(), owner.token, 'Presence Split');
        await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
        const idle = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
        const idleBody = idle.body as { users: unknown[]; activeUsers: unknown[] };
        assert.equal(idleBody.users.length, 2);
        assert.equal(idleBody.activeUsers.length, 0);

        await api(base(), 'GET', `/api/data-rooms/${room.id}/contents`, { token: guest.token });
        const active = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
        const activeBody = active.body as { activeUsers: Array<{ id: string }> };
        assert.equal(activeBody.activeUsers.length, 1);
        assert.equal(activeBody.activeUsers[0].id, guest.id);
    });

    it('opening a public link while authenticated marks a member as active', async () => {
        const room = await createRoom(base(), owner.token, 'Presence Link');
        await makeRoomPublic(base(), owner.token, room.id);
        await api(base(), 'POST', '/api/shares', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id, userId: guest.id },
        });
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        await api(base(), 'GET', `/api/public/${token}`, { token: guest.token });
        const { body } = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
        const active = body as { activeUsers: Array<{ id: string }> };
        assert.ok(active.activeUsers.some((u) => u.id === guest.id));
    });

    it('a read-only link viewer appears in activeUsers but not in invited users', async () => {
        const room = await createRoom(base(), owner.token, 'Presence Viewer');
        await makeRoomPublic(base(), owner.token, room.id);
        const created = await api(base(), 'POST', '/api/public-links', {
            token: owner.token,
            body: { shareableType: 'DATAROOM', shareableId: room.id },
        });
        const token = (created.body as { token: string }).token;
        await api(base(), 'GET', `/api/public/${token}`, { token: guest.token });
        const { body } = await api(base(), 'GET', `/api/data-rooms/${room.id}`, { token: owner.token });
        const payload = body as { users: Array<{ id: string }>; activeUsers: Array<{ id: string }> };
        assert.ok(!payload.users.some((u) => u.id === guest.id), 'viewer must not be an invited member');
        assert.ok(payload.activeUsers.some((u) => u.id === guest.id), 'viewer should be in currently-active');
    });
});
