import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../middleware/public.decorator';
import { AuthController } from '../controller/auth.controller';
import {
    RegisterDto,
    LoginDto,
    VerifyCodeDto,
    VerifyLoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    DeleteAccountDto,
} from '../dto/auth.dto';
import { AUTH_COOKIE, authCookieOptions, clearAuthCookieOptions } from '../utils/jwt-config';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';

@Controller('auth')
export class AuthRoutes {
    constructor(private readonly authController: AuthController) {}

    @Public()
    @Post('register')
    register(@Body() body: RegisterDto) {
        return this.authController.register(body);
    }

    @Public()
    @Post('verify-code')
    async verifyCode(@Res({ passthrough: true }) res: Response, @Body() body: VerifyCodeDto) {
        const result = await this.authController.verifyCode(body);
        res.cookie(AUTH_COOKIE, result.accessToken, authCookieOptions());
        return result;
    }

    @Public()
    @Post('login')
    login(@Body() body: LoginDto) {
        return this.authController.login(body);
    }

    @Public()
    @Post('verify-login')
    async verifyLogin(@Res({ passthrough: true }) res: Response, @Body() body: VerifyLoginDto) {
        const result = await this.authController.verifyLogin(body);
        res.cookie(AUTH_COOKIE, result.accessToken, authCookieOptions());
        return result;
    }

    @Public()
    @Post('forgot-password')
    forgotPassword(@Body() body: ForgotPasswordDto) {
        return this.authController.forgotPassword(body);
    }

    @Public()
    @Post('reset-password')
    resetPassword(@Body() body: ResetPasswordDto) {
        return this.authController.resetPassword(body);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions());
        return { ok: true };
    }

    @Post('request-delete-account')
    requestDeleteAccount(@Req() req: AuthenticatedRequest) {
        return this.authController.requestDeleteAccount(userIdFromRequest(req));
    }

    @Delete('delete-account')
    deleteAccount(@Req() req: AuthenticatedRequest, @Body() body: DeleteAccountDto) {
        return this.authController.deleteAccount(userIdFromRequest(req), body);
    }

    @Get('me')
    me(@Req() req: AuthenticatedRequest) {
        return this.authController.me(userIdFromRequest(req));
    }
}
