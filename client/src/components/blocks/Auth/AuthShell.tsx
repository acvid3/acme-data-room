import { Link } from 'react-router-dom'
import { Logo } from '@/components/icons/logo'

export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.6]"
                aria-hidden
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.05) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
                }}
            />
            <div className="relative w-full max-w-sm space-y-6">
                <Link to="/" className="group flex flex-col items-center gap-3 text-center">
                    <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-colors group-hover:bg-primary/90">
                        <Logo className="size-5" />
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="font-display text-xl font-medium tracking-tight">
                            Acme Data Room
                        </span>
                        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-muted-foreground">
                            virtual data rooms
                        </span>
                    </span>
                </Link>
                {children}
            </div>
        </div>
    )
}
