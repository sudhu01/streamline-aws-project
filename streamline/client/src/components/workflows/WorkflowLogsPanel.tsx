import { useEffect, useRef } from 'react'
import { IconCheck, IconX, IconClock, IconLoader } from '@tabler/icons-react'

interface LogEntry {
  id: string
  timestamp: Date
  nodeId?: string
  nodeName?: string
  type: 'trigger' | 'node' | 'error' | 'success' | 'info'
  message: string
  data?: any
  input?: any
  output?: any
}

interface WorkflowLogsPanelProps {
  logs: LogEntry[]
  isRunning: boolean
}

export default function WorkflowLogsPanel({ logs, isRunning }: WorkflowLogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'trigger':
        return <IconClock size={14} className="text-blue-400" />
      case 'node':
        return <IconLoader size={14} className="text-yellow-400 animate-spin" />
      case 'success':
        return <IconCheck size={14} className="text-green-400" />
      case 'error':
        return <IconX size={14} className="text-red-400" />
      default:
        return <IconClock size={14} className="text-gray-400" />
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="h-64 border-t border-border bg-surface flex flex-col">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="font-semibold text-sm">Execution Logs</div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <IconLoader size={14} className="animate-spin" />
            <span>Running...</span>
          </div>
        )}
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-text-secondary text-center py-8">
            No logs yet. Click "Test" to run the workflow.
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className="flex gap-3 items-start pb-2 border-b border-border/50 last:border-0"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getLogIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-secondary">{formatTimestamp(log.timestamp)}</span>
                  {log.nodeName && (
                    <span className="text-blue-400 font-semibold">[{log.nodeName}]</span>
                  )}
                  <span className={`${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'trigger' ? 'text-blue-400' :
                    'text-text-primary'
                  }`}>
                    {log.message}
                  </span>
                </div>
                {log.input && (
                  <div className="mt-1 pl-4 border-l-2 border-blue-500/30">
                    <div className="text-blue-400 text-xs mb-1">Input:</div>
                    <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                      {typeof log.input === 'object' ? JSON.stringify(log.input, null, 2) : String(log.input)}
                    </pre>
                  </div>
                )}
                {(() => {
                  // Check if output exists and is displayable
                  if (log.output === null || log.output === undefined) return null
                  
                  // For objects, check if they have keys (not empty)
                  if (typeof log.output === 'object') {
                    if (Array.isArray(log.output)) {
                      // Arrays are valid if they have items
                      if (log.output.length === 0) return null
                    } else {
                      // Objects are valid if they have keys
                      if (Object.keys(log.output).length === 0) return null
                    }
                  }
                  
                  // For strings, check if they're not empty
                  if (typeof log.output === 'string' && log.output.trim() === '') return null
                  
                  return (
                    <div className="mt-1 pl-4 border-l-2 border-green-500/30">
                      <div className="text-green-400 text-xs mb-1">Output:</div>
                      <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                        {typeof log.output === 'object' ? JSON.stringify(log.output, null, 2) : String(log.output)}
                      </pre>
                    </div>
                  )
                })()}
                {log.data && (
                  <div className="mt-1 pl-4 border-l-2 border-yellow-500/30">
                    <div className="text-yellow-400 text-xs mb-1">Data:</div>
                    <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                      {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

