import { Link, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'

export default function FileViewer() {
    const { fileId } = useParams<{ fileId: string }>()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/dashboard" className="hover:text-foreground">
                    Data Rooms
                </Link>
                <span>/</span>
                <span className="text-foreground">File {fileId?.slice(0, 8)}</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
                <FileText className="size-10 text-muted-foreground" />
                <h1 className="text-lg font-medium">File preview coming soon</h1>
                <p className="max-w-sm text-sm text-muted-foreground">
                    PDF preview, download, rename, and move actions will live here.
                </p>
            </div>
        </div>
    )
}
