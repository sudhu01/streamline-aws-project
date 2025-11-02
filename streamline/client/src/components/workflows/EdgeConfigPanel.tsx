import { Trash2 } from 'lucide-react'
import { type Edge } from 'reactflow'

interface EdgeConfigPanelProps {
  edge: Edge | null
  onDelete: (edgeId: string) => void
  sourceNodeName?: string
  targetNodeName?: string
}

export default function EdgeConfigPanel({ edge, onDelete, sourceNodeName, targetNodeName }: EdgeConfigPanelProps) {
  if (!edge) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-border">
        <div className="text-sm font-semibold">Connection</div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-text-secondary mb-3">Details</div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-text-secondary">From:</span>{' '}
            <span className="font-medium text-text-primary">{sourceNodeName || edge.source}</span>
          </div>
          <div>
            <span className="text-text-secondary">To:</span>{' '}
            <span className="font-medium text-text-primary">{targetNodeName || edge.target}</span>
          </div>
          <div className="text-xs text-text-secondary mt-3">
            This connection passes data from the output of the source node to the input of the target node.
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete this connection?`)) {
              onDelete(edge.id)
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-transparent border-2 border-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} className="text-red-500" />
          <span className="text-red-500 font-medium">Delete Connection</span>
        </button>
      </div>
    </div>
  )
}

