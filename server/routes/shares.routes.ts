import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SharesController } from '../controller/shares.controller';
import { CreateShareDto } from '../dto/shares.dto';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller('shares')
export class SharesRoutes {
    constructor(private readonly sharesController: SharesController) {}

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() body: CreateShareDto) {
        return this.sharesController.create(userIdFromRequest(req), body);
    }

    @Get()
    list(
        @Req() req: AuthenticatedRequest,
        @Query('shareableType') shareableType: string,
        @Query('shareableId') shareableId: string,
    ) {
        return this.sharesController.list(userIdFromRequest(req), shareableType, shareableId);
    }

    @Delete(':id')
    revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.sharesController.revoke(userIdFromRequest(req), id);
    }
}
