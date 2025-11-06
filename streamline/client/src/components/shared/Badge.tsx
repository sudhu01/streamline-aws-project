import { Badge as ShadcnBadge } from '@/components/ui/badge'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md'
  children: ReactNode
}

export default function Badge({ 
  variant = 'default',
  size = 'md',
  className = '', 
  children,
  ...props 
}: BadgeProps) {
  // Map custom variants to shadcn variants
  const shadcnVariant = variant === 'error' ? 'destructive' : variant === 'info' ? 'secondary' : variant === 'default' ? 'default' : 'outline'
  
  // Apply custom colors for success and warning
  const customStyles = variant === 'success' 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : variant === 'warning'
    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : ''
  
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  
  return (
    <ShadcnBadge
      variant={shadcnVariant as 'default' | 'secondary' | 'destructive' | 'outline'}
      className={cn(customStyles, sizeStyles, className)}
      {...props}
    >
      {children}
    </ShadcnBadge>
  )
}
