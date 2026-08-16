import * as React from 'react'
import { cn } from '@/utils/cn'
import type { ViewMode } from '@/components/shared/view-toggle'

type CardGridProps = {
    children: React.ReactNode
    view?: ViewMode
    className?: string
}

const MAX_VH = 60
const GRID_GAP = 16
const LIST_GAP = 8

export function CardGrid({ children, view = 'grid', className }: CardGridProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const innerRef = React.useRef<HTMLDivElement>(null)
    const [maxHeight, setMaxHeight] = React.useState<number | undefined>(undefined)

    React.useEffect(() => {
        const container = containerRef.current
        const inner = innerRef.current
        if (!container || !inner) return

        const compute = () => {
            const firstItem = container.querySelector<HTMLElement>(':scope > div > *')
            if (!firstItem) return
            const gap = view === 'grid' ? GRID_GAP : LIST_GAP
            const rowHeight = firstItem.offsetHeight + gap
            const available = window.innerHeight * (MAX_VH / 100)
            const rows = Math.max(1, Math.floor(available / rowHeight))
            setMaxHeight(rows * rowHeight - gap)
        }

        compute()
        window.addEventListener('resize', compute)
        const observer = new ResizeObserver(compute)
        observer.observe(inner)
        return () => {
            window.removeEventListener('resize', compute)
            observer.disconnect()
        }
    }, [view])

    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let rafId = 0

        const handleDragOver = (event: DragEvent) => {
            const rect = container.getBoundingClientRect()
            const cursorY = event.clientY - rect.top
            const edge = 80
            const scrollStep = 12

            cancelAnimationFrame(rafId)

            const step = () => {
                if (cursorY < edge) {
                    container.scrollTop -= scrollStep
                    rafId = requestAnimationFrame(step)
                } else if (cursorY > rect.height - edge) {
                    container.scrollTop += scrollStep
                    rafId = requestAnimationFrame(step)
                }
            }

            if (cursorY < edge || cursorY > rect.height - edge) {
                rafId = requestAnimationFrame(step)
            }
        }

        const stopAutoScroll = () => cancelAnimationFrame(rafId)

        container.addEventListener('dragover', handleDragOver)
        container.addEventListener('dragleave', stopAutoScroll)
        container.addEventListener('drop', stopAutoScroll)
        return () => {
            container.removeEventListener('dragover', handleDragOver)
            container.removeEventListener('dragleave', stopAutoScroll)
            container.removeEventListener('drop', stopAutoScroll)
            cancelAnimationFrame(rafId)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn('scrollbar-hidden min-h-0 overflow-y-auto pr-1', className)}
            style={maxHeight !== undefined ? { maxHeight } : undefined}
        >
            <div
                ref={innerRef}
                className={cn(
                    view === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'
                        : 'flex flex-col gap-2',
                )}
            >
                {children}
            </div>
        </div>
    )
}
