import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/\S/)
    @MaxLength(50)
    name!: string;
}

export class LoginDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}

export class VerifyCodeDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/)
    code!: string;
}

export class VerifyLoginDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/)
    code!: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;
}

export class ResetPasswordDto {
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/)
    code!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    newPassword!: string;
}

export class DeleteAccountDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/)
    code!: string;
}
