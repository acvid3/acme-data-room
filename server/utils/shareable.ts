import { NotFoundException } from '@nestjs/common';
import type { DataRoomRepository } from '../repository/data-room.repository';
import type { FolderRepository } from '../repository/folder.repository';
import type { FileRepository } from '../repository/file.repository';
import type { ShareableType } from '../interfaces/shares.interfaces';

export async function findShareableOwnerId(
    dataRoomRepository: DataRoomRepository,
    folderRepository: FolderRepository,
    fileRepository: FileRepository,
    shareableType: ShareableType,
    shareableId: string,
): Promise<string | null> {
    switch (shareableType) {
        case 'DATAROOM': {
            const room = await dataRoomRepository.findById(shareableId);
            return room?.ownerId ?? null;
        }
        case 'FOLDER': {
            const folder = await folderRepository.findById(shareableId);
            return folder ? (await dataRoomRepository.findById(folder.dataRoomId))?.ownerId ?? null : null;
        }
        case 'FILE': {
            const file = await fileRepository.findById(shareableId);
            return file ? (await dataRoomRepository.findById(file.dataRoomId))?.ownerId ?? null : null;
        }
        default:
            return null;
    }
}

export async function findShareableRoomId(
    folderRepository: FolderRepository,
    fileRepository: FileRepository,
    shareableType: ShareableType,
    shareableId: string,
): Promise<string> {
    switch (shareableType) {
        case 'DATAROOM':
            return shareableId;
        case 'FOLDER': {
            const folder = await folderRepository.findById(shareableId);
            return folder?.dataRoomId ?? '';
        }
        case 'FILE': {
            const file = await fileRepository.findById(shareableId);
            return file?.dataRoomId ?? '';
        }
        default:
            return '';
    }
}

export async function assertFolderInRoom(
    folderRepository: FolderRepository,
    folderId: string,
    roomId: string,
): Promise<void> {
    const folder = await folderRepository.findById(folderId);
    if (!folder || folder.dataRoomId !== roomId) {
        throw new NotFoundException('Folder not found');
    }
}
