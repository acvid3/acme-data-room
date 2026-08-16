import type { DataRoom } from '@/types'
import type { SortDirection } from '@/components/shared/sort-menu'

export type ContentSort = 'name' | 'updated' | 'size'

export function sortItems<T extends { name: string; updatedAt: string }>(
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

export type RoomSort = 'name' | 'created' | 'members'

export function sortRooms(rooms: DataRoom[], sort: RoomSort, direction: SortDirection): DataRoom[] {
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
}
