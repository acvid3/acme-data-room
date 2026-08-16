import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesController } from '../controller/files.controller';
import { UploadFileFieldsDto, UpdateFileDto } from '../dto/files.dto';
import { FILE_UPLOAD_LIMITS } from '../services/files.service';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller('files')
export class FilesRoutes {
    constructor(private readonly filesController: FilesController) {}

    @Post()
    @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_LIMITS))
    upload(
        @Req() req: AuthenticatedRequest,
        @Body() body: UploadFileFieldsDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.filesController.upload(
            userIdFromRequest(req),
            body.dataRoomId,
            body.folderId ?? null,
            file,
        );
    }

    @Get(':id')
    get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.filesController.get(userIdFromRequest(req), id);
    }

    @Get(':id/download')
    download(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.filesController.download(userIdFromRequest(req), id);
    }

    @Patch(':id')
    update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateFileDto) {
        return this.filesController.update(userIdFromRequest(req), id, body);
    }

    @Delete(':id')
    remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.filesController.remove(userIdFromRequest(req), id);
    }
}
