import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PublicLinkRepository } from '../repository/public-link.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { ShareRepository } from '../repository/share.repository';
import { UserRepository } from '../repository/user.repository';
import { CreatePublicLinkDto } from '../dto/shares.dto';
import { normalizePage, type PageOptions } from '../utils/pagination';
import { findShareableOwnerId, findShareableRoomId } from '../utils/shareable';
import type { PublicLink } from '../interfaces/public-links.interfaces';
import type { ShareableType } from '../interfaces/shares.interfaces';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { DataRoom, RoomUser } from '../interfaces/data-rooms.interfaces';
import type { File } from '../interfaces/files.interfaces';

export type PublicLinkOpenResult =
    | { type: 'DATAROOM'; room: { id: string; name: string }; contents: FolderContents; users: RoomUser[] }
    | { type: 'FOLDER'; folder: { id: string; name: string }; contents: FolderContents }
    | { type: 'FILE'; file: File };

@Injectable()
export class PublicLinksService {
    constructor(
        private readonly publicLinkRepository: PublicLinkRepository,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
        private readonly shareRepository: ShareRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async create(userId: string, body: CreatePublicLinkDto): Promise<PublicLink> {
        const ownerId = await findShareableOwnerId(
            this.dataRoomRepository,
            this.folderRepository,
            this.fileRepository,
            body.shareableType,
            body.shareableId,
        );
        if (!ownerId || ownerId !== userId) {
            throw new NotFoundException('Item not found');
        }
        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, body.shareableType, body.shareableId);
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room || room.visibility !== 'PUBLIC') {
            throw new ConflictException('Room must be public to create a public link');
        }

        const existing = await this.publicLinkRepository.findByShareable(body.shareableType, body.shareableId);
        if (existing.length > 0) {
            return this.buildPublicLink(existing[0]);
        }

        const token = randomBytes(32).toString('hex');
        const link = await this.publicLinkRepository.create({
            shareableType: body.shareableType,
            shareableId: body.shareableId,
            token,
        });
        return this.buildPublicLink(link);
    }

    async open(token: string, options: PageOptions = {}): Promise<PublicLinkOpenResult> {
        const { limit, offset } = normalizePage(options);
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        await this.assertRoomPublic(
            await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId),
        );
        return this.resolveContents(link.shareableType, link.shareableId, limit, offset);
    }

    async openFolder(token: string, folderId: string, options: PageOptions = {}): Promise<PublicLinkOpenResult> {
        const { limit, offset } = normalizePage(options);
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        if (link.shareableType === 'FILE') {
            throw new NotFoundException('Item not found');
        }

        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId);
        await this.assertRoomPublic(roomId);
        const folder = await this.folderRepository.findById(folderId);
        if (!folder || folder.dataRoomId !== roomId) {
            throw new NotFoundException('Item not found');
        }

        if (link.shareableType === 'FOLDER') {
            const ancestors = await this.folderRepository.findAncestorFolderIds(folderId);
            const linkFolderAncestors = await this.folderRepository.findAncestorFolderIds(link.shareableId);
            if (!linkFolderAncestors.some((ancestorId) => ancestors.includes(ancestorId))) {
                throw new NotFoundException('Item not found');
            }
        }

        const [folders, files, folderTotal, fileTotal] = await Promise.all([
            this.folderRepository.findByParentPage(roomId, folder.id, offset, limit),
            this.fileRepository.findByFolderPage(roomId, folder.id, offset, limit),
            this.folderRepository.countByParent(roomId, folder.id),
            this.fileRepository.countByFolder(roomId, folder.id),
        ]);
        return {
            type: 'FOLDER',
            folder: { id: folder.id, name: folder.name },
            contents: { folders, files, total: folderTotal + fileTotal },
        };
    }

    async join(userId: string, token: string): Promise<DataRoom> {
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId);
        if (!roomId) {
            throw new NotFoundException('Link not found');
        }
        await this.assertRoomPublic(roomId);

        const room = await this.dataRoomRepository.findById(roomId);
        if (!room) {
            throw new NotFoundException('Link not found');
        }

        if (room.ownerId !== userId) {
            const existing = await this.shareRepository.findByUserAndShareable(userId, 'DATAROOM', roomId);
            if (!existing) {
                await this.shareRepository.create({ shareableType: 'DATAROOM', shareableId: roomId, userId });
            }
        }

        const users = await this.withRoomUsers(roomId);
        return { ...room, users, userCount: users.length };
    }

    async revoke(userId: string, token: string): Promise<void> {
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        const ownerId = await findShareableOwnerId(
            this.dataRoomRepository,
            this.folderRepository,
            this.fileRepository,
            link.shareableType,
            link.shareableId,
        );
        if (!ownerId || ownerId !== userId) {
            throw new NotFoundException('Link not found');
        }
        await this.publicLinkRepository.deleteByToken(token);
    }

    private buildPublicLink(link: { id: string; token: string; shareableType: ShareableType; shareableId: string; createdAt: Date }): PublicLink {
        const baseUrl = process.env.PUBLIC_BASE_URL ?? '';
        return {
            id: link.id,
            token: link.token,
            shareableType: link.shareableType,
            shareableId: link.shareableId,
            url: `${baseUrl}/api/public/${link.token}`,
            createdAt: link.createdAt.toISOString(),
        };
    }

    private async assertRoomPublic(roomId: string): Promise<void> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room || room.visibility !== 'PUBLIC') {
            throw new NotFoundException('Link not found');
        }
    }

    private async withRoomUsers(roomId: string): Promise<RoomUser[]> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room) {
            return [];
        }
        const [owner, sharedUsers] = await Promise.all([
            this.userRepository.findById(room.ownerId),
            this.shareRepository.findUsersByShareable('DATAROOM', roomId),
        ]);
        const users: RoomUser[] = [];
        if (owner) {
            users.push({ id: owner.id, email: owner.email, name: owner.name });
        }
        users.push(...sharedUsers);
        return users;
    }

    private async resolveContents(
        shareableType: ShareableType,
        shareableId: string,
        limit: number,
        offset: number,
    ): Promise<PublicLinkOpenResult> {
        switch (shareableType) {
            case 'DATAROOM': {
                const room = await this.dataRoomRepository.findById(shareableId);
                if (!room) {
                    throw new NotFoundException('Item not found');
                }
                const [folders, files, folderTotal, fileTotal, users] = await Promise.all([
                    this.folderRepository.findByParentPage(room.id, null, offset, limit),
                    this.fileRepository.findByFolderPage(room.id, null, offset, limit),
                    this.folderRepository.countByParent(room.id, null),
                    this.fileRepository.countByFolder(room.id, null),
                    this.withRoomUsers(room.id),
                ]);
                return {
                    type: 'DATAROOM',
                    room: { id: room.id, name: room.name },
                    contents: { folders, files, total: folderTotal + fileTotal },
                    users,
                };
            }
            case 'FOLDER': {
                const folder = await this.folderRepository.findById(shareableId);
                if (!folder) {
                    throw new NotFoundException('Item not found');
                }
                const [folders, files, folderTotal, fileTotal] = await Promise.all([
                    this.folderRepository.findByParentPage(folder.dataRoomId, folder.id, offset, limit),
                    this.fileRepository.findByFolderPage(folder.dataRoomId, folder.id, offset, limit),
                    this.folderRepository.countByParent(folder.dataRoomId, folder.id),
                    this.fileRepository.countByFolder(folder.dataRoomId, folder.id),
                ]);
                return {
                    type: 'FOLDER',
                    folder: { id: folder.id, name: folder.name },
                    contents: { folders, files, total: folderTotal + fileTotal },
                };
            }
            case 'FILE': {
                const file = await this.fileRepository.findById(shareableId);
                if (!file) {
                    throw new NotFoundException('Item not found');
                }
                return { type: 'FILE', file };
            }
            default:
                throw new NotFoundException('Item not found');
        }
    }
}
