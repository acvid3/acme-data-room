import { verify } from 'jsonwebtoken';
import type { Request } from 'express';
import { requiredJwtSecret, jwtVerifyOptions, AUTH_COOKIE } from '../utils/jwt-config';

export interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

export function userIdFromRequest(req: AuthenticatedRequest): string {
    return req.user?.id ?? '';
}

export function optionalUserId(req: Request): string | null {
    const header = req.headers['authorization'];
    const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = req.cookies?.[AUTH_COOKIE];
    const token = headerToken ?? cookieToken;
    if (!token) {
        return null;
    }
    try {
        const payload = verify(token, requiredJwtSecret(), jwtVerifyOptions) as { sub: string };
        return payload.sub ?? null;
    } catch {
        return null;
    }
}
