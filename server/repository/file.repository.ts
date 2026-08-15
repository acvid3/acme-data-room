import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { mapFile } from '../utils/prisma-mappers';
import type { File } from '../interfaces/files.interfaces';

@Injectable()
export class FileRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: {
        dataRoomId: string;
        folderId: string | null;
        name: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
    }): Promise<File> {
        const file = await this.prisma.file.create({ data });
        return mapFile(file);
    }

    async findById(id: string): Promise<File | null> {
        const file = await this.prisma.file.findUnique({ where: { id } });
        return file ? mapFile(file) : null;
    }

    async findByIdWithStorageKey(id: string): Promise<(File & { storageKey: string }) | null> {
        const file = await this.prisma.file.findUnique({ where: { id } });
        if (!file) {
            return null;
        }
        return { ...mapFile(file), storageKey: file.storageKey };
    }

    async findByFolder(dataRoomId: string, folderId: string | null): Promise<File[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId, folderId },
            orderBy: { name: 'asc' },
        });
        return files.map((file) => mapFile(file));
    }

    async findByFolderPage(
        dataRoomId: string,
        folderId: string | null,
        offset: number,
        limit: number,
    ): Promise<File[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId, folderId },
            orderBy: { name: 'asc' },
            skip: offset,
            take: limit,
        });
        return files.map((file) => mapFile(file));
    }

    async countByFolder(dataRoomId: string, folderId: string | null): Promise<number> {
        return this.prisma.file.count({ where: { dataRoomId, folderId } });
    }

    async searchByName(dataRoomId: string, query: string, limit: number): Promise<File[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId, name: { contains: query, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
            take: limit,
        });
        return files.map((file) => mapFile(file));
    }

    async findNamesInFolder(dataRoomId: string, folderId: string | null): Promise<string[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId, folderId },
            select: { name: true },
        });
        return files.map((file) => file.name);
    }

    async findStorageKeysInFolders(dataRoomId: string, folderIds: string[]): Promise<string[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId, folderId: { in: folderIds } },
            select: { storageKey: true },
        });
        return files.map((file) => file.storageKey);
    }

    async findStorageKeysByRoom(dataRoomId: string): Promise<string[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoomId },
            select: { storageKey: true },
        });
        return files.map((file) => file.storageKey);
    }

    async findStorageKeysByOwner(ownerId: string): Promise<string[]> {
        const files = await this.prisma.file.findMany({
            where: { dataRoom: { ownerId } },
            select: { storageKey: true },
        });
        return files.map((file) => file.storageKey);
    }

    async update(id: string, data: { name?: string; folderId?: string | null }): Promise<File> {
        const file = await this.prisma.file.update({ where: { id }, data });
        return mapFile(file);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.file.delete({ where: { id } });
    }
}
