import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataRoomsController } from '../controller/data-rooms.controller';
import { CreateDataRoomDto, UpdateDataRoomDto } from '../dto/data-rooms.dto';
import { CreateFolderInRoomDto } from '../dto/folders.dto';
import { UploadFileInRoomFieldsDto } from '../dto/files.dto';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller('data-rooms')
export class DataRoomsRoutes {
    constructor(private readonly dataRoomsController: DataRoomsController) {}

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() body: CreateDataRoomDto) {
        return this.dataRoomsController.create(userIdFromRequest(req), body);
    }

    @Get()
    list(
        @Req() req: AuthenticatedRequest,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('includeUserCount') includeUserCount?: string,
    ) {
        return this.dataRoomsController.list(userIdFromRequest(req), {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            includeUserCount: includeUserCount === 'true',
        });
    }

    @Get('shared')
    listShared(
        @Req() req: AuthenticatedRequest,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('includeUserCount') includeUserCount?: string,
    ) {
        return this.dataRoomsController.listShared(userIdFromRequest(req), {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            includeUserCount: includeUserCount === 'true',
        });
    }

    @Get(':id')
    get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.dataRoomsController.get(userIdFromRequest(req), id);
    }

    @Patch(':id')
    rename(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateDataRoomDto) {
        return this.dataRoomsController.rename(userIdFromRequest(req), id, body);
    }

    @Delete(':id')
    remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.dataRoomsController.remove(userIdFromRequest(req), id);
    }

    @Get(':id/contents')
    contents(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Query('parentId') parentId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.dataRoomsController.contents(userIdFromRequest(req), id, parentId, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Get(':id/contents/:folderId')
    folderContents(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Param('folderId') folderId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.dataRoomsController.folderContents(userIdFromRequest(req), id, folderId, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @Get(':id/search')
    search(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('q') query?: string) {
        return this.dataRoomsController.search(userIdFromRequest(req), id, query ?? '');
    }

    @Get(':id/stats')
    stats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.dataRoomsController.stats(userIdFromRequest(req), id);
    }

    @Post(':id/folders')
    createFolder(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: CreateFolderInRoomDto) {
        return this.dataRoomsController.createFolder(userIdFromRequest(req), id, body);
    }

    @Post(':id/files')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() body: UploadFileInRoomFieldsDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.dataRoomsController.uploadFile(
            userIdFromRequest(req),
            id,
            body.folderId ?? null,
            {
                name: file.originalname,
                mimeType: file.mimetype,
                data: file.buffer,
            },
        );
    }
}
