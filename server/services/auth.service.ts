import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { UserRepository } from '../repository/user.repository';
import { DataRoomRepository } from '../repository/data-room.repository';
import { FileRepository } from '../repository/file.repository';
import { ShareRepository } from '../repository/share.repository';
import { PublicLinkRepository } from '../repository/public-link.repository';
import { VerificationService } from './verification.service';
import { FILE_STORAGE } from '../interfaces/storage.interfaces';
import type { FileStorage } from '../interfaces/storage.interfaces';
import { EMAIL_SERVICE } from '../interfaces/email.interfaces';
import type { EmailService } from '../interfaces/email.interfaces';
import { RegisterDto, LoginDto, VerifyCodeDto, VerifyLoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';
import type { AuthResponse, User } from '../interfaces/auth.interfaces';

const BCRYPT_ROUNDS = 10;

export interface RegisterResult {
    email: string;
    code?: string;
    sent: boolean;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly verificationService: VerificationService,
        private readonly dataRoomRepository: DataRoomRepository,
        private readonly fileRepository: FileRepository,
        private readonly shareRepository: ShareRepository,
        private readonly publicLinkRepository: PublicLinkRepository,
        @Inject(FILE_STORAGE) private readonly storage: FileStorage,
        @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    ) {}

    async register(body: RegisterDto): Promise<RegisterResult> {
        const email = body.email.trim().toLowerCase();
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await hash(body.password, BCRYPT_ROUNDS);
        await this.userRepository.create({
            email,
            name: body.name.trim(),
            passwordHash,
        });

        const { code, sent } = await this.verificationService.issueCode(email, 'email_verification');
        return { email, code: sent ? undefined : code, sent };
    }

    async verifyCode(body: VerifyCodeDto): Promise<AuthResponse> {
        const email = body.email.trim().toLowerCase();
        const valid = await this.verificationService.verifyCode(email, body.code, 'email_verification');
        if (!valid) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }
        const user = await this.requireUser(email);
        await this.sendWelcomeEmail(user);
        return this.buildAuthResponse(user);
    }

    private async sendWelcomeEmail(user: User): Promise<void> {
        try {
            await this.emailService.send({
                to: user.email,
                subject: 'Welcome to Acme Data Room',
                html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2>Welcome, ${user.name}!</h2>
                    <p>Your account has been successfully verified. We're happy to have you on board.</p>
                    <p>You can now log in and start organizing your documents in Data Rooms.</p>
                    <p>If you have any questions, feel free to reach out.</p>
                </div>`,
            });
        } catch {
            // welcome email must not fail the registration
        }
    }

    async login(body: LoginDto): Promise<{ email: string; code?: string; sent: boolean }> {
        const email = body.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const valid = await compare(body.password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const { code, sent } = await this.verificationService.issueCode(email, 'login');
        return { email, code: sent ? undefined : code, sent };
    }

    async verifyLogin(body: VerifyLoginDto): Promise<AuthResponse> {
        const email = body.email.trim().toLowerCase();
        const valid = await this.verificationService.verifyCode(email, body.code, 'login');
        if (!valid) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }
        const user = await this.requireUser(email);
        return this.buildAuthResponse(user);
    }

    async forgotPassword(body: ForgotPasswordDto): Promise<{ email: string; code?: string; sent: boolean }> {
        const email = body.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundException('No account found for this email');
        }
        const { code, sent } = await this.verificationService.issueCode(email, 'password_reset');
        return { email, code: sent ? undefined : code, sent };
    }

    async resetPassword(body: ResetPasswordDto): Promise<void> {
        const email = body.email.trim().toLowerCase();
        const valid = await this.verificationService.verifyCode(email, body.code, 'password_reset');
        if (!valid) {
            throw new UnauthorizedException('Invalid or expired reset code');
        }
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const passwordHash = await hash(body.newPassword, BCRYPT_ROUNDS);
        await this.userRepository.updatePassword(user.id, passwordHash);
    }

    async requestDeleteAccount(userId: string): Promise<{ email: string; code?: string; sent: boolean }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const { code, sent } = await this.verificationService.issueCode(user.email, 'delete_account');
        return { email: user.email, code: sent ? undefined : code, sent };
    }

    async deleteAccount(userId: string, code: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const valid = await this.verificationService.verifyCode(user.email, code, 'delete_account');
        if (!valid) {
            throw new UnauthorizedException('Invalid or expired confirmation code');
        }

        const storageKeys = await this.fileRepository.findStorageKeysByOwner(userId);
        const rooms = await this.dataRoomRepository.findByOwner(userId);
        for (const room of rooms) {
            await this.publicLinkRepository.deleteByShareable('DATAROOM', room.id);
        }
        await this.dataRoomRepository.deleteByOwner(userId);
        await this.shareRepository.deleteByUserId(userId);
        await this.userRepository.deleteById(userId);
        await Promise.all(storageKeys.map((key) => this.storage.delete(key).catch(() => undefined)));
    }

    async me(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }

    private async requireUser(email: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
    }

    private buildAuthResponse(user: User): AuthResponse {
        const accessToken = sign({ sub: user.id }, process.env.JWT_SECRET ?? '', { expiresIn: '7d' });
        return { accessToken, user };
    }
}
