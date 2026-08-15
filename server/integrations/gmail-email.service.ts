import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import type { EmailMessage, EmailService } from '../interfaces/email.interfaces';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

@Injectable()
export class GmailEmailService implements EmailService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly refreshToken: string;
    private readonly fromEmail: string;

    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID ?? '';
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
        this.refreshToken = process.env.GMAIL_REFRESH_TOKEN ?? '';
        this.fromEmail = process.env.GMAIL_FROM ?? '';
    }

    private buildOAuth2Client() {
        const client = new google.auth.OAuth2(this.clientId, this.clientSecret);
        client.setCredentials({ refresh_token: this.refreshToken });
        return client;
    }

    async send(message: EmailMessage): Promise<boolean> {
        if (!this.refreshToken || !this.fromEmail) {
            return false;
        }
        try {
            const client = this.buildOAuth2Client();
            const gmail = google.gmail({ version: 'v1', auth: client });

            const raw = Buffer.from(
                `To: ${message.to}\r\n` +
                    `From: ${this.fromEmail}\r\n` +
                    `Subject: ${message.subject}\r\n` +
                    `Content-Type: text/html; charset=UTF-8\r\n` +
                    `MIME-Version: 1.0\r\n\r\n` +
                    message.html,
            )
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw },
            });
            return true;
        } catch {
            return false;
        }
    }

    createConsentUrl(redirectUri: string): string {
        const client = this.buildOAuth2Client();
        return client.generateAuthUrl({
            access_type: 'offline',
            scope: [GMAIL_SCOPE],
            prompt: 'consent',
            redirect_uri: redirectUri,
        });
    }

    async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string }> {
        const client = this.buildOAuth2Client();
        const { tokens } = await client.getToken({
            code,
            redirect_uri: redirectUri,
        });
        return {
            accessToken: tokens.access_token ?? '',
            refreshToken: tokens.refresh_token ?? '',
        };
    }
}
