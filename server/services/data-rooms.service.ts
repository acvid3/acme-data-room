import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { UserRepository } from '../repository/user.repository';
import { ShareRepository } from '../repository/share.repository';
import { FoldersService } from './folders.service';
import { FilesService, UploadFileInput } from './files.service';
import { AccessService } from './access.service';
import { FILE_STORAGE } from '../interfaces/storage.interfaces';
import type { FileStorage } from '../interfaces/storage.interfaces';
import { CreateDataRoomDto, UpdateDataRoomDto } from '../dto/data-rooms.dto';
import { CreateFolderInRoomDto } from '../dto/folders.dto';
import { normalizePage, toPage, type Page, type PageOptions } from '../utils/pagination';
import { assertFolderInRoom } from '../utils/shareable';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { DataRoom, RoomUser } from '../interfaces/data-rooms.interfaces';
import type { Folder } from '../interfaces/folders.interfaces';
import type { File as FileModel } from '../interfaces/files.interfaces';

@Injectable()
export class DataRoomsService {
    constructor(
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,
        private readonly foldersService: FoldersService,
        private readonly filesService: FilesService,
        private readonly accessService: AccessService,
        @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    ) {}

    async create(ownerId: string, body: CreateDataRoomDto): Promise<DataRoom> {
        return this.dataRoomRepository.create({
            ownerId,
            name: body.name.trim(),
            description: body.description ?? null,
            visibility: body.visibility,
        });
    }

    async list(ownerId: string, options: PageOptions & { includeUserCount?: boolean } = {}): Promise<Page<DataRoom>> {
        const { limit, offset, includeUserCount } = normalizePage(options);
        const [rooms, total] = await Promise.all([
            this.dataRoomRepository.findByOwnerPage(ownerId, offset, limit),
            this.dataRoomRepository.countByOwner(ownerId),
        ]);
        const items = includeUserCount ? await this.withUserCounts(rooms) : rooms;
        return toPage(items, total);
    }

    async listShared(
        userId: string,
        options: PageOptions & { includeUserCount?: boolean } = {},
    ): Promise<Page<DataRoom>> {
        const { limit, offset, includeUserCount } = normalizePage(options);
        const [rooms, total] = await Promise.all([
            this.dataRoomRepository.findSharedWithPage(userId, offset, limit),
            this.dataRoomRepository.countSharedWith(userId),
        ]);
        const items = includeUserCount ? await this.withUserCounts(rooms) : rooms;
        return toPage(items, total);
    }

    async get(userId: string, id: string): Promise<DataRoom> {
        await this.assertReadable(userId, 'DATAROOM', id);
        const room = await this.dataRoomRepository.findById(id);
        if (!room) {
            throw new NotFoundException('Data room not found');
        }
        return this.withUsers(room);
    }

    async rename(ownerId: string, id: string, body: UpdateDataRoomDto): Promise<DataRoom> {
        await this.assertOwned(ownerId, id);
        return this.dataRoomRepository.update(id, {
            name: body.name?.trim(),
            description: body.description,
            visibility: body.visibility,
        });
    }

    async remove(ownerId: string, id: string): Promise<void> {
        await this.assertOwned(ownerId, id);
        const storageKeys = await this.fileRepository.findStorageKeysByRoom(id);
        await this.dataRoomRepository.delete(id);
        await Promise.all(storageKeys.map((key) => this.storage.delete(key).catch(() => undefined)));
    }

    async search(userId: string, id: string, query: string, limit = 50): Promise<FolderContents> {
        await this.assertReadable(userId, 'DATAROOM', id);
        const q = query.trim();
        if (!q) {
            return { folders: [], files: [], total: 0 };
        }
        const [folders, files] = await Promise.all([
            this.folderRepository.searchByName(id, q, limit),
            this.fileRepository.searchByName(id, q, limit),
        ]);
        return { folders, files, total: folders.length + files.length };
    }

    async stats(userId: string, id: string): Promise<{ folders: number; files: number; sizeBytes: number }> {
        await this.assertReadable(userId, 'DATAROOM', id);
        const rootFolderIds = await this.folderRepository.findByParent(id, null);
        const subtreeFolders = await Promise.all(
            rootFolderIds.map((folder) => this.folderRepository.findSubtreeStats(id, folder.id)),
        );
        const rootFiles = await this.fileRepository.findByFolder(id, null);
        const folders = subtreeFolders.reduce((sum, s) => sum + s.folders, 0);
        const files = rootFiles.length + subtreeFolders.reduce((sum, s) => sum + s.files, 0);
        const sizeBytes =
            rootFiles.reduce((sum, f) => sum + f.sizeBytes, 0) +
            subtreeFolders.reduce((sum, s) => sum + s.sizeBytes, 0);
        return { folders, files, sizeBytes };
    }

    async contents(
        userId: string,
        id: string,
        parentFolderId?: string,
        options: PageOptions = {},
    ): Promise<FolderContents> {
        const { limit, offset } = normalizePage(options);
        await this.assertReadable(userId, 'DATAROOM', id);
        if (parentFolderId) {
            await assertFolderInRoom(this.folderRepository, parentFolderId, id);
        }
        const parentFolderIdOrNull = parentFolderId ?? null;
        const [folders, files, folderTotal, fileTotal] = await Promise.all([
            this.folderRepository.findByParentPage(id, parentFolderIdOrNull, offset, limit),
            this.fileRepository.findByFolderPage(id, parentFolderIdOrNull, offset, limit),
            this.folderRepository.countByParent(id, parentFolderIdOrNull),
            this.fileRepository.countByFolder(id, parentFolderIdOrNull),
        ]);
        return { folders, files, total: folderTotal + fileTotal };
    }

    createFolder(ownerId: string, roomId: string, body: CreateFolderInRoomDto): Promise<Folder> {
        return this.foldersService.create(ownerId, { ...body, dataRoomId: roomId });
    }

    uploadFile(
        ownerId: string,
        roomId: string,
        folderId: string | null,
        input: UploadFileInput,
    ): Promise<FileModel> {
        return this.filesService.createUpload(ownerId, roomId, folderId, input);
    }

    private async assertReadable(userId: string, shareableType: 'DATAROOM', shareableId: string): Promise<void> {
        const accessible = await this.accessService.canRead(userId, shareableType, shareableId);
        if (!accessible) {
            throw new NotFoundException('Data room not found');
        }
    }

    private async withUserCounts(rooms: DataRoom[]): Promise<DataRoom[]> {
        if (rooms.length === 0) {
            return rooms;
        }
        const roomIds = rooms.map((room) => room.id);
        const [owners, sharedCounts] = await Promise.all([
            Promise.all(rooms.map((room) => this.userRepository.findById(room.ownerId))),
            this.shareRepository.countUsersByShareables('DATAROOM', roomIds),
        ]);
        return rooms.map((room, index) => {
            const shared = sharedCounts.get(room.id) ?? 0;
            const hasOwner = owners[index] ? 1 : 0;
            return { ...room, userCount: shared + hasOwner };
        });
    }

    private async withUsers(room: DataRoom): Promise<DataRoom> {
        const [owner, sharedUsers] = await Promise.all([
            this.userRepository.findById(room.ownerId),
            this.shareRepository.findUsersByShareable('DATAROOM', room.id),
        ]);
        const users: RoomUser[] = [];
        if (owner) {
            users.push({ id: owner.id, email: owner.email, name: owner.name });
        }
        users.push(...sharedUsers);
        return { ...room, users, userCount: users.length };
    }

    private async assertOwned(ownerId: string, roomId: string): Promise<void> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room || room.ownerId !== ownerId) {
            throw new NotFoundException('Data room not found');
        }
    }
}
