export function Logo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="2.75"
                y="2.5"
                width="18.5"
                height="19"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.7"
            />
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 7.6v8.8" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="5.4" cy="8" r="0.9" fill="hsl(var(--gold))" />
            <circle cx="5.4" cy="16" r="0.9" fill="hsl(var(--gold))" />
            <circle cx="12" cy="7.2" r="1.1" fill="hsl(var(--gold))" />
        </svg>
    )
}
