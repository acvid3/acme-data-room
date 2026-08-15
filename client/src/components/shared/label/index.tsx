import * as React from 'react'
import { cn } from '@/utils/cn'
import { labelVariants } from './variants'

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = 'Label'

export { Label }
