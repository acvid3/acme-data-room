import { Link } from 'react-router-dom'
import { FolderLock, Share2, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/auth'

type SectionCard = {
    to: string
    title: string
    description: string
    icon: typeof FolderLock
    index: string
}

export default function Dashboard() {
    const { user } = useAuth()

    const sections: SectionCard[] = [
        {
            to: '/rooms',
            title: 'My Data Rooms',
            description: 'Create and manage the data rooms you own.',
            icon: FolderLock,
            index: '01',
        },
        {
            to: '/shared',
            title: 'Shared with me',
            description: 'Browse data rooms others have granted you access to.',
            icon: Share2,
            index: '02',
        },
        {
            to: '/profile',
            title: 'Profile',
            description: 'View your account details and settings.',
            icon: UserRound,
            index: '03',
        },
    ]

    return (
        <div className="space-y-8">
            <div className="max-w-xl">
                <p className="mb-3 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> workspace
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                    Welcome{user ? `, ${user.name}` : ''}
                </h1>
                <p className="mt-1.5 text-muted-foreground">Where would you like to go?</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {sections.map((section) => (
                    <Link
                        key={section.to}
                        to={section.to}
                        className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <section.icon className="size-6" />
                            </div>
                            <span className="font-mono text-xs text-border transition-colors group-hover:text-gold">
                                {section.index}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-medium tracking-tight group-hover:text-primary">
                                {section.title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
