import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { FoldersController } from '../controller/folders.controller';
import { CreateFolderDto, UpdateFolderDto } from '../dto/folders.dto';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller('folders')
export class FoldersRoutes {
    constructor(private readonly foldersController: FoldersController) {}

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() body: CreateFolderDto) {
        return this.foldersController.create(userIdFromRequest(req), body);
    }

    @Get(':id')
    get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.foldersController.get(userIdFromRequest(req), id);
    }

    @Get(':id/contents')
    contents(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.foldersController.contents(userIdFromRequest(req), id, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Get(':id/stats')
    stats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.foldersController.stats(userIdFromRequest(req), id);
    }

    @Patch(':id')
    rename(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateFolderDto) {
        return this.foldersController.rename(userIdFromRequest(req), id, body);
    }

    @Delete(':id')
    remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.foldersController.remove(userIdFromRequest(req), id);
    }
}
