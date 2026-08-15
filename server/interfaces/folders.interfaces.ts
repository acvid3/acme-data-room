export interface Folder {
    id: string;
    dataRoomId: string;
    parentFolderId: string | null;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeleteFolderResult {
    deletedFolders: number;
    deletedFiles: number;
}
