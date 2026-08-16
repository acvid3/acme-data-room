import { Globe, Lock } from 'lucide-react'
import type { RoomVisibility } from '@/types'
import { cn } from '@/utils/cn'

type VisibilityToggleProps = {
    value: RoomVisibility
    onChange: (value: RoomVisibility) => void
    disabled?: boolean
}

export function VisibilityToggle({ value, onChange, disabled }: VisibilityToggleProps) {
    return (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            {value === 'PUBLIC' ? (
                <Globe className="size-4 shrink-0 text-primary" />
            ) : (
                <Lock className="size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                    {value === 'PUBLIC' ? 'Public room' : 'Private room'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {value === 'PUBLIC'
                        ? 'Anyone with the link can view and join this room.'
                        : 'Only people you invite can access this room.'}
                </p>
            </div>
            <button
                role="switch"
                aria-checked={value === 'PUBLIC'}
                disabled={disabled}
                onClick={() => onChange(value === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50',
                    value === 'PUBLIC' ? 'bg-primary' : 'bg-muted-foreground/40',
                )}
                aria-label="Toggle public room"
            >
                <span
                    className={cn(
                        'size-5 rounded-full bg-white shadow transition-transform',
                        value === 'PUBLIC' ? 'translate-x-5' : 'translate-x-0',
                    )}
                />
            </button>
        </div>
    )
}
