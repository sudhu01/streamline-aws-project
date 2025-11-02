import { useState, useEffect } from 'react'

interface HttpRequestNodeConfigProps {
  node: any
  onUpdate: (updates: any) => void
}

export default function HttpRequestNodeConfig({ node, onUpdate }: HttpRequestNodeConfigProps) {
  const [method, setMethod] = useState(node?.data?.method || 'GET')
  const [url, setUrl] = useState(node?.data?.url || '')
  const [queryParams, setQueryParams] = useState(node?.data?.queryParams || '')
  const [responseFormat, setResponseFormat] = useState(node?.data?.responseFormat || 'JSON')

  useEffect(() => {
    if (node?.data) {
      setMethod(node.data.method || 'GET')
      setUrl(node.data.url || '')
      setQueryParams(node.data.queryParams || '')
      setResponseFormat(node.data.responseFormat || 'JSON')
    }
  }, [node])

  const updateField = (field: string, value: string) => {
    const updates: any = {}
    updates[field] = value
    onUpdate(updates)
    
    if (field === 'method') setMethod(value)
    if (field === 'url') setUrl(value)
    if (field === 'queryParams') setQueryParams(value)
    if (field === 'responseFormat') setResponseFormat(value)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Method</label>
        <select
          value={method}
          onChange={(e) => updateField('method', e.target.value)}
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
        <label className="block text-sm font-medium mb-2">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => updateField('url', e.target.value)}
          placeholder="https://api.coingecko.com/api/v3/simple/price"
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Query Parameters</label>
        <textarea
          value={queryParams}
          onChange={(e) => updateField('queryParams', e.target.value)}
          placeholder='ids={{$json.coin}}, vs_currencies=usd'
          rows={3}
          className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary font-mono text-sm resize-none"
        />
        <p className="text-xs text-text-secondary mt-1">
          Separate multiple parameters with commas. Use {'{{$json.field}}'} for dynamic values.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Response Format</label>
        <select
          value={responseFormat}
          onChange={(e) => updateField('responseFormat', e.target.value)}
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="JSON">JSON</option>
          <option value="XML">XML</option>
          <option value="Text">Text</option>
          <option value="Binary">Binary</option>
        </select>
      </div>
    </div>
  )
}

