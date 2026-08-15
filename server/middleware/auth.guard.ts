import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';
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
        const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) {
            throw new UnauthorizedException('No auth token');
        }

        try {
            const payload = verify(token, process.env.JWT_SECRET ?? '') as { sub: string };
            request.user = { id: payload.sub };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
