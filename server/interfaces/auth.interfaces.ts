export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}
