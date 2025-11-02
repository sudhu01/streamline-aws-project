import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
  hover?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  elevated = false,
  hover = false,
  ...props 
}: CardProps) {
  const baseStyles = 'rounded-xl border bg-surface p-6 transition-all duration-200'
  const elevatedStyles = elevated ? 'bg-surface-elevated shadow-theme-lg' : 'shadow-theme'
  const hoverStyles = hover ? 'hover:shadow-theme-lg hover:border-[color:var(--sl-primary)] cursor-pointer' : ''
  
  return (
    <div 
      className={`${baseStyles} ${elevatedStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

