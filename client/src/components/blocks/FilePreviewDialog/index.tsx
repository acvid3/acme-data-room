import * as React from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import type { DownloadResult, FileMeta } from '@/types'
import { Button } from '@/components/shared/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type FilePreviewDialogProps = {
    file: FileMeta
    open: boolean
    onOpenChange: (open: boolean) => void
    url?: string
    onFetchUrl?: () => Promise<DownloadResult>
}

function isText(mimeType: string): boolean {
    return (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/xml' ||
        mimeType === 'application/javascript' ||
        mimeType.includes('markdown')
    )
}

function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}

function isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/')
}

function isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/')
}

export default function FilePreviewDialog({
    file,
    open,
    onOpenChange,
    url: presetUrl,
    onFetchUrl,
}: FilePreviewDialogProps) {
    const [url, setUrl] = React.useState<string | null>(presetUrl ?? null)
    const [text, setText] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const mimeType = file.mimeType

    React.useEffect(() => {
        if (!open) return
        setLoading(true)
        setError(null)
        setText(null)
        setUrl(presetUrl ?? null)

        const load = async () => {
            const resolved = presetUrl ?? (onFetchUrl ? (await onFetchUrl()).url : null)
            if (!resolved) throw new Error('No download url available.')
            setUrl(resolved)
            if (isText(mimeType)) {
                const res = await fetch(resolved)
                setText(await res.text())
            }
        }

        load()
            .catch((err) =>
                setError(err instanceof ApiError ? err.message : 'Failed to load file preview.'),
            )
            .finally(() => setLoading(false))
    }, [open, file.id, mimeType, presetUrl, onFetchUrl])

    const handleDownload = async () => {
        if (url) {
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = file.name
            anchor.click()
            return
        }
        if (!onFetchUrl) return
        const result = await onFetchUrl()
        const anchor = document.createElement('a')
        anchor.href = result.url
        anchor.download = result.name
        anchor.click()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        <span className="flex items-center gap-2 pr-8">
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex h-[60vh] flex-col">
                    {loading ? (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                            <Loader2 className="size-6 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-1 items-center justify-center text-destructive">
                            {error}
                        </div>
                    ) : url && isText(mimeType) && text !== null ? (
                        <pre className="scrollbar-hidden min-h-0 flex-1 overflow-auto rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                            {text}
                        </pre>
                    ) : url && isImage(mimeType) ? (
                        <img
                            src={url}
                            alt={file.name}
                            className="max-h-[60vh] w-full object-contain"
                        />
                    ) : url && isVideo(mimeType) ? (
                        <video src={url} controls className="max-h-[60vh] w-full" />
                    ) : url && isAudio(mimeType) ? (
                        <audio src={url} controls className="w-full" />
                    ) : url && mimeType === 'application/pdf' ? (
                        <iframe src={url} title={file.name} className="h-full w-full flex-1" />
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                            <FileText className="size-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Preview not available for this file type.
                            </p>
                            <Button onClick={handleDownload}>
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
