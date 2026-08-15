import { Users } from 'lucide-react'
import type { DataRoom } from '@/types'

type RoomMembersProps = {
    room: DataRoom
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

export default function RoomMembers({ room }: RoomMembersProps) {
    const members = room.users ?? []
    const count = room.userCount ?? members.length

    return (
        <aside className="w-full max-w-xs shrink-0 space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">People</h2>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {count}
                </span>
            </div>
            <ul className="space-y-2">
                {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {initials(member.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {member.id === room.ownerId && (
                            <span className="ml-auto text-xs text-muted-foreground">Owner</span>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    )
}
