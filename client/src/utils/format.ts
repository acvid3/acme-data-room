export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function formatType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF'
    const subtype = mimeType.split('/')[1]
    return subtype ? subtype.toUpperCase() : mimeType
}

export function formatStats(stats: { folders: number; files: number; sizeBytes: number }): string {
    return [
        `${stats.folders} ${stats.folders === 1 ? 'folder' : 'folders'}`,
        `${stats.files} ${stats.files === 1 ? 'file' : 'files'}`,
        formatSize(stats.sizeBytes),
    ].join(' · ')
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}
