import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../middleware/public.decorator';
import { GmailEmailService } from '../integrations/gmail-email.service';
import { IsString, IsNotEmpty } from 'class-validator';

class ExchangeCodeDto {
    @IsString()
    @IsNotEmpty()
    code!: string;
}

@Public()
@Controller('gmail-auth')
export class GmailAuthRoutes {
    constructor(private readonly gmailEmailService: GmailEmailService) {}

    @Get('consent-url')
    consentUrl(@Query('redirect') redirect?: string) {
        const redirectUri = redirect ?? process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:4000/api/gmail-auth/callback';
        return { url: this.gmailEmailService.createConsentUrl(redirectUri) };
    }

    @Post('exchange')
    async exchange(@Body() body: ExchangeCodeDto) {
        const redirectUri = process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:4000/api/gmail-auth/callback';
        const result = await this.gmailEmailService.exchangeCode(body.code, redirectUri);
        return result;
    }
}
