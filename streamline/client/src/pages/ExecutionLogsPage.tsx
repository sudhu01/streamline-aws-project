import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { exportLogsCsv, exportLogsJson, getLog, getLogStats, listLogs, retryLog } from '../services/logsService'
import LogsTable from '../components/logs/LogsTable'
import ExecutionDetailsModal from '../components/logs/ExecutionDetailsModal'

export default function ExecutionLogsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [auto, setAuto] = useState(false)
  const [selectedId, setSelectedId] = useState<string|undefined>()
  const { data, isLoading, refetch } = useQuery({ queryKey: ['logs', { q, status, page, pageSize }], queryFn: () => listLogs({ q, status, page, pageSize }), refetchInterval: auto ? 10000 : false })
  const total = data?.total || 0
  const items = useMemo(()=> (data?.items || []).map(i => ({ ...i, workflowName: i.workflow?.name })), [data])

  const [detail, setDetail] = useState<any>(null)
  useEffect(()=>{ (async()=>{ if (!selectedId) return; setDetail(await getLog(selectedId)) })() }, [selectedId])

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto pt-24">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Execution Logs</h1>
        <button onClick={()=>refetch()} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Refresh</button>
        <button onClick={async()=>downloadBlob(await exportLogsCsv(), 'logs.csv')} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Export CSV</button>
        <button onClick={async()=>downloadJson(await exportLogsJson(), 'logs.json')} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Export JSON</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by workflow" className="border rounded px-3 py-2 bg-background" />
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1) }} className="border rounded px-2 py-2 bg-surface text-text-primary">
          <option value="all">All</option>
          <option>Success</option>
          <option>Failed</option>
          <option>Running</option>
          <option>Cancelled</option>
        </select>
        <label className="flex items-center gap-2 ml-auto text-sm">
          <input type="checkbox" checked={auto} onChange={(e)=>setAuto(e.target.checked)} /> Auto-refresh (10s)
        </label>
      </div>
      {isLoading ? (
        <div className="h-24 rounded border animate-pulse" />
      ) : items.length === 0 ? (
        <div className="rounded border p-6 bg-surface text-center">No execution logs yet</div>
      ) : (
        <LogsTable data={items} onOpen={setSelectedId} />
      )}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span>Rows per page:</span>
        <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value)); setPage(1) }} className="border rounded px-2 py-1 bg-surface text-text-primary">
          {[10,25,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="ml-auto">{(page-1)*pageSize+1}-{Math.min(page*pageSize,total)} of {total}</div>
        <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 rounded border">Prev</button>
        <button disabled={page*pageSize>=total} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 rounded border">Next</button>
      </div>

      <ExecutionDetailsModal open={!!selectedId && !!detail} data={detail || {}} onClose={()=>{ setSelectedId(undefined); setDetail(null) }} onRetry={async()=>{ if (!selectedId) return; await retryLog(selectedId); setSelectedId(undefined); setDetail(null); refetch() }} />
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename)
}

