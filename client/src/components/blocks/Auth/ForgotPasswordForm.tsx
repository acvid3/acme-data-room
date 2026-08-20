import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { PasswordInput } from '@/components/shared/password-input'
import { AuthShell } from './AuthShell'

type Step = 'email' | 'reset'

export default function ForgotPasswordForm() {
    const { requestPasswordResetCode, resetPassword } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = React.useState('')
    const [devCode, setDevCode] = React.useState<string | undefined>(undefined)
    const [code, setCode] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')
    const [step, setStep] = React.useState<Step>('email')
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [done, setDone] = React.useState(false)

    const handleEmail = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            const challenge = await requestPasswordResetCode(email)
            setDevCode(challenge.code)
            setStep('reset')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReset = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        setSubmitting(true)
        try {
            await resetPassword(email, code, password)
            setDone(true)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthShell>
            {done ? (
                <div className="relative space-y-4 overflow-hidden rounded-lg border border-border bg-card p-6 text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/40">
                    <p className="font-medium">Password reset</p>
                    <p className="text-sm text-muted-foreground">
                        Your password has been updated. You can now sign in.
                    </p>
                    <Button className="w-full" onClick={() => navigate('/login')}>
                        Sign in
                    </Button>
                </div>
            ) : step === 'email' ? (
                <form
                    onSubmit={handleEmail}
                    className="relative space-y-4 overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/40"
                >
                    <div className="space-y-1 text-center">
                        <p className="font-medium">Forgot password?</p>
                        <p className="text-sm text-muted-foreground">
                            Enter your email and we&apos;ll send you a reset code.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {error && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        Send code
                    </Button>
                </form>
            ) : (
                <form
                    onSubmit={handleReset}
                    className="relative space-y-4 overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/40"
                >
                    <div className="space-y-1 text-center">
                        <p className="font-medium">Reset password</p>
                        <p className="text-sm text-muted-foreground">
                            Enter the code we sent to <span className="font-medium">{email}</span>
                        </p>
                    </div>

                    {devCode && (
                        <p className="rounded-md bg-muted px-3 py-2 text-center text-sm">
                            Dev code: <span className="font-mono font-medium">{devCode}</span>
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code">Verification code</Label>
                        <Input
                            id="code"
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
                        <Label htmlFor="password">New password</Label>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm new password</Label>
                        <PasswordInput
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>

                    {error && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        Reset password
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep('email')}
                    >
                        Back
                    </Button>
                </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthShell>
    )
}
