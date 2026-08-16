import * as React from 'react'
import { AlertTriangle, CalendarDays, Mail, ShieldAlert, Trash2, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/shared/button'
import { formatDate } from '@/utils/format'
import DeleteAccountDialog from '@/components/blocks/Auth/DeleteAccountDialog'
import ChangePassword from './ChangePassword'

export default function Profile() {
    const { user } = useAuth()
    const [deleteOpen, setDeleteOpen] = React.useState(false)

    if (!user) return null

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold">Profile</h1>
                    <p className="text-sm text-muted-foreground">Manage your account details.</p>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-card p-6">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-7" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">{user.name}</p>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5" />
                            {user.email}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            Member since {formatDate(user.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <ChangePassword />

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <ShieldAlert className="size-5" />
                    </div>
                    <div>
                        <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                            <AlertTriangle className="size-4 text-destructive" />
                            Danger zone
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Permanently delete your account, all your data rooms, files, and shared
                            access. This action cannot be undone.
                        </p>
                    </div>
                </div>
                <Button variant="destructive" className="mt-4" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" />
                    Delete account
                </Button>
            </div>

            <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
        </div>
    )
}
