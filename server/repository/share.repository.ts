import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import type { Share, ShareableType } from '../interfaces/shares.interfaces';

@Injectable()
export class ShareRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: { shareableType: ShareableType; shareableId: string; userId: string }): Promise<Share> {
        const share = await this.prisma.share.create({
            data,
            include: { user: { select: { id: true, email: true, name: true } } },
        });
        return this.toDto(share);
    }

    async findById(id: string): Promise<Share | null> {
        const share = await this.prisma.share.findUnique({
            where: { id },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
        return share ? this.toDto(share) : null;
    }

    async findByShareable(shareableType: ShareableType, shareableId: string): Promise<Share[]> {
        const shares = await this.prisma.share.findMany({
            where: { shareableType, shareableId },
            include: { user: { select: { id: true, email: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return shares.map((share) => this.toDto(share));
    }

    async findUsersByShareable(shareableType: ShareableType, shareableId: string): Promise<
        Array<{ id: string; email: string; name: string }>
    > {
        const shares = await this.prisma.share.findMany({
            where: { shareableType, shareableId },
            include: { user: { select: { id: true, email: true, name: true } } },
            orderBy: { createdAt: 'asc' },
        });
        return shares.map((share) => share.user);
    }

    async countUsersByShareables(shareableType: ShareableType, shareableIds: string[]): Promise<Map<string, number>> {
        if (shareableIds.length === 0) {
            return new Map();
        }
        const groups = await this.prisma.share.groupBy({
            by: ['shareableId'],
            where: { shareableType, shareableId: { in: shareableIds } },
            _count: { _all: true },
        });
        return new Map(groups.map((g) => [g.shareableId, g._count._all]));
    }

    async findByUserId(userId: string): Promise<Share[]> {
        const shares = await this.prisma.share.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return shares.map((share) => this.toDto(share));
    }

    async findByUserAndShareable(
        userId: string,
        shareableType: ShareableType,
        shareableId: string,
    ): Promise<Share | null> {
        const share = await this.prisma.share.findFirst({
            where: { userId, shareableType, shareableId },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
        return share ? this.toDto(share) : null;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.share.delete({ where: { id } });
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.prisma.share.deleteMany({ where: { userId } });
    }

    private toDto(share: {
        id: string;
        shareableType: ShareableType;
        shareableId: string;
        userId: string;
        createdAt: Date;
        user?: { id: string; email: string; name: string };
    }): Share {
        return {
            id: share.id,
            shareableType: share.shareableType,
            shareableId: share.shareableId,
            userId: share.userId,
            user: share.user,
            createdAt: share.createdAt.toISOString(),
        };
    }
}
