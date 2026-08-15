import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { VerificationCodeRepository } from '../repository/verification-code.repository';
import { EMAIL_SERVICE } from '../interfaces/email.interfaces';
import type { EmailService } from '../interfaces/email.interfaces';

const CODE_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MINUTES = 60;
const RATE_LIMIT_MAX = 5;
const MAX_ATTEMPTS = 5;

@Injectable()
export class VerificationService {
    constructor(
        private readonly verificationCodeRepository: VerificationCodeRepository,
        @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    ) {}

    async issueCode(email: string, purpose: string): Promise<{ code: string; sent: boolean }> {
        const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60_000);
        const recent = await this.verificationCodeRepository.countRecent(email, since);
        if (recent >= RATE_LIMIT_MAX) {
            throw new Error('Too many verification requests. Try again later.');
        }

        const code = String(randomInt(100000, 1000000));
        await this.verificationCodeRepository.create({
            email,
            code,
            purpose,
            expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000),
        });

        this.logCode(email, purpose, code);

        const subject = purpose === 'password_reset' ? 'Reset your password' : 'Your verification code';
        const sent = await this.emailService.send({
            to: email,
            subject,
            html: this.renderTemplate(purpose, code),
        });

        return { code, sent };
    }

    async verifyCode(email: string, code: string, purpose: string): Promise<boolean> {
        const record = await this.verificationCodeRepository.findValid(email, code, purpose);
        if (!record) {
            return false;
        }
        if (record.expiresAt.getTime() < Date.now()) {
            await this.verificationCodeRepository.delete(record.id);
            return false;
        }
        if (record.attempts >= MAX_ATTEMPTS) {
            await this.verificationCodeRepository.delete(record.id);
            return false;
        }
        await this.verificationCodeRepository.incrementAttempts(record.id);
        await this.verificationCodeRepository.delete(record.id);
        return true;
    }

    private logCode(email: string, purpose: string, code: string): void {
        try {
            const dir = join(process.cwd(), 'logs');
            mkdirSync(dir, { recursive: true });
            appendFileSync(
                join(dir, 'codes.log'),
                `${new Date().toISOString()} [${purpose}] ${email} → ${code}\n`,
            );
        } catch {
            // logging must never break code issuance
        }
    }

    private renderTemplate(purpose: string, code: string): string {
        const heading =
            purpose === 'password_reset' ? 'Password Reset Code' : 'Email Verification Code';
        return `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2>${heading}</h2>
            <p>Use this code to continue:</p>
            <div style="font-size:32px;font-weight:bold;padding:20px 0;color:#4F46E5;">${code}</div>
            <p>This code expires in ${CODE_EXPIRY_MINUTES} minutes.</p>
            <p>If you did not request this, ignore this email.</p>
        </div>`;
    }
}
