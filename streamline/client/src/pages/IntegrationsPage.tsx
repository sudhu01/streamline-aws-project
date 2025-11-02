import { useState } from 'react'
import AvailableIntegrations from '../components/integrations/AvailableIntegrations'
import ConnectedIntegrations from '../components/integrations/ConnectedIntegrations'
import ManageAPIKeysCard from '../components/integrations/ManageAPIKeysCard'
import ManageWebhooksCard from '../components/integrations/ManageWebhooksCard'
import ManagePollingCard from '../components/integrations/ManagePollingCard'

export default function IntegrationsPage() {
  const [tab, setTab] = useState<'available'|'connected'>('available')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  return (
    <div className="px-4 py-6 max-w-6xl mx-auto pt-24">
      <h1 className="text-2xl font-bold mb-4">Integrations</h1>
      <div className="flex gap-3 items-center mb-4">
        <button onClick={()=>setTab('available')} className={`px-3 py-1.5 rounded border ${tab==='available'?'border-[color:var(--sl-primary)]':''}`}>Available</button>
        <button onClick={()=>setTab('connected')} className={`px-3 py-1.5 rounded border ${tab==='connected'?'border-[color:var(--sl-primary)]':''}`}>Connected</button>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search" className="ml-auto border rounded px-3 py-2 bg-background" />
        <select 
          value={cat} 
          onChange={(e)=>setCat(e.target.value)} 
          className="border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary appearance-none cursor-pointer"
          style={{ colorScheme: 'dark' }}
        >
          <option value="All">All</option>
          <option value="Communication">Communication</option>
          <option value="Data">Data</option>
          <option value="Storage">Storage</option>
          <option value="Productivity">Productivity</option>
          <option value="Custom">Custom</option>
        </select>
      </div>
      {tab === 'available' && <AvailableIntegrations category={cat} search={q} />}
      {tab === 'connected' && (
        <div className="space-y-6">
          <ManageAPIKeysCard />
          <ManageWebhooksCard />
          <ManagePollingCard />
        </div>
      )}
    </div>
  )
}

