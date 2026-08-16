import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PublicLinkRepository } from '../repository/public-link.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { ShareRepository } from '../repository/share.repository';
import { UserRepository } from '../repository/user.repository';
import { PresenceService } from './presence.service';
import { CreatePublicLinkDto } from '../dto/shares.dto';
import { normalizePage, type PageOptions } from '../utils/pagination';
import { findShareableOwnerId, findShareableRoomId } from '../utils/shareable';
import { FILE_STORAGE } from '../interfaces/storage.interfaces';
import type { FileStorage } from '../interfaces/storage.interfaces';
import type { PublicLink } from '../interfaces/public-links.interfaces';
import type { ShareableType } from '../interfaces/shares.interfaces';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { Folder } from '../interfaces/folders.interfaces';
import type { DataRoom, RoomUser } from '../interfaces/data-rooms.interfaces';
import type { DownloadFileResult, File } from '../interfaces/files.interfaces';

export type FolderStats = { folders: number; files: number; sizeBytes: number };

export interface PublicFolderItem extends Folder {
    stats: FolderStats;
}

export interface PublicFolderContents {
    folders: PublicFolderItem[];
    files: File[];
    total: number;
}

export type PublicLinkOpenResult =
    | {
          type: 'DATAROOM';
          room: { id: string; name: string };
          contents: PublicFolderContents;
          stats: FolderStats;
          users: RoomUser[];
          activeUsers: RoomUser[];
      }
    | { type: 'FOLDER'; folder: { id: string; name: string }; roomId: string; contents: PublicFolderContents; stats: FolderStats }
    | { type: 'FILE'; file: File; roomId: string; url: string };

@Injectable()
export class PublicLinksService {
    constructor(
        private readonly publicLinkRepository: PublicLinkRepository,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
        private readonly shareRepository: ShareRepository,
        private readonly userRepository: UserRepository,
        private readonly presenceService: PresenceService,
        @Inject(FILE_STORAGE) private readonly storage: FileStorage,
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

    async open(userId: string | null, token: string, options: PageOptions = {}): Promise<PublicLinkOpenResult> {
        const { limit, offset } = normalizePage(options);
        if (!userId) {
            throw new NotFoundException('Link not found');
        }
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId);
        await this.assertRoomPublic(roomId);
        this.presenceService.touch(roomId, userId);
        return this.resolveContents(link.shareableType, link.shareableId, limit, offset);
    }

    async openFolder(
        userId: string | null,
        token: string,
        folderId: string,
        options: PageOptions = {},
    ): Promise<PublicLinkOpenResult> {
        const { limit, offset } = normalizePage(options);
        if (!userId) {
            throw new NotFoundException('Link not found');
        }
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        if (link.shareableType === 'FILE') {
            throw new NotFoundException('Item not found');
        }

        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId);
        await this.assertRoomPublic(roomId);
        this.presenceService.touch(roomId, userId);
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

        const [contents, stats] = await Promise.all([
            this.publicContents(roomId, folder.id, offset, limit),
            this.folderRepository.findSubtreeStats(roomId, folder.id),
        ]);
        return {
            type: 'FOLDER',
            folder: { id: folder.id, name: folder.name },
            roomId,
            contents,
            stats,
        };
    }

    async download(userId: string | null, token: string, fileId: string): Promise<DownloadFileResult> {
        if (!userId) {
            throw new NotFoundException('Link not found');
        }
        const link = await this.publicLinkRepository.findByToken(token);
        if (!link) {
            throw new NotFoundException('Link not found');
        }
        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, link.shareableType, link.shareableId);
        await this.assertRoomPublic(roomId);
        this.presenceService.touch(roomId, userId);

        const file = await this.fileRepository.findByIdWithStorageKey(fileId);
        if (!file || file.dataRoomId !== roomId) {
            throw new NotFoundException('File not found');
        }

        if (link.shareableType === 'FILE') {
            if (link.shareableId !== fileId) {
                throw new NotFoundException('File not found');
            }
        } else if (link.shareableType === 'FOLDER') {
            if (!file.folderId) {
                throw new NotFoundException('File not found');
            }
            const ancestors = await this.folderRepository.findAncestorFolderIds(file.folderId);
            if (!ancestors.includes(link.shareableId)) {
                throw new NotFoundException('File not found');
            }
        }

        const url = await this.storage.createPresignedDownloadUrl(file.storageKey);
        return { url, name: file.name };
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

        const { users, activeUsers } = await this.roomUsers(roomId);
        return { ...room, users, userCount: users.length, activeUsers };
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

    private async roomUsers(roomId: string): Promise<{ users: RoomUser[]; activeUsers: RoomUser[] }> {
        const room = await this.dataRoomRepository.findById(roomId);
        if (!room) {
            return { users: [], activeUsers: [] };
        }
        const activeIds = this.presenceService.activeUserIds(roomId);
        const [owner, sharedUsers, activeUsers] = await Promise.all([
            this.userRepository.findById(room.ownerId),
            this.shareRepository.findUsersByShareable('DATAROOM', roomId),
            activeIds.length > 0 ? this.userRepository.findByIds(activeIds) : Promise.resolve([]),
        ]);
        const users: RoomUser[] = [];
        if (owner) {
            users.push({ id: owner.id, email: owner.email, name: owner.name });
        }
        users.push(...sharedUsers);
        const present = activeUsers.map((u) => ({ id: u.id, email: u.email, name: u.name }));
        return { users, activeUsers: present };
    }

    private async publicContents(
        roomId: string,
        parentFolderId: string | null,
        offset: number,
        limit: number,
    ): Promise<PublicFolderContents> {
        const [folders, files, folderTotal, fileTotal] = await Promise.all([
            this.folderRepository.findByParentPage(roomId, parentFolderId, offset, limit),
            this.fileRepository.findByFolderPage(roomId, parentFolderId, offset, limit),
            this.folderRepository.countByParent(roomId, parentFolderId),
            this.fileRepository.countByFolder(roomId, parentFolderId),
        ]);
        const stats = await this.folderRepository.findSubtreeStatsByRoots(
            roomId,
            folders.map((folder) => folder.id),
        );
        return {
            folders: folders.map((folder) => ({
                ...folder,
                stats: stats.get(folder.id) ?? { folders: 1, files: 0, sizeBytes: 0 },
            })),
            files,
            total: folderTotal + fileTotal,
        };
    }

    private async roomStats(roomId: string): Promise<FolderStats> {
        const rootFolderIds = await this.folderRepository.findByParent(roomId, null);
        const subtreeStats = await Promise.all(
            rootFolderIds.map((folder) => this.folderRepository.findSubtreeStats(roomId, folder.id)),
        );
        const rootFiles = await this.fileRepository.findByFolder(roomId, null);
        const folders = subtreeStats.reduce((sum, s) => sum + s.folders, 0);
        const files = rootFiles.length + subtreeStats.reduce((sum, s) => sum + s.files, 0);
        const sizeBytes =
            rootFiles.reduce((sum, f) => sum + f.sizeBytes, 0) +
            subtreeStats.reduce((sum, s) => sum + s.sizeBytes, 0);
        return { folders, files, sizeBytes };
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
                const [roomMembers, stats, contents] = await Promise.all([
                    this.roomUsers(room.id),
                    this.roomStats(room.id),
                    this.publicContents(room.id, null, offset, limit),
                ]);
                return {
                    type: 'DATAROOM',
                    room: { id: room.id, name: room.name },
                    contents,
                    stats,
                    users: roomMembers.users,
                    activeUsers: roomMembers.activeUsers,
                };
            }
            case 'FOLDER': {
                const folder = await this.folderRepository.findById(shareableId);
                if (!folder) {
                    throw new NotFoundException('Item not found');
                }
                const [contents, stats] = await Promise.all([
                    this.publicContents(folder.dataRoomId, folder.id, offset, limit),
                    this.folderRepository.findSubtreeStats(folder.dataRoomId, folder.id),
                ]);
                return {
                    type: 'FOLDER',
                    folder: { id: folder.id, name: folder.name },
                    roomId: folder.dataRoomId,
                    contents,
                    stats,
                };
            }
            case 'FILE': {
                const file = await this.fileRepository.findByIdWithStorageKey(shareableId);
                if (!file) {
                    throw new NotFoundException('Item not found');
                }
                const url = await this.storage.createPresignedDownloadUrl(file.storageKey);
                return { type: 'FILE', file, roomId: file.dataRoomId, url };
            }
            default:
                throw new NotFoundException('Item not found');
        }
    }
}
