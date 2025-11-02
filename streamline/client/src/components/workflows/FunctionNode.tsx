import { Handle, Position, type NodeProps } from 'reactflow'
import { IconCode } from '@tabler/icons-react'

interface FunctionNodeData {
  label: string
  code?: string
  purpose?: string
  nodeType?: string
}

export default function FunctionNode({ data, selected, type }: NodeProps<FunctionNodeData>) {
  // Check if this is a trigger node
  const isTrigger = type === 'input' || type === 'trigger' || data.nodeType === 'trigger'
  
  return (
    <div 
      className={`px-4 py-3 rounded-lg border-2 min-w-[150px] max-w-[200px] transition-all relative ${
        selected 
          ? 'border-white shadow-lg' 
          : 'border-white/70 hover:border-white'
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
        <IconCode size={14} style={{ color: isTrigger ? '#ffffff' : 'white', flexShrink: 0 }} />
        <div className="font-semibold text-sm truncate" style={{ color: isTrigger ? '#ffffff' : 'white' }}>
          {data.label || 'Function'}
        </div>
      </div>

      {data.purpose && (
        <div className="text-xs mt-1 line-clamp-2" style={{ color: isTrigger ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }}>
          {data.purpose}
        </div>
      )}

      {data.code && (
        <div className="mt-2 text-xs font-mono line-clamp-2" style={{ color: isTrigger ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}>
          {data.code.substring(0, 40)}...
        </div>
      )}

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

