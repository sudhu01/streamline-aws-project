import { useEffect, useState } from 'react'
import { getActionTypes } from '../../services/workflowService'

export default function ActionConfigurator({ type, onChange }: { type: string; onChange: (data: any) => void }) {
  const [form, setForm] = useState<any>({})
  useEffect(()=>{ onChange(form) }, [form, onChange])
  if (!type) return <div className="text-sm opacity-70">Select an action type</div>
  return (
    <div className="space-y-2">
      <div className="text-sm">Config for: <span className="font-mono">{type}</span></div>
      <input className="w-full border rounded px-2 py-1 bg-background" placeholder="Name" value={form.name||''} onChange={(e)=>setForm({...form, name: e.target.value})} />
      <textarea className="w-full border rounded px-2 py-1 bg-background" placeholder="JSON config" value={form.json||''} onChange={(e)=>setForm({...form, json: e.target.value})} />
    </div>
  )
}

