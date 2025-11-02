import { useEffect, useState } from 'react'
import { disconnectIntegration, getConnectedIntegrations, testConnection } from '../../services/integrationService'
import IntegrationCard from './IntegrationCard'

export default function ConnectedIntegrations() {
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{ (async()=> setItems(await getConnectedIntegrations()))() }, [])
  return (
    <div>
      {items.length === 0 && <div className="text-sm opacity-70">No integrations connected yet</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <IntegrationCard key={it.id} item={{ ...it, name: it.name, description: it.type, connected: true }} onManage={()=>alert('Manage (stub)')} onDisconnect={()=>disconnectIntegration(it.id).then(()=>location.reload())} />
        ))}
      </div>
    </div>
  )
}

