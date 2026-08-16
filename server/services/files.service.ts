import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FileRepository } from '../repository/file.repository';
import { FolderRepository } from '../repository/folder.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { AccessService } from './access.service';
import { FILE_STORAGE } from '../interfaces/storage.interfaces';
import type { FileStorage } from '../interfaces/storage.interfaces';
import { UpdateFileDto } from '../dto/files.dto';
import { nextAvailableName } from '../utils/name-conflicts';
import { assertFolderInRoom } from '../utils/shareable';
import type { DownloadFileResult, File } from '../interfaces/files.interfaces';

export const FILE_UPLOAD_LIMITS = {
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 50 * 1024 * 1024),
        files: 1,
    },
};

const ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'application/pdf',
    'application/zip',
    'application/json',
    'application/xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
]);

export interface UploadFileInput {
    name: string;
    mimeType: string;
    data: Buffer;
}

@Injectable()
export class FilesService {
    constructor(
        private readonly fileRepository: FileRepository,
        private readonly folderRepository: FolderRepository,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly accessService: AccessService,
        @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    ) {}

    async createUpload(
        userId: string,
        dataRoomId: string,
        folderId: string | null,
        input: UploadFileInput,
    ): Promise<File> {
        await this.assertRoomAccess(userId, dataRoomId);
        if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
            throw new BadRequestException('File type is not allowed');
        }
        if (folderId) {
            await assertFolderInRoom(this.folderRepository, folderId, dataRoomId);
        }

        const existing = await this.fileRepository.findNamesInFolder(dataRoomId, folderId);
        const name = nextAvailableName(input.name, new Set(existing));
        const storageKey = `rooms/${dataRoomId}/${randomUUID()}/${name}`;

        await this.storage.put(storageKey, input.mimeType, input.data);

        return this.fileRepository.create({
            dataRoomId,
            folderId,
            name,
            mimeType: input.mimeType,
            sizeBytes: input.data.length,
            storageKey,
        });
    }

    async get(userId: string, id: string): Promise<File> {
        return this.findReadable(userId, id);
    }

    async download(userId: string, id: string): Promise<DownloadFileResult> {
        const file = await this.findReadable(userId, id);
        const url = await this.storage.createPresignedDownloadUrl(file.storageKey);
        return { url, name: file.name };
    }

    async update(userId: string, id: string, body: UpdateFileDto): Promise<File> {
        const file = await this.findOwned(userId, id);
        const updates: { name?: string; folderId?: string | null } = {};

        if (body.folderId !== undefined) {
            const newFolderId = body.folderId || null;
            if (newFolderId) {
                await assertFolderInRoom(this.folderRepository, newFolderId, file.dataRoomId);
            }
            updates.folderId = newFolderId;
        }

        if (body.name !== undefined && body.name.trim() !== file.name) {
            const targetFolderId = updates.folderId !== undefined ? updates.folderId : file.folderId;
            const existing = await this.fileRepository.findNamesInFolder(file.dataRoomId, targetFolderId);
            updates.name = nextAvailableName(body.name.trim(), new Set(existing));
        }

        return this.fileRepository.update(id, updates);
    }

    async remove(userId: string, id: string): Promise<void> {
        const file = await this.findOwned(userId, id);
        await this.fileRepository.delete(id);
        await this.storage.delete(file.storageKey);
    }

    private async findReadable(userId: string, fileId: string): Promise<File & { storageKey: string }> {
        const file = await this.fileRepository.findByIdWithStorageKey(fileId);
        if (!file) {
            throw new NotFoundException('File not found');
        }
        const accessible = await this.accessService.canRead(userId, 'FILE', fileId);
        if (!accessible) {
            throw new NotFoundException('File not found');
        }
        return file;
    }

    private async findOwned(userId: string, fileId: string): Promise<File & { storageKey: string }> {
        const file = await this.fileRepository.findByIdWithStorageKey(fileId);
        if (!file) {
            throw new NotFoundException('File not found');
        }
        const room = await this.dataRoomRepository.findById(file.dataRoomId);
        if (!room || room.ownerId !== userId) {
            throw new NotFoundException('File not found');
        }
        return file;
    }

    private async assertRoomAccess(userId: string, roomId: string): Promise<void> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room || room.ownerId !== userId) {
            throw new NotFoundException('Data room not found');
        }
    }
}
