import { useNavigate } from 'react-router-dom'
import { PlusCircle, Plug, List } from 'lucide-react'

export default function QuickActions() {
  const navigate = useNavigate()
  return (
    <div className="rounded-lg border bg-surface p-4">
      <h3 className="font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => navigate('/workflows')} className="flex items-center justify-center gap-2 px-4 py-3 rounded border hover:border-[color:var(--sl-primary)]">
          <PlusCircle size={18} /> Create New Workflow
        </button>
        <button onClick={() => navigate('/integrations')} className="flex items-center justify-center gap-2 px-4 py-3 rounded border hover:border-[color:var(--sl-primary)]">
          <Plug size={18} /> Add Integration
        </button>
        <button onClick={() => navigate('/logs')} className="flex items-center justify-center gap-2 px-4 py-3 rounded border hover:border-[color:var(--sl-primary)]">
          <List size={18} /> View All Logs
        </button>
      </div>
    </div>
  )
}

