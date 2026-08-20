const sections = [
    {
        title: 'Information we collect',
        body: 'We collect what you give us when you create an account: your name and email address. We do not collect payment details, and we do not read the contents of your documents.',
    },
    {
        title: 'How we use it',
        body: 'Your email is used to sign you in, send verification codes for security actions, and — only if you ask — respond to support requests. Your name personalizes your account.',
    },
    {
        title: 'Documents and data rooms',
        body: 'Files you upload are stored in object storage and associated only with your account. They are visible to the users you explicitly share them with and to no one else.',
    },
    {
        title: 'Data retention',
        body: 'Account data stays until you delete your account. Deleting your account removes your profile, data rooms, folders, files, and shares, and cleans up stored documents.',
    },
    {
        title: 'Sharing and access',
        body: 'When you share a room, folder, or file, you control exactly who can view it. Shared users have read-only access; public links can be revoked at any time.',
    },
    {
        title: 'Security',
        body: 'Access is protected with email OTP verification, httpOnly session cookies, rate-limited authentication endpoints, and short-lived download links. We keep these protections up to date as the product evolves.',
    },
    {
        title: 'Contact',
        body: 'For privacy questions or data requests, contact us at acvid3@gmail.com. We respond to every request.',
    },
]

export default function Privacy() {
    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> legal
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    Privacy Policy
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    A short, plain-language summary of how Acme Data Room handles your data.
                </p>
            </section>

            <section className="mt-12 max-w-3xl space-y-4">
                {sections.map((section, index) => (
                    <div key={section.title} className="rounded-lg border border-border bg-card p-6">
                        <div className="flex items-baseline gap-3">
                            <span className="font-mono text-xs text-gold">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h2 className="font-display text-lg font-medium tracking-tight">
                                {section.title}
                            </h2>
                        </div>
                        <p className="mt-2 pl-8 text-sm leading-relaxed text-muted-foreground">
                            {section.body}
                        </p>
                    </div>
                ))}
            </section>
        </>
    )
}
