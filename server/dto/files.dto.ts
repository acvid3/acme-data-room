import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UploadFileFieldsDto {
    @IsString()
    @IsNotEmpty()
    dataRoomId!: string;

    @IsOptional()
    @IsString()
    folderId?: string;
}

export class UploadFileInRoomFieldsDto {
    @IsOptional()
    @IsString()
    folderId?: string;
}

export class UpdateFileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    folderId?: string;
}
