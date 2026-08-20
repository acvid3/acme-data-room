import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ViewMode = 'grid' | 'list'

type ViewToggleProps = {
    value: ViewMode
    onChange: (mode: ViewMode) => void
    className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
    return (
        <div
            className={cn(
                'inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm',
                className,
            )}
        >
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    'flex h-full flex-1 items-center justify-center rounded-[4px] px-2.5 transition-colors',
                    value === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                aria-label="Grid view"
                aria-pressed={value === 'grid'}
            >
                <LayoutGrid className="size-4" />
            </button>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    'flex h-full flex-1 items-center justify-center rounded-[4px] px-2.5 transition-colors',
                    value === 'list'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                aria-label="List view"
                aria-pressed={value === 'list'}
            >
                <List className="size-4" />
            </button>
        </div>
    )
}
