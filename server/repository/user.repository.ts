import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { mapUser } from '../utils/prisma-mappers';
import type { User } from '../interfaces/auth.interfaces';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        return user ? mapUser(user) : null;
    }

    async findByIds(ids: string[]): Promise<User[]> {
        if (ids.length === 0) {
            return [];
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        return users.map((user) => mapUser(user));
    }

    async findByEmail(email: string): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        createdAt: string;
    } | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, passwordHash: true, createdAt: true },
        });
        return user ? { ...user, createdAt: user.createdAt.toISOString() } : null;
    }

    async searchByEmail(query: string, limit: number): Promise<User[]> {
        const users = await this.prisma.user.findMany({
            where: { email: { contains: query, mode: 'insensitive' } },
            select: { id: true, email: true, name: true, createdAt: true },
            orderBy: { email: 'asc' },
            take: limit,
        });
        return users.map((user) => mapUser(user));
    }

    async create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
        const user = await this.prisma.user.create({
            data,
            select: { id: true, email: true, name: true, createdAt: true },
        });
        return mapUser(user);
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }

    async deleteById(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }
}
