import * as React from 'react'
import type { ViewMode } from '@/components/shared/view-toggle'

const STORAGE_PREFIX = 'acme_data_room_view'

export function useViewMode(context: string, defaultMode: ViewMode = 'grid') {
    const storageKey = `${STORAGE_PREFIX}_${context}`

    const [view, setView] = React.useState<ViewMode>(() => {
        const stored = localStorage.getItem(storageKey)
        return stored === 'list' || stored === 'grid' ? stored : defaultMode
    })

    React.useEffect(() => {
        localStorage.setItem(storageKey, view)
    }, [storageKey, view])

    return { view, setView }
}
