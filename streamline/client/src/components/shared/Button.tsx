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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-[color:var(--sl-primary)] text-white hover:bg-[color:var(--sl-primary-hover)] focus:ring-[color:var(--sl-primary)] shadow-theme',
    secondary: 'bg-surface-elevated text-text-primary hover:bg-surface border border-border',
    outline: 'border-2 border-border text-text-primary hover:border-[color:var(--sl-primary)] hover:text-[color:var(--sl-primary)]',
    ghost: 'text-text-primary hover:bg-surface border border-transparent',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

