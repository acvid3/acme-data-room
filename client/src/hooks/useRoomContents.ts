import * as React from 'react'
import { ApiError } from '@/api/client'
import { roomApi } from '@/api'
import type { DataRoom, FolderContents } from '@/types'

type UseRoomContentsOptions = {
    limit?: number
    offset?: number
}

export function useRoomContents(roomId: string, folderId?: string, options: UseRoomContentsOptions = {}) {
    const { limit, offset } = options
    const [contents, setContents] = React.useState<FolderContents>({ folders: [], files: [], total: 0 })
    const [room, setRoom] = React.useState<DataRoom | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const reload = React.useCallback(() => {
        setLoading(true)
        setError(null)
        roomApi
            .contents(roomId, folderId, limit, offset)
            .then((data) => {
                setContents(data)
                return roomApi.get(roomId)
            })
            .then(setRoom)
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : 'Failed to load contents.')
            })
            .finally(() => setLoading(false))
    }, [roomId, folderId, limit, offset])

    React.useEffect(() => {
        reload()
    }, [reload])

    return { room, contents, setContents, loading, error, reload }
}
