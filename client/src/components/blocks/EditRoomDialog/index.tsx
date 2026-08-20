import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { roomApi } from '@/api'
import type { DataRoom } from '@/types'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { VisibilityToggle } from '@/components/shared/visibility-toggle'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type EditRoomDialogProps = {
    room: DataRoom | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdated: (room: DataRoom) => void
}

export default function EditRoomDialog({ room, open, onOpenChange, onUpdated }: EditRoomDialogProps) {
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [visibility, setVisibility] = React.useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!room || !open) return
        setName(room.name)
        setDescription(room.description ?? '')
        setVisibility(room.visibility)
        setError(null)
    }, [room, open])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!room) return
        setError(null)
        setSubmitting(true)
        try {
            const updated = await roomApi.update(room.id, {
                name,
                description,
                visibility,
            })
            onUpdated(updated)
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update data room.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit data room</DialogTitle>
                    <DialogDescription>Update the name, description, or visibility.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="room-name">Name</Label>
                        <Input
                            id="room-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Acme Corp Acquisition"
                            maxLength={100}
                            autoFocus
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="room-description">Description</Label>
                        <textarea
                            id="room-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What is this data room for? (optional)"
                            maxLength={500}
                            rows={3}
                            className="flex w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-right font-mono text-[11px] text-muted-foreground">
                            {description.length}/500
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Visibility</Label>
                        <VisibilityToggle value={visibility} onChange={setVisibility} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !name.trim()}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
