import { UserButton, useAuth } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function Header() {
  const { isSignedIn } = useAuth()
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border shadow-theme">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link to="/" className="text-xl font-bold text-primary hover:opacity-90 transition-opacity">
          Streamline
        </Link>
        <div className="flex-1" />
        {isSignedIn && (
          <nav className="flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">Dashboard</Link>
            <Link to="/workflows" className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">Workflows</Link>
            <Link to="/integrations" className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">Integrations</Link>
            <Link to="/logs" className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">Logs</Link>
          </nav>
        )}
        <div className="flex items-center pl-4 border-l border-border">
          <UserButton afterSignOutUrl="/login" />
        </div>
      </div>
    </header>
  )
}

