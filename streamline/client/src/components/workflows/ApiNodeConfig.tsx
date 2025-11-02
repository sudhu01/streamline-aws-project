import { useState, useEffect } from 'react'
import { getConnectedIntegrations } from '../../services/integrationService'

interface ApiNodeConfigProps {
  node: any
  onUpdate: (updates: any) => void
  type?: string
}

export default function ApiNodeConfig({ node, onUpdate, type }: ApiNodeConfigProps) {
  // Check if this is a trigger node
  const isTrigger = type === 'input' || type === 'trigger' || node?.data?.nodeType === 'trigger'
  const integrationType = node?.data?.integrationType || 'slack'
  const isSlackTrigger = isTrigger && integrationType === 'slack'
  
  const [integrations, setIntegrations] = useState<any[]>([])
  const [resource, setResource] = useState(node?.data?.resource || (isSlackTrigger ? 'Event' : ''))
  const [operation, setOperation] = useState(node?.data?.operation || '')
  const [channel, setChannel] = useState(node?.data?.channel || '')
  const [text, setText] = useState(node?.data?.text || '')
  const [eventType, setEventType] = useState(node?.data?.eventType || 'message.channels')

  useEffect(() => {
    loadIntegrations()
  }, [])

  useEffect(() => {
    if (node?.data) {
      const currentIsSlackTrigger = (type === 'input' || type === 'trigger' || node.data?.nodeType === 'trigger') && (node.data?.integrationType === 'slack')
      setResource(node.data.resource || (currentIsSlackTrigger ? 'Event' : ''))
      setOperation(node.data.operation || '')
      setChannel(node.data.channel || '')
      setText(node.data.text || '')
      setEventType(node.data.eventType || 'message.channels')
    }
  }, [node, type])

  const loadIntegrations = async () => {
    try {
      const data = await getConnectedIntegrations()
      // Filter only API integrations
      const apiTypes = ['slack', 'airtable', 'news_api', 'twilio']
      const apiIntegrations = data.filter((int: any) => apiTypes.includes(int.type))
      setIntegrations(apiIntegrations)
    } catch (error) {
      console.error('Failed to load integrations:', error)
    }
  }

  const updateField = (field: string, value: string) => {
    const updates: any = {}
    updates[field] = value
    onUpdate(updates)
    
    if (field === 'resource') setResource(value)
    if (field === 'operation') setOperation(value)
    if (field === 'channel') setChannel(value)
    if (field === 'text') setText(value)
    if (field === 'eventType') setEventType(value)
  }

  // Get integration from node data if available
  const integration = node?.data?.integrationId 
    ? integrations.find((int: any) => int.id === node.data.integrationId)
    : null
  const currentIntegrationType = integration?.type || integrationType

  // If it's a Slack trigger node, show special trigger format
  if (isSlackTrigger || (isTrigger && currentIntegrationType === 'slack')) {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold mb-3">Purpose:</div>
          <div className="text-sm text-text-secondary">
            Listen for a Slack message in a specific channel.
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase text-text-secondary mb-3">Configuration</div>
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
                  <td className="px-3 py-2 text-text-primary border-b border-border font-medium">Resource</td>
                  <td className="px-3 py-2 border-b border-border">
                    <input
                      type="text"
                      value={resource || 'Event'}
                      onChange={(e) => updateField('resource', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-text-primary border-b border-border font-medium">Event Type</td>
                  <td className="px-3 py-2 border-b border-border">
                    <input
                      type="text"
                      value={eventType}
                      onChange={(e) => updateField('eventType', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-text-primary font-medium">Channel</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={channel}
                      onChange={(e) => updateField('channel', e.target.value)}
                      placeholder="#crypto"
                      className="w-full bg-transparent border-0 outline-none text-text-primary font-mono text-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 rounded border border-border bg-surface/50">
          <div className="text-xs font-semibold mb-1">Credentials:</div>
          <div className="text-xs text-text-secondary">
            Use your Slack Bot Token (xoxb-...) created via api.slack.com/apps
          </div>
          {integration && (
            <div className="text-xs text-text-secondary mt-1">
              Using: {integration.name}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular API node configuration (non-trigger)
  return (
    <div className="space-y-4">
      {integration && (
        <div className="p-3 rounded border border-border bg-surface/50">
          <div className="text-xs font-semibold mb-1">Integration:</div>
          <div className="text-sm text-text-primary">{integration.name} ({integration.type})</div>
        </div>
      )}

      {!integration && (
        <div className="p-3 rounded border border-border bg-surface/50">
          <div className="text-xs text-warning">No integration selected. The integration is set when adding the node from the library.</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Resource</label>
        <input
          type="text"
          value={resource}
          onChange={(e) => updateField('resource', e.target.value)}
          placeholder={integrationType === 'slack' ? 'Message' : 'Resource name'}
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Operation</label>
        <select
          value={operation}
          onChange={(e) => updateField('operation', e.target.value)}
          className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="">Select operation...</option>
          {integrationType === 'slack' && (
            <>
              <option value="Post">Post</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
            </>
          )}
          {integrationType === 'airtable' && (
            <>
              <option value="Create">Create</option>
              <option value="Read">Read</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
            </>
          )}
        </select>
      </div>

      {integrationType === 'slack' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => updateField('channel', e.target.value)}
              placeholder="#alerts"
              className="w-full border border-border rounded px-3 py-2 bg-surface text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Text</label>
            <textarea
              value={text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder='{{$json.text}}'
              rows={3}
              className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </>
      )}

      <div className="p-3 rounded border border-border bg-surface/50">
        <div className="text-xs font-semibold mb-1">Credentials:</div>
        <div className="text-xs text-text-secondary">
          {integration ? (
            <span>Using: {integration.name}</span>
          ) : (
            <span className="text-warning">Integration is set when adding the node from the library.</span>
          )}
        </div>
        {integrationType === 'slack' && (
          <div className="text-xs text-text-secondary mt-2">
            Use the Bot User OAuth Token (starts with xoxb-...) from Slack API dashboard → OAuth & Permissions page.
          </div>
        )}
      </div>
    </div>
  )
}

