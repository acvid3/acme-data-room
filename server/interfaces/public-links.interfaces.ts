import type { ShareableType } from './shares.interfaces';

export interface PublicLink {
    id: string;
    token: string;
    shareableType: ShareableType;
    shareableId: string;
    url: string;
    createdAt: string;
}
