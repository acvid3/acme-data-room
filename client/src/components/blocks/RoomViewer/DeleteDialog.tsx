import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { fileApi, folderApi } from '@/api'
import { Button } from '@/components/shared/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'
import type { ItemTarget } from './ItemCard'

type DeleteDialogProps = {
    target: ItemTarget | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleted: () => void
}

export default function DeleteDialog({ target, open, onOpenChange, onDeleted }: DeleteDialogProps) {
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleDelete = async () => {
        if (!target) return
        setError(null)
        setSubmitting(true)
        try {
            if (target.type === 'folder') await folderApi.remove(target.item.id)
            else await fileApi.remove(target.item.id)
            onDeleted()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to delete.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete {target?.item.name}</DialogTitle>
                    <DialogDescription>
                        This will permanently delete the item and all of its contents.
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
