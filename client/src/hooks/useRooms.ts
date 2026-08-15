import * as React from 'react'
import { ApiError } from '@/api/client'
import type { DataRoom } from '@/types'

type RoomsData = {
    rooms: DataRoom[]
    total: number
}

function normalizeRooms(data: unknown): RoomsData {
    if (Array.isArray(data)) return { rooms: data as DataRoom[], total: data.length }
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>
        const listField = ['data', 'items', 'rooms', 'results'].find(
            (key) => Array.isArray(record[key]),
        )
        if (listField) {
            const items = record[listField] as DataRoom[]
            const totalField = ['total', 'totalCount', 'count'].find(
                (key) => record[key] !== undefined,
            )
            const parsed = totalField ? Number(record[totalField]) : NaN
            const total = Number.isFinite(parsed) ? parsed : items.length
            return { rooms: items, total }
        }
    }
    return { rooms: [], total: 0 }
}

export function useRooms(
    fetcher: (limit?: number, offset?: number) => Promise<unknown>,
    errorMessage: string,
    pageSize = 25,
) {
    const [rooms, setRooms] = React.useState<DataRoom[]>([])
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const offset = (page - 1) * pageSize

    React.useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        fetcher(pageSize, offset)
            .then((data) => {
                if (!cancelled) {
                    const normalized = normalizeRooms(data)
                    setRooms(normalized.rooms)
                    setTotal(normalized.total)
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof ApiError ? err.message : errorMessage)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [fetcher, errorMessage, pageSize, offset])

    return { rooms, setRooms, total, page, setPage, loading, error }
}
