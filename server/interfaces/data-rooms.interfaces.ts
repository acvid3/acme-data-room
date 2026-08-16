export type DataRoomVisibility = 'PUBLIC' | 'PRIVATE';

export interface RoomUser {
    id: string;
    email: string;
    name: string;
}

export interface DataRoom {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    visibility: DataRoomVisibility;
    createdAt: string;
    updatedAt: string;
    users?: RoomUser[];
    userCount?: number;
    activeUsers?: RoomUser[];
}
