import { useState } from 'react'

export default function TestWorkflowModal({ open, onClose, onRun }: { open: boolean; onClose: ()=>void; onRun: (input:any)=>Promise<any> }) {
  const [input, setInput] = useState('{}')
  const [result, setResult] = useState<any>(null)
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-surface rounded-lg border w-full max-w-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Test Workflow</div>
          <button onClick={onClose} className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Close</button>
        </div>
        <textarea className="w-full h-32 border rounded px-2 py-1 bg-background" value={input} onChange={(e)=>setInput(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <button onClick={async()=>{ const res = await onRun(safeParse(input)); setResult(res) }} className="px-3 py-1 rounded bg-[color:var(--sl-primary)] text-white">Run Test</button>
        </div>
        {result && (
          <pre className="mt-3 text-xs bg-background p-2 rounded border overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}

function safeParse(s: string) {
  try { return JSON.parse(s) } catch { return {} }
}

