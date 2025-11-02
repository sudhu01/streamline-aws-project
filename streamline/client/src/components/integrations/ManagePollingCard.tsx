import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { X } from 'lucide-react'

export default function ManagePollingCard() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    loadPollingConfigs()
  }, [])

  const loadPollingConfigs = async () => {
    try {
      const res = await api.get('/api/integrations/connected')
      const integrations = res.data || []
      const pollingIntegrations = integrations.filter((int: any) => {
        let config = int.config || {}
        if (!config || Object.keys(config).length === 0) {
          try {
            config = JSON.parse(int.configEnc || '{}')
          } catch {
            return false
          }
        }
        return config.connectionMode === 'polling' || config.pollingEnabled
      })
      setItems(pollingIntegrations)
    } catch (error) {
      console.error('Failed to load polling configs:', error)
    }
  }

  const handleDeletePolling = async (id: string) => {
    if (!confirm('Delete this polling configuration?')) return
    
    try {
      await api.delete(`/api/integrations/${id}`)
      loadPollingConfigs()
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to delete polling configuration')
    }
  }

  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Polling Configurations</h3>
      </div>

      {items.length === 0 && (
        <div className="text-sm text-text-secondary">No polling configurations</div>
      )}

      <div className="divide-y divide-border">
        {items.map((item: any) => {
          let pollingEnabled = false
          let botTokenMasked = ''
          let config = item.config || {}
          if (!config || Object.keys(config).length === 0) {
            try {
              config = JSON.parse(item.configEnc || '{}')
            } catch {}
          }
          pollingEnabled = config.pollingEnabled || false
          const token = config.botToken || ''
          botTokenMasked = token ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}` : 'Not configured'

          return (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-text-secondary mt-1">
                  Bot Token: {botTokenMasked}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Type: {item.type} • Status: {pollingEnabled ? (
                    <span className="text-success">Active</span>
                  ) : (
                    <span className="text-text-secondary">Inactive</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeletePolling(item.id)}
                className="ml-4 px-3 py-1.5 rounded bg-error text-white hover:opacity-90 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

