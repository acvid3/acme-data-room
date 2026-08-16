import { verify } from 'jsonwebtoken';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

export function userIdFromRequest(req: AuthenticatedRequest): string {
    return req.user?.id ?? '';
}

export function optionalUserId(req: Request): string | null {
    const header = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        return null;
    }
    try {
        const payload = verify(token, process.env.JWT_SECRET ?? '') as { sub: string };
        return payload.sub ?? null;
    } catch {
        return null;
    }
}
