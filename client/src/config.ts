export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api'

export const TOKEN_KEY = 'acme_data_room_token'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}
