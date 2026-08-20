import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DialogContext, useDialog } from './context'

export function Dialog({
    open,
    onOpenChange,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}) {
    const value = React.useMemo(
        () => ({ open, setOpen: onOpenChange }),
        [open, onOpenChange],
    )
    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export function DialogContent({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    const { open, setOpen } = useDialog()

    React.useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKeyDown)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = ''
        }
    }, [open, setOpen])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    'relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl shadow-foreground/5',
                    'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/40',
                    className,
                )}
            >
                {children}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
                    aria-label="Close"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4 space-y-1.5">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="font-display text-xl font-semibold leading-none tracking-tight">{children}</h2>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-muted-foreground">{children}</p>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex justify-end gap-2 pt-2">{children}</div>
}
