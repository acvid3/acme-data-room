import * as React from 'react'
import { folderApi } from '@/api'
import type { Folder } from '@/types'

export function useFolderPath(folderId?: string) {
    const [path, setPath] = React.useState<Folder[]>([])

    React.useEffect(() => {
        let cancelled = false
        setPath([])
        if (!folderId) return

        const walkUp = async (id: string, acc: Folder[] = []): Promise<Folder[]> => {
            const folder = await folderApi.get(id)
            acc.unshift(folder)
            return folder.parentFolderId ? walkUp(folder.parentFolderId, acc) : acc
        }

        walkUp(folderId)
            .then((chain) => {
                if (!cancelled) setPath(chain)
            })
            .catch(() => {
                if (!cancelled) setPath([])
            })

        return () => {
            cancelled = true
        }
    }, [folderId])

    return path
}
