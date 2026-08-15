import { Injectable } from '@nestjs/common';
import { AuthService, RegisterResult } from '../services/auth.service';
import {
    RegisterDto,
    LoginDto,
    VerifyCodeDto,
    VerifyLoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    DeleteAccountDto,
} from '../dto/auth.dto';
import type { AuthResponse, User } from '../interfaces/auth.interfaces';

@Injectable()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register(body: RegisterDto): Promise<RegisterResult> {
        return this.authService.register(body);
    }

    verifyCode(body: VerifyCodeDto): Promise<AuthResponse> {
        return this.authService.verifyCode(body);
    }

    login(body: LoginDto): Promise<{ email: string; code?: string; sent: boolean }> {
        return this.authService.login(body);
    }

    verifyLogin(body: VerifyLoginDto): Promise<AuthResponse> {
        return this.authService.verifyLogin(body);
    }

    forgotPassword(body: ForgotPasswordDto): Promise<{ email: string; code?: string; sent: boolean }> {
        return this.authService.forgotPassword(body);
    }

    resetPassword(body: ResetPasswordDto): Promise<void> {
        return this.authService.resetPassword(body);
    }

    requestDeleteAccount(userId: string): Promise<{ email: string; code?: string; sent: boolean }> {
        return this.authService.requestDeleteAccount(userId);
    }

    deleteAccount(userId: string, body: DeleteAccountDto): Promise<void> {
        return this.authService.deleteAccount(userId, body.code);
    }

    me(userId: string): Promise<User> {
        return this.authService.me(userId);
    }
}
