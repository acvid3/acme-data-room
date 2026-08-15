import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? 'postgresql://dataroom:dataroom@localhost:5433/dataroom_test?schema=public';
const SERVER_DIR = path.resolve(__dirname, '..', '..');

export interface TestApp {
    baseUrl: string;
    process: ChildProcess;
    close(): Promise<void>;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilReady(baseUrl: string, child: ChildProcess): Promise<void> {
    for (let i = 0; i < 40; i++) {
        if (child.exitCode !== null) {
            throw new Error(`server exited early with code ${child.exitCode}`);
        }
        try {
            const res = await fetch(`${baseUrl}/api/auth/me`);
            if (res.status === 401 || res.status === 200) {
                return;
            }
        } catch {
            // not up yet
        }
        await sleep(250);
    }
    throw new Error('server did not become ready in time');
}

export async function startTestApp(): Promise<TestApp> {
    const port = 4100 + Math.floor(Math.random() * 900);
    const child = spawn('node', [path.join(SERVER_DIR, 'dist', 'main.js')], {
        env: {
            ...process.env,
            PORT: String(port),
            DATABASE_URL: TEST_DATABASE_URL,
            JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret',
            GMAIL_REFRESH_TOKEN: '',
            GMAIL_FROM: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', () => {});
    child.stderr?.on('data', (data) => {
        process.stderr.write(data);
    });

    const baseUrl = `http://127.0.0.1:${port}`;
    await waitUntilReady(baseUrl, child);

    return {
        baseUrl,
        process: child,
        close: async () => {
            child.kill('SIGTERM');
            await once(child, 'exit').catch(() => undefined);
        },
    };
}

export interface ApiResult {
    status: number;
    body: unknown;
}

export async function api(
    baseUrl: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    options: { token?: string; body?: unknown } = {},
): Promise<ApiResult> {
    const headers: Record<string, string> = {};
    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }
    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: options.body instanceof FormData ? options.body : options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let body: unknown = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }
    return { status: response.status, body };
}

export interface UploadFileOptions {
    token: string;
    dataRoomId: string;
    folderId?: string | null;
    name: string;
    mimeType?: string;
    data?: Buffer;
}

export async function uploadFile(
    baseUrl: string,
    options: UploadFileOptions,
): Promise<ApiResult> {
    const form = new FormData();
    form.append('dataRoomId', options.dataRoomId);
    if (options.folderId) {
        form.append('folderId', options.folderId);
    }
    const bytes = options.data ?? Buffer.from('file-content');
    form.append('file', new Blob([bytes], { type: options.mimeType ?? 'application/octet-stream' }), options.name);
    return api(baseUrl, 'POST', '/api/files', { token: options.token, body: form });
}

export interface RegisteredUser {
    token: string;
    id: string;
    email: string;
}

export async function registerUser(
    baseUrl: string,
    email: string,
    name = 'Test User',
    password = 'secret123',
): Promise<RegisteredUser> {
    const result = await api(baseUrl, 'POST', '/api/auth/register', {
        body: { email, password, name },
    });
    if (result.status >= 400) {
        throw new Error(`register failed ${result.status}: ${JSON.stringify(result.body)}`);
    }
    const registerBody = result.body as { code?: string; sent: boolean };
    if (!registerBody.code) {
        throw new Error('register did not return a dev verification code');
    }
    const verify = await api(baseUrl, 'POST', '/api/auth/verify-code', {
        body: { email, code: registerBody.code },
    });
    if (verify.status >= 400) {
        throw new Error(`verify-code failed ${verify.status}: ${JSON.stringify(verify.body)}`);
    }
    const body = verify.body as { accessToken: string; user: { id: string; email: string } };
    return { token: body.accessToken, id: body.user.id, email: body.user.email };
}
