import { Injectable } from '@nestjs/common';
import { FoldersService } from '../services/folders.service';
import { CreateFolderDto, UpdateFolderDto } from '../dto/folders.dto';
import type { PageOptions } from '../utils/pagination';
import type { FolderContents } from '../interfaces/contents.interfaces';
import type { DeleteFolderResult, Folder } from '../interfaces/folders.interfaces';

@Injectable()
export class FoldersController {
    constructor(private readonly foldersService: FoldersService) {}

    create(userId: string, body: CreateFolderDto): Promise<Folder> {
        return this.foldersService.create(userId, body);
    }

    get(userId: string, id: string): Promise<Folder> {
        return this.foldersService.get(userId, id);
    }

    contents(userId: string, id: string, options?: PageOptions): Promise<FolderContents> {
        return this.foldersService.contents(userId, id, options);
    }

    rename(userId: string, id: string, body: UpdateFolderDto): Promise<Folder> {
        return this.foldersService.update(userId, id, body);
    }

    remove(userId: string, id: string): Promise<DeleteFolderResult> {
        return this.foldersService.remove(userId, id);
    }

    stats(userId: string, id: string): Promise<{ folders: number; files: number; sizeBytes: number }> {
        return this.foldersService.stats(userId, id);
    }
}
