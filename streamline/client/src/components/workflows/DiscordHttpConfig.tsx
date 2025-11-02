import { useState, useEffect } from 'react'

interface DiscordHttpConfigProps {
  node: any
  onUpdate: (updates: any) => void
}

export default function DiscordHttpConfig({ node, onUpdate }: DiscordHttpConfigProps) {
  // Default values as specified
  const defaultUrl = 'https://discord.com/api/webhooks/<YOUR_WEBHOOK_ID>/<YOUR_WEBHOOK_TOKEN>'
  const defaultBodyParams = 'content: {{$json.content}}'
  
  // Initialize with node data if available, otherwise use defaults
  const [method, setMethod] = useState(() => node?.data?.method || 'POST')
  const [url, setUrl] = useState(() => node?.data?.url !== undefined ? node.data.url : defaultUrl)
  const [responseFormat, setResponseFormat] = useState(() => node?.data?.responseFormat || 'JSON')
  const [bodyContentType, setBodyContentType] = useState(() => node?.data?.bodyContentType || 'JSON')
  const [bodyParameters, setBodyParameters] = useState(() => node?.data?.bodyParameters !== undefined ? node.data.bodyParameters : defaultBodyParams)

  // Only sync with node data when the node ID changes (user switches nodes)
  // Don't sync on every data change to allow editing without interference
  useEffect(() => {
    if (node?.data && node?.id) {
      // Only update state if the value exists in node.data, preserve empty strings
      if (node.data.method !== undefined) setMethod(node.data.method)
      if ('url' in node.data) {
        // Preserve empty strings - only use default if url is actually undefined
        setUrl(node.data.url !== undefined ? node.data.url : defaultUrl)
      }
      if (node.data.responseFormat !== undefined) setResponseFormat(node.data.responseFormat)
      if (node.data.bodyContentType !== undefined) setBodyContentType(node.data.bodyContentType)
      if ('bodyParameters' in node.data) {
        // Preserve empty strings - only use default if bodyParameters is actually undefined
        setBodyParameters(node.data.bodyParameters !== undefined ? node.data.bodyParameters : defaultBodyParams)
      }
    }
  }, [node?.id]) // Only run when node ID changes, not when data changes

  const updateField = (field: string, value: string) => {
    // Update local state immediately for responsive UI
    if (field === 'method') setMethod(value)
    else if (field === 'url') setUrl(value)
    else if (field === 'responseFormat') setResponseFormat(value)
    else if (field === 'bodyContentType') setBodyContentType(value)
    else if (field === 'bodyParameters') setBodyParameters(value)
    
    // Update node data
    const updates: any = {}
    updates[field] = value
    onUpdate(updates)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary border-b border-border">Field</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary border-b border-border">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 text-text-primary border-b border-border font-medium">Method</td>
                <td className="px-3 py-2 border-b border-border">
                  <select
                    value={method}
                    onChange={(e) => updateField('method', e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-text-primary border-b border-border font-medium">URL</td>
                <td className="px-3 py-2 border-b border-border">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateField('url', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/<YOUR_WEBHOOK_ID>/<YOUR_WEBHOOK_TOKEN>"
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-text-primary border-b border-border font-medium">Response Format</td>
                <td className="px-3 py-2 border-b border-border">
                  <select
                    value={responseFormat}
                    onChange={(e) => updateField('responseFormat', e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                  >
                    <option value="JSON">JSON</option>
                    <option value="XML">XML</option>
                    <option value="Text">Text</option>
                    <option value="Binary">Binary</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-text-primary border-b border-border font-medium">Body Content Type</td>
                <td className="px-3 py-2 border-b border-border">
                  <select
                    value={bodyContentType}
                    onChange={(e) => updateField('bodyContentType', e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                  >
                    <option value="JSON">JSON</option>
                    <option value="Form-Data">Form-Data</option>
                    <option value="Form-Encoded">Form-Encoded</option>
                    <option value="Raw">Raw</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-text-primary font-medium">Body Parameters</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={bodyParameters}
                    onChange={(e) => updateField('bodyParameters', e.target.value)}
                    placeholder="content: {{$json.content}}"
                    className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

