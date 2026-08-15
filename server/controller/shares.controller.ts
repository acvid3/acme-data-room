import { Injectable } from '@nestjs/common';
import { SharesService } from '../services/shares.service';
import { CreateShareDto } from '../dto/shares.dto';
import type { Share, ShareableType } from '../interfaces/shares.interfaces';

@Injectable()
export class SharesController {
    constructor(private readonly sharesService: SharesService) {}

    create(userId: string, body: CreateShareDto): Promise<Share> {
        return this.sharesService.create(userId, body);
    }

    list(userId: string, shareableType: string, shareableId: string): Promise<Share[]> {
        return this.sharesService.list(userId, shareableType as ShareableType, shareableId);
    }

    revoke(userId: string, id: string): Promise<void> {
        return this.sharesService.revoke(userId, id);
    }
}
