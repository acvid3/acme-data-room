import * as React from 'react'
import { Check, Filter } from 'lucide-react'
import { cn } from '@/utils/cn'

type FilterOption = {
    value: string
    label: string
}

type FilterMenuProps<T extends string> = {
    options: FilterOption[]
    value: T
    onFilter: (value: T) => void
    className?: string
}

export function FilterMenu<T extends string>({
    options,
    value,
    onFilter,
    className,
}: FilterMenuProps<T>) {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)
    const active = value !== 'all'

    React.useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const current = options.find((option) => option.value === value)

    const select = (optionValue: string) => {
        onFilter(optionValue as T)
        setOpen(false)
    }

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    'flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-sm transition-colors hover:text-foreground',
                    active ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                <Filter className="size-4" />
                {current?.label}
            </button>
            {open && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border bg-popover p-1 shadow-md">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => select(option.value)}
                            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-accent"
                        >
                            {option.label}
                            {option.value === value && <Check className="size-4" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
