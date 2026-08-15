import { Injectable } from '@nestjs/common';
import { PublicLinksService, PublicLinkOpenResult } from '../services/public-links.service';
import { CreatePublicLinkDto } from '../dto/shares.dto';
import type { PageOptions } from '../utils/pagination';
import type { DataRoom } from '../interfaces/data-rooms.interfaces';
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

    open(token: string, options?: PageOptions): Promise<PublicLinkOpenResult> {
        return this.publicLinksService.open(token, options);
    }

    openFolder(token: string, folderId: string, options?: PageOptions): Promise<PublicLinkOpenResult> {
        return this.publicLinksService.openFolder(token, folderId, options);
    }

    join(userId: string, token: string): Promise<DataRoom> {
        return this.publicLinksService.join(userId, token);
    }
}
