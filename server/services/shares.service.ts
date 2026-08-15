import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ShareRepository } from '../repository/share.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { CreateShareDto } from '../dto/shares.dto';
import { findShareableOwnerId } from '../utils/shareable';
import type { Share, ShareableType } from '../interfaces/shares.interfaces';

@Injectable()
export class SharesService {
    constructor(
        private readonly shareRepository: ShareRepository,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
    ) {}

    async create(userId: string, body: CreateShareDto): Promise<Share> {
        await this.assertOwnsShareable(userId, body.shareableType, body.shareableId);

        try {
            return await this.shareRepository.create(body);
        } catch {
            throw new ConflictException('Share already exists');
        }
    }

    async list(userId: string, shareableType: ShareableType, shareableId: string): Promise<Share[]> {
        await this.assertOwnsShareable(userId, shareableType, shareableId);
        return this.shareRepository.findByShareable(shareableType, shareableId);
    }

    async revoke(userId: string, shareId: string): Promise<void> {
        const share = await this.shareRepository.findById(shareId);
        if (!share) {
            throw new NotFoundException('Share not found');
        }
        await this.assertOwnsShareable(userId, share.shareableType, share.shareableId);
        await this.shareRepository.delete(shareId);
    }

    private async assertOwnsShareable(userId: string, shareableType: ShareableType, shareableId: string): Promise<void> {
        const ownerId = await findShareableOwnerId(
            this.dataRoomRepository,
            this.folderRepository,
            this.fileRepository,
            shareableType,
            shareableId,
        );
        if (!ownerId || ownerId !== userId) {
            throw new NotFoundException('Item not found');
        }
    }
}
