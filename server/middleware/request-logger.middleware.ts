import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const SENSITIVE_QUERY_KEYS = ['code', 'token', 'authorization'];

function maskSensitiveUrl(originalUrl: string): string {
    const maskedPath = originalUrl.replace(/\/api\/public\/[a-f0-9]+/gi, '/api/public/***');
    const queryIndex = maskedPath.indexOf('?');
    if (queryIndex === -1) {
        return maskedPath;
    }
    const path = maskedPath.slice(0, queryIndex);
    const query = new URLSearchParams(maskedPath.slice(queryIndex + 1));
    for (const key of SENSITIVE_QUERY_KEYS) {
        if (query.has(key)) {
            query.set(key, '***');
        }
    }
    return `${path}?${query.toString()}`;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`${req.method} ${maskSensitiveUrl(req.originalUrl)} ${res.statusCode} ${duration}ms`);
        });
        next();
    }
}
