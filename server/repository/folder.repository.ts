import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import { mapFolder } from '../utils/prisma-mappers';
import type { Folder } from '../interfaces/folders.interfaces';

@Injectable()
export class FolderRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: { dataRoomId: string; parentFolderId: string | null; name: string }): Promise<Folder> {
        const folder = await this.prisma.folder.create({ data });
        return mapFolder(folder);
    }

    async findById(id: string): Promise<Folder | null> {
        const folder = await this.prisma.folder.findUnique({ where: { id } });
        return folder ? mapFolder(folder) : null;
    }

    async findByParent(dataRoomId: string, parentFolderId: string | null): Promise<Folder[]> {
        const folders = await this.prisma.folder.findMany({
            where: { dataRoomId, parentFolderId },
            orderBy: { name: 'asc' },
        });
        return folders.map((folder) => mapFolder(folder));
    }

    async findByParentPage(
        dataRoomId: string,
        parentFolderId: string | null,
        offset: number,
        limit: number,
    ): Promise<Folder[]> {
        const folders = await this.prisma.folder.findMany({
            where: { dataRoomId, parentFolderId },
            orderBy: { name: 'asc' },
            skip: offset,
            take: limit,
        });
        return folders.map((folder) => mapFolder(folder));
    }

    async countByParent(dataRoomId: string, parentFolderId: string | null): Promise<number> {
        return this.prisma.folder.count({ where: { dataRoomId, parentFolderId } });
    }

    async searchByName(dataRoomId: string, query: string, limit: number): Promise<Folder[]> {
        const folders = await this.prisma.folder.findMany({
            where: { dataRoomId, name: { contains: query, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
            take: limit,
        });
        return folders.map((folder) => mapFolder(folder));
    }

    async findSubtreeStats(dataRoomId: string, rootFolderId: string): Promise<{ folders: number; files: number; sizeBytes: number }> {
        const result = await this.prisma.$queryRaw<Array<{ folders: bigint; files: bigint; sizeBytes: bigint }>>`
            WITH RECURSIVE tree AS (
                SELECT id
                FROM "Folder"
                WHERE id = ${rootFolderId}
                UNION ALL
                SELECT f.id
                FROM "Folder" f
                INNER JOIN tree t ON f."parentFolderId" = t.id
            )
            SELECT
                (SELECT COUNT(*) FROM tree) AS folders,
                (SELECT COUNT(*) FROM "File" WHERE "folderId" IN (SELECT id FROM tree)) AS files,
                (SELECT COALESCE(SUM("sizeBytes"), 0) FROM "File" WHERE "folderId" IN (SELECT id FROM tree)) AS "sizeBytes"
        `;
        const row = result[0];
        return {
            folders: Number(row.folders),
            files: Number(row.files),
            sizeBytes: Number(row.sizeBytes),
        };
    }

    async findSubtreeStatsByRoots(
        dataRoomId: string,
        rootFolderIds: string[],
    ): Promise<Map<string, { folders: number; files: number; sizeBytes: number }>> {
        if (rootFolderIds.length === 0) {
            return new Map();
        }
        const rows = await this.prisma.$queryRaw<
            Array<{ rootId: string; folders: bigint; files: bigint; sizeBytes: bigint }>
        >`
            WITH RECURSIVE tree AS (
                SELECT id, "parentFolderId", id AS root_id
                FROM "Folder"
                WHERE "dataRoomId" = ${dataRoomId} AND id IN (${Prisma.join(rootFolderIds)})
                UNION ALL
                SELECT f.id, f."parentFolderId", t.root_id
                FROM "Folder" f
                INNER JOIN tree t ON f."parentFolderId" = t.id
            )
            SELECT
                t.root_id AS "rootId",
                COUNT(DISTINCT t.id) AS folders,
                COUNT(f.id) AS files,
                COALESCE(SUM(f."sizeBytes"), 0) AS "sizeBytes"
            FROM tree t
            LEFT JOIN "File" f ON f."folderId" = t.id
            GROUP BY t.root_id
        `;
        return new Map(
            rows.map((row) => [
                row.rootId,
                {
                    folders: Number(row.folders),
                    files: Number(row.files),
                    sizeBytes: Number(row.sizeBytes),
                },
            ]),
        );
    }

    async findNamesInParent(dataRoomId: string, parentFolderId: string | null): Promise<string[]> {
        const folders = await this.prisma.folder.findMany({
            where: { dataRoomId, parentFolderId },
            select: { name: true },
        });
        return folders.map((folder) => folder.name);
    }

    async update(id: string, data: { name?: string; parentFolderId?: string | null }): Promise<Folder> {
        const folder = await this.prisma.folder.update({ where: { id }, data });
        return mapFolder(folder);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.folder.delete({ where: { id } });
    }

    async findSubtreeFolderIds(dataRoomId: string, rootFolderId: string): Promise<string[]> {
        const folders = await this.prisma.$queryRaw<Array<{ id: string }>>`
            WITH RECURSIVE tree AS (
                SELECT id, "parentFolderId"
                FROM "Folder"
                WHERE id = ${rootFolderId}
                UNION ALL
                SELECT f.id, f."parentFolderId"
                FROM "Folder" f
                INNER JOIN tree t ON f."parentFolderId" = t.id
            )
            SELECT id FROM tree
        `;
        return folders.map((folder) => folder.id);
    }

    async findAncestorFolderIds(folderId: string): Promise<string[]> {
        const rows = await this.prisma.$queryRaw<Array<{ id: string; parent_id: string | null }>>`
            WITH RECURSIVE ancestors AS (
                SELECT id, "parentFolderId" AS parent_id
                FROM "Folder"
                WHERE id = ${folderId}
                UNION ALL
                SELECT f.id, f."parentFolderId" AS parent_id
                FROM "Folder" f
                INNER JOIN ancestors a ON f.id = a.parent_id
            )
            SELECT id, parent_id FROM ancestors
        `;
        return rows.map((row) => row.id);
    }
}
