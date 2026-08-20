import { Link } from 'react-router-dom'
import {
    ArrowRight,
    FileText,
    FolderLock,
    Landmark,
    Lock,
    LogIn,
    Search,
    Share2,
    ShieldCheck,
    Upload,
    UserPlus,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'

const features = [
    {
        icon: FolderLock,
        index: '01',
        title: 'Organized data rooms',
        description: 'Create rooms, nest folders, and keep every document in its place.',
    },
    {
        icon: FileText,
        index: '02',
        title: 'Secure documents',
        description: 'Upload files with drag-and-drop and preview PDFs right in the browser.',
    },
    {
        icon: Share2,
        index: '03',
        title: 'Controlled sharing',
        description: 'Share a room, folder, or file with specific people or via public links.',
    },
]

const steps = [
    {
        icon: FolderLock,
        step: '01',
        title: 'Create a data room',
        body: 'Name it, add a description, and decide whether it is private or public.',
    },
    {
        icon: Upload,
        step: '02',
        title: 'Upload and organize',
        body: 'Drag-and-drop files into nested folders. Everything stays in its place.',
    },
    {
        icon: Share2,
        step: '03',
        title: 'Share securely',
        body: 'Grant specific users or share a link. Everyone reads, nobody edits.',
    },
]

const useCases = [
    {
        icon: Landmark,
        title: 'M&A due diligence',
        body: 'One room per deal, with a folder per workstream — buyer and seller always on the same version.',
        image: '/images/use-ma.jpg',
        alt: 'Business handshake sealing a contract',
    },
    {
        icon: FileText,
        title: 'Fundraising',
        body: 'Share your data room with investors, track who is in the room, and revoke access on demand.',
        image: '/images/use-funding.jpg',
        alt: 'Investors reviewing financial charts',
    },
    {
        icon: Search,
        title: 'Audits & compliance',
        body: 'Controlled, read-only access with search across the whole room — auditors find what they need fast.',
        image: '/images/use-audit.jpg',
        alt: 'Accountant checking financial documents',
    },
]

export default function Landing() {
    const { user } = useAuth()

    return (
        <>
            <section className="relative left-1/2 -mt-16 w-screen -translate-x-1/2 overflow-hidden sm:-mt-20">
                <img
                    src="/images/hero.jpg"
                    alt="Reviewing business documents at the office"
                    className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/65" aria-hidden />
                <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="mb-6 font-mono text-xs uppercase tracking-eyebrow text-gold">
                            <span className="text-white/70">/</span> due diligence, engineered
                        </p>
                        <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                            Secure due diligence, <span className="text-gold">organized</span>.
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-primary-foreground/80">
                            Acme Data Room keeps your documents in secure, shareable data rooms —
                            built for multi-billion dollar acquisitions.
                        </p>
                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            {user ? (
                                <Link to="/dashboard">
                                    <Button size="lg">
                                        <ArrowRight className="size-4" />
                                        Go to dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="w-full sm:w-auto">
                                        <Button size="lg" className="w-full sm:min-w-44">
                                            <UserPlus className="size-4" />
                                            Create an account
                                        </Button>
                                    </Link>
                                    <Link to="/login" className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full border-white/30 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground sm:min-w-44"
                                        >
                                            <LogIn className="size-4" />
                                            Sign in
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/20 pt-6 font-mono text-[11px] uppercase tracking-wider text-primary-foreground/70">
                            <span>OTP-secured auth</span>
                            <span className="text-white/25">·</span>
                            <span>Read-only sharing</span>
                            <span className="text-white/25">·</span>
                            <span>Presigned downloads</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-20">
                <div className="mb-8">
                    <p className="mb-3 font-mono text-xs uppercase tracking-eyebrow text-gold">
                        <span className="text-primary">/</span> how it works
                    </p>
                    <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight">
                        From upload to close in three steps
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                    {steps.map((step) => (
                        <div
                            key={step.step}
                            className="group relative rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <step.icon className="size-5" />
                                </div>
                                <span className="font-mono text-sm text-border transition-colors group-hover:text-gold">
                                    {step.step}
                                </span>
                            </div>
                            <h3 className="mt-5 font-display text-lg font-medium tracking-tight">
                                {step.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {step.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-20">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-3 font-mono text-xs uppercase tracking-eyebrow text-gold">
                            <span className="text-primary">/</span> features
                        </p>
                        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight">
                            Built around the document
                        </h2>
                    </div>
                    <Link to="/features">
                        <Button variant="outline">
                            See all features
                            <ArrowRight className="size-4" />
                        </Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group relative rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <feature.icon className="size-5" />
                                </div>
                                <span className="font-mono text-xs text-border transition-colors group-hover:text-gold">
                                    {feature.index}
                                </span>
                            </div>
                            <h3 className="mt-5 font-display text-lg font-medium tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-20">
                <div className="mb-8">
                    <p className="mb-3 font-mono text-xs uppercase tracking-eyebrow text-gold">
                        <span className="text-primary">/</span> use cases
                    </p>
                    <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight">
                        Where a data room fits
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                    {useCases.map((useCase) => (
                        <div
                            key={useCase.title}
                            className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40"
                        >
                            <img
                                src={useCase.image}
                                alt={useCase.alt}
                                loading="lazy"
                                className="h-40 w-full object-cover"
                            />
                            <div className="p-6">
                                <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <useCase.icon className="size-5" />
                                </div>
                                <h3 className="mt-5 font-display text-lg font-medium tracking-tight">
                                    {useCase.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {useCase.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-20 flex flex-col items-start gap-6 rounded-lg border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">
                            Security by default
                        </h2>
                        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                            OTP-secured sign-in, no existence leaks, and read-only access for guests —
                            every layer is safe without configuration.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/security">
                        <Button variant="outline">
                            <Lock className="size-4" />
                            How we secure it
                        </Button>
                    </Link>
                    <Link to="/privacy">
                        <Button variant="ghost">Privacy policy</Button>
                    </Link>
                </div>
            </section>

            <section className="mx-auto mt-20 max-w-3xl text-center">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> get started
                </p>
                <h2 className="text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
                    Ready to organize your next deal?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
                    Create a data room, upload your documents, and share them with confidence — in
                    minutes, not days.
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
                            <Link to="/register" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:min-w-44">
                                    <UserPlus className="size-4" />
                                    Create an account
                                </Button>
                            </Link>
                            <Link to="/faq" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full sm:min-w-44">
                                    Read the FAQ
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>
        </>
    )
}
