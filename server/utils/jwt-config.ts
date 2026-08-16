import type { Algorithm, SignOptions, VerifyOptions } from 'jsonwebtoken';
import type { CookieOptions } from 'express';

export const JWT_ISSUER = 'acme-data-room';
export const JWT_AUDIENCE = 'acme-data-room-web';
const JWT_ALGORITHMS: Algorithm[] = ['HS256'];

export const AUTH_COOKIE = 'access_token';

export function authCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}

export function clearAuthCookieOptions(): CookieOptions {
    return { ...authCookieOptions(), maxAge: 0 };
}

let cachedSecret: string | undefined;

export function requiredJwtSecret(): string {
    if (cachedSecret) {
        return cachedSecret;
    }
    const secret = process.env.JWT_SECRET ?? '';
    if (!secret || secret.length < 32 || secret === 'dev-secret-change-me') {
        throw new Error('JWT_SECRET must be set to a strong secret (>= 32 characters)');
    }
    cachedSecret = secret;
    return secret;
}

export const jwtSignOptions: SignOptions = {
    expiresIn: '7d',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: JWT_ALGORITHMS[0],
};

export const jwtVerifyOptions: VerifyOptions = {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: JWT_ALGORITHMS,
};
