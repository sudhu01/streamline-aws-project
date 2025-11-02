import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--sl-primary)',
        background: 'var(--sl-background)',
        surface: 'var(--sl-surface)',
        'surface-elevated': 'var(--sl-surface-elevated)',
        text: {
          primary: 'var(--sl-text-primary)',
          secondary: 'var(--sl-text-secondary)'
        },
        border: 'var(--sl-border)',
        success: 'var(--sl-success)',
        error: 'var(--sl-error)',
        warning: 'var(--sl-warning)',
      },
      boxShadow: {
        'theme': '0 4px 6px -1px var(--sl-shadow), 0 2px 4px -1px var(--sl-shadow)',
        'theme-lg': '0 10px 15px -3px var(--sl-shadow), 0 4px 6px -2px var(--sl-shadow)',
      }
    }
  },
  plugins: []
} satisfies Config


