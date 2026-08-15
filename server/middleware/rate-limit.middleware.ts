import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

interface RateBucket {
    timestamps: number[];
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    private readonly buckets = new Map<string, RateBucket>();
    private readonly maxRequests: number;
    private readonly windowSeconds: number;

    constructor() {
        this.maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);
        this.windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
    }

    use(req: Request, res: Response, next: NextFunction): void {
        const ip = req.ip ?? 'unknown';
        const now = Date.now();
        const windowStart = now - this.windowSeconds * 1000;

        let bucket = this.buckets.get(ip);
        if (!bucket) {
            bucket = { timestamps: [] };
            this.buckets.set(ip, bucket);
        }

        bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

        if (bucket.timestamps.length >= this.maxRequests) {
            res.setHeader('Retry-After', String(this.windowSeconds));
            res.status(429).json({ statusCode: 429, message: 'Rate limit exceeded' });
            return;
        }

        bucket.timestamps.push(now);
        res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, this.maxRequests - bucket.timestamps.length)));
        next();
    }
}
