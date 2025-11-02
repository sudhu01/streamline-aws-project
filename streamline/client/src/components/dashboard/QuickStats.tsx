import StatsCard from './StatsCard'
import { useDashboard } from '../../hooks/useDashboard'
import { Workflow, Play, ListChecks, Percent } from 'lucide-react'

export default function QuickStats() {
  const { stats, isLoading, error } = useDashboard()

  if (error) {
    return (
      <div className="rounded-lg border bg-surface p-4">
        <div className="mb-2">Failed to load stats.</div>
        <button className="px-3 py-1 rounded bg-[color:var(--sl-primary)] text-white" onClick={() => location.reload()}>Retry</button>
      </div>
    )
  }

  const items = [
    { title: 'Total Workflows', value: stats?.totalWorkflows ?? 0, icon: <Workflow size={18} /> },
    { title: 'Active Workflows', value: stats?.activeWorkflows ?? 0, icon: <Play size={18} /> },
    { title: 'Total Executions', value: stats?.totalExecutions ?? 0, icon: <ListChecks size={18} /> },
    { title: 'Success Rate', value: `${stats?.successRate ?? 0}%`, icon: <Percent size={18} /> },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-surface animate-pulse" />
          ))
        : items.map((it) => (
            <StatsCard key={it.title} title={it.title} value={it.value as any} icon={it.icon} />
          ))}
    </div>
  )
}

