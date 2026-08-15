import * as React from 'react'
import { API_BASE, getToken } from '@/config'

export type UploadItem = {
    id: string
    name: string
    progress: number
    status: 'uploading' | 'done' | 'error'
    error?: string
}

export function useUploads() {
    const [items, setItems] = React.useState<UploadItem[]>([])

    const update = React.useCallback((id: string, patch: Partial<UploadItem>) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    }, [])

    const uploadFile = React.useCallback(
        (file: File, dataRoomId: string, folderId: string | null) =>
            new Promise<void>((resolve) => {
                const id = crypto.randomUUID()
                setItems((prev) => [
                    ...prev,
                    { id, name: file.name, progress: 0, status: 'uploading' },
                ])

                const form = new FormData()
                form.append('file', file)
                form.append('dataRoomId', dataRoomId)
                if (folderId) form.append('folderId', folderId)

                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${API_BASE}/files`)
                const token = getToken()
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        update(id, { progress: Math.round((event.loaded / event.total) * 100) })
                    }
                }
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        update(id, { progress: 100, status: 'done' })
                    } else {
                        update(id, { status: 'error', error: `Upload failed with status ${xhr.status}` })
                    }
                    resolve()
                }
                xhr.onerror = () => {
                    update(id, { status: 'error', error: 'Upload failed' })
                    resolve()
                }
                xhr.send(form)
            }),
        [update],
    )

    const clearDone = React.useCallback(() => {
        setItems((prev) => prev.filter((item) => item.status !== 'done'))
    }, [])

    return { uploadItems: items, uploadFile, clearDone }
}
