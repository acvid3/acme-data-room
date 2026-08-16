import { api } from './client'
import type {
    AuthChallenge,
    AuthResponse,
    DeleteFolderResult,
    DownloadResult,
    DataRoom,
    FileMeta,
    Folder,
    FolderContents,
    PublicLink,
    PublicPayload,
    RoomStats,
    RoomVisibility,
    SearchResults,
    Share,
    ShareableType,
    User,
} from '@/types'

export const authApi = {
    register: (email: string, password: string, name: string) =>
        api.post<AuthChallenge>('/auth/register', { email, password, name }),
    verifyCode: (email: string, code: string) =>
        api.post<AuthResponse>('/auth/verify-code', { email, code }),
    login: (email: string, password: string) =>
        api.post<AuthChallenge>('/auth/login', { email, password }),
    verifyLogin: (email: string, code: string) =>
        api.post<AuthResponse>('/auth/verify-login', { email, code }),
    forgotPassword: (email: string) =>
        api.post<AuthChallenge>('/auth/forgot-password', { email }),
    resetPassword: (email: string, code: string, newPassword: string) =>
        api.post<{ message?: string }>('/auth/reset-password', { email, code, newPassword }),
    requestDeleteAccount: () => api.post<AuthChallenge>('/auth/request-delete-account'),
    deleteAccount: (code: string) =>
        api.delete<{ ok: boolean }>('/auth/delete-account', { code }),
    me: () => api.get<User>('/auth/me'),
}

export const roomApi = {
    list: (limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        params.set('includeUserCount', 'true')
        return api.get<unknown>(`/data-rooms?${params.toString()}`)
    },
    listShared: (limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        params.set('includeUserCount', 'true')
        return api.get<unknown>(`/data-rooms/shared?${params.toString()}`)
    },
    get: (id: string) => api.get<DataRoom>(`/data-rooms/${id}`),
    create: (name: string, description?: string, visibility?: RoomVisibility) =>
        api.post<DataRoom>('/data-rooms', { name, description, visibility }),
    rename: (id: string, name: string) => api.patch<DataRoom>(`/data-rooms/${id}`, { name }),
    setVisibility: (id: string, visibility: RoomVisibility) =>
        api.patch<DataRoom>(`/data-rooms/${id}`, { visibility }),
    remove: (id: string) => api.delete<{ ok: boolean }>(`/data-rooms/${id}`),
    contents: (roomId: string, folderId?: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        const query = params.toString()
        const base = folderId
            ? `/data-rooms/${roomId}/contents/${folderId}`
            : `/data-rooms/${roomId}/contents`
        return api.get<FolderContents>(query ? `${base}?${query}` : base)
    },
    createFolder: (roomId: string, name: string, parentId?: string) =>
        api.post<Folder>(`/data-rooms/${roomId}/folders`, { name, parentId }),
    search: (roomId: string, q: string) =>
        api.get<SearchResults>(`/data-rooms/${roomId}/search?q=${encodeURIComponent(q)}`),
    stats: (roomId: string) => api.get<RoomStats>(`/data-rooms/${roomId}/stats`),
}

export const userApi = {
    search: (email: string) => api.get<User[]>(`/users?email=${encodeURIComponent(email)}`),
}

export const fileApi = {
    get: (id: string) => api.get<FileMeta>(`/files/${id}`),
    download: (id: string) => api.get<DownloadResult>(`/files/${id}/download`),
    rename: (id: string, name: string) => api.patch<FileMeta>(`/files/${id}`, { name }),
    move: (id: string, folderId: string | null) =>
        api.patch<FileMeta>(`/files/${id}`, { folderId }),
    remove: (id: string) => api.delete<{ ok: boolean }>(`/files/${id}`),
}

export const folderApi = {
    create: (input: { dataRoomId: string; name: string; parentId: string | null }) =>
        api.post<Folder>('/folders', input),
    get: (id: string) => api.get<Folder>(`/folders/${id}`),
    contents: (id: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        const query = params.toString()
        return api.get<FolderContents>(query ? `/folders/${id}/contents?${query}` : `/folders/${id}/contents`)
    },
    rename: (id: string, name: string) => api.patch<Folder>(`/folders/${id}`, { name }),
    move: (id: string, parentId: string | null) =>
        api.patch<Folder>(`/folders/${id}`, { parentId }),
    stats: (id: string) => api.get<RoomStats>(`/folders/${id}/stats`),
    remove: (id: string) => api.delete<DeleteFolderResult>(`/folders/${id}`),
}

export const shareApi = {
    create: (shareableType: ShareableType, shareableId: string, userId: string) =>
        api.post<Share>('/shares', { shareableType, shareableId, userId }),
    list: (shareableType: ShareableType, shareableId: string) =>
        api.get<Share[]>(`/shares?shareableType=${shareableType}&shareableId=${shareableId}`),
    revoke: (id: string) => api.delete<{ ok: boolean }>(`/shares/${id}`),
}

export const publicLinkApi = {
    create: (shareableType: ShareableType, shareableId: string) =>
        api.post<PublicLink>('/public-links', { shareableType, shareableId }),
    open: (token: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        const query = params.toString()
        return api.get<PublicPayload>(query ? `/public/${token}?${query}` : `/public/${token}`)
    },
    openFolder: (token: string, folderId: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.set('limit', String(limit))
        if (offset !== undefined) params.set('offset', String(offset))
        const query = params.toString()
        return api.get<PublicPayload>(
            query ? `/public/${token}/folders/${folderId}?${query}` : `/public/${token}/folders/${folderId}`,
        )
    },
    download: (token: string, fileId: string) =>
        api.get<DownloadResult>(`/public/${token}/files/${fileId}/download`),
    revoke: (token: string) => api.delete<{ ok: boolean }>(`/public-links/${token}`),
}
