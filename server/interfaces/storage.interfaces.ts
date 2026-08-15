export const FILE_STORAGE = 'FILE_STORAGE';

export interface FileStorage {
    createPresignedDownloadUrl(key: string): Promise<string>;
    put(key: string, mimeType: string, data: Buffer): Promise<void>;
    delete(key: string): Promise<void>;
}
