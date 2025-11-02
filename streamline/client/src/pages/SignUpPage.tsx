import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-surface">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(128,153,249,0.1),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(101,118,243,0.1),transparent_50%)]" />
      <div className="relative w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <div className="text-4xl font-bold text-primary mb-2">Streamline</div>
          <p className="text-text-secondary">No-code workflow automation</p>
        </div>
        <div className="rounded-2xl bg-surface-elevated border border-border p-8 shadow-theme-lg backdrop-blur-sm">
          <SignUp
            appearance={{ 
              variables: { colorPrimary: 'var(--sl-primary)' },
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent',
              }
            }}
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
            redirectUrl="/dashboard"
          />
        </div>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  )
}
