import type { DataRoom } from '../interfaces/data-rooms.interfaces';
import type { Folder } from '../interfaces/folders.interfaces';
import type { File } from '../interfaces/files.interfaces';
import type { User } from '../interfaces/auth.interfaces';

interface DateRecord {
    createdAt: Date;
    updatedAt: Date;
}

interface UserRecord {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

export function mapUser(user: UserRecord): User {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
    };
}

export function mapDataRoom(room: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    visibility: 'PUBLIC' | 'PRIVATE';
} & DateRecord): DataRoom {
    return {
        id: room.id,
        ownerId: room.ownerId,
        name: room.name,
        description: room.description,
        visibility: room.visibility,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
    };
}

export function mapFolder(folder: { id: string; dataRoomId: string; parentFolderId: string | null; name: string } & DateRecord): Folder {
    return {
        id: folder.id,
        dataRoomId: folder.dataRoomId,
        parentFolderId: folder.parentFolderId,
        name: folder.name,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
    };
}

export function mapFile(file: {
    id: string;
    dataRoomId: string;
    folderId: string | null;
    name: string;
    mimeType: string;
    sizeBytes: number;
} & DateRecord): File {
    return {
        id: file.id,
        dataRoomId: file.dataRoomId,
        folderId: file.folderId,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
    };
}
