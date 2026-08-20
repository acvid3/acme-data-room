import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/shared/guards'
import AppShell from '@/components/blocks/AppShell'
import Auth from '@/components/blocks/Auth'
import PublicLayout from '@/components/blocks/PublicLayout'
import Landing from '@/components/blocks/Landing'
import Features from '@/components/blocks/Features'
import Security from '@/components/blocks/Security'
import About from '@/components/blocks/About'
import Faq from '@/components/blocks/Faq'
import Contact from '@/components/blocks/Contact'
import Privacy from '@/components/blocks/Privacy'
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
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/security" element={<Security />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
            </Route>
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
