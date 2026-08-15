import * as React from 'react'

export type DraggedItem =
    | { type: 'folder'; id: string; name: string }
    | { type: 'file'; id: string; name: string }

type DndContextValue = {
    dragged: DraggedItem | null
    setDragged: (item: DraggedItem | null) => void
}

const DndContext = React.createContext<DndContextValue>({
    dragged: null,
    setDragged: () => undefined,
})

export function DndProvider({ children }: { children: React.ReactNode }) {
    const [dragged, setDragged] = React.useState<DraggedItem | null>(null)

    const value = React.useMemo(() => ({ dragged, setDragged }), [dragged])

    return <DndContext.Provider value={value}>{children}</DndContext.Provider>
}

export function useDnd(): DndContextValue {
    return React.useContext(DndContext)
}
