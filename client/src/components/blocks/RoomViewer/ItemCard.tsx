import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText, Folder, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { fileApi, folderApi } from '@/api'
import { useDnd, type DraggedItem } from '@/contexts/dnd'
import type { FileMeta, Folder as FolderType, RoomStats } from '@/types'
import type { ViewMode } from '@/components/shared/view-toggle'
import { cn } from '@/utils/cn'

export type ItemTarget =
    | { type: 'folder'; item: FolderType }
    | { type: 'file'; item: FileMeta }

type ItemCardProps = {
    target: ItemTarget
    roomId: string
    readOnly: boolean
    view?: ViewMode
    onRename: (target: ItemTarget) => void
    onDelete: (target: ItemTarget) => void
    onDrop: (item: DraggedItem, targetFolderId: string | null) => void
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF'
    const subtype = mimeType.split('/')[1]
    return subtype ? subtype.toUpperCase() : mimeType
}

function FolderStats({ folder }: { folder: FolderType }) {
    const [stats, setStats] = React.useState<RoomStats | null>(null)

    React.useEffect(() => {
        let cancelled = false
        folderApi
            .stats(folder.id)
            .then((data) => {
                if (!cancelled) setStats(data)
            })
            .catch(() => {
                if (!cancelled) setStats(null)
            })
        return () => {
            cancelled = true
        }
    }, [folder.id])

    const hasStats = stats && (stats.files > 0 || stats.folders > 0 || stats.sizeBytes > 0)

    return (
        <div className="space-y-0.5">
            {hasStats && stats && (
                <p className="truncate text-xs text-muted-foreground">
                    <FolderOpen className="mr-1 inline size-3" />
                    {[
                        stats.files > 0 && `${stats.files} ${stats.files === 1 ? 'file' : 'files'}`,
                        stats.folders > 0 && `${stats.folders} ${stats.folders === 1 ? 'folder' : 'folders'}`,
                        stats.sizeBytes > 0 && formatSize(stats.sizeBytes),
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            )}
            <p className="truncate text-xs text-muted-foreground">
                Updated {formatDate(folder.updatedAt)}
            </p>
        </div>
    )
}

export default function ItemCard({ target, roomId, readOnly, view = 'grid', onRename, onDelete, onDrop }: ItemCardProps) {
    const navigate = useNavigate()
    const { dragged, setDragged } = useDnd()
    const [dropActive, setDropActive] = React.useState(false)

    const isFolder = target.type === 'folder'
    const id = target.item.id
    const name = target.item.name

    const handleDragStart = (event: React.DragEvent) => {
        setDragged({ type: target.type, id, name })
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', id)
    }

    const handleDragOver = (event: React.DragEvent) => {
        if (!dragged || dragged.id === id) return
        if (target.type === 'folder') {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
        }
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setDropActive(false)
        if (!dragged || dragged.id === id) return
        if (target.type === 'file') return
        onDrop(dragged, target.item.id)
    }

    const handleOpen = () => {
        if (isFolder) navigate(`/rooms/${roomId}/folders/${id}`)
    }

    const handleDownload = async (event: React.MouseEvent) => {
        event.stopPropagation()
        const { url, name: fileName } = await fileApi.download(id)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        anchor.click()
    }

    const meta = isFolder ? (
        <FolderStats folder={target.item} />
    ) : (
        <>
            <p className="truncate text-xs text-muted-foreground">
                {formatType(target.item.mimeType)} · {formatSize(target.item.sizeBytes)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
                Updated {formatDate(target.item.updatedAt)}
            </p>
        </>
    )

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={() => setDragged(null)}
            onDragOver={handleDragOver}
            onDragEnter={() => setDropActive(true)}
            onDragLeave={() => setDropActive(false)}
            onDrop={handleDrop}
            onClick={isFolder ? handleOpen : undefined}
            className={cn(
                'group relative flex rounded-lg border bg-card p-4 transition-colors',
                isFolder && 'cursor-pointer hover:bg-accent',
                dropActive && target.type === 'folder' && 'border-primary bg-primary/5',
                view === 'list' ? 'flex-row items-center gap-3' : 'flex-col gap-3',
            )}
        >
            <div
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isFolder ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary',
                )}
            >
                {isFolder ? <Folder className="size-5" /> : <FileText className="size-5" />}
            </div>

            {view === 'list' ? (
                <>
                    <div className="flex min-w-0 flex-[3] items-center gap-3">
                        <p className="truncate font-medium">{name}</p>
                    </div>
                    <div className="flex min-w-0 flex-[2] flex-col">{meta}</div>
                    <div className="flex min-w-0 flex-[2] items-center justify-end">
                        {!isFolder && (
                            <button
                                onClick={handleDownload}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                aria-label="Download"
                            >
                                <Download className="size-4" />
                            </button>
                        )}
                        {!readOnly && (
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onRename(target)
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    aria-label="Rename"
                                >
                                    <Pencil className="size-4" />
                                </button>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onDelete(target)
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                    aria-label="Delete"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        {meta}
                    </div>

                    {!isFolder && (
                        <button
                            onClick={handleDownload}
                            className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                            aria-label="Download"
                        >
                            <Download className="size-4" />
                        </button>
                    )}

                    {!readOnly && (
                        <div className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                            <button
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onRename(target)
                                }}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                aria-label="Rename"
                            >
                                <Pencil className="size-4" />
                            </button>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onDelete(target)
                                }}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                aria-label="Delete"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
