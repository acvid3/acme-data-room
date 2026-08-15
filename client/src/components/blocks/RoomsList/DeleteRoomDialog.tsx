import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { roomApi } from '@/api'
import type { DataRoom } from '@/types'
import { Button } from '@/components/shared/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type DeleteRoomDialogProps = {
    room: DataRoom | null
    onOpenChange: (open: boolean) => void
    onDeleted: (id: string) => void
}

export default function DeleteRoomDialog({ room, onOpenChange, onDeleted }: DeleteRoomDialogProps) {
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleDelete = async () => {
        if (!room) return
        setError(null)
        setSubmitting(true)
        try {
            await roomApi.remove(room.id)
            onDeleted(room.id)
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to delete data room.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={room !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete {room?.name}</DialogTitle>
                    <DialogDescription>
                        This will permanently delete the data room and all of its folders and files.
                    </DialogDescription>
                </DialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
