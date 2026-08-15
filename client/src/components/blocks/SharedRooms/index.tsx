import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Eye, Loader2, Share2, Users } from 'lucide-react'
import { Pagination } from '@/components/shared/pagination'
import { CardGrid } from '@/components/shared/card-grid'
import { ViewToggle } from '@/components/shared/view-toggle'
import { SortMenu, type SortDirection } from '@/components/shared/sort-menu'
import { useSharedRooms } from '@/hooks/useSharedRooms'
import { useViewMode } from '@/hooks/useViewMode'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 25

type RoomSort = 'name' | 'created' | 'members'

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export default function SharedRooms() {
    const { rooms, total, page, setPage, loading, error } = useSharedRooms(PAGE_SIZE)
    const { view, setView } = useViewMode('rooms')
    const [sort, setSort] = React.useState<RoomSort>('name')
    const [direction, setDirection] = React.useState<SortDirection>('asc')

    const sortedRooms = React.useMemo(() => {
        const factor = direction === 'asc' ? 1 : -1
        return [...rooms].sort((a, b) => {
            if (sort === 'created') {
                return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
            }
            if (sort === 'members') {
                return ((a.userCount ?? 1) - (b.userCount ?? 1)) * factor
            }
            return a.name.localeCompare(b.name) * factor
        })
    }, [rooms, sort, direction])

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
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Share2 className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">Shared with me</h1>
                        <p className="text-sm text-muted-foreground">
                            Data rooms others have granted you read-only access to.
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
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
                        <Share2 className="size-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Nothing shared with you yet</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        When someone shares a data room with you, it appears here.
                    </p>
                </div>
            ) : (
                <>
                    <CardGrid view={view}>
                        {sortedRooms.map((room) => (
                            <Link
                                key={room.id}
                                to={`/rooms/${room.id}`}
                                className={cn(
                                    'group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent',
                                    view === 'list' && 'flex items-center gap-3',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground',
                                    )}
                                >
                                    <Share2 className="size-5" />
                                </div>
                                <div className={cn('min-w-0', view === 'list' && 'flex-1')}>
                                    <h3 className="truncate font-medium group-hover:text-primary">
                                        {room.name}
                                    </h3>
                                    {view === 'grid' && room.description && (
                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {room.description}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3" />
                                        {formatDate(room.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-3">
                                        {room.userCount !== undefined && (
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {room.userCount}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Eye className="size-3" />
                                            Read-only
                                        </span>
                                    </span>
                                </div>
                            </Link>
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
        </div>
    )
}
