import * as React from 'react'
import { authApi } from '@/api'
import { clearToken, getToken, setToken } from '@/config'
import type { AuthChallenge, User } from '@/types'

type AuthContextValue = {
    user: User | null
    loading: boolean
    requestLoginCode: (email: string, password: string) => Promise<AuthChallenge>
    confirmLogin: (email: string, code: string) => Promise<void>
    requestRegister: (email: string, password: string, name: string) => Promise<AuthChallenge>
    confirmRegister: (email: string, code: string) => Promise<void>
    requestPasswordResetCode: (email: string) => Promise<AuthChallenge>
    resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
    requestDeleteAccountCode: () => Promise<AuthChallenge>
    deleteAccount: (code: string) => Promise<void>
    logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const token = getToken()
        if (!token) {
            setLoading(false)
            return
        }
        authApi
            .me()
            .then(setUser)
            .catch(() => clearToken())
            .finally(() => setLoading(false))
    }, [])

    const applyAuth = React.useCallback((token: string, user: User) => {
        setToken(token)
        setUser(user)
    }, [])

    const requestLoginCode = React.useCallback(
        async (email: string, password: string) => authApi.login(email, password),
        [],
    )

    const confirmLogin = React.useCallback(
        async (email: string, code: string) => {
            const res = await authApi.verifyLogin(email, code)
            applyAuth(res.accessToken, res.user)
        },
        [applyAuth],
    )

    const requestRegister = React.useCallback(
        async (email: string, password: string, name: string) =>
            authApi.register(email, password, name),
        [],
    )

    const confirmRegister = React.useCallback(
        async (email: string, code: string) => {
            const res = await authApi.verifyCode(email, code)
            applyAuth(res.accessToken, res.user)
        },
        [applyAuth],
    )

    const requestPasswordResetCode = React.useCallback(
        async (email: string) => authApi.forgotPassword(email),
        [],
    )

    const resetPassword = React.useCallback(
        async (email: string, code: string, newPassword: string) => {
            await authApi.resetPassword(email, code, newPassword)
        },
        [],
    )

    const requestDeleteAccountCode = React.useCallback(
        async () => authApi.requestDeleteAccount(),
        [],
    )

    const deleteAccount = React.useCallback(async (code: string) => {
        await authApi.deleteAccount(code)
        clearToken()
        setUser(null)
    }, [])

    const logout = React.useCallback(() => {
        clearToken()
        setUser(null)
    }, [])

    const value = React.useMemo(
        () => ({
            user,
            loading,
            requestLoginCode,
            confirmLogin,
            requestRegister,
            confirmRegister,
            requestPasswordResetCode,
            resetPassword,
            requestDeleteAccountCode,
            deleteAccount,
            logout,
        }),
        [
            user,
            loading,
            requestLoginCode,
            confirmLogin,
            requestRegister,
            confirmRegister,
            requestPasswordResetCode,
            resetPassword,
            requestDeleteAccountCode,
            deleteAccount,
            logout,
        ],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = React.useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}
