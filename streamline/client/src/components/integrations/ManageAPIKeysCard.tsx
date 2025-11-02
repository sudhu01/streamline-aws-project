import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { X } from 'lucide-react'

export default function ManageAPIKeysCard() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    loadAPIKeyIntegrations()
  }, [])

  const loadAPIKeyIntegrations = async () => {
    try {
      const res = await api.get('/api/integrations/connected')
      const integrations = res.data || []
      // Filter integrations that use API authentication (authType: 'api')
      const apiIntegrations = integrations.filter((int: any) => {
        // Check integration types that typically use API keys
        const apiTypes = ['airtable', 'slack', 'news_api', 'twilio']
        return apiTypes.includes(int.type)
      })
      setItems(apiIntegrations)
    } catch (error) {
      console.error('Failed to load API key integrations:', error)
    }
  }

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Delete this integration?')) return
    
    try {
      await api.delete(`/api/integrations/${id}`)
      loadAPIKeyIntegrations()
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to delete integration')
    }
  }

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return 'Not configured'
    return `${key.substring(0, 4)}${'*'.repeat(Math.min(key.length - 8, 12))}${key.substring(key.length - 4)}`
  }

  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">API Keys</h3>
      </div>
      {items.length === 0 && <div className="text-sm text-text-secondary">No API key integrations configured</div>}
      <div className="divide-y divide-border">
        {items.map((item: any) => {
          let config = item.config || {}
          if (!config || Object.keys(config).length === 0) {
            try {
              config = JSON.parse(item.configEnc || '{}')
            } catch {}
          }
          
          // Extract API key - apiKeys from IntegrationConfigModal are flattened into config via ...apiKeys in integrationService
          // So if user entered key name "API_KEY" with value "xoxb-123", config will have { "API_KEY": "xoxb-123" }
          let apiKey = ''
          let apiKeyLabel = 'API Key'
          
          // Exclude these known non-API-key fields
          const excludedKeys = ['webhookUrl', 'botToken', 'connectionMode', 'pollingEnabled', 'integrationName', 'apiKeys']
          
          // First, check if apiKeys exists as a nested object (for backwards compatibility)
          if (config.apiKeys && typeof config.apiKeys === 'object' && !Array.isArray(config.apiKeys)) {
            const keys = Object.keys(config.apiKeys)
            if (keys.length > 0) {
              apiKey = config.apiKeys[keys[0]] || ''
              apiKeyLabel = keys[0]
            }
          } else {
            // Check all config keys (since apiKeys are flattened into config root)
            // Filter out excluded keys and non-string values
            const possibleApiKeys = Object.keys(config).filter(k => 
              !excludedKeys.includes(k) &&
              typeof config[k] === 'string' &&
              config[k].trim().length > 0
            )
            
            if (possibleApiKeys.length > 0) {
              // Use the first key found (user's custom key name from the form)
              apiKey = config[possibleApiKeys[0]]
              apiKeyLabel = possibleApiKeys[0]
            }
            
            // Fallback to common field names if nothing found yet
            if (!apiKey) {
              const commonKeyNames = ['apiKey', 'api_key', 'API_KEY', 'secretKey', 'secret_key', 'SECRET_KEY', 'accessToken', 'access_token', 'ACCESS_TOKEN', 'apiToken', 'api_token', 'API_TOKEN']
              for (const keyName of commonKeyNames) {
                if (config[keyName]) {
                  apiKey = config[keyName]
                  apiKeyLabel = keyName
                  break
                }
              }
            }
          }

          return (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-text-secondary mt-1">
                  Type: {item.type} • {apiKeyLabel}: {maskApiKey(apiKey)}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteIntegration(item.id)}
                className="ml-4 px-3 py-1.5 rounded bg-error text-white hover:opacity-90 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-text-secondary">API keys are encrypted at rest with AES-256.</div>
    </div>
  )
}

