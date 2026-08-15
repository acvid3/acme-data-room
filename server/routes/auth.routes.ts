import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
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
    verifyCode(@Body() body: VerifyCodeDto) {
        return this.authController.verifyCode(body);
    }

    @Public()
    @Post('login')
    login(@Body() body: LoginDto) {
        return this.authController.login(body);
    }

    @Public()
    @Post('verify-login')
    verifyLogin(@Body() body: VerifyLoginDto) {
        return this.authController.verifyLogin(body);
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
