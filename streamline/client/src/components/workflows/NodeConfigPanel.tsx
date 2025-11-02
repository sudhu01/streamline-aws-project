import { Trash2 } from 'lucide-react'
import FunctionNodeConfig from './FunctionNodeConfig'
import WebhookNodeConfig from './WebhookNodeConfig'
import HttpRequestNodeConfig from './HttpRequestNodeConfig'
import ApiNodeConfig from './ApiNodeConfig'
import DiscordHttpConfig from './DiscordHttpConfig'
import { type Node } from 'reactflow'

interface NodeConfigPanelProps {
  node: Node | null
  onUpdate: (updates: any) => void
  onDelete: (nodeId: string) => void
  onSetAsTrigger?: (nodeId: string) => void
}

function getNodeTypeDisplay(node: Node): string {
  const nodeType = node.type || node.data?.nodeType || 'default'
  const integrationType = node.data?.integrationType || node.data?.type
  
  if (nodeType === 'function' || node.data?.nodeType === 'function') return 'Function'
  
  // Check if it's a trigger node with integration type
  const isTrigger = node.type === 'input' || node.type === 'trigger' || node.data?.nodeType === 'trigger'
  
  // Discord webhook (trigger) vs Discord HTTP Request (non-trigger)
  if (integrationType === 'discord') {
    if (isTrigger) {
      return 'Discord Webhook'
    } else {
      return 'HTTP Request'
    }
  }
  
  if (nodeType === 'webhook' || node.data?.nodeType === 'webhook' || 
      (integrationType && integrationType === 'telegram')) {
    const type = integrationType || 'Webhook'
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Webhook`
  }
  
  if (nodeType === 'http' || node.data?.nodeType === 'http') return 'HTTP Request'
  
  if (nodeType === 'api' || node.data?.nodeType === 'api' || 
      (integrationType && ['slack', 'airtable', 'news_api', 'twilio'].includes(integrationType))) {
    const type = integrationType || 'API'
    const displayType = `${type.charAt(0).toUpperCase() + type.slice(1)}`
    // If it's a Slack trigger, show "Slack (Trigger)"
    if (isTrigger && integrationType === 'slack') {
      return 'Slack (Trigger)'
    }
    return `${displayType} API`
  }
  
  if (nodeType === 'trigger') return 'Trigger'
  
  return node.data?.label || nodeType || 'Default'
}

export default function NodeConfigPanel({ node, onUpdate, onDelete, onSetAsTrigger }: NodeConfigPanelProps) {
  console.log('[NodeConfigPanel] Rendering with node:', node?.id, node?.type, node?.data)
  
  if (!node) {
    return (
      <div className="text-sm text-text-secondary">Select a node to configure</div>
    )
  }

  const nodeTypeDisplay = getNodeTypeDisplay(node)

  const renderConfig = () => {
    // Check node type from multiple possible locations (prioritize node.data.nodeType)
    const nodeType = node.data?.nodeType || node.type || 'default'
    const integrationType = node.data?.integrationType || node.data?.type
    
    console.log('[NodeConfigPanel] Node type check:', { 
      nodeType, 
      integrationType, 
      nodeDataType: node.data?.nodeType,
      nodeTypeProperty: node.type,
      nodeData: node.data 
    })
    
    // Check if it's a trigger node
    const isTrigger = node.type === 'input' || node.type === 'trigger' || node.data?.nodeType === 'trigger'
    
    // Function node
    if (nodeType === 'function') {
      return <FunctionNodeConfig node={node} onUpdate={onUpdate} />
    }
    
    // Discord node - trigger uses webhook config, non-trigger uses HTTP Request format
    if (integrationType === 'discord') {
      if (isTrigger) {
        // Discord trigger nodes use webhook config
        return <WebhookNodeConfig node={node} onUpdate={onUpdate} />
      } else {
        // All non-trigger Discord nodes use HTTP Request format
        return <DiscordHttpConfig node={node} onUpdate={onUpdate} />
      }
    }
    
    // Other webhook nodes (telegram webhook, etc.)
    if (nodeType === 'webhook' || 
        (integrationType === 'telegram' && node.data?.connectionMode === 'webhook')) {
      return <WebhookNodeConfig node={node} onUpdate={onUpdate} />
    }
    
    // HTTP Request node (non-Discord)
    if (nodeType === 'http') {
      return <HttpRequestNodeConfig node={node} onUpdate={onUpdate} />
    }
    
    // API node - check for API integrations
    if (nodeType === 'api' || 
        (integrationType && ['slack', 'airtable', 'news_api', 'twilio'].includes(integrationType))) {
      return <ApiNodeConfig node={node} onUpdate={onUpdate} type={node.type} />
    }
    
    // Default fallback - show debug info
    return (
      <div className="text-sm text-text-secondary">
        <div className="text-xs opacity-70 mb-2">Node type: {nodeType}</div>
        <div className="text-xs opacity-70 mb-1">Integration: {integrationType || 'none'}</div>
        <div className="text-xs opacity-70">Configuration not available for this node type</div>
        <div className="text-xs opacity-50 mt-2 font-mono">{JSON.stringify(node.data, null, 2)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-border">
        <div className="text-sm font-semibold">Node Type: {nodeTypeDisplay}</div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-text-secondary mb-3">Configuration</div>
        {renderConfig()}
      </div>
      
      <div className="pt-4 border-t border-border space-y-2">
        {onSetAsTrigger && (node.type !== 'input' && node.type !== 'trigger' && node.data?.nodeType !== 'trigger') && (
          <button
            onClick={() => {
              if (onSetAsTrigger) {
                onSetAsTrigger(node.id)
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-[color:var(--sl-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <span className="font-medium">Set as Trigger</span>
          </button>
        )}
        
        {(node.type === 'input' || node.type === 'trigger' || node.data?.nodeType === 'trigger') && (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-[color:var(--sl-primary)]/20 text-[color:var(--sl-primary)] border border-[color:var(--sl-primary)]/30">
            <span className="text-sm font-medium">This node is a trigger</span>
          </div>
        )}

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete this node "${node.data?.label || node.id}"?`)) {
              onDelete(node.id)
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-transparent border-2 border-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} className="text-red-500" />
          <span className="text-red-500 font-medium">Delete Node</span>
        </button>
      </div>
    </div>
  )
}

