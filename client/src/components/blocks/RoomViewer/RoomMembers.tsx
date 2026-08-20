import { Users } from 'lucide-react'
import type { DataRoom } from '@/types'
import MemberList from '@/components/shared/member-list'

type RoomMembersProps = {
    room: DataRoom
}

export default function RoomMembers({ room }: RoomMembersProps) {
    const members = room.users ?? []
    const count = room.userCount ?? members.length

    return (
        <aside className="w-full min-w-0 shrink-0 space-y-4 rounded-lg border bg-card p-4 md:max-w-xs">
            <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">People</h2>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {count}
                </span>
            </div>
            <MemberList title="Active now" members={room.activeUsers ?? []} highlight />
            <MemberList title="Invited" members={members} />
        </aside>
    )
}
