import { Link, NavLink, Outlet } from 'react-router-dom'
import { FolderLock, LogOut, Share2, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Logo } from '@/components/icons/logo'
import { cn } from '@/utils/cn'

const navItems = [
    { to: '/rooms', label: 'My Data Rooms', icon: FolderLock },
    { to: '/shared', label: 'Shared with me', icon: Share2 },
]

export default function AppShell() {
    const { user, logout } = useAuth()

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-2 font-semibold">
                            <Logo className="size-5" />
                            Acme Data Room
                        </Link>
                        <nav className="hidden items-center gap-1 sm:flex">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/rooms'}
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-secondary text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )
                                    }
                                >
                                    <item.icon className="size-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <Link
                                to="/profile"
                                className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
                            >
                                <UserRound className="size-4" />
                                {user.name}
                            </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="size-4" />
                            Sign out
                        </Button>
                    </div>
                </div>
                <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 sm:hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/rooms'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-secondary text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )
                            }
                        >
                            <item.icon className="size-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
                <Outlet />
            </main>
        </div>
    )
}
