export interface File {
    id: string;
    dataRoomId: string;
    folderId: string | null;
    name: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    updatedAt: string;
}

export interface DownloadFileResult {
    url: string;
    name: string;
}
