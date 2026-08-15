import * as React from 'react'

export type DialogContextValue = {
    open: boolean
    setOpen: (open: boolean) => void
}

export const DialogContext = React.createContext<DialogContextValue>({
    open: false,
    setOpen: () => undefined,
})

export function useDialog() {
    return React.useContext(DialogContext)
}
