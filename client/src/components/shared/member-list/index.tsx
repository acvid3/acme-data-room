import { Users } from 'lucide-react'
import type { RoomUser } from '@/types'

type MemberListProps = {
    title: string
    members: RoomUser[]
    highlight?: boolean
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

export default function MemberList({ title, members, highlight }: MemberListProps) {
    if (members.length === 0) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Users
                    className={highlight ? 'size-4 text-primary' : 'size-4 text-muted-foreground'}
                />
                <h3 className="text-sm font-medium">{title}</h3>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {members.length}
                </span>
            </div>
            <ul className="space-y-2">
                {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2.5">
                        <div
                            className={
                                highlight
                                    ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground'
                                    : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'
                            }
                        >
                            {initials(member.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {highlight && (
                            <span className="ml-auto flex items-center gap-1 text-xs text-primary">
                                <span className="size-1.5 rounded-full bg-primary" />
                                Active now
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
