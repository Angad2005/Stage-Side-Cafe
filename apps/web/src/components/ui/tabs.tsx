import React, { createContext, useContext, useState } from 'react'
import { cn } from '../../lib/utils'

interface TabsContextType {
  value: string
  onValueChange: (val: string) => void
}

const TabsContext = createContext<TabsContextType>({
  value: '',
  onValueChange: () => {},
})

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = (val: string) => {
    if (controlledValue === undefined) setInternalValue(val)
    onValueChange?.(val)
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-[#161622] p-1 text-[#8f90a2] border border-[#242436]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(TabsContext)
  const isSelected = context.value === value

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isSelected
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-[#8f90a2] hover:text-[#ededed] hover:bg-[#1f1f30]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(TabsContext)
  if (context.value !== value) return null

  return (
    <div className={cn('mt-4 focus-visible:outline-none', className)} {...props}>
      {children}
    </div>
  )
}
