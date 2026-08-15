import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/shared/guards'
import AppShell from '@/components/blocks/AppShell'
import Auth from '@/components/blocks/Auth'
import Landing from '@/components/blocks/Landing'
import Dashboard from '@/components/blocks/Dashboard'
import RoomsList from '@/components/blocks/RoomsList'
import SharedRooms from '@/components/blocks/SharedRooms'
import RoomViewer from '@/components/blocks/RoomViewer'
import FileViewer from '@/components/blocks/FileViewer'
import PublicViewer from '@/components/blocks/PublicViewer'
import Profile from '@/components/blocks/Profile'
import NotFound from '@/components/blocks/NotFound'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route
                path="/login"
                element={
                    <PublicOnlyRoute>
                        <Auth key="login" mode="login" />
                    </PublicOnlyRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicOnlyRoute>
                        <Auth key="register" mode="register" />
                    </PublicOnlyRoute>
                }
            />
            <Route
                path="/forgot-password"
                element={
                    <PublicOnlyRoute>
                        <Auth key="forgot-password" mode="forgot-password" />
                    </PublicOnlyRoute>
                }
            />
            <Route
                element={
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/rooms" element={<RoomsList />} />
                <Route path="/shared" element={<SharedRooms />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/rooms/:roomId" element={<RoomViewer />} />
                <Route path="/rooms/:roomId/folders/:folderId" element={<RoomViewer />} />
                <Route path="/files/:fileId" element={<FileViewer />} />
            </Route>
            <Route path="/public/:token" element={<PublicViewer />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
