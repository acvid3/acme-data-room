import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Folder } from '@/types'

type BreadcrumbsProps = {
    roomId: string
    roomName: string
    folderPath: Folder[]
    currentFolderId?: string
}

export default function Breadcrumbs({
    roomId,
    roomName,
    folderPath,
    currentFolderId,
}: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to={`/rooms/${roomId}`} className="font-medium hover:text-foreground">
                {roomName}
            </Link>
            {folderPath.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight className="size-4" />
                    {folder.id === currentFolderId ? (
                        <span className="font-medium text-foreground">{folder.name}</span>
                    ) : (
                        <Link
                            to={`/rooms/${roomId}/folders/${folder.id}`}
                            className="hover:text-foreground"
                        >
                            {folder.name}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    )
}
