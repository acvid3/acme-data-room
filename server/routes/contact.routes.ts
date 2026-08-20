import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Public } from '../middleware/public.decorator';
import { ContactDto } from '../dto/contact.dto';
import { EMAIL_SERVICE } from '../interfaces/email.interfaces';
import type { EmailService } from '../interfaces/email.interfaces';

const CONTACT_RECIPIENT = process.env.GMAIL_FROM ?? '';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

@Controller('contact')
export class ContactRoutes {
    constructor(@Inject(EMAIL_SERVICE) private readonly emailService: EmailService) {}

    @Public()
    @Post()
    async submit(@Body() body: ContactDto): Promise<{ sent: boolean }> {
        const recipient = CONTACT_RECIPIENT;
        if (!recipient) {
            return { sent: false };
        }
        const name = escapeHtml(body.name.trim());
        const email = escapeHtml(body.email.trim());
        const message = escapeHtml(body.message.trim());
        const sent = await this.emailService.send({
            to: recipient,
            subject: `Contact form: ${name}`,
            html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2>New contact form message</h2>
                <table style="border-collapse:collapse;width:100%;">
                    <tr><td style="padding:4px 8px;font-weight:bold;">Name</td><td style="padding:4px 8px;">${name}</td></tr>
                    <tr><td style="padding:4px 8px;font-weight:bold;">Email</td><td style="padding:4px 8px;">${email}</td></tr>
                    <tr><td style="padding:4px 8px;font-weight:bold;">Message</td><td style="padding:4px 8px;white-space:pre-wrap;">${message}</td></tr>
                </table>
            </div>`,
        });
        return { sent };
    }
}
