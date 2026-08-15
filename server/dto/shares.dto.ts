import { IsEnum, IsString } from 'class-validator';
import type { ShareableType } from '../interfaces/shares.interfaces';

export class CreateShareDto {
    @IsEnum(['DATAROOM', 'FOLDER', 'FILE'])
    shareableType!: ShareableType;

    @IsString()
    shareableId!: string;

    @IsString()
    userId!: string;
}

export class CreatePublicLinkDto {
    @IsEnum(['DATAROOM', 'FOLDER', 'FILE'])
    shareableType!: ShareableType;

    @IsString()
    shareableId!: string;
}
