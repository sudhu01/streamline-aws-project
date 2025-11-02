import { useState } from 'react'

export default function TestConnectionModal({ open, onClose, onTest }: { open: boolean; onClose: ()=>void; onTest: ()=>Promise<{ status:number; body:any; ms:number }> }) {
  const [result, setResult] = useState<any>(null)
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-surface rounded-lg border w-full max-w-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Test Connection</div>
          <button onClick={onClose} className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Close</button>
        </div>
        <button onClick={async()=>{ const t0 = performance.now(); const r = await onTest(); setResult({ ...r, ms: Math.round(performance.now()-t0) }) }} className="px-3 py-1 rounded bg-[color:var(--sl-primary)] text-white">Run Test</button>
        {result && (
          <div className="mt-3 text-sm space-y-1">
            <div>Status: <span className={result.status===200? 'text-green-600':'text-red-600'}>{result.status}</span></div>
            <div>Time: {result.ms} ms</div>
            <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-60">{JSON.stringify(result.body, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

