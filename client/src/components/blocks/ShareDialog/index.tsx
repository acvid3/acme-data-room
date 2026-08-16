import * as React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { publicLinkApi, roomApi } from '@/api'
import type { DataRoom, PublicLink, ShareableType } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'
import { VisibilityToggle } from '@/components/shared/visibility-toggle'
import PermissionedShare from './PermissionedShare'
import ShareLink from './ShareLink'

type ShareDialogProps = {
    shareableType: ShareableType
    shareableId: string
    room: DataRoom | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onVisibilityChange: (room: DataRoom) => void
}

export default function ShareDialog({
    shareableType,
    shareableId,
    room,
    open,
    onOpenChange,
    onVisibilityChange,
}: ShareDialogProps) {
    const [link, setLink] = React.useState<PublicLink | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [visibility, setVisibility] = React.useState<DataRoom['visibility']>(room?.visibility ?? 'PRIVATE')

    const loadLink = React.useCallback(
        (isPublic: boolean) => {
            if (!isPublic) {
                setLink(null)
                setLoading(false)
                return
            }
            setLoading(true)
            publicLinkApi
                .create(shareableType, shareableId)
                .then(setLink)
                .catch((err) =>
                    setError(err instanceof ApiError ? err.message : 'Failed to create public link.'),
                )
                .finally(() => setLoading(false))
        },
        [shareableType, shareableId],
    )

    React.useEffect(() => {
        if (!open) return
        if (room) setVisibility(room.visibility)
        setError(null)
        loadLink(room?.visibility === 'PUBLIC')
    }, [open, room?.visibility, loadLink])

    const toggleVisibility = async () => {
        if (!room) return
        const next: 'PUBLIC' | 'PRIVATE' = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
        setSaving(true)
        setError(null)
        try {
            const updated = await roomApi.setVisibility(room.id, next)
            setVisibility(updated.visibility)
            onVisibilityChange(updated)
            loadLink(updated.visibility === 'PUBLIC')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update visibility.')
        } finally {
            setSaving(false)
        }
    }

    const revokeLink = async () => {
        if (!link) return
        try {
            await publicLinkApi.revoke(link.token)
            setLink(null)
            loadLink(visibility === 'PUBLIC')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to remove link.')
        }
    }

    const showPublicSection = visibility === 'PUBLIC'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Share</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {error && (
                        <p className="flex items-center gap-1.5 text-sm text-destructive">
                            <AlertTriangle className="size-4" />
                            {error}
                        </p>
                    )}

                    <VisibilityToggle
                        value={visibility}
                        onChange={toggleVisibility}
                        disabled={saving}
                    />

                    {visibility === 'PRIVATE' && (
                        <p className="text-xs text-muted-foreground">
                            Make the room public to create a shareable link.
                        </p>
                    )}

                    {showPublicSection ? (
                        loading ? (
                            <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <Loader2 className="size-5 animate-spin" />
                            </div>
                        ) : (
                            link && (
                                <ShareLink
                                    url={`${window.location.origin}/public/${link.token}`}
                                    onRevoke={revokeLink}
                                />
                            )
                        )
                    ) : null}

                    <PermissionedShare shareableType={shareableType} shareableId={shareableId} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
