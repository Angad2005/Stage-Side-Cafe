import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'safe' | 'suspicious' | 'unsafe' | 'secondary' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    safe: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    suspicious: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    unsafe: 'bg-red-500/20 text-red-300 border-red-500/30',
    secondary: 'bg-[#1f1f2e] text-[#a0a0b2] border-[#2e2e42]',
    outline: 'border-[#333346] text-[#dedee8]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
