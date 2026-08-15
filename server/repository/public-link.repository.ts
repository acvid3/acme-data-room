import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import type { PublicLink } from '../interfaces/public-links.interfaces';
import type { ShareableType } from '../interfaces/shares.interfaces';

@Injectable()
export class PublicLinkRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: { shareableType: ShareableType; shareableId: string; token: string }): Promise<{
        id: string;
        token: string;
        shareableType: ShareableType;
        shareableId: string;
        createdAt: Date;
    }> {
        return this.prisma.publicLink.create({ data });
    }

    async findByToken(token: string): Promise<{
        id: string;
        token: string;
        shareableType: ShareableType;
        shareableId: string;
        createdAt: Date;
    } | null> {
        return this.prisma.publicLink.findUnique({ where: { token } });
    }

    async findByShareable(shareableType: ShareableType, shareableId: string): Promise<
        Array<{ id: string; token: string; shareableType: ShareableType; shareableId: string; createdAt: Date }>
    > {
        return this.prisma.publicLink.findMany({
            where: { shareableType, shareableId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteByToken(token: string): Promise<void> {
        await this.prisma.publicLink.delete({ where: { token } });
    }

    async deleteByShareable(shareableType: ShareableType, shareableId: string): Promise<void> {
        await this.prisma.publicLink.deleteMany({ where: { shareableType, shareableId } });
    }
}
