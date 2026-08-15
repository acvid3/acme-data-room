import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
    @IsString()
    @IsNotEmpty()
    dataRoomId!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}

export class CreateFolderInRoomDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}

export class UpdateFolderDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}
