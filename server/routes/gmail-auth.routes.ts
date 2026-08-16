import { BadRequestException, Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Public } from '../middleware/public.decorator';
import { GmailEmailService } from '../integrations/gmail-email.service';
import { userIdFromRequest, type AuthenticatedRequest } from '../interfaces/request.interfaces';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

class ExchangeCodeDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsOptional()
    @IsString()
    redirect?: string;
}

function isAllowedRedirect(redirect: string): boolean {
    const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const defaultUri = process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:4000/api/gmail-auth/callback';
    return redirect === defaultUri || origins.some((origin) => redirect.startsWith(origin));
}

@Controller('gmail-auth')
export class GmailAuthRoutes {
    constructor(private readonly gmailEmailService: GmailEmailService) {}

    @Public()
    @Get('consent-url')
    consentUrl(@Query('redirect') redirect?: string) {
        const redirectUri = redirect ?? process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:4000/api/gmail-auth/callback';
        if (!isAllowedRedirect(redirectUri)) {
            throw new BadRequestException('Redirect URL is not allowed');
        }
        return { url: this.gmailEmailService.createConsentUrl(redirectUri) };
    }

    @Post('exchange')
    async exchange(@Req() req: AuthenticatedRequest, @Body() body: ExchangeCodeDto) {
        if (!userIdFromRequest(req)) {
            throw new BadRequestException('Authentication required');
        }
        const redirectUri = body.redirect ?? process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:4000/api/gmail-auth/callback';
        if (!isAllowedRedirect(redirectUri)) {
            throw new BadRequestException('Redirect URL is not allowed');
        }
        const result = await this.gmailEmailService.exchangeCode(body.code, redirectUri);
        return { accessToken: result.accessToken };
    }
}
