import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { fileApi, folderApi } from '@/api'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'
import type { ItemTarget } from './ItemCard'

type RenameDialogProps = {
    target: ItemTarget | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRenamed: () => void
}

export default function RenameDialog({ target, open, onOpenChange, onRenamed }: RenameDialogProps) {
    const [name, setName] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (open && target) setName(target.item.name)
    }, [open, target])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!target) return
        setError(null)
        setSubmitting(true)
        try {
            if (target.type === 'folder') await folderApi.rename(target.item.id, name)
            else await fileApi.rename(target.item.id, name)
            onRenamed()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to rename.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
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
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
