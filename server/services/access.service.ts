import { Injectable } from '@nestjs/common';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FolderRepository } from '../repository/folder.repository';
import { FileRepository } from '../repository/file.repository';
import { ShareRepository } from '../repository/share.repository';
import { findShareableOwnerId, findShareableRoomId } from '../utils/shareable';
import type { ShareableType } from '../interfaces/shares.interfaces';

@Injectable()
export class AccessService {
    constructor(
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly folderRepository: FolderRepository,
        private readonly fileRepository: FileRepository,
        private readonly shareRepository: ShareRepository,
    ) {}

    async canRead(userId: string, shareableType: ShareableType, shareableId: string): Promise<boolean> {
        const ownerId = await findShareableOwnerId(
            this.dataRoomRepository,
            this.folderRepository,
            this.fileRepository,
            shareableType,
            shareableId,
        );
        if (!ownerId) {
            return false;
        }
        if (ownerId === userId) {
            return true;
        }
        return this.hasShareAccess(userId, shareableType, shareableId);
    }

    private async hasShareAccess(userId: string, shareableType: ShareableType, shareableId: string): Promise<boolean> {
        const shares = await this.shareRepository.findByUserId(userId);
        const roomId = await findShareableRoomId(this.folderRepository, this.fileRepository, shareableType, shareableId);

        const matchesShare = (type: ShareableType, id: string): boolean =>
            shares.some((share) => share.shareableType === type && share.shareableId === id);

        if (matchesShare('DATAROOM', roomId)) {
            return true;
        }

        switch (shareableType) {
            case 'DATAROOM':
                return matchesShare('DATAROOM', shareableId);
            case 'FOLDER': {
                if (matchesShare('FOLDER', shareableId)) {
                    return true;
                }
                const ancestors = await this.folderRepository.findAncestorFolderIds(shareableId);
                return ancestors
                    .slice(1)
                    .some((ancestorId) => matchesShare('FOLDER', ancestorId));
            }
            case 'FILE': {
                if (matchesShare('FILE', shareableId)) {
                    return true;
                }
                const file = await this.fileRepository.findById(shareableId);
                if (!file?.folderId) {
                    return false;
                }
                const ancestors = await this.folderRepository.findAncestorFolderIds(file.folderId);
                return ancestors.some((ancestorId) => matchesShare('FOLDER', ancestorId));
            }
            default:
                return false;
        }
    }
}
