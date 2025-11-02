import type { HTMLAttributes, ReactNode } from 'react'

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
  const baseStyles = 'inline-flex items-center rounded-full font-medium'
  
  const variants = {
    default: 'bg-surface-elevated text-text-primary border border-border',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }
  
  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

