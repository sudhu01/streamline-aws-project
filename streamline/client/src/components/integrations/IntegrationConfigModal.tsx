import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Button from '@/components/shared/Button'
import Input from '@/components/shared/Input'
import { Label } from '@/components/ui/label'

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
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpTls, setSmtpTls] = useState(true)
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
      setSmtpHost('')
      setSmtpPort('587')
      setSmtpUser('')
      setSmtpPassword('')
      setSmtpTls(true)
      setResult(null)
    }
  }, [open])
  
  if (!integration) return null

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
    } else if (authType === 'smtp') {
      if (!smtpHost.trim() || !smtpUser.trim() || !smtpPassword.trim()) {
        setResult({ ok: false, error: 'SMTP host, username, and password are required' })
        return
      }
      config.smtpHost = smtpHost.trim()
      config.smtpPort = parseInt(smtpPort) || 587
      config.smtpUser = smtpUser.trim()
      config.smtpPassword = smtpPassword.trim()
      config.smtpTls = smtpTls
    } else if (authType === 'oauth') {
      // OAuth will initiate flow - for now, just store basic config
      // In production, this would trigger OAuth flow
      config.oauthEnabled = true
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
            <Input
              label="Webhook URL"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              helperText="Enter the webhook URL from your Discord server settings"
            />
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
              <Input
              label="Webhook URL"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.telegram.org/bot..."
              helperText="Enter the Telegram webhook URL"
            />
            </div>
          ) : (
            <div>
              <Input
                label="Bot Token"
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                helperText="Get your bot token from @BotFather on Telegram"
              />
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

    if (authType === 'smtp') {
      return (
        <div className="space-y-4">
          <Input
            label="SMTP Host"
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.gmail.com"
          />
          <Input
            label="SMTP Port"
            type="number"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587"
          />
          <Input
            label="Username"
            type="text"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="your-email@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder="Your email password or app password"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={smtpTls}
              onChange={(e) => setSmtpTls(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Enable TLS/SSL</span>
          </label>
        </div>
      )
    }

    if (authType === 'oauth') {
      return (
        <div className="p-4 rounded border border-border bg-surface/50">
          <p className="text-sm text-text-secondary mb-3">
            OAuth authentication will be initiated when you save this integration. You'll be redirected to authorize access.
          </p>
          <p className="text-xs text-text-secondary">
            Click "Save & Connect" to begin the OAuth authorization flow.
          </p>
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
              <Input
                value={keyPair.name}
                onChange={(e) => updateApiKey(index, 'name', e.target.value)}
                placeholder="Key name (e.g., API_KEY, SECRET_KEY)"
                className="flex-1"
              />
              <Input
                type="password"
                value={keyPair.value}
                onChange={(e) => updateApiKey(index, 'value', e.target.value)}
                placeholder="Key value"
                className="flex-1"
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure: {integration.name}</DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            label="Integration Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={integration.name}
          />

          {renderAuthForm()}
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded text-sm ${result.ok ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
            {result.ok ? '✓ Connection successful!' : `✗ Connection failed: ${result.error || 'Unknown error'}`}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary"
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
          >
            {testing ? 'Testing...' : 'Save & Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

