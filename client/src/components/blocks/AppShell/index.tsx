import { Link, NavLink, Outlet } from 'react-router-dom'
import { FolderLock, LogOut, Share2, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Logo } from '@/components/icons/logo'
import { contactLinks } from '@/constants'
import { cn } from '@/utils/cn'

const navItems = [
    { to: '/rooms', label: 'My Data Rooms', icon: FolderLock },
    { to: '/shared', label: 'Shared with me', icon: Share2 },
]

export default function AppShell() {
    const { user, logout } = useAuth()

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="group flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
                                <Logo className="size-4" />
                            </span>
                            <span className="hidden flex-col leading-tight sm:flex">
                                <span className="font-display text-sm font-medium tracking-tight">
                                    Acme Data Room
                                </span>
                            </span>
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
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
                                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <UserRound className="size-4" />
                                <span className="hidden sm:inline">{user.name}</span>
                            </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="size-4" />
                            <span className="hidden sm:inline">Sign out</span>
                        </Button>
                    </div>
                </div>
                <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 sm:hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/rooms'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
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
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <Outlet />
            </main>
            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Acme Data Room · © {new Date().getFullYear()}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                        {contactLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                                rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                            >
                                <link.icon className="size-3.5 text-primary transition-colors group-hover:text-gold" />
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    )
}
