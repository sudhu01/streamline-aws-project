import { useDashboard } from '../../hooks/useDashboard'
import { Link } from 'react-router-dom'

export default function RecentWorkflows() {
  const { recentWorkflows, isLoading, error } = useDashboard()

  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Recent Workflows</h3>
        <Link to="/workflows" className="text-sm text-[color:var(--sl-primary)] hover:opacity-80">View All</Link>
      </div>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded border animate-pulse" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-600">Failed to load workflows.</div>}
      {!isLoading && !error && (
        <div className="divide-y">
          {Array.isArray(recentWorkflows) && recentWorkflows.length > 0 ? (
            recentWorkflows.map(w => (
              <div key={w.id} className="py-2 flex items-center justify-between">
                <Link to={`/workflows/${w.id}`} className="hover:underline">{w.name}</Link>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <span className={`px-2 py-0.5 rounded-full border ${w.status === 'Active' ? 'border-green-500 text-green-700' : 'border-slate-400'}`}>{w.status}</span>
                  <span>{w.successRate != null ? `${w.successRate}%` : '-'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm opacity-70">No workflows yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

