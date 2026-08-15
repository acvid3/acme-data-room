import * as React from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'

type ShareLinkProps = {
    url: string
    onRevoke: () => void
}

export default function ShareLink({ url, onRevoke }: ShareLinkProps) {
    const [copied, setCopied] = React.useState(false)

    const copy = async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
                <Link2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Anyone with the link</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRevoke}
                    className="ml-auto h-7 text-destructive hover:text-destructive"
                >
                    Remove
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Input value={url} readOnly className="bg-background text-xs" />
                <Button size="sm" onClick={copy} className="shrink-0">
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </div>
    )
}
