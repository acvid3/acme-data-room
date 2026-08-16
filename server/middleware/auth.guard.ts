import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';
import { requiredJwtSecret, jwtVerifyOptions, AUTH_COOKIE } from '../utils/jwt-config';
import type { AuthenticatedRequest } from '../interfaces/request.interfaces';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const header = request.headers['authorization'];
        const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
        const cookieToken = request.cookies?.[AUTH_COOKIE];
        const token = headerToken ?? cookieToken;
        if (!token) {
            throw new UnauthorizedException('No auth token');
        }

        try {
            const payload = verify(token, requiredJwtSecret(), jwtVerifyOptions) as { sub: string };
            request.user = { id: payload.sub };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
