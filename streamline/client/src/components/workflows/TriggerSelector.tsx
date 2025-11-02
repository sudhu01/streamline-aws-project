import { useEffect, useState } from 'react'
import { getTriggerTypes } from '../../services/workflowService'

export default function TriggerSelector({ onSelect }: { onSelect: (type: string) => void }) {
  const [types, setTypes] = useState<Array<{key:string; name:string}>>([])
  useEffect(() => { (async ()=> setTypes(await getTriggerTypes()))() }, [])
  return (
    <div className="space-y-2">
      {types.map(t => (
        <button key={t.key} onClick={()=>onSelect(t.key)} className="w-full text-left px-3 py-2 rounded border hover:border-[color:var(--sl-primary)]">{t.name}</button>
      ))}
    </div>
  )
}

