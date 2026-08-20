import { Compass, FileText, ShieldCheck } from 'lucide-react'

const principles = [
    {
        icon: Compass,
        title: 'Built for the deal',
        body: 'Due diligence moves on organized, current documents. Acme Data Room keeps structure predictable so nothing gets lost between kick-off and close.',
    },
    {
        icon: ShieldCheck,
        title: 'Security as a feature',
        body: 'Access control, OTP, and expiring downloads are not add-ons — they are how the product behaves by default.',
    },
    {
        icon: FileText,
        title: 'Documents in the center',
        body: 'Rooms, folders, and files are first-class citizens. Search, preview, and sharing all work directly on the document model.',
    },
]

export default function About() {
    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> about
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    About Acme Data Room
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    Acme Data Room is a virtual data room for the modern acquisition — an organized,
                    secure home for the documents that make due diligence happen.
                </p>
            </section>

            <section className="mt-12 space-y-6">
                <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display text-lg font-medium tracking-tight">
                        What we do
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        We give every deal a single source of truth. Buyers, sellers, and advisors
                        share one room per project, nest folders for each workstream, and control who
                        sees what — down to a single file. No more scattered inbox threads, stale
                        copies, or files that wander off.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {principles.map((principle) => (
                        <div
                            key={principle.title}
                            className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/40"
                        >
                            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <principle.icon className="size-5" />
                            </div>
                            <h3 className="mt-4 font-display text-lg font-medium tracking-tight">
                                {principle.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {principle.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    )
}
