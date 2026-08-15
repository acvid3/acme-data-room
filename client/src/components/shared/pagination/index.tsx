import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/shared/button'
import { cn } from '@/utils/cn'

type PaginationProps = {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    className?: string
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            <p className="text-sm text-muted-foreground">
                {total === 0 ? 'No items' : `${from}–${to} of ${total}`}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                    {page} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    )
}
