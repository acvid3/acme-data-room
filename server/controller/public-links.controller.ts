import { Injectable } from '@nestjs/common';
import { PublicLinksService, PublicLinkOpenResult } from '../services/public-links.service';
import { CreatePublicLinkDto } from '../dto/shares.dto';
import type { PageOptions } from '../utils/pagination';
import type { DownloadFileResult } from '../interfaces/files.interfaces';
import type { PublicLink } from '../interfaces/public-links.interfaces';

@Injectable()
export class PublicLinksController {
    constructor(private readonly publicLinksService: PublicLinksService) {}

    create(userId: string, body: CreatePublicLinkDto): Promise<PublicLink> {
        return this.publicLinksService.create(userId, body);
    }

    revoke(userId: string, token: string): Promise<void> {
        return this.publicLinksService.revoke(userId, token);
    }

    open(userId: string | null, token: string, options?: PageOptions): Promise<PublicLinkOpenResult> {
        return this.publicLinksService.open(userId, token, options);
    }

    openFolder(userId: string | null, token: string, folderId: string, options?: PageOptions): Promise<PublicLinkOpenResult> {
        return this.publicLinksService.openFolder(userId, token, folderId, options);
    }

    download(userId: string | null, token: string, fileId: string): Promise<DownloadFileResult> {
        return this.publicLinksService.download(userId, token, fileId);
    }
}
