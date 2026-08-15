import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { roomApi } from '@/api'
import type { DataRoom } from '@/types'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type CreateRoomDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (room: DataRoom) => void
}

export default function CreateRoomDialog({
    open,
    onOpenChange,
    onCreated,
}: CreateRoomDialogProps) {
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const reset = () => {
        setName('')
        setDescription('')
        setError(null)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            const room = await roomApi.create(name, description || undefined)
            onCreated(room)
            reset()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to create data room.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New data room</DialogTitle>
                    <DialogDescription>Give your data room a name to get started.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Acme Corp Acquisition"
                        autoFocus
                        required
                    />
                    <Input
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Description (optional)"
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
