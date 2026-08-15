import { Link } from 'react-router-dom'
import { FolderLock, Share2, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/auth'

type SectionCard = {
    to: string
    title: string
    description: string
    icon: typeof FolderLock
}

export default function Dashboard() {
    const { user } = useAuth()

    const sections: SectionCard[] = [
        {
            to: '/rooms',
            title: 'My Data Rooms',
            description: 'Create and manage the data rooms you own.',
            icon: FolderLock,
        },
        {
            to: '/shared',
            title: 'Shared with me',
            description: 'Browse data rooms others have granted you access to.',
            icon: Share2,
        },
        {
            to: '/profile',
            title: 'Profile',
            description: 'View your account details and settings.',
            icon: UserRound,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Welcome{user ? `, ${user.name}` : ''}</h1>
                <p className="text-sm text-muted-foreground">Where would you like to go?</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {sections.map((section) => (
                    <Link
                        key={section.to}
                        to={section.to}
                        className="group flex flex-col items-start gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent"
                    >
                        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <section.icon className="size-6" />
                        </div>
                        <div>
                            <h2 className="font-medium group-hover:text-primary">{section.title}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
