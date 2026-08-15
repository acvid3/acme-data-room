import { Injectable } from '@nestjs/common';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FileStorage } from '../interfaces/storage.interfaces';

const DEFAULT_DOWNLOAD_EXPIRES = 3600;

@Injectable()
export class S3Storage implements FileStorage {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor() {
        this.bucket = process.env.S3_BUCKET ?? '';
        this.client = new S3Client({
            endpoint: process.env.S3_ENDPOINT ?? undefined,
            region: process.env.S3_REGION ?? 'us-east-1',
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY ?? '',
                secretAccessKey: process.env.S3_SECRET_KEY ?? '',
            },
        });
    }

    async createPresignedDownloadUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn: DEFAULT_DOWNLOAD_EXPIRES });
    }

    async put(key: string, mimeType: string, data: Buffer): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: mimeType,
                Body: data,
            }),
        );
    }

    async delete(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
    }
}
