import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { X, Copy, ExternalLink } from 'lucide-react'

export default function ManageWebhooksCard() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      // Load integrations that have webhook configuration
      const res = await api.get('/api/integrations/connected')
      const integrations = res.data || []
      const webhookIntegrations = integrations.filter((int: any) => {
        // Check if integration has config (decrypted) or configEnc (encrypted)
        let config = int.config || {}
        if (!config || Object.keys(config).length === 0) {
          try {
            config = JSON.parse(int.configEnc || '{}')
          } catch {
            return false
          }
        }
        // Filter for integrations with webhook URLs or webhook-based integrations
        return config.webhookUrl || (int.type === 'discord' || (int.type === 'telegram' && config.connectionMode === 'webhook'))
      })
      setItems(webhookIntegrations)
    } catch (error) {
      console.error('Failed to load webhooks:', error)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    
    try {
      await api.delete(`/api/integrations/${id}`)
      loadWebhooks()
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to delete webhook')
    }
  }

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    // You could add a toast notification here
  }

  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Webhooks</h3>
      </div>

      {items.length === 0 && (
        <div className="text-sm text-text-secondary">No webhooks configured</div>
      )}

      <div className="divide-y divide-border">
        {items.map((item: any) => {
          let webhookUrl = ''
          let config = item.config || {}
          if (!config || Object.keys(config).length === 0) {
            try {
              config = JSON.parse(item.configEnc || '{}')
            } catch {}
          }
          webhookUrl = config.webhookUrl || ''

          return (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                  <span className="truncate max-w-md">{webhookUrl || 'No URL configured'}</span>
                  {webhookUrl && (
                    <>
                      <button
                        onClick={() => copyWebhookUrl(webhookUrl)}
                        className="p-1 hover:bg-surface-elevated rounded transition-colors"
                        title="Copy URL"
                      >
                        <Copy size={14} />
                      </button>
                      <a
                        href={webhookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-surface-elevated rounded transition-colors"
                        title="Open URL"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </>
                  )}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Type: {item.type} • Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteWebhook(item.id)}
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

