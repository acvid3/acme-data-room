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
                'flex items-center gap-1 rounded-lg border bg-background p-1',
                className,
            )}
        >
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    'rounded-md p-1.5 transition-colors',
                    value === 'grid'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="Grid view"
                aria-pressed={value === 'grid'}
            >
                <LayoutGrid className="size-4" />
            </button>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    'rounded-md p-1.5 transition-colors',
                    value === 'list'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="List view"
                aria-pressed={value === 'list'}
            >
                <List className="size-4" />
            </button>
        </div>
    )
}
