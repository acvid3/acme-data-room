import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { AccessService } from './access.service';
import { PresenceService } from './presence.service';
import { FILE_STORAGE } from '../interfaces/storage.interfaces';
import type { FileStorage } from '../interfaces/storage.interfaces';
import { CreateFolderDto, UpdateFolderDto } from '../dto/folders.dto';
import { nextAvailableName } from '../utils/name-conflicts';
import { normalizePage, type PageOptions } from '../utils/pagination';
import { assertFolderInRoom } from '../utils/shareable';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { DeleteFolderResult, Folder } from '../interfaces/folders.interfaces';

@Injectable()
export class FoldersService {
    constructor(
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly accessService: AccessService,
        private readonly presenceService: PresenceService,
        @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    ) {}

    async create(userId: string, body: CreateFolderDto): Promise<Folder> {
        const dataRoomId = body.dataRoomId;
        await this.assertRoomAccess(userId, dataRoomId);
        const parentFolderId = body.parentId ?? null;
        if (parentFolderId) {
            await assertFolderInRoom(this.folderRepository, parentFolderId, dataRoomId);
        }

        const existing = await this.folderRepository.findNamesInParent(dataRoomId, parentFolderId);
        const name = nextAvailableName(body.name.trim(), new Set(existing));
        return this.folderRepository.create({ dataRoomId, parentFolderId, name });
    }

    async get(userId: string, id: string): Promise<Folder> {
        return this.findReadable(userId, id);
    }

    async contents(userId: string, id: string, options: PageOptions = {}): Promise<FolderContents> {
        const { limit, offset } = normalizePage(options);
        const folder = await this.findReadable(userId, id);
        this.presenceService.touch(folder.dataRoomId, userId);
        const [folders, files, folderTotal, fileTotal] = await Promise.all([
            this.folderRepository.findByParentPage(folder.dataRoomId, folder.id, offset, limit),
            this.fileRepository.findByFolderPage(folder.dataRoomId, folder.id, offset, limit),
            this.folderRepository.countByParent(folder.dataRoomId, folder.id),
            this.fileRepository.countByFolder(folder.dataRoomId, folder.id),
        ]);
        return { folders, files, total: folderTotal + fileTotal };
    }

    async update(userId: string, id: string, body: UpdateFolderDto): Promise<Folder> {
        const folder = await this.findOwned(userId, id);
        const updates: { name?: string; parentFolderId?: string | null } = {};

        if (body.parentId !== undefined) {
            const newParentId = body.parentId || null;
            if (newParentId) {
                await assertFolderInRoom(this.folderRepository, newParentId, folder.dataRoomId);
                await this.assertNotDescendant(folder.id, newParentId);
            }
            updates.parentFolderId = newParentId;
        }

        const targetParentId = updates.parentFolderId !== undefined ? updates.parentFolderId : folder.parentFolderId;
        if (body.name !== undefined && body.name.trim() !== folder.name) {
            const existing = await this.folderRepository.findNamesInParent(folder.dataRoomId, targetParentId);
            updates.name = nextAvailableName(body.name.trim(), new Set(existing));
        }

        return this.folderRepository.update(id, updates);
    }

    async remove(userId: string, id: string): Promise<DeleteFolderResult> {
        const folder = await this.findOwned(userId, id);
        const folderIds = await this.folderRepository.findSubtreeFolderIds(folder.dataRoomId, id);
        const folderCount = folderIds.length;

        const storageKeys = await this.fileRepository.findStorageKeysInFolders(folder.dataRoomId, folderIds);
        const fileCount = storageKeys.length;

        await this.folderRepository.delete(id);
        await Promise.all(storageKeys.map((key) => this.storage.delete(key).catch(() => undefined)));
        return { deletedFolders: folderCount, deletedFiles: fileCount };
    }

    private async findReadable(userId: string, folderId: string): Promise<Folder> {
        const folder = await this.folderRepository.findById(folderId);
        if (!folder) {
            throw new NotFoundException('Folder not found');
        }
        const accessible = await this.accessService.canRead(userId, 'FOLDER', folderId);
        if (!accessible) {
            throw new NotFoundException('Folder not found');
        }
        return folder;
    }

    private async findOwned(userId: string, folderId: string): Promise<Folder> {
        const folder = await this.folderRepository.findById(folderId);
        if (!folder) {
            throw new NotFoundException('Folder not found');
        }
        const room = await this.dataRoomRepository.findById(folder.dataRoomId);
        if (!room || room.ownerId !== userId) {
            throw new NotFoundException('Folder not found');
        }
        return folder;
    }

    async stats(userId: string, id: string): Promise<{ folders: number; files: number; sizeBytes: number }> {
        const folder = await this.findReadable(userId, id);
        return this.folderRepository.findSubtreeStats(folder.dataRoomId, folder.id);
    }

    private async assertNotDescendant(folderId: string, candidateParentId: string): Promise<void> {
        if (candidateParentId === folderId) {
            throw new ConflictException('A folder cannot be moved into itself');
        }
        const folder = await this.folderRepository.findById(folderId);
        if (!folder) {
            throw new NotFoundException('Folder not found');
        }
        const subtreeIds = await this.folderRepository.findSubtreeFolderIds(folder.dataRoomId, folderId);
        if (subtreeIds.includes(candidateParentId)) {
            throw new ConflictException('A folder cannot be moved into its own descendant');
        }
    }

    private async assertRoomAccess(userId: string, roomId: string): Promise<void> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room || room.ownerId !== userId) {
            throw new NotFoundException('Data room not found');
        }
    }
}
