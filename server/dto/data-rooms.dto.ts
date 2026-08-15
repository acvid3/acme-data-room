import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { DataRoomVisibility } from '../interfaces/data-rooms.interfaces';

export class CreateDataRoomDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsEnum(['PUBLIC', 'PRIVATE'])
    visibility?: DataRoomVisibility;
}

export class UpdateDataRoomDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsEnum(['PUBLIC', 'PRIVATE'])
    visibility?: DataRoomVisibility;
}
