import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, FileText, Folder, Link2, Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { publicLinkApi } from '@/api'
import { CardGrid } from '@/components/shared/card-grid'
import { Pagination } from '@/components/shared/pagination'
import { SortMenu, type SortDirection } from '@/components/shared/sort-menu'
import type { FileMeta, Folder as FolderType, PublicPayload } from '@/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 25

type ContentSort = 'name' | 'updated' | 'size'

function sortItems<T extends { name: string; updatedAt: string }>(
    items: T[],
    sort: ContentSort,
    direction: SortDirection,
): T[] {
    const factor = direction === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
        if (sort === 'size') {
            const sizeA = 'sizeBytes' in a ? Number((a as Record<string, unknown>).sizeBytes) : 0
            const sizeB = 'sizeBytes' in b ? Number((b as Record<string, unknown>).sizeBytes) : 0
            return (sizeA - sizeB) * factor
        }
        if (sort === 'updated') {
            return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor
        }
        return a.name.localeCompare(b.name) * factor
    })
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF'
    const subtype = mimeType.split('/')[1]
    return subtype ? subtype.toUpperCase() : mimeType
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function FolderCard({ folder, onOpen }: { folder: FolderType; onOpen: (folder: FolderType) => void }) {
    return (
        <button
            onClick={() => onOpen(folder)}
            className="group flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
        >
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Folder className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium group-hover:text-primary">{folder.name}</p>
                <p className="truncate text-xs text-muted-foreground">Folder</p>
            </div>
        </button>
    )
}

function FileCard({ file }: { file: FileMeta }) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {formatType(file.mimeType)} · {formatSize(file.sizeBytes)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    Updated {formatDate(file.updatedAt)}
                </p>
            </div>
        </div>
    )
}

function FileView({ file }: { file: FileMeta }) {
    return (
        <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-6" />
                </div>
                <div>
                    <h2 className="text-lg font-medium">{file.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {formatType(file.mimeType)} · {formatSize(file.sizeBytes)}
                    </p>
                </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-xs text-muted-foreground">Type</dt>
                    <dd className="font-medium">{formatType(file.mimeType)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Size</dt>
                    <dd className="font-medium">{formatSize(file.sizeBytes)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Added</dt>
                    <dd className="font-medium">{formatDate(file.createdAt)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="font-medium">{formatDate(file.updatedAt)}</dd>
                </div>
            </dl>
        </div>
    )
}

type BreadcrumbsProps = {
    rootName: string
    path: FolderType[]
    onNavigate: (index: number) => void
}

function Breadcrumbs({ rootName, path, onNavigate }: BreadcrumbsProps) {
    return (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <button onClick={() => onNavigate(-1)} className="font-medium hover:text-foreground">
                {rootName}
            </button>
            {path.map((folder, index) => (
                <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight className="size-4" />
                    {index === path.length - 1 ? (
                        <span className="font-medium text-foreground">{folder.name}</span>
                    ) : (
                        <button onClick={() => onNavigate(index)} className="hover:text-foreground">
                            {folder.name}
                        </button>
                    )}
                </span>
            ))}
        </nav>
    )
}

export default function PublicViewer() {
    const { token } = useParams<{ token: string }>()
    const [payload, setPayload] = React.useState<PublicPayload | null>(null)
    const [path, setPath] = React.useState<FolderType[]>([])
    const [page, setPage] = React.useState(1)
    const [sort, setSort] = React.useState<ContentSort>('name')
    const [direction, setDirection] = React.useState<SortDirection>('asc')
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const load = React.useCallback(
        (
            request: (limit: number, offset: number) => Promise<PublicPayload>,
            nextPath: FolderType[],
        ) => {
            setLoading(true)
            setError(null)
            request(PAGE_SIZE, 0)
                .then((data) => {
                    setPayload(data)
                    setPath(nextPath)
                    setPage(1)
                })
                .catch((err) => {
                    setError(err instanceof ApiError ? err.message : 'Link could not be opened.')
                })
                .finally(() => setLoading(false))
        },
        [],
    )

    React.useEffect(() => {
        if (!token) return
        load((limit, offset) => publicLinkApi.open(token, limit, offset), [])
    }, [token, load])

    const handleOpenFolder = (folder: FolderType) => {
        if (!token) return
        load((limit, offset) => publicLinkApi.openFolder(token, folder.id, limit, offset), [
            ...path,
            folder,
        ])
    }

    const handleNavigate = (index: number) => {
        if (!token) return
        if (index < 0) {
            load((limit, offset) => publicLinkApi.open(token, limit, offset), [])
            return
        }
        const target = path[index]
        load((limit, offset) => publicLinkApi.openFolder(token, target.id, limit, offset), path.slice(0, index))
    }

    const handlePageChange = (nextPage: number) => {
        if (!token || !payload || payload.type === 'FILE') return
        setPage(nextPage)
        setLoading(true)
        setError(null)
        const request =
            payload.type === 'DATAROOM' && path.length === 0
                ? (limit: number, offset: number) => publicLinkApi.open(token, limit, offset)
                : (limit: number, offset: number) =>
                      publicLinkApi.openFolder(token, path[path.length - 1].id, limit, offset)
        request(PAGE_SIZE, (nextPage - 1) * PAGE_SIZE)
            .then(setPayload)
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : 'Link could not be opened.')
            })
            .finally(() => setLoading(false))
    }

    const handleSort = (value: ContentSort, dir: SortDirection) => {
        setSort(value)
        setDirection(dir)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
            </div>
        )
    }

    if (error || !payload) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
                <Link2 className="size-10 text-muted-foreground" />
                <h1 className="text-lg font-medium">Link unavailable</h1>
                <p className="max-w-sm text-sm text-muted-foreground">
                    This public link is invalid, expired, or was revoked by its owner.
                </p>
                <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
                    Go to Acme Data Room
                </Link>
            </div>
        )
    }

    if (payload.type === 'FILE') {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">{payload.file.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Shared with you via public link
                        </p>
                    </div>
                </div>
                <FileView file={payload.file} />
            </div>
        )
    }

    const rootName = payload.type === 'DATAROOM' ? payload.room.name : payload.folder.name

    const sortedFolders = sortItems(payload.contents.folders, sort, direction)
    const sortedFiles = sortItems(payload.contents.files, sort, direction)

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-4',
                    path.length > 0 && 'hidden',
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Folder className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">{rootName}</h1>
                        <p className="text-sm text-muted-foreground">
                            Shared with you via public link
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1">
                    <Breadcrumbs rootName={rootName} path={path} onNavigate={handleNavigate} />
                </div>
                <SortMenu
                    options={[
                        { value: 'name', label: 'Name' },
                        { value: 'updated', label: 'Last updated', ascLabel: 'Oldest first', descLabel: 'Newest first' },
                        { value: 'size', label: 'Size', ascLabel: 'Smallest first', descLabel: 'Largest first' },
                    ]}
                    value={sort}
                    direction={direction}
                    onSort={handleSort}
                />
            </div>

            {payload.contents.folders.length === 0 && payload.contents.files.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                    <Folder className="size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">This location is empty.</p>
                </div>
            ) : (
                <>
                    <CardGrid>
                        {sortedFolders.map((folder) => (
                            <FolderCard key={folder.id} folder={folder} onOpen={handleOpenFolder} />
                        ))}
                        {sortedFiles.map((file) => (
                            <FileCard key={file.id} file={file} />
                        ))}
                    </CardGrid>
                    {payload.contents.total > PAGE_SIZE && (
                        <Pagination
                            page={page}
                            pageSize={PAGE_SIZE}
                            total={payload.contents.total}
                            onPageChange={handlePageChange}
                            className="pt-2"
                        />
                    )}
                </>
            )}
        </div>
    )
}
