import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { publicLinkApi } from '@/api'
import type { PublicLink, ShareableType } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'
import PermissionedShare from './PermissionedShare'
import ShareLink from './ShareLink'

type ShareDialogProps = {
    shareableType: ShareableType
    shareableId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ShareDialog({
    shareableType,
    shareableId,
    open,
    onOpenChange,
}: ShareDialogProps) {
    const [link, setLink] = React.useState<PublicLink | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const loadLink = React.useCallback(() => {
        publicLinkApi
            .create(shareableType, shareableId)
            .then(setLink)
            .catch((err) =>
                setError(err instanceof ApiError ? err.message : 'Failed to create public link.'),
            )
            .finally(() => setLoading(false))
    }, [shareableType, shareableId])

    React.useEffect(() => {
        if (!open) return
        setLoading(true)
        setError(null)
        loadLink()
    }, [open, loadLink])

    const revokeLink = async () => {
        if (!link) return
        try {
            await publicLinkApi.revoke(link.token)
            setLink(null)
            loadLink()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to remove link.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Share</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {link && (
                                <ShareLink
                                    url={`${window.location.origin}/public/${link.token}`}
                                    onRevoke={revokeLink}
                                />
                            )}
                            <PermissionedShare shareableType={shareableType} shareableId={shareableId} />
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
