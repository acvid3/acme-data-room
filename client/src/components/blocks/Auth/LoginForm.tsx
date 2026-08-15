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
import CodeStep from './CodeStep'

export default function LoginForm() {
    const { requestLoginCode, confirmLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [step, setStep] = React.useState<'credentials' | 'code'>('credentials')
    const [devCode, setDevCode] = React.useState<string | undefined>(undefined)
    const [code, setCode] = React.useState('')
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    const handleCredentials = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            const challenge = await requestLoginCode(email, password)
            setDevCode(challenge.code)
            setStep('code')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCode = async () => {
        setError(null)
        setSubmitting(true)
        try {
            await confirmLogin(email, code)
            navigate('/dashboard', { replace: true })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Invalid code. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthShell>
            {step === 'credentials' ? (
                <form
                    onSubmit={handleCredentials}
                    className="space-y-4 rounded-lg border bg-card p-6 shadow-sm"
                >
                    <p className="text-center text-sm text-muted-foreground">
                        Sign in to access your data rooms
                    </p>
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
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {error && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        Continue
                    </Button>
                </form>
            ) : (
                <CodeStep
                    email={email}
                    devCode={devCode}
                    submitting={submitting}
                    error={error}
                    onCodeChange={setCode}
                    onSubmit={handleCode}
                    onBack={() => setStep('credentials')}
                />
            )}

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                    Create one
                </Link>
            </p>
        </AuthShell>
    )
}
