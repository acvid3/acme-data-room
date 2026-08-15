import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { mapDataRoom } from '../utils/prisma-mappers';
import type { DataRoom } from '../interfaces/data-rooms.interfaces';

@Injectable()
export class DataRoomRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: {
        ownerId: string;
        name: string;
        description?: string | null;
        visibility?: 'PUBLIC' | 'PRIVATE';
    }): Promise<DataRoom> {
        const room = await this.prisma.dataRoom.create({ data });
        return mapDataRoom(room);
    }

    async findById(id: string): Promise<DataRoom | null> {
        const room = await this.prisma.dataRoom.findUnique({ where: { id } });
        return room ? mapDataRoom(room) : null;
    }

    async findByOwner(ownerId: string): Promise<DataRoom[]> {
        const rooms = await this.prisma.dataRoom.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });
        return rooms.map((room) => mapDataRoom(room));
    }

    async findByOwnerPage(ownerId: string, offset: number, limit: number): Promise<DataRoom[]> {
        const rooms = await this.prisma.dataRoom.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });
        return rooms.map((room) => mapDataRoom(room));
    }

    async countByOwner(ownerId: string): Promise<number> {
        return this.prisma.dataRoom.count({ where: { ownerId } });
    }

    async update(id: string, data: {
        name?: string;
        description?: string | null;
        visibility?: 'PUBLIC' | 'PRIVATE';
    }): Promise<DataRoom> {
        const room = await this.prisma.dataRoom.update({ where: { id }, data });
        return mapDataRoom(room);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.dataRoom.delete({ where: { id } });
    }

    async findSharedWithPage(userId: string, offset: number, limit: number): Promise<DataRoom[]> {
        const ids = await this.sharedRoomIds(userId);
        if (ids.length === 0) {
            return [];
        }
        const rooms = await this.prisma.dataRoom.findMany({
            where: { id: { in: ids } },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });
        return rooms.map((room) => mapDataRoom(room));
    }

    async countSharedWith(userId: string): Promise<number> {
        return (await this.sharedRoomIds(userId)).length;
    }

    async deleteByOwner(ownerId: string): Promise<void> {
        await this.prisma.dataRoom.deleteMany({ where: { ownerId } });
    }

    private async sharedRoomIds(userId: string): Promise<string[]> {
        const shares = await this.prisma.share.findMany({
            where: { userId, shareableType: 'DATAROOM' },
            select: { shareableId: true },
        });
        return shares.map((share) => share.shareableId);
    }
}
