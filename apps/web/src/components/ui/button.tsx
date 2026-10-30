import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20',
        destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/30',
        outline: 'border border-[#2e2e40] bg-transparent text-[#ededed] hover:bg-[#181824] hover:border-indigo-500/50',
        secondary: 'bg-[#1e1e2d] text-[#ededed] hover:bg-[#28283d] border border-[#2e2e42]',
        ghost: 'hover:bg-[#181824] text-[#a1a1aa] hover:text-white',
        safe: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
