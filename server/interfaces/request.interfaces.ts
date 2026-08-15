import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

export function userIdFromRequest(req: AuthenticatedRequest): string {
    return req.user?.id ?? '';
}
