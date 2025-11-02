import { Handle, Position, type NodeProps } from 'reactflow'
import { IconWebhook, IconCode, IconApi, IconLink } from '@tabler/icons-react'

interface DefaultNodeData {
  label: string
  nodeType?: string
  integrationType?: string
}

export default function DefaultNode({ data, selected, type }: NodeProps<DefaultNodeData>) {
  const nodeType = data.nodeType || 'default'
  
  // Check if this is a trigger node
  const isTrigger = type === 'input' || type === 'trigger' || data.nodeType === 'trigger'
  
  // Choose icon based on node type
  let Icon: any = IconCode
  if (nodeType === 'webhook') {
    Icon = IconWebhook
  } else if (nodeType === 'api') {
    Icon = IconApi
  } else if (nodeType === 'http') {
    Icon = IconLink
  }

  return (
    <div 
      className={`px-4 py-3 rounded-lg border-2 min-w-[150px] max-w-[200px] transition-all relative ${
        selected 
          ? isTrigger ? 'border-white shadow-lg' : 'border-white shadow-lg'
          : isTrigger ? 'border-white/70 hover:border-white' : 'border-white/70 hover:border-white'
      }`}
      style={{ 
        backgroundColor: isTrigger ? '#000000' : 'transparent',
        backdropFilter: 'none'
      }}
    >
      {/* Input handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-white !border-2 !border-white"
        style={{ backgroundColor: 'white', border: '2px solid white' }}
        id="input-top"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-white !border-2 !border-white"
        style={{ backgroundColor: 'white', border: '2px solid white' }}
        id="input-left"
      />
      
      <div className="flex items-center gap-2 mb-1" style={{ color: isTrigger ? '#ffffff' : 'white' }}>
        <Icon size={14} style={{ color: isTrigger ? '#ffffff' : 'white', flexShrink: 0 }} />
        <div className="font-semibold text-sm truncate" style={{ color: isTrigger ? '#ffffff' : 'white' }}>
          {data.label || 'Node'}
        </div>
      </div>
      
      {/* Output handles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-white !border-2 !border-white"
        style={{ backgroundColor: 'white', border: '2px solid white' }}
        id="output-bottom"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-white !border-2 !border-white"
        style={{ backgroundColor: 'white', border: '2px solid white' }}
        id="output-right"
      />
    </div>
  )
}

