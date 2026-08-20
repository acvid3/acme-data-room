import { FileSearch, FolderLock, LayoutGrid, Link2, Radio, Share2, Upload } from 'lucide-react'

const featureGroups = [
    {
        icon: FolderLock,
        title: 'Organized data rooms',
        points: [
            'Nest folders to any depth with breadcrumb navigation',
            'Rename, move, and delete with subtree-safe guards',
            'Room, folder, and file counts always in view',
        ],
    },
    {
        icon: Upload,
        title: 'Secure documents',
        points: [
            'Multi-file upload with drag-and-drop and per-file progress',
            'Preview PDFs, images, and video right in the browser',
            'Same-name uploads get automatic suffixes — no data loss',
        ],
    },
    {
        icon: Share2,
        title: 'Controlled sharing',
        points: [
            'Share a room, folder, or single file',
            'Per-user read-only grants or revocable public links',
            'Guests can read, never modify',
        ],
    },
    {
        icon: FileSearch,
        title: 'Search everywhere',
        points: [
            'Case-insensitive search across folder and file names',
            'Server-side results for owned rooms',
            'Instant client-side filtering on shared links',
        ],
    },
    {
        icon: Radio,
        title: 'Live presence',
        points: [
            'See who is viewing a room right now',
            'In-memory presence with a short expiry',
            'Keep coordination simple during due diligence',
        ],
    },
    {
        icon: LayoutGrid,
        title: 'Listing that adapts',
        points: [
            'Grid or list view, remembered per room',
            'Sort by name, updated, or size',
            'Filter, paginate, and drag to move items',
        ],
    },
]

export default function Features() {
    return (
        <>
            <section className="max-w-3xl">
                <p className="mb-4 font-mono text-xs uppercase tracking-eyebrow text-gold">
                    <span className="text-primary">/</span> product
                </p>
                <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                    Everything a data room needs
                </h1>
                <p className="mt-4 text-balance text-lg text-muted-foreground">
                    Organized, secure, and shareable — Acme Data Room is built for the document
                    lifecycle of a real deal.
                </p>
            </section>

            <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featureGroups.map((group, index) => (
                    <div
                        key={group.title}
                        className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <group.icon className="size-5" />
                            </div>
                            <span className="font-mono text-xs text-border transition-colors group-hover:text-gold">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </div>
                        <h2 className="mt-5 font-display text-lg font-medium tracking-tight">
                            {group.title}
                        </h2>
                        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                            {group.points.map((point) => (
                                <li key={point} className="flex items-start gap-2">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <section className="mt-12 flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Link2 className="size-5" />
                    </div>
                    <div>
                        <h2 className="font-display text-lg font-medium tracking-tight">
                            Public links
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Anyone with a share link and an account can drill into a shared room —
                            read-only, with breadcrumbs and search.
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}
