import { useState, useEffect } from 'react'

interface WebhookNodeConfigProps {
  node: any
  onUpdate: (updates: any) => void
}

export default function WebhookNodeConfig({ node, onUpdate }: WebhookNodeConfigProps) {
  const [httpMethod, setHttpMethod] = useState(node?.data?.httpMethod || 'POST')
  const [path, setPath] = useState(node?.data?.path || '')
  const [respondToWebhook, setRespondToWebhook] = useState(node?.data?.respondToWebhook || 'Immediately')
  const [responseCode, setResponseCode] = useState(node?.data?.responseCode || '200')
  const [responseBody, setResponseBody] = useState(node?.data?.responseBody || '{"status":"ok"}')

  useEffect(() => {
    if (node?.data) {
      setHttpMethod(node.data.httpMethod || 'POST')
      setPath(node.data.path || '')
      setRespondToWebhook(node.data.respondToWebhook || 'Immediately')
      setResponseCode(node.data.responseCode || '200')
      setResponseBody(node.data.responseBody || '{"status":"ok"}')
    }
  }, [node])

  const updateField = (field: string, value: string) => {
    const updates: any = {}
    updates[field] = value
    onUpdate(updates)
    
    if (field === 'httpMethod') setHttpMethod(value)
    if (field === 'path') setPath(value)
    if (field === 'respondToWebhook') setRespondToWebhook(value)
    if (field === 'responseCode') setResponseCode(value)
    if (field === 'responseBody') setResponseBody(value)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">HTTP Method</label>
        <select
          value={httpMethod}
          onChange={(e) => updateField('httpMethod', e.target.value)}
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Path</label>
        <input
          type="text"
          value={path}
          onChange={(e) => updateField('path', e.target.value)}
          placeholder="discord-price"
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Respond to Webhook</label>
        <select
          value={respondToWebhook}
          onChange={(e) => updateField('respondToWebhook', e.target.value)}
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="Immediately">Immediately</option>
          <option value="When Last Node Finishes">When Last Node Finishes</option>
          <option value="Never">Never</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Response Code</label>
        <input
          type="text"
          value={responseCode}
          onChange={(e) => updateField('responseCode', e.target.value)}
          placeholder="200"
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Response Body</label>
        <textarea
          value={responseBody}
          onChange={(e) => updateField('responseBody', e.target.value)}
          placeholder='{"status":"ok"}'
          rows={3}
          className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary font-mono text-sm resize-none"
        />
      </div>
    </div>
  )
}

