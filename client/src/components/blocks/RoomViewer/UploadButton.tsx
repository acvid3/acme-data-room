import * as React from 'react'
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react'
import { useUploads } from '@/hooks/useUploads'
import { cn } from '@/utils/cn'

type UploadButtonProps = {
    dataRoomId: string
    folderId: string | null
    onUploaded: () => void
}

export default function UploadButton({ dataRoomId, folderId, onUploaded }: UploadButtonProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const { uploadItems, uploadFile, clearDone } = useUploads()
    const [dragging, setDragging] = React.useState(false)

    const handleFiles = async (files: FileList | File[]) => {
        await Promise.all(
            Array.from(files).map((file) => uploadFile(file, dataRoomId, folderId)),
        )
        onUploaded()
    }

    const activeItems = uploadItems.filter((item) => item.status !== 'done')
    const doneCount = uploadItems.filter((item) => item.status === 'done').length
    const showDone = doneCount > 0 && activeItems.length === 0

    React.useEffect(() => {
        if (!showDone) return
        const timeout = setTimeout(clearDone, 3000)
        return () => clearTimeout(timeout)
    }, [showDone, clearDone])

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                    if (event.target.files) handleFiles(event.target.files)
                    event.target.value = ''
                }}
            />
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files)
                }}
                className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
                    dragging && 'border-primary bg-primary/5 text-foreground',
                )}
            >
                <Upload className="size-4" />
                Upload
            </div>

            {activeItems.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2 rounded-lg border bg-card p-3 shadow-lg">
                    {activeItems.map((item) => (
                        <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-medium">{item.name}</span>
                                {item.status === 'error' ? (
                                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        {item.progress}%
                                    </span>
                                )}
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        item.status === 'error' ? 'bg-destructive' : 'bg-primary',
                                    )}
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                            {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                        </div>
                    ))}
                </div>
            )}

            {showDone && (
                <div className="fixed bottom-4 right-4 z-50 flex w-80 items-center gap-2 rounded-lg border bg-card p-3 shadow-lg">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <span className="flex-1 text-sm">Upload complete</span>
                    <button onClick={clearDone} aria-label="Dismiss">
                        <X className="size-4 text-muted-foreground hover:text-foreground" />
                    </button>
                </div>
            )}
        </>
    )
}
