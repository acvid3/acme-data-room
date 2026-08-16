import { Injectable } from '@nestjs/common';

const PRESENCE_TTL_MS = Number(process.env.PRESENCE_TTL_SECONDS ?? 300) * 1000;

@Injectable()
export class PresenceService {
    private readonly presence = new Map<string, Map<string, number>>();

    touch(roomId: string, userId: string): void {
        let room = this.presence.get(roomId);
        if (!room) {
            room = new Map();
            this.presence.set(roomId, room);
        }
        room.set(userId, Date.now());
    }

    activeUserIds(roomId: string): string[] {
        const room = this.presence.get(roomId);
        if (!room) {
            return [];
        }
        const cutoff = Date.now() - PRESENCE_TTL_MS;
        const active: string[] = [];
        for (const [userId, lastSeen] of room) {
            if (lastSeen > cutoff) {
                active.push(userId);
            } else {
                room.delete(userId);
            }
        }
        return active;
    }

    clearUser(userId: string): void {
        for (const room of this.presence.values()) {
            room.delete(userId);
        }
    }
}
