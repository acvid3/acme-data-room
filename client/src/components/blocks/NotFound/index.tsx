import { Link } from 'react-router-dom'
import { FolderSearch } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
            <FolderSearch className="size-10 text-muted-foreground" />
            <h1 className="text-lg font-medium">Page not found</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
                Go to Data Rooms
            </Link>
        </div>
    )
}
