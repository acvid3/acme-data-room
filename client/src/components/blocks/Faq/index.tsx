import * as React from 'react'
import { HelpCircle, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

const faqs = [
    {
        q: 'How do I share a data room?',
        a: 'Open a room and press Share. You can grant specific users read-only access, or create a public link that anyone with an account and the link can open. Either can be revoked at any time.',
    },
    {
        q: 'What is the difference between a user share and a public link?',
        a: 'A user share grants access to a specific person you choose. A public link is a token — anyone who has it (and is signed in) can view. Public links require the room to be marked public.',
    },
    {
        q: 'Can guests edit or delete files?',
        a: 'No. Shared access is read-only by design: guests can browse, preview, and download, but all writes require ownership of the room.',
    },
    {
        q: 'How is my account secured?',
        a: 'Sign-in, password reset, and account deletion require a 6-digit code emailed to you. Codes expire in 10 minutes, have a limited number of attempts, and are rate-limited.',
    },
    {
        q: 'What file types can I preview?',
        a: 'PDFs, images, and video render inline in the browser via a secure preview dialog. Other files can still be downloaded through an expiring link.',
    },
    {
        q: 'Are there upload limits?',
        a: 'Individual uploads are capped (50 MB by default) and the gateway raises its own body limit to match, so large documents pass through without being truncated.',
    },
]

export default function Faq() {
    const [openKey, setOpenKey] = React.useState<string | null>(null)

    const toggle = (key: string) => {
        setOpenKey((current) => (current === key ? null : key))
    }

    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> faq
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    Frequently asked questions
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    Quick answers about sharing, security, and how rooms behave.
                </p>
            </section>

            <section className="mt-12 max-w-3xl">
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {faqs.map((item) => {
                        const open = openKey === item.q
                        return (
                            <div key={item.q}>
                                <button
                                    type="button"
                                    onClick={() => toggle(item.q)}
                                    aria-expanded={open}
                                    className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-accent/50"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <HelpCircle className="size-4" />
                                    </span>
                                    <span className="flex-1 font-display text-base font-medium tracking-tight">
                                        {item.q}
                                    </span>
                                    <Plus
                                        className={cn(
                                            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                            open && 'rotate-45 text-primary',
                                        )}
                                        aria-hidden
                                    />
                                </button>
                                {open && (
                                    <div className="px-5 pb-5 pl-[3.5rem]">
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {item.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>
        </>
    )
}
