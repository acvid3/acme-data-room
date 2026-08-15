export type ShareableType = 'DATAROOM' | 'FOLDER' | 'FILE';

export interface ShareUser {
    id: string;
    email: string;
    name: string;
}

export interface Share {
    id: string;
    shareableType: ShareableType;
    shareableId: string;
    userId: string;
    user?: ShareUser;
    createdAt: string;
}
