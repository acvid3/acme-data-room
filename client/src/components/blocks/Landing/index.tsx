import { Link } from 'react-router-dom'
import { ArrowRight, FileText, FolderLock, LogIn, Share2, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Logo } from '@/components/icons/logo'

const features = [
    {
        icon: FolderLock,
        title: 'Organized data rooms',
        description: 'Create rooms, nest folders, and keep every document in its place.',
    },
    {
        icon: FileText,
        title: 'Secure documents',
        description: 'Upload files with drag-and-drop and preview PDFs right in the browser.',
    },
    {
        icon: Share2,
        title: 'Controlled sharing',
        description: 'Share a room, folder, or file with specific people or via public links.',
    },
]

export default function Landing() {
    const { user } = useAuth()

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
                    <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
                        <Logo className="size-5 shrink-0" />
                        <span className="hidden truncate sm:inline">Acme Data Room</span>
                    </Link>
                    <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
                <section className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Logo className="size-8" />
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight">
                        Secure due diligence, organized.
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Acme Data Room keeps your documents in secure, shareable data rooms — built
                        for multi-billion dollar acquisitions.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {user ? (
                            <Link to="/dashboard">
                                <Button size="lg">
                                    <ArrowRight className="size-4" />
                                    Go to dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <Button size="lg">
                                        <UserPlus className="size-4" />
                                        Create an account
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="outline">
                                        <LogIn className="size-4" />
                                        Sign in
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                <section className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-lg border bg-card p-6"
                        >
                            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <feature.icon className="size-5" />
                            </div>
                            <h2 className="mt-4 font-medium">{feature.title}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </section>
            </main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <p className="text-xs text-muted-foreground">Acme Data Room</p>
                </div>
            </footer>
        </div>
    )
}
