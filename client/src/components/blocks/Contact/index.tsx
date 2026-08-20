import * as React from 'react'
import { CheckCircle2, Loader2, MessageSquareText, Send } from 'lucide-react'
import { ApiError } from '@/api/client'
import { contactApi } from '@/api'
import { contactLinks } from '@/constants'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'

export default function Contact() {
    const [name, setName] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [message, setMessage] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [result, setResult] = React.useState<{ sent: boolean } | null>(null)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setResult(null)
        setSubmitting(true)
        try {
            const res = await contactApi.submit({ name, email, message })
            setResult(res)
            setName('')
            setEmail('')
            setMessage('')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send the message.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> contact
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    Get in touch
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    Questions about the product, a demo, or a partnership — reach out on any channel
                    or use the form below.
                </p>
            </section>

            <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {contactLinks
                    .filter((link) => !link.href.startsWith('mailto:'))
                    .map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                        rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                        className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <link.icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                                {link.href.startsWith('mailto:') ? 'email' : 'channel'}
                            </p>
                            <p className="truncate font-display text-base font-medium tracking-tight">
                                {link.label}
                            </p>
                        </div>
                    </a>
                ))}
            </section>

            <section className="mt-12 max-w-2xl">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                        <MessageSquareText className="size-5" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-semibold tracking-tight">
                            Send a message
                        </h2>
                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            We&apos;ll get back to you
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="contact-name">Name</Label>
                            <Input
                                id="contact-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Alice"
                                maxLength={100}
                                autoComplete="name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input
                                id="contact-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                maxLength={254}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-message">Message</Label>
                        <textarea
                            id="contact-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="How can we help?"
                            maxLength={2000}
                            rows={5}
                            required
                            className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-right font-mono text-[11px] text-muted-foreground">
                            {message.length}/2000
                        </p>
                    </div>

                    {error && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {result && (
                        <div
                            className={
                                result.sent
                                    ? 'flex items-start gap-2.5 rounded-md bg-primary/10 px-3 py-2.5 text-sm text-foreground'
                                    : 'flex items-start gap-2.5 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground'
                            }
                        >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                            <p>
                                {result.sent
                                    ? 'Message sent — we\u2019ll get back to you soon.'
                                    : 'Message received, but email delivery is not configured yet.'}
                            </p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting || !name.trim() || !message.trim()}>
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        <Send className="size-4" />
                        Send message
                    </Button>
                </form>
            </section>
        </>
    )
}
