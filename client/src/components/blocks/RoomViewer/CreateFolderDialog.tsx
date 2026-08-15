import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { roomApi } from '@/api'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type CreateFolderDialogProps = {
    roomId: string
    parentId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: () => void
}

export default function CreateFolderDialog({
    roomId,
    parentId,
    open,
    onOpenChange,
    onCreated,
}: CreateFolderDialogProps) {
    const [name, setName] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            await roomApi.createFolder(roomId, name, parentId ?? undefined)
            setName('')
            onCreated()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to create folder.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New folder</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        required
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !name.trim()}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
