import { FileDown, KeyRound, Lock, ShieldCheck, ShieldX, UserCheck } from 'lucide-react'

const securityItems = [
    {
        icon: KeyRound,
        title: 'Email + OTP authentication',
        body: 'Every sensitive action — sign-in, password reset, account deletion — is confirmed with a 6-digit code emailed to you. Sessions live in httpOnly cookies, not in localStorage.',
    },
    {
        icon: ShieldX,
        title: 'No existence leaks',
        body: 'Unauthorized reads and writes return 404, never 403. A caller cannot distinguish between a room that does not exist and a room they cannot see.',
    },
    {
        icon: UserCheck,
        title: 'Read-only by construction',
        body: 'Shared access is read-only at the service layer. Guests can browse and download, but write operations require ownership — no client-side tricks can bypass it.',
    },
    {
        icon: FileDown,
        title: 'Direct downloads',
        body: 'Files are downloaded through short-lived presigned URLs. Document bytes never stream through the API, and every link expires.',
    },
    {
        icon: Lock,
        title: 'Data isolation',
        body: 'Each project runs against its own database on the same instance. Rooms, folders, and files are scoped to their owner with validated DTOs at every boundary.',
    },
    {
        icon: ShieldCheck,
        title: 'Rate-limited auth',
        body: 'Verification codes are rate-limited, expire after 10 minutes, and allow a bounded number of attempts. Password endpoints are throttled per IP.',
    },
]

export default function Security() {
    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> security
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    Security by default
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    A data room holds documents that move the needle. Ours is built so that every
                    layer — auth, access, and delivery — is secure without configuration.
                </p>
            </section>

            <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {securityItems.map((item) => (
                    <div
                        key={item.title}
                        className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <item.icon className="size-5" />
                        </div>
                        <h2 className="mt-4 font-display text-lg font-medium tracking-tight">
                            {item.title}
                        </h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {item.body}
                        </p>
                    </div>
                ))}
            </section>
        </>
    )
}
