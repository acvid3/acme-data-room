import * as React from 'react'
import { ArrowDown, ArrowUp, Check, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

export type SortDirection = 'asc' | 'desc'

type SortOption = {
    value: string
    label: string
    ascLabel?: string
    descLabel?: string
}

type SortMenuProps<T extends string> = {
    options: SortOption[]
    value: T
    direction: SortDirection
    onSort: (value: T, direction: SortDirection) => void
    className?: string
}

const directionMeta: Record<SortDirection, { icon: typeof ArrowUp; suffix: string }> = {
    asc: { icon: ArrowUp, suffix: 'A–Z ↑' },
    desc: { icon: ArrowDown, suffix: 'Z–A ↓' },
}

export function SortMenu<T extends string>({
    options,
    value,
    direction,
    onSort,
    className,
}: SortMenuProps<T>) {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const current = options.find((option) => option.value === value)
    const currentDirectionLabel =
        direction === 'asc'
            ? current?.ascLabel ?? 'A–Z ↑'
            : current?.descLabel ?? 'Z–A ↓'

    const select = (optionValue: string, optionDirection: SortDirection) => {
        onSort(optionValue as T, optionDirection)
        setOpen(false)
    }

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <SlidersHorizontal className="size-4" />
                Sort
                {current && <span className="text-foreground">{currentDirectionLabel}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-52 rounded-lg border bg-popover p-1 shadow-md">
                    {options.map((option) => (
                        <React.Fragment key={option.value}>
                            {(['asc', 'desc'] as const).map((dir) => {
                                const meta = directionMeta[dir]
                                const active = option.value === value && direction === dir
                                const label = dir === 'asc' ? option.ascLabel : option.descLabel
                                return (
                                    <button
                                        key={`${option.value}-${dir}`}
                                        onClick={() => select(option.value, dir)}
                                        className={cn(
                                            'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent',
                                            active && 'bg-accent font-medium',
                                        )}
                                    >
                                        <span className="flex w-4 shrink-0 items-center justify-center">
                                            <meta.icon className="size-3.5" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {label ?? meta.suffix}
                                        </span>
                                        <span className="flex w-4 shrink-0 items-center justify-center">
                                            {active && <Check className="size-4" />}
                                        </span>
                                    </button>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    )
}
