import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './middleware/auth.guard';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { AuthRoutes } from './routes/auth.routes';
import { DataRoomsRoutes } from './routes/data-rooms.routes';
import { FoldersRoutes } from './routes/folders.routes';
import { FilesRoutes } from './routes/files.routes';
import { SharesRoutes } from './routes/shares.routes';
import { PublicLinksRoutes } from './routes/public-links.routes';
import { UsersRoutes } from './routes/users.routes';
import { GmailAuthRoutes } from './routes/gmail-auth.routes';
import { ContactRoutes } from './routes/contact.routes';
import { PrismaService } from './services/prisma.service';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { DataRoomsService } from './services/data-rooms.service';
import { FoldersService } from './services/folders.service';
import { FilesService } from './services/files.service';
import { SharesService } from './services/shares.service';
import { PublicLinksService } from './services/public-links.service';
import { AccessService } from './services/access.service';
import { UsersService } from './services/users.service';
import { PresenceService } from './services/presence.service';
import { S3Storage } from './integrations/s3-storage';
import { GmailEmailService } from './integrations/gmail-email.service';
import { FILE_STORAGE } from './interfaces/storage.interfaces';
import { EMAIL_SERVICE } from './interfaces/email.interfaces';
import { AuthController } from './controller/auth.controller';
import { DataRoomsController } from './controller/data-rooms.controller';
import { FoldersController } from './controller/folders.controller';
import { FilesController } from './controller/files.controller';
import { SharesController } from './controller/shares.controller';
import { PublicLinksController } from './controller/public-links.controller';
import { UsersController } from './controller/users.controller';
import { UserRepository } from './repository/user.repository';
import { DataRoomRepository } from './repository/data-room.repository';
import { FolderRepository } from './repository/folder.repository';
import { FileRepository } from './repository/file.repository';
import { ShareRepository } from './repository/share.repository';
import { PublicLinkRepository } from './repository/public-link.repository';
import { VerificationCodeRepository } from './repository/verification-code.repository';

@Module({
    controllers: [
        AuthRoutes,
        DataRoomsRoutes,
        FoldersRoutes,
        FilesRoutes,
        SharesRoutes,
        PublicLinksRoutes,
        UsersRoutes,
        GmailAuthRoutes,
        ContactRoutes,
    ],
    providers: [
        PrismaService,
        AuthService,
        VerificationService,
        DataRoomsService,
        FoldersService,
        FilesService,
        SharesService,
        PublicLinksService,
        AccessService,
        UsersService,
        PresenceService,
        {
            provide: FILE_STORAGE,
            useClass: S3Storage,
        },
        {
            provide: EMAIL_SERVICE,
            useClass: GmailEmailService,
        },
        GmailEmailService,
        AuthController,
        DataRoomsController,
        FoldersController,
        FilesController,
        SharesController,
        PublicLinksController,
        UsersController,
        UserRepository,
        DataRoomRepository,
        FolderRepository,
        FileRepository,
        ShareRepository,
        PublicLinkRepository,
        VerificationCodeRepository,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware).forRoutes('*');
        consumer.apply(RateLimitMiddleware).forRoutes(AuthRoutes, ContactRoutes);
    }
}
