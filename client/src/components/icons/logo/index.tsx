import { FolderLock } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Logo({ className }: { className?: string }) {
    return <FolderLock className={cn('text-primary', className)} />
}
