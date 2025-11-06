import { Card as ShadcnCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
  return (
    <ShadcnCard 
      className={cn(
        elevated && 'shadow-lg',
        hover && 'hover:shadow-lg transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </ShadcnCard>
  )
}

// Export shadcn card sub-components for convenience
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
