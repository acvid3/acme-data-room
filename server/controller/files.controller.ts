import { Injectable } from '@nestjs/common';
import { FilesService } from '../services/files.service';
import { UpdateFileDto } from '../dto/files.dto';
import type { DownloadFileResult, File } from '../interfaces/files.interfaces';

@Injectable()
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    upload(
        userId: string,
        dataRoomId: string,
        folderId: string | null,
        file: Express.Multer.File,
    ): Promise<File> {
        return this.filesService.createUpload(userId, dataRoomId, folderId, {
            name: file.originalname,
            mimeType: file.mimetype,
            data: file.buffer,
        });
    }

    get(userId: string, id: string): Promise<File> {
        return this.filesService.get(userId, id);
    }

    download(userId: string, id: string): Promise<DownloadFileResult> {
        return this.filesService.download(userId, id);
    }

    update(userId: string, id: string, body: UpdateFileDto): Promise<File> {
        return this.filesService.update(userId, id, body);
    }

    remove(userId: string, id: string): Promise<void> {
        return this.filesService.remove(userId, id);
    }
}
