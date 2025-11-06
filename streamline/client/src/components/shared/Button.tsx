import { Button as ShadcnButton } from '@/components/ui/button'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  // Map old variants to shadcn variants
  const shadcnVariant = variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : variant
  
  // Map old sizes to shadcn sizes
  const shadcnSize = size === 'md' ? 'default' : size
  
  return (
    <ShadcnButton
      variant={shadcnVariant as 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'}
      size={shadcnSize as 'default' | 'sm' | 'lg'}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </ShadcnButton>
  )
}
