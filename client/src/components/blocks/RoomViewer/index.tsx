import * as React from 'react'
import { useParams } from 'react-router-dom'
import { FileSearch, FileText, FolderPlus, FolderOpen, Loader2, Search, Share2, Users, X } from 'lucide-react'
import { ApiError } from '@/api/client'
import { fileApi, folderApi, roomApi } from '@/api'
import { DndProvider, useDnd } from '@/contexts/dnd'
import { useAuth } from '@/contexts/auth'
import { useRoomContents } from '@/hooks/useRoomContents'
import { useFolderPath } from '@/hooks/useFolderPath'
import type { FileMeta, Folder } from '@/types'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Pagination } from '@/components/shared/pagination'
import { CardGrid } from '@/components/shared/card-grid'
import { ViewToggle } from '@/components/shared/view-toggle'
import { SortMenu, type SortDirection } from '@/components/shared/sort-menu'
import { FilterMenu } from '@/components/shared/filter-menu'
import { useViewMode } from '@/hooks/useViewMode'
import Breadcrumbs from './Breadcrumbs'
import ItemCard, { type ItemTarget } from './ItemCard'
import RoomMembers from './RoomMembers'
import CreateFolderDialog from './CreateFolderDialog'
import RenameDialog from './RenameDialog'
import DeleteDialog from './DeleteDialog'
import UploadButton from './UploadButton'
import ShareDialog from '@/components/blocks/ShareDialog'
import FilePreviewDialog from '@/components/blocks/FilePreviewDialog'
import UpLevelCard from './UpLevelCard'

const FILE_PAGE_SIZE = 25

type ContentSort = 'name' | 'updated' | 'size'
type ContentFilter = 'all' | 'folders' | 'files'

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

function RoomViewerContent() {
    const { roomId = '', folderId } = useParams<{ roomId: string; folderId?: string }>()
    const { user } = useAuth()
    const [filePage, setFilePage] = React.useState(1)
    const fileOffset = (filePage - 1) * FILE_PAGE_SIZE
    const { room, setRoom, contents, setContents, loading, error, reload } = useRoomContents(roomId, folderId, {
        limit: FILE_PAGE_SIZE,
        offset: fileOffset,
    })
    const folderPath = useFolderPath(folderId)
    const parentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1].parentFolderId : null
    const { setDragged } = useDnd()

    const [createOpen, setCreateOpen] = React.useState(false)
    const [renameTarget, setRenameTarget] = React.useState<ItemTarget | null>(null)
    const [deleteTarget, setDeleteTarget] = React.useState<ItemTarget | null>(null)
    const [previewFile, setPreviewFile] = React.useState<FileMeta | null>(null)
    const [shareOpen, setShareOpen] = React.useState(false)
    const { view, setView } = useViewMode('contents')
    const [sort, setSort] = React.useState<ContentSort>('name')
    const [direction, setDirection] = React.useState<SortDirection>('asc')
    const [filter, setFilter] = React.useState<ContentFilter>('all')
    const [searchQuery, setSearchQuery] = React.useState('')
    const [searchResults, setSearchResults] = React.useState<{ folders: Folder[]; files: FileMeta[] }>({ folders: [], files: [] })
    const [searching, setSearching] = React.useState(false)
    const [toast, setToast] = React.useState<string | null>(null)

    const readOnly = room ? room.ownerId !== user?.id : false

    React.useEffect(() => {
        setFilePage(1)
    }, [folderId])

    React.useEffect(() => {
        if (!toast) return
        const timeout = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(timeout)
    }, [toast])

    const runSearch = React.useCallback(
        async (q: string) => {
            const query = q.trim()
            if (!query) {
                setSearchResults({ folders: [], files: [] })
                setSearching(false)
                return
            }
            setSearching(true)
            try {
                const result = await roomApi.search(roomId, query)
                setSearchResults({ folders: result.folders, files: result.files })
            } catch {
                setSearchResults({ folders: [], files: [] })
            } finally {
                setSearching(false)
            }
        },
        [roomId],
    )

    React.useEffect(() => {
        const query = searchQuery.trim()
        if (!query) {
            setSearchResults({ folders: [], files: [] })
            setSearching(false)
            return
        }
        setSearching(true)
        const timeout = setTimeout(() => runSearch(query), 300)
        return () => clearTimeout(timeout)
    }, [searchQuery, runSearch])

    const handleMove = async (item: { type: 'folder' | 'file'; id: string }, targetFolderId: string | null) => {
        if (readOnly) return
        try {
            if (item.type === 'file') await fileApi.move(item.id, targetFolderId)
            else await folderApi.move(item.id, targetFolderId)
            setDragged(null)
            reload()
            setToast('Item moved')
        } catch (err) {
            setToast(err instanceof ApiError ? err.message : 'Failed to move item.')
        }
    }

    const removeFromList = (id: string) => {
        setContents((prev) => ({
            folders: prev.folders.filter((folder) => folder.id !== id),
            files: prev.files.filter((file) => file.id !== id),
            total: Math.max(0, prev.total - 1),
        }))
    }

    const visibleFolders =
        filter === 'files' ? [] : sortItems(contents.folders, sort, direction)
    const visibleFiles =
        filter === 'folders' ? [] : sortItems(contents.files, sort, direction)

    const handleSort = (value: ContentSort, dir: SortDirection) => {
        setSort(value)
        setDirection(dir)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <Breadcrumbs
                        roomId={roomId}
                        roomName={room?.name ?? 'Loading...'}
                        folderPath={folderPath}
                        currentFolderId={folderId}
                    />
                    {room?.userCount !== undefined && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" />
                            {room.userCount} {room.userCount === 1 ? 'person' : 'people'} in this room
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!readOnly && (
                        <>
                            <UploadButton dataRoomId={roomId} folderId={folderId ?? null} onUploaded={reload} />
                            <Button onClick={() => setCreateOpen(true)}>
                                <FolderPlus className="size-4" />
                                New folder
                            </Button>
                        </>
                    )}
                    {!readOnly && (
                        <Button variant="outline" onClick={() => setShareOpen(true)} disabled={!room}>
                            <Share2 className="size-4" />
                            Share
                        </Button>
                    )}
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search files and folders..."
                        className="pl-9 pr-8"
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
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
                <div className="min-w-0 flex-1">

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            ) : error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            ) : (
                <div className="space-y-2">
                    {readOnly && (
                        <p className="text-xs text-muted-foreground">
                            You have read-only access to this data room.
                        </p>
                    )}

                    {searchQuery.trim() ? (
                        searching ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground">
                                <Loader2 className="size-5 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Results for &quot;{searchQuery.trim()}&quot;
                                </p>
                                <CardGrid view={view}>
                                    {searchResults.folders.map((folder) => (
                                        <ItemCard
                                            key={folder.id}
                                            roomId={roomId}
                                            target={{ type: 'folder', item: folder }}
                                            view={view}
                                            readOnly={readOnly}
                                            onRename={setRenameTarget}
                                            onDelete={setDeleteTarget}
                                            onDrop={handleMove}
                                        />
                                    ))}
                                    {searchResults.files.map((file) => (
                                        <ItemCard
                                            key={file.id}
                                            roomId={roomId}
                                            target={{ type: 'file', item: file }}
                                            view={view}
                                            readOnly={readOnly}
                                            onPreview={setPreviewFile}
                                            onRename={setRenameTarget}
                                            onDelete={setDeleteTarget}
                                            onDrop={handleMove}
                                        />
                                    ))}
                                </CardGrid>
                                {searchResults.folders.length === 0 && searchResults.files.length === 0 && (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                                        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                                            <FileSearch className="size-7 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium">No matches found</p>
                                        <p className="text-sm text-muted-foreground">
                                            Try a different search term.
                                        </p>
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        <>
                            <CardGrid view={view}>
                                {folderId && (
                                    <UpLevelCard
                                        targetFolderId={parentFolderId}
                                        onDrop={handleMove}
                                        view={view}
                                    />
                                )}
                                {visibleFolders.map((folder) => (
                                    <ItemCard
                                        key={folder.id}
                                        roomId={roomId}
                                        target={{ type: 'folder', item: folder }}
                                            view={view}
                                        readOnly={readOnly}
                                        onRename={setRenameTarget}
                                        onDelete={setDeleteTarget}
                                        onDrop={handleMove}
                                    />
                                ))}

                                {visibleFiles.map((file) => (
                                    <ItemCard
                                        key={file.id}
                                        roomId={roomId}
                                        target={{ type: 'file', item: file }}
                                            view={view}
                                        readOnly={readOnly}
                                        onPreview={setPreviewFile}
                                        onRename={setRenameTarget}
                                        onDelete={setDeleteTarget}
                                        onDrop={handleMove}
                                    />
                                ))}
                            </CardGrid>

                            {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                                        {folderId ? (
                                            <FolderOpen className="size-7 text-muted-foreground" />
                                        ) : (
                                            <FileText className="size-7 text-muted-foreground" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium">This folder is empty</p>
                                    {!readOnly && (
                                        <p className="max-w-xs text-sm text-muted-foreground">
                                            Upload files or create a folder to get started.
                                        </p>
                                    )}
                                </div>
                            )}

                            {contents.total > FILE_PAGE_SIZE && (
                                <Pagination
                                    page={filePage}
                                    pageSize={FILE_PAGE_SIZE}
                                    total={contents.total}
                                    onPageChange={setFilePage}
                                    className="pt-2"
                                />
                            )}
                        </>
                    )}
                </div>
            )}
                </div>

            {room && <RoomMembers room={room} />}
            </div>

            <CreateFolderDialog
                roomId={roomId}
                parentId={folderId ?? null}
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={reload}
            />
            <RenameDialog
                target={renameTarget}
                open={renameTarget !== null}
                onOpenChange={(open) => !open && setRenameTarget(null)}
                onRenamed={reload}
            />
            <DeleteDialog
                target={deleteTarget}
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onDeleted={() => {
                    if (deleteTarget) removeFromList(deleteTarget.item.id)
                }}
            />

            {room && (
                <ShareDialog
                    shareableType="DATAROOM"
                    shareableId={roomId}
                    room={room}
                    open={shareOpen}
                    onOpenChange={setShareOpen}
                    onVisibilityChange={setRoom}
                />
            )}

            {previewFile && (
                <FilePreviewDialog
                    file={previewFile}
                    open={previewFile !== null}
                    onOpenChange={(open) => !open && setPreviewFile(null)}
                    onFetchUrl={() => fileApi.download(previewFile.id)}
                />
            )}

            {toast && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-card px-4 py-2 text-sm shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    )
}

export default function RoomViewer() {
    return (
        <DndProvider>
            <RoomViewerContent />
        </DndProvider>
    )
}
