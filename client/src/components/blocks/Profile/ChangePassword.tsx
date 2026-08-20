import * as React from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { PasswordInput } from '@/components/shared/password-input'

type Step = 'idle' | 'code' | 'done'

export default function ChangePassword() {
    const { user, requestPasswordResetCode, resetPassword } = useAuth()

    const [step, setStep] = React.useState<Step>('idle')
    const [devCode, setDevCode] = React.useState<string | undefined>(undefined)
    const [code, setCode] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    const requestCode = async () => {
        if (!user) return
        setError(null)
        setSubmitting(true)
        try {
            const challenge = await requestPasswordResetCode(user.email)
            setDevCode(challenge.code)
            setStep('code')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send a code.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!user) return
        setError(null)
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        setSubmitting(true)
        try {
            await resetPassword(user.email, code, password)
            setStep('done')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to change password.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
                <KeyRound className="size-4 text-muted-foreground" />
                Change password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll send a verification code to your email to confirm the change.
            </p>

            {step === 'done' ? (
                <div className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Your password has been updated.
                </div>
            ) : step === 'idle' ? (
                <Button className="mt-4" onClick={requestCode} disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Send code
                </Button>
            ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {devCode && (
                        <p className="rounded-md bg-muted px-3 py-2 text-center text-sm">
                            Dev code: <span className="font-mono font-medium">{devCode}</span>
                        </p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="change-code">Verification code</Label>
                        <Input
                            id="change-code"
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
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <PasswordInput
                            id="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm new password</Label>
                        <PasswordInput
                            id="confirm-new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setStep('idle')
                                setCode('')
                                setPassword('')
                                setConfirmPassword('')
                                setError(null)
                            }}
                        >
                            Back
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="size-4 animate-spin" />}
                            Change password
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}
