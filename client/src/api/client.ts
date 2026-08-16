import { API_BASE } from '@/config'

export class ApiError extends Error {
    status: number
    details?: string[]

    constructor(status: number, message: string, details?: string[]) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.details = details
    }
}

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
    signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, signal } = options

    const finalHeaders: Record<string, string> = { ...headers }
    if (body !== undefined && !(body instanceof FormData)) {
        finalHeaders['Content-Type'] = 'application/json'
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: finalHeaders,
        credentials: 'include',
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
        signal,
    })

    if (!res.ok) {
        let message = `Request failed with status ${res.status}`
        let details: string[] | undefined
        const data = await res.json().catch(() => null)
        if (data && typeof data.message === 'string') message = data.message
        else if (data && Array.isArray(data.message)) {
            details = data.message
            message = data.message[0]
        }
        throw new ApiError(res.status, message, details)
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as T
    }
    return (await res.json()) as T
}

export const api = {
    get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'DELETE', body }),
}
