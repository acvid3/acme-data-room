import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'

type CodeStepProps = {
    email: string
    devCode?: string
    submitting: boolean
    error: string | null
    onCodeChange: (code: string) => void
    onSubmit: () => void
    onBack: () => void
}

export default function CodeStep({
    email,
    devCode,
    submitting,
    error,
    onCodeChange,
    onSubmit,
    onBack,
}: CodeStepProps) {
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        onSubmit()
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="relative space-y-4 overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/40"
        >
            <div className="space-y-1 text-center">
                <p className="font-medium">Enter the code</p>
                <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to <span className="font-medium">{email}</span>
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
                    onChange={(event) => onCodeChange(event.target.value)}
                    className="text-center font-mono text-lg tracking-widest"
                    autoFocus
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
                Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
                Back
            </Button>
        </form>
    )
}
