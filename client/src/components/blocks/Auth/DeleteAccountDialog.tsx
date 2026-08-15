import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shared/dialog'

type DeleteAccountDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const { requestDeleteAccountCode, deleteAccount } = useAuth()

    const [step, setStep] = React.useState<'confirm' | 'code'>('confirm')
    const [devCode, setDevCode] = React.useState<string | undefined>(undefined)
    const [code, setCode] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (open) {
            setStep('confirm')
            setCode('')
            setDevCode(undefined)
            setError(null)
        }
    }, [open])

    const handleRequestCode = async () => {
        setError(null)
        setSubmitting(true)
        try {
            const challenge = await requestDeleteAccountCode()
            setDevCode(challenge.code)
            setStep('code')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send a code.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        setError(null)
        setSubmitting(true)
        try {
            await deleteAccount(code)
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to delete account.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete account</DialogTitle>
                    <DialogDescription>
                        {step === 'confirm'
                            ? 'This permanently deletes your account and all of your data rooms.'
                            : `Enter the 6-digit code sent to your email to confirm deletion.`}
                    </DialogDescription>
                </DialogHeader>

                {step === 'confirm' ? (
                    <>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRequestCode} disabled={submitting}>
                                {submitting && <Loader2 className="size-4 animate-spin" />}
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="space-y-4">
                        {devCode && (
                            <p className="rounded-md bg-muted px-3 py-2 text-center text-sm">
                                Dev code: <span className="font-mono font-medium">{devCode}</span>
                            </p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="delete-code">Verification code</Label>
                            <Input
                                id="delete-code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="••••••"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                className="text-center font-mono text-lg tracking-widest"
                                autoFocus
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep('confirm')}>
                                Back
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={submitting || code.length !== 6}>
                                {submitting && <Loader2 className="size-4 animate-spin" />}
                                Delete account
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
