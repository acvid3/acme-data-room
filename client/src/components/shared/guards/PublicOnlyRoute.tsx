import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth'

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) return null
    if (user) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}
