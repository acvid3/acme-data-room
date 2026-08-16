import * as React from 'react'
import { ArrowUp, FolderUp } from 'lucide-react'
import { useDnd, type DraggedItem } from '@/contexts/dnd'
import { cn } from '@/utils/cn'

type UpLevelCardProps = {
    targetFolderId: string | null
    onDrop: (item: DraggedItem, targetFolderId: string | null) => void
    view: 'grid' | 'list'
}

export default function UpLevelCard({ targetFolderId, onDrop, view }: UpLevelCardProps) {
    const { dragged, setDragged } = useDnd()
    const [dropActive, setDropActive] = React.useState(false)

    const handleDragOver = (event: React.DragEvent) => {
        if (!dragged) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setDropActive(false)
        if (!dragged) return
        onDrop(dragged, targetFolderId)
        setDragged(null)
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={() => setDropActive(true)}
            onDragLeave={() => setDropActive(false)}
            onDrop={handleDrop}
            className={cn(
                'flex rounded-lg border border-dashed bg-card/50 p-4 text-muted-foreground transition-colors',
                view === 'grid' ? 'flex-col items-center justify-center gap-2' : 'items-center gap-3',
                dropActive && 'border-primary bg-primary/5 text-primary',
            )}
        >
            {view === 'grid' ? <FolderUp className="size-6" /> : <ArrowUp className="size-5" />}
            <span className="text-sm font-medium">Move to parent</span>
        </div>
    )
}
