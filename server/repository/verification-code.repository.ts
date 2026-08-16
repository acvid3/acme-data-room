import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class VerificationCodeRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: { email: string; code: string; purpose: string; expiresAt: Date }): Promise<void> {
        await this.prisma.verificationCode.create({ data });
    }

    async findLatest(email: string, purpose: string): Promise<{
        id: string;
        code: string;
        expiresAt: Date;
        attempts: number;
    } | null> {
        return this.prisma.verificationCode.findFirst({
            where: { email, purpose },
            orderBy: { createdAt: 'desc' },
        });
    }

    async countRecent(email: string, since: Date, purpose?: string): Promise<number> {
        return this.prisma.verificationCode.count({
            where: {
                email,
                createdAt: { gte: since },
                ...(purpose ? { purpose } : {}),
            },
        });
    }

    async incrementAttempts(id: string): Promise<void> {
        await this.prisma.verificationCode.update({
            where: { id },
            data: { attempts: { increment: 1 } },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.verificationCode.delete({ where: { id } });
    }
}
