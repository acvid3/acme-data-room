import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/shared/input'
import { cn } from '@/utils/cn'

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    id: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ id, className, ...props }, ref) => {
        const [visible, setVisible] = React.useState(false)

        return (
            <div className={cn('relative', className)}>
                <Input
                    ref={ref}
                    id={id}
                    type={visible ? 'text' : 'password'}
                    className="pr-10"
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>
        )
    },
)
PasswordInput.displayName = 'PasswordInput'
