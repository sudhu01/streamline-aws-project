import { useQuery } from '@tanstack/react-query'
import { getRecentLogs } from '../../services/dashboardService'
import { useState } from 'react'

export default function RecentExecutions() {
  const [status, setStatus] = useState<'all' | 'Success' | 'Failed' | 'Running'>('all')
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard','logs', status],
    queryFn: () => getRecentLogs(10, status),
    refetchInterval: 30000,
  })

  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Recent Executions</h3>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded px-2 py-1 bg-surface text-text-primary">
          <option value="all">All</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Running">Running</option>
        </select>
      </div>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded border animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          Failed to load executions.
          <button className="px-2 py-0.5 rounded bg-[color:var(--sl-primary)] text-white" onClick={() => refetch()}>Retry</button>
        </div>
      )}
      {!isLoading && !error && (
        <div className="max-h-80 overflow-auto divide-y">
          {Array.isArray(data) && data.length > 0 ? (
            data.map((ex) => (
              <div key={ex.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{ex.workflow.name}</div>
                  <div className="text-xs opacity-70">{new Date(ex.startedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-2 py-0.5 rounded-full border ${ex.status === 'Success' ? 'border-green-500 text-green-700' : ex.status === 'Failed' ? 'border-red-500 text-red-700' : 'border-yellow-500 text-yellow-700'}`}>{ex.status}</span>
                  <span>{ex.durationMs ? `${(ex.durationMs/1000).toFixed(1)}s` : '-'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm opacity-70">No executions yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

