import React from 'react'
import { cn } from '../../lib/utils'

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#2e2e42] bg-[#1a1a28]', className)}
      {...props}
    />
  )
}

export function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  if (!src) return null
  return <img src={src} alt={alt || 'Avatar'} className={cn('aspect-square h-full w-full object-cover', className)} />
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-[#1e1e2f] text-xs font-bold text-indigo-300', className)}>
      {children}
    </div>
  )
}

export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      className={cn(
        'shrink-0 bg-[#252538]',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
    />
  )
}
