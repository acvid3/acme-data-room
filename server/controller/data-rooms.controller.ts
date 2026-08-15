import { Injectable } from '@nestjs/common';
import { DataRoomsService } from '../services/data-rooms.service';
import { UploadFileInput } from '../services/files.service';
import { CreateDataRoomDto, UpdateDataRoomDto } from '../dto/data-rooms.dto';
import { CreateFolderInRoomDto } from '../dto/folders.dto';
import type { PageOptions } from '../utils/pagination';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { DataRoom } from '../interfaces/data-rooms.interfaces';
import type { Folder } from '../interfaces/folders.interfaces';
import type { File } from '../interfaces/files.interfaces';

@Injectable()
export class DataRoomsController {
    constructor(private readonly dataRoomsService: DataRoomsService) {}

    create(userId: string, body: CreateDataRoomDto): Promise<DataRoom> {
        return this.dataRoomsService.create(userId, body);
    }

    list(userId: string, options: PageOptions) {
        return this.dataRoomsService.list(userId, options);
    }

    listShared(userId: string, options: PageOptions) {
        return this.dataRoomsService.listShared(userId, options);
    }

    get(userId: string, id: string): Promise<DataRoom> {
        return this.dataRoomsService.get(userId, id);
    }

    rename(userId: string, id: string, body: UpdateDataRoomDto): Promise<DataRoom> {
        return this.dataRoomsService.rename(userId, id, body);
    }

    remove(userId: string, id: string): Promise<void> {
        return this.dataRoomsService.remove(userId, id);
    }

    search(userId: string, id: string, query: string): Promise<FolderContents> {
        return this.dataRoomsService.search(userId, id, query);
    }

    stats(userId: string, id: string): Promise<{ folders: number; files: number; sizeBytes: number }> {
        return this.dataRoomsService.stats(userId, id);
    }

    contents(userId: string, id: string, parentId?: string, options?: PageOptions): Promise<FolderContents> {
        return this.dataRoomsService.contents(userId, id, parentId, options);
    }

    folderContents(userId: string, id: string, folderId: string, options?: PageOptions): Promise<FolderContents> {
        return this.dataRoomsService.contents(userId, id, folderId, options);
    }

    createFolder(userId: string, id: string, body: CreateFolderInRoomDto): Promise<Folder> {
        return this.dataRoomsService.createFolder(userId, id, body);
    }

    uploadFile(
        userId: string,
        id: string,
        folderId: string | null,
        input: UploadFileInput,
    ): Promise<File> {
        return this.dataRoomsService.uploadFile(userId, id, folderId, input);
    }
}
