import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Public } from '../middleware/public.decorator';
import { PublicLinksController } from '../controller/public-links.controller';
import { CreatePublicLinkDto } from '../dto/shares.dto';
import { userIdFromRequest, optionalUserId, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller()
export class PublicLinksRoutes {
    constructor(private readonly publicLinksController: PublicLinksController) {}

    @Post('public-links')
    create(@Req() req: AuthenticatedRequest, @Body() body: CreatePublicLinkDto) {
        return this.publicLinksController.create(userIdFromRequest(req), body);
    }

    @Delete('public-links/:token')
    revoke(@Req() req: AuthenticatedRequest, @Param('token') token: string) {
        return this.publicLinksController.revoke(userIdFromRequest(req), token);
    }

    @Public()
    @Get('public/:token')
    open(
        @Req() req: AuthenticatedRequest,
        @Param('token') token: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.publicLinksController.open(optionalUserId(req), token, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Public()
    @Get('public/:token/folders/:folderId')
    openFolder(
        @Req() req: AuthenticatedRequest,
        @Param('token') token: string,
        @Param('folderId') folderId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.publicLinksController.openFolder(optionalUserId(req), token, folderId, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Public()
    @Get('public/:token/files/:fileId/download')
    download(@Req() req: AuthenticatedRequest, @Param('token') token: string, @Param('fileId') fileId: string) {
        return this.publicLinksController.download(optionalUserId(req), token, fileId);
    }
}
