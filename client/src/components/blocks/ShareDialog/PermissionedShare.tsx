import * as React from 'react'
import { Loader2, Trash2, UserPlus } from 'lucide-react'
import { ApiError } from '@/api/client'
import { shareApi, userApi } from '@/api'
import type { Share, ShareableType, User } from '@/types'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'

type PermissionedShareProps = {
    shareableType: ShareableType
    shareableId: string
}

export default function PermissionedShare({ shareableType, shareableId }: PermissionedShareProps) {
    const [shares, setShares] = React.useState<Share[]>([])
    const [email, setEmail] = React.useState('')
    const [candidates, setCandidates] = React.useState<User[]>([])
    const [selected, setSelected] = React.useState<User | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const loadShares = React.useCallback(() => {
        shareApi
            .list(shareableType, shareableId)
            .then(setShares)
            .catch(() => setShares([]))
    }, [shareableType, shareableId])

    React.useEffect(() => {
        loadShares()
    }, [loadShares])

    const handleEmailChange = async (value: string) => {
        setEmail(value)
        setSelected(null)
        if (value.trim().length < 2) {
            setCandidates([])
            return
        }
        try {
            const results = await userApi.search(value)
            setCandidates(results)
        } catch {
            setCandidates([])
        }
    }

    const pick = (user: User) => {
        setSelected(user)
        setEmail(user.email)
        setCandidates([])
    }

    const share = async () => {
        if (!selected) return
        setError(null)
        setSubmitting(true)
        try {
            await shareApi.create(shareableType, shareableId, selected.id)
            setSelected(null)
            setEmail('')
            loadShares()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to share.')
        } finally {
            setSubmitting(false)
        }
    }

    const revoke = async (id: string) => {
        try {
            await shareApi.revoke(id)
            setShares((prev) => prev.filter((share) => share.id !== id))
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to revoke access.')
        }
    }

    return (
        <div className="space-y-3">
            <Label>Share with people</Label>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Input
                        value={email}
                        onChange={(event) => handleEmailChange(event.target.value)}
                        placeholder="Enter email address"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault()
                                share()
                            }
                        }}
                    />
                    <Button onClick={share} disabled={!selected || submitting} className="shrink-0">
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                        Share
                    </Button>
                </div>
                {candidates.length > 0 && (
                    <div className="overflow-hidden rounded-md border">
                        {candidates.map((candidate) => (
                            <button
                                key={candidate.id}
                                onClick={() => pick(candidate)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                            >
                                <span className="font-medium">{candidate.name}</span>
                                <span className="text-muted-foreground">{candidate.email}</span>
                            </button>
                        ))}
                    </div>
                )}
                {email && candidates.length === 0 && !selected && (
                    <p className="text-xs text-muted-foreground">No users found.</p>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {shares.length > 0 && (
                <div className="space-y-2">
                    {shares.map((share) => (
                        <div
                            key={share.id}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {share.user?.name ?? 'Unknown user'}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {share.user?.email}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => revoke(share.id)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Revoke access"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
