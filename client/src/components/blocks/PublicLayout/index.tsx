import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowRight, LogIn, Mail, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Logo } from '@/components/icons/logo'
import { contactLinks } from '@/constants'
import { cn } from '@/utils/cn'

const navItems = [
    { to: '/features', label: 'Features' },
    { to: '/security', label: 'Security' },
    { to: '/about', label: 'About' },
    { to: '/faq', label: 'FAQ' },
]

const footerLinks = [
    { to: '/features', label: 'Features' },
    { to: '/security', label: 'Security' },
    { to: '/about', label: 'About' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy' },
]

export default function PublicLayout() {
    const { user } = useAuth()

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.6]"
                aria-hidden
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(var(--primary) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
                }}
            />
            <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
                    <Link to="/" className="group flex min-w-0 items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
                            <Logo className="size-4" />
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate font-display text-base font-medium tracking-tight">
                                Acme Data Room
                            </span>
                            <span className="hidden font-mono text-[10px] uppercase tracking-eyebrow text-muted-foreground sm:block">
                                virtual data rooms
                            </span>
                        </span>
                    </Link>
                    <nav className="hidden shrink-0 items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <Link to="/contact" className="hidden sm:block">
                            <Button variant="ghost" size="sm">
                                <Mail className="size-4" />
                                Contact
                            </Button>
                        </Link>
                        {user ? (
                            <Link to="/dashboard">
                                <Button size="sm">
                                    <ArrowRight className="size-4" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                    <span className="sm:hidden">Go</span>
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        <LogIn className="size-4" />
                                        <span className="hidden sm:inline">Sign in</span>
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">
                                        <UserPlus className="size-4" />
                                        <span className="hidden sm:inline">Get started</span>
                                        <span className="sm:hidden">Join</span>
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 lg:hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </header>

            <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:py-20">
                <Outlet />
            </main>

            <footer className="relative border-t border-border">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <Logo className="size-4" />
                                </span>
                                <span className="font-display text-sm font-medium tracking-tight">
                                    Acme Data Room
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Secure virtual data rooms for due diligence, built for multi-billion
                                dollar acquisitions.
                            </p>
                        </div>
                        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 sm:gap-x-16">
                            {footerLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border pt-6 sm:justify-between">
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
                </div>
            </footer>
        </div>
    )
}
