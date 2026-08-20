import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ContactDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MaxLength(100)
    name!: string;

    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MaxLength(2000)
    message!: string;
}
