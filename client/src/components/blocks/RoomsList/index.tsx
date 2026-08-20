import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, FolderLock, FolderOpen, FolderPlus, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/shared/button'
import { Pagination } from '@/components/shared/pagination'
import { CardGrid } from '@/components/shared/card-grid'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { SortMenu, type SortDirection } from '@/components/shared/sort-menu'
import { useDataRooms } from '@/hooks/useDataRooms'
import { useViewMode } from '@/hooks/useViewMode'
import { formatDate } from '@/utils/format'
import { sortRooms, type RoomSort } from '@/utils/sort'
import { cn } from '@/utils/cn'
import CreateRoomDialog from '@/components/blocks/CreateRoomDialog'
import EditRoomDialog from '@/components/blocks/EditRoomDialog'
import DeleteRoomDialog from './DeleteRoomDialog'
import type { DataRoom } from '@/types'

const PAGE_SIZE = 25

function RoomCard({
    room,
    view,
    onEdit,
    onDelete,
}: {
    room: DataRoom
    view: ViewMode
    onEdit: (room: DataRoom) => void
    onDelete: (room: DataRoom) => void
}) {
    return (
        <div
            className={cn(
                'group relative rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
                view === 'list' && 'flex items-center gap-3',
            )}
        >
            <Link to={`/rooms/${room.id}`} className="flex items-start gap-3 focus:outline-none">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FolderLock className="size-5" />
                </div>
                <div className={cn('min-w-0', view === 'list' && 'flex-1')}>
                    <h3 className="truncate font-display text-base font-medium tracking-tight group-hover:text-primary">
                        {room.name}
                    </h3>
                    {view === 'grid' &&
                        (room.description ? (
                            <p className="line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">No description</p>
                        ))}
                    <div className="mt-1.5 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            Created {formatDate(room.createdAt)}
                        </span>
                        {room.userCount !== undefined && (
                            <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {room.userCount} {room.userCount === 1 ? 'person' : 'people'}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
            <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                    onClick={() => onEdit(room)}
                    className="rounded-md p-2 text-muted-foreground transition-opacity hover:bg-primary/10 hover:text-primary focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Edit ${room.name}`}
                >
                    <Pencil className="size-4" />
                </button>
                <button
                    onClick={() => onDelete(room)}
                    className="rounded-md p-2 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${room.name}`}
                >
                    <Trash2 className="size-4" />
                </button>
            </div>
        </div>
    )
}

export default function RoomsList() {
    const { rooms, total, page, setPage, loading, error, setRooms } = useDataRooms(PAGE_SIZE)
    const [createOpen, setCreateOpen] = React.useState(false)
    const [editTarget, setEditTarget] = React.useState<DataRoom | null>(null)
    const [deleteTarget, setDeleteTarget] = React.useState<DataRoom | null>(null)
    const { view, setView } = useViewMode('rooms')
    const [sort, setSort] = React.useState<RoomSort>('name')
    const [direction, setDirection] = React.useState<SortDirection>('asc')

    const sortedRooms = React.useMemo(
        () => sortRooms(rooms, sort, direction),
        [rooms, sort, direction],
    )

    const removeRoom = (id: string) => {
        setRooms((prev) => prev.filter((room) => room.id !== id))
    }

    const updateRoom = (updated: DataRoom) => {
        setRooms((prev) => prev.map((room) => (room.id === updated.id ? updated : room)))
    }

    const handleSort = (value: RoomSort, dir: SortDirection) => {
        setSort(value)
        setDirection(dir)
    }

    React.useEffect(() => {
        window.scrollTo(0, 0)
    }, [page])

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                        <FolderOpen className="size-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight">Data Rooms</h1>
                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Create and manage your virtual data rooms.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <SortMenu
                        options={[
                            { value: 'name', label: 'Name' },
                            { value: 'created', label: 'Date created', ascLabel: 'Newest first', descLabel: 'Oldest first' },
                            { value: 'members', label: 'Members', ascLabel: 'Fewest first', descLabel: 'Most first' },
                        ]}
                        value={sort}
                        direction={direction}
                        onSort={handleSort}
                    />
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        New data room
                    </Button>
                    <ViewToggle value={view} onChange={setView} />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                </div>
            ) : error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <FolderLock className="size-8 text-primary" />
                    </div>
                    <p className="font-display text-lg font-medium">No data rooms yet</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        Create your first data room to start uploading documents.
                    </p>
                    <Button onClick={() => setCreateOpen(true)}>
                        <FolderPlus className="size-4" />
                        Create a data room
                    </Button>
                </div>
            ) : (
                <>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {total} {total === 1 ? 'data room' : 'data rooms'}
                    </p>
                    <CardGrid view={view}>
                        {sortedRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                view={view}
                                onEdit={setEditTarget}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </CardGrid>
                    {total > PAGE_SIZE && (
                        <Pagination
                            page={page}
                            pageSize={PAGE_SIZE}
                            total={total}
                            onPageChange={setPage}
                            className="pt-4"
                        />
                    )}
                </>
            )}

            <CreateRoomDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={(room) => setRooms((prev) => [room, ...prev])}
            />
            <EditRoomDialog
                room={editTarget}
                open={editTarget !== null}
                onOpenChange={(open) => !open && setEditTarget(null)}
                onUpdated={updateRoom}
            />
            <DeleteRoomDialog
                room={deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onDeleted={removeRoom}
            />
        </div>
    )
}
