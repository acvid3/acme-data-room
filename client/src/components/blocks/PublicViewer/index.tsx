import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, FileText, Folder, Link2, Loader2, Search, X } from 'lucide-react'
import { ApiError } from '@/api/client'
import { publicLinkApi } from '@/api'
import { CardGrid } from '@/components/shared/card-grid'
import { Pagination } from '@/components/shared/pagination'
import { SortMenu, type SortDirection } from '@/components/shared/sort-menu'
import { FilterMenu } from '@/components/shared/filter-menu'
import { ViewToggle } from '@/components/shared/view-toggle'
import { Input } from '@/components/shared/input'
import MemberList from '@/components/shared/member-list'
import ItemCard from '@/components/blocks/RoomViewer/ItemCard'
import FilePreviewDialog from '@/components/blocks/FilePreviewDialog'
import { DndProvider } from '@/contexts/dnd'
import { useViewMode } from '@/hooks/useViewMode'
import { formatDate, formatSize, formatStats, formatType } from '@/utils/format'
import { sortItems, type ContentSort } from '@/utils/sort'
import type { FileMeta, Folder as FolderType, PublicPayload } from '@/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 25

type ContentFilter = 'all' | 'folders' | 'files'

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

function PublicViewerContent() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [payload, setPayload] = React.useState<PublicPayload | null>(null)
    const [path, setPath] = React.useState<FolderType[]>([])
    const [page, setPage] = React.useState(1)
    const [previewFile, setPreviewFile] = React.useState<FileMeta | null>(null)
    const [sort, setSort] = React.useState<ContentSort>('name')
    const [direction, setDirection] = React.useState<SortDirection>('asc')
    const [filter, setFilter] = React.useState<ContentFilter>('all')
    const [searchQuery, setSearchQuery] = React.useState('')
    const { view, setView } = useViewMode('public')
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
                    if (err instanceof ApiError && err.status === 404) {
                        navigate('/login', { replace: true, state: { from: window.location.pathname } })
                        return
                    }
                    setError(err instanceof ApiError ? err.message : 'Link could not be opened.')
                })
                .finally(() => setLoading(false))
        },
        [navigate],
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
                if (err instanceof ApiError && err.status === 404) {
                    navigate('/login', { replace: true, state: { from: window.location.pathname } })
                    return
                }
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
                        <h1 className="font-display text-xl font-semibold tracking-tight">{payload.file.name}</h1>
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

    const query = searchQuery.trim().toLowerCase()
    const matches = (name: string) => !query || name.toLowerCase().includes(query)

    const visibleFolders =
        filter === 'files'
            ? []
            : sortItems(payload.contents.folders.filter((folder) => matches(folder.name)), sort, direction)
    const visibleFiles =
        filter === 'folders'
            ? []
            : sortItems(payload.contents.files.filter((file) => matches(file.name)), sort, direction)

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
                        <h1 className="font-display text-2xl font-semibold tracking-tight">{rootName}</h1>
                        <p className="text-sm text-muted-foreground">
                            Shared with you via public link
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Breadcrumbs rootName={rootName} path={path} onNavigate={handleNavigate} />
                    {payload.stats && (
                        <span className="text-xs text-muted-foreground">
                            {formatStats(payload.stats)}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search files and folders..."
                            className="w-full pl-9 pr-8 sm:w-56"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="size-4" />
                            </button>
                        )}
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
                    <FilterMenu
                        options={[
                            { value: 'all', label: 'All items' },
                            { value: 'folders', label: 'Folders' },
                            { value: 'files', label: 'Files' },
                        ]}
                        value={filter}
                        onFilter={setFilter}
                    />
                    <ViewToggle value={view} onChange={setView} />
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="min-w-0 flex-1">
                    {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                            <Folder className="size-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {query ? 'No matches found.' : 'This location is empty.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <CardGrid view={view}>
                                {visibleFolders.map((folder) => (
                                    <ItemCard
                                        key={folder.id}
                                        roomId={folder.dataRoomId}
                                        target={{ type: 'folder', item: folder }}
                                        view={view}
                                        readOnly
                                        folderStats={folder.stats}
                                        onOpenFolder={handleOpenFolder}
                                    />
                                ))}
                                {visibleFiles.map((file) => (
                                    <ItemCard
                                        key={file.id}
                                        roomId={file.dataRoomId}
                                        target={{ type: 'file', item: file }}
                                        view={view}
                                        readOnly
                                        onDownload={(f) => (token ? publicLinkApi.download(token, f.id) : Promise.reject(new Error('Missing token')))}
                                        onPreview={setPreviewFile}
                                    />
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

                {payload.type === 'DATAROOM' && (
                    <aside className="w-full max-w-xs shrink-0 space-y-4 rounded-lg border bg-card p-4">
                        <MemberList
                            title="People in this room"
                            members={payload.activeUsers}
                            highlight
                        />
                        <MemberList title="Invited" members={payload.users} />
                    </aside>
                )}
            </div>

            {previewFile && token && (
                <FilePreviewDialog
                    file={previewFile}
                    open={previewFile !== null}
                    onOpenChange={(open) => !open && setPreviewFile(null)}
                    onFetchUrl={() => publicLinkApi.download(token, previewFile.id)}
                />
            )}
        </div>
    )
}

export default function PublicViewer() {
    return (
        <DndProvider>
            <PublicViewerContent />
        </DndProvider>
    )
}
