import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

interface ApiKeyPair {
  name: string
  value: string
}

export default function IntegrationConfigModal({ 
  open, 
  onClose, 
  onSave, 
  integration 
}: { 
  open: boolean
  onClose: ()=>void
  onSave: (config:any)=>Promise<any>
  integration: any | null
}) {
  const [name, setName] = useState('')
  const [apiKeys, setApiKeys] = useState<ApiKeyPair[]>([{ name: '', value: '' }])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const [botToken, setBotToken] = useState('')
  const [connectionMode, setConnectionMode] = useState<'webhook' | 'polling'>('webhook')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const authType = integration?.authType || 'api'

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setName('')
      setApiKeys([{ name: '', value: '' }])
      setWebhookUrl('')
      setPollingEnabled(false)
      setBotToken('')
      setConnectionMode('webhook')
      setResult(null)
    }
  }, [open])
  
  if (!open || !integration) return null

  const addApiKeyField = () => {
    setApiKeys([...apiKeys, { name: '', value: '' }])
  }

  const removeApiKeyField = (index: number) => {
    setApiKeys(apiKeys.filter((_, i) => i !== index))
  }

  const updateApiKey = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...apiKeys]
    updated[index] = { ...updated[index], [field]: value }
    setApiKeys(updated)
  }

  const handleSave = async () => {
    const config: any = {
      integrationName: name || integration.name
    }

    if (authType === 'webhook') {
      if (!webhookUrl.trim()) {
        setResult({ ok: false, error: 'Webhook URL is required' })
        return
      }
      config.webhookUrl = webhookUrl.trim()
    } else if (authType === 'webhook_or_polling') {
      if (connectionMode === 'webhook') {
        if (!webhookUrl.trim()) {
          setResult({ ok: false, error: 'Webhook URL is required' })
          return
        }
        config.webhookUrl = webhookUrl.trim()
        config.connectionMode = 'webhook'
      } else {
        if (!botToken.trim()) {
          setResult({ ok: false, error: 'Bot token is required for polling' })
          return
        }
        config.botToken = botToken.trim()
        config.connectionMode = 'polling'
        config.pollingEnabled = true
      }
    } else if (authType === 'api') {
      const apiKeyConfig: any = {}
      apiKeys.forEach(keyPair => {
        if (keyPair.name && keyPair.value) {
          apiKeyConfig[keyPair.name] = keyPair.value
        }
      })
      if (Object.keys(apiKeyConfig).length === 0) {
        setResult({ ok: false, error: 'At least one API key is required' })
        return
      }
      config.apiKeys = apiKeyConfig
    }
    
    await onSave(config)
  }

  const renderAuthForm = () => {
    if (authType === 'none') {
      return (
        <div className="p-4 rounded border border-border bg-surface/50">
          <p className="text-sm text-text-secondary">
            No authentication required. This integration can be used directly.
          </p>
        </div>
      )
    }

    if (authType === 'webhook') {
      return (
        <div>
          <label className="block text-sm font-medium mb-2">Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-text-secondary mt-1">
            Enter the webhook URL from your Discord server settings
          </p>
        </div>
      )
    }

    if (authType === 'webhook_or_polling') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Connection Mode</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConnectionMode('webhook')}
                className={`flex-1 px-4 py-2 rounded border transition-colors ${
                  connectionMode === 'webhook'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                Webhook
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('polling')}
                className={`flex-1 px-4 py-2 rounded border transition-colors ${
                  connectionMode === 'polling'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                Polling
              </button>
            </div>
          </div>

          {connectionMode === 'webhook' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.telegram.org/bot..."
                className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-text-secondary mt-1">
                Enter the Telegram webhook URL
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Bot Token</label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-text-secondary mt-1">
                Get your bot token from @BotFather on Telegram
              </p>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={pollingEnabled}
                  onChange={(e) => setPollingEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable polling (check for new messages periodically)</span>
              </label>
            </div>
          )}
        </div>
      )
    }

    // Default: API auth
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">API Keys</label>
          <button
            type="button"
            onClick={addApiKeyField}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:border-primary transition-colors"
          >
            <Plus size={14} />
            Add Key
          </button>
        </div>
        
        <div className="space-y-2">
          {apiKeys.map((keyPair, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                value={keyPair.name}
                onChange={(e) => updateApiKey(index, 'name', e.target.value)}
                placeholder="Key name (e.g., API_KEY, SECRET_KEY)"
                className="flex-1 border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
              />
              <input
                type="password"
                value={keyPair.value}
                onChange={(e) => updateApiKey(index, 'value', e.target.value)}
                placeholder="Key value"
                className="flex-1 border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
              />
              {apiKeys.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeApiKeyField(index)}
                  className="p-2 rounded border border-border hover:border-error transition-colors"
                >
                  <X size={16} className="text-error" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="border border-border rounded-lg w-full max-w-2xl p-6 shadow-theme-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0f172a', opacity: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-lg">Configure: {integration.name}</div>
            <div className="text-sm text-text-secondary mt-1">{integration.description}</div>
          </div>
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 rounded border border-border hover:border-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Integration Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={integration.name}
              className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {renderAuthForm()}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded border border-border hover:border-primary transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={testing}
            onClick={async () => {
              setTesting(true)
              setResult(null)
              try {
                await handleSave()
                setResult({ ok: true })
              } catch (e) {
                setResult({ ok: false, error: String(e) })
              } finally {
                setTesting(false)
              }
            }}
            className="px-4 py-2 rounded bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Save & Connect'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded text-sm ${result.ok ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {result.ok ? '✓ Connection successful!' : `✗ Connection failed: ${result.error || 'Unknown error'}`}
          </div>
        )}
      </div>
    </div>
  )
}
