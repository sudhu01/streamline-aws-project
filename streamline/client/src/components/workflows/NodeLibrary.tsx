import { useEffect, useState } from 'react'
import { getConnectedIntegrations } from '../../services/integrationService'

interface NodeLibraryProps {
  onAddNode: (node: { id: string; type: string; name: string; integrationId?: string; integrationType?: string }) => void
}

export default function NodeLibrary({ onAddNode }: NodeLibraryProps) {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const data = await getConnectedIntegrations()
      setIntegrations(data || [])
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIntegrationNode = (integration: any) => {
    const nodeId = `node_${Date.now()}`
    let config = integration.config || {}
    
    // Determine node type based on integration configuration
    let nodeType = 'api'
    if (config.webhookUrl || integration.type === 'discord' || (integration.type === 'telegram' && config.connectionMode === 'webhook')) {
      nodeType = 'webhook'
    } else if (['slack', 'airtable', 'news_api', 'twilio'].includes(integration.type)) {
      nodeType = 'api'
    }

    onAddNode({
      id: nodeId,
      type: nodeType,
      name: integration.name,
      integrationId: integration.id,
      integrationType: integration.type
    })
  }

  const handleAddTrigger = () => {
    const nodeId = `trigger_${Date.now()}`
    onAddNode({
      id: nodeId,
      type: 'trigger',
      name: 'Trigger'
    })
  }

  const handleAddAction = () => {
    const nodeId = `action_${Date.now()}`
    onAddNode({
      id: nodeId,
      type: 'action',
      name: 'Action'
    })
  }

  if (loading) {
    return (
      <div className="text-sm text-text-secondary">Loading...</div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase text-text-secondary mb-2">Triggers</div>
        <button
          onClick={handleAddTrigger}
          className="w-full text-left px-3 py-2 rounded border border-border hover:border-primary transition-colors bg-surface"
        >
          + Manual Trigger
        </button>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-text-secondary mb-2">Actions</div>
        <button
          onClick={() => {
            const nodeId = `function_${Date.now()}`
            onAddNode({
              id: nodeId,
              type: 'function',
              name: 'Function',
              nodeType: 'function'
            })
          }}
          className="w-full text-left px-3 py-2 rounded border border-border hover:border-primary transition-colors bg-surface mb-2"
        >
          + Function
        </button>
        <button
          onClick={() => {
            const nodeId = `http_${Date.now()}`
            onAddNode({
              id: nodeId,
              type: 'http',
              name: 'HTTP Request',
              nodeType: 'http'
            })
          }}
          className="w-full text-left px-3 py-2 rounded border border-border hover:border-primary transition-colors bg-surface mb-2"
        >
          + HTTP Request
        </button>
      </div>

      {integrations.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase text-text-secondary mb-2">Integrations</div>
          <div className="space-y-2">
            {integrations.map((integration) => {
              // Determine integration category
              let category = 'integration'
              let config = integration.config || {}
              
              if (config.webhookUrl || integration.type === 'discord' || (integration.type === 'telegram' && config.connectionMode === 'webhook')) {
                category = 'webhook'
              } else if (config.pollingEnabled || config.connectionMode === 'polling') {
                category = 'polling'
              } else if (['airtable', 'slack', 'news_api', 'twilio'].includes(integration.type)) {
                category = 'api'
              }

              // Determine node type based on integration category
              let nodeType = 'api'
              if (category === 'webhook') {
                nodeType = 'webhook'
              } else if (category === 'api') {
                nodeType = 'api'
              }

              return (
                <button
                  key={integration.id}
                  onClick={() => handleAddIntegrationNode(integration)}
                  className="w-full text-left px-3 py-2 rounded border border-border hover:border-primary transition-colors bg-surface"
                  title={`Add ${integration.name} (${integration.type})`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{integration.name}</div>
                      <div className="text-xs text-text-secondary">{integration.type}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {integrations.length === 0 && (
        <div className="text-sm text-text-secondary">
          <div className="mb-2">No integrations connected</div>
          <a href="/integrations" className="text-primary hover:underline">Connect an integration</a>
        </div>
      )}
    </div>
  )
}

