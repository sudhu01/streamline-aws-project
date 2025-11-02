import ReactFlow, { addEdge, Background, Controls, MiniMap, useEdgesState, useNodesState, type Edge, type Node, type OnConnect, type NodeTypes, type NodeMouseHandler, type EdgeMouseHandler } from 'reactflow'
import 'reactflow/dist/style.css'
import { useCallback, useEffect } from 'react'

const defaultNodes: Node[] = [
  { id: 'trigger', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
]

interface WorkflowCanvasProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onChange?: (nodes: Node[], edges: Edge[]) => void
  onNodeClick?: NodeMouseHandler
  onEdgeClick?: EdgeMouseHandler
  onPaneClick?: () => void
  nodeTypes?: NodeTypes
}

export default function WorkflowCanvas({ initialNodes, initialEdges, onChange, onNodeClick, onEdgeClick, onPaneClick, nodeTypes }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || [])

  // Sync with external state changes
  useEffect(() => {
    if (initialNodes) {
      setNodes(initialNodes)
    }
  }, [initialNodes, setNodes])

  useEffect(() => {
    if (initialEdges) {
      setEdges(initialEdges)
    }
  }, [initialEdges, setEdges])

  const onConnect: OnConnect = useCallback((params) => {
    if (params) {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        animated: false,
        style: { stroke: 'var(--sl-primary)', strokeWidth: 2 },
        type: 'smoothstep'
      }
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds)
        // Notify parent about the change
        setTimeout(() => {
          onChange?.(nodes, updated)
        }, 0)
        return updated
      })
      console.log('[WorkflowCanvas] Connection created:', newEdge)
    }
  }, [setEdges, nodes, onChange])

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes)
    // Trigger change callback after state update
    setTimeout(() => {
      setEdges((currentEdges) => {
        onChange?.(nodes, currentEdges)
        return currentEdges
      })
    }, 0)
  }, [onEdgesChange, nodes, onChange, setEdges])

  // Handle node click - pass through to parent with full node data
  const handleNodeClick = useCallback((_event: any, clickedNode: Node) => {
    console.log('[WorkflowCanvas] Node clicked:', clickedNode.id)
    // Find the full node from current nodes state
    const fullNode = nodes.find(n => n.id === clickedNode.id) || clickedNode
    console.log('[WorkflowCanvas] Full node data:', fullNode)
    if (onNodeClick) {
      onNodeClick(_event, fullNode)
    }
  }, [nodes, onNodeClick])

  // Handle node changes
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    // Trigger change callback after state update
    setTimeout(() => {
      setNodes((currentNodes) => {
        onChange?.(currentNodes, edges)
        return currentNodes
      })
    }, 0)
  }, [onNodesChange, edges, onChange, setNodes])

  return (
    <div className="h-full w-full" style={{ minWidth: 0, minHeight: 0 }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        connectionLineStyle={{ stroke: 'var(--sl-primary)', strokeWidth: 2 }}
        defaultEdgeOptions={{ 
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'var(--sl-primary)', strokeWidth: 2 }
        }}
        connectOnClick={false}
        connectionMode="loose"
        onNodeClick={handleNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}

