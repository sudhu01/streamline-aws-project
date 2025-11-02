import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import WorkflowCanvas from '../components/workflows/WorkflowCanvas'
import NodeLibrary from '../components/workflows/NodeLibrary'
import FunctionNode from '../components/workflows/FunctionNode'
import DefaultNode from '../components/workflows/DefaultNode'
import NodeConfigPanel from '../components/workflows/NodeConfigPanel'
import EdgeConfigPanel from '../components/workflows/EdgeConfigPanel'
import WorkflowLogsPanel from '../components/workflows/WorkflowLogsPanel'
import { getWorkflow, updateWorkflow, testWorkflow, toggleWorkflowStatus } from '../services/workflowService'
import { type Node, type Edge, type NodeTypes } from 'reactflow'

export interface LogEntry {
  id: string
  timestamp: Date
  nodeId?: string
  nodeName?: string
  type: 'trigger' | 'node' | 'error' | 'success' | 'info'
  message: string
  data?: any
  input?: any
  output?: any
}

export default function WorkflowEditorPage() {
  const { id } = useParams()
  const [wf, setWf] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    (async () => { 
      if (!id) return
      const data = await getWorkflow(id)
      setWf(data)
      
      // Ensure nodes have nodeType in data if missing
      const nodesWithType = (data.rfNodes || []).map((node: Node) => {
        if (!node.data?.nodeType) {
          // Infer nodeType from existing data
          let inferredType = node.type || 'default'
          if (node.type === 'function') {
            inferredType = 'function'
          } else if (node.data?.integrationType) {
            const intType = node.data.integrationType
            if (['discord', 'telegram'].includes(intType) && node.data?.connectionMode === 'webhook') {
              inferredType = 'webhook'
            } else if (['slack', 'airtable', 'news_api', 'twilio'].includes(intType)) {
              inferredType = 'api'
            }
          } else if (node.data?.type === 'http' || node.type === 'http') {
            inferredType = 'http'
          }
          
          return {
            ...node,
            data: {
              ...node.data,
              nodeType: inferredType
            }
          }
        }
        return node
      })
      
      setNodes(nodesWithType)
      setEdges(data.rfEdges || [])
    })()
  }, [id])

  // Sync selected node when nodes array changes (from ReactFlow selection)
  useEffect(() => {
    const selected = nodes.find(n => n.selected)
    console.log('[WorkflowEditor] Selection sync - selected node in array:', selected?.id)
    console.log('[WorkflowEditor] Current selectedNode state:', selectedNode?.id)
    
    if (selected) {
      // Only update if different node is selected
      if (!selectedNode || selectedNode.id !== selected.id) {
        console.log('[WorkflowEditor] Updating selectedNode to:', selected.id)
        setSelectedNode(selected)
      }
    } else if (selectedNode) {
      // Check if the previously selected node is still in the array and unselected
      const stillExists = nodes.find(n => n.id === selectedNode.id)
      if (!stillExists || !stillExists.selected) {
        console.log('[WorkflowEditor] Clearing selectedNode')
        setSelectedNode(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  async function save(partial: any) {
    if (!id) return
    setSaving(true)
    const updated = await updateWorkflow(id, partial)
    setWf(updated)
    setSaving(false)
  }

  function handleAddNode(nodeData: any) {
    console.log('[WorkflowEditor] Adding node:', nodeData)
    
    // Determine the React Flow node type (use 'default' for React Flow, but store nodeType in data)
    let rfNodeType: string = 'default'
    const nodeType = nodeData.type || nodeData.nodeType || 'default'
    
    // Only set custom React Flow types for function nodes (which have a custom component)
    // For other types, use 'default' but store type info in data
    if (nodeType === 'function') {
      rfNodeType = 'function'
    }

    const newNode: Node = {
      id: nodeData.id,
      type: rfNodeType, // React Flow visual type
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: nodeData.name || 'Node',
        nodeType: nodeType, // Store our internal node type for configuration
        integrationType: nodeData.integrationType,
        integrationId: nodeData.integrationId,
        ...nodeData // Spread other properties
      }
    }
    
    console.log('[WorkflowEditor] Created node:', newNode)
    
    const updatedNodes = [...nodes, newNode]
    setNodes(updatedNodes)
    setSelectedNode(newNode)
    save({ rfNodes: updatedNodes, rfEdges: edges })
  }

  function handleCanvasChange(updatedNodes: Node[], updatedEdges: Edge[]) {
    setNodes(updatedNodes)
    setEdges(updatedEdges)
    
    // Sync selected node with nodes array
    if (selectedNode) {
      const updatedSelectedNode = updatedNodes.find(n => n.id === selectedNode.id)
      if (updatedSelectedNode) {
        setSelectedNode(updatedSelectedNode)
      } else {
        // Node might have been deleted or not found, check if any node is selected
        const anySelected = updatedNodes.find(n => n.selected)
        setSelectedNode(anySelected || null)
      }
    } else {
      // If no node was selected but a node is now selected, update
      const anySelected = updatedNodes.find(n => n.selected)
      if (anySelected) {
        setSelectedNode(anySelected)
      }
    }
    
    save({ rfNodes: updatedNodes, rfEdges: updatedEdges })
  }

  function handleNodeUpdate(updates: any) {
    if (!selectedNode) return
    
    const updatedNodes = nodes.map(node => {
      if (node.id === selectedNode.id) {
        const updatedData = {
          ...node.data,
          ...updates
        }
        return { ...node, data: updatedData }
      }
      return node
    })
    
    setNodes(updatedNodes)
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } })
    save({ rfNodes: updatedNodes, rfEdges: edges })
  }

  function handleNodeClick(_event: any, node: Node) {
    console.log('[WorkflowEditor] Node clicked:', node.id, node.type, node.data)
    // Find the full node from the nodes array to ensure we have all data
    const fullNode = nodes.find(n => n.id === node.id) || node
    console.log('[WorkflowEditor] Full node found:', fullNode)
    console.log('[WorkflowEditor] Current nodes array:', nodes.map(n => ({ id: n.id, selected: n.selected })))
    setSelectedNode(fullNode)
    setSelectedEdge(null) // Clear edge selection when node is clicked
    console.log('[WorkflowEditor] Selected node set to:', fullNode.id)
  }

  function handleEdgeClick(_event: any, edge: Edge) {
    console.log('[WorkflowEditor] Edge clicked:', edge.id, edge.source, edge.target)
    // Find the full edge from the edges array
    const fullEdge = edges.find(e => e.id === edge.id) || edge
    setSelectedEdge(fullEdge)
    setSelectedNode(null) // Clear node selection when edge is clicked
    console.log('[WorkflowEditor] Selected edge set to:', fullEdge.id)
  }

  function handlePaneClick() {
    setSelectedNode(null)
    setSelectedEdge(null)
  }

  function handleDeleteNode(nodeId: string) {
    // Remove the node
    const updatedNodes = nodes.filter(n => n.id !== nodeId)
    // Remove edges connected to this node
    const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    
    setNodes(updatedNodes)
    setEdges(updatedEdges)
    setSelectedNode(null)
    save({ rfNodes: updatedNodes, rfEdges: updatedEdges })
  }

  function handleDeleteEdge(edgeId: string) {
    // Remove the edge
    const updatedEdges = edges.filter(e => e.id !== edgeId)
    
    setEdges(updatedEdges)
    setSelectedEdge(null)
    save({ rfNodes: nodes, rfEdges: updatedEdges })
  }

  function handleSetAsTrigger(nodeId: string) {
    // Set a node as trigger by changing its type to 'input' and adding trigger marker
    // First, unset any other trigger nodes
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        // Update the selected node to be a trigger
        return {
          ...node,
          type: 'input', // React Flow uses 'input' type for trigger nodes
          data: {
            ...node.data,
            nodeType: 'trigger',
            label: node.data?.label || 'Trigger'
          }
        }
      } else if (node.type === 'input' || node.type === 'trigger' || node.data?.nodeType === 'trigger') {
        // Unset other trigger nodes
        return {
          ...node,
          type: 'default',
          data: {
            ...node.data,
            nodeType: node.data?.nodeType === 'trigger' ? undefined : node.data?.nodeType
          }
        }
      }
      return node
    })
    
    setNodes(updatedNodes)
    if (selectedNode?.id === nodeId) {
      const updatedSelectedNode = updatedNodes.find(n => n.id === nodeId)
      if (updatedSelectedNode) {
        setSelectedNode(updatedSelectedNode)
      }
    }
    save({ rfNodes: updatedNodes, rfEdges: edges })
  }

  async function handleTestWorkflow() {
    if (!id || !wf) return
    
    setIsExecuting(true)
    setExecutionLogs([])
    
    const startTime = new Date()
    const triggerNode = nodes.find(n => n.type === 'input' || n.data?.nodeType === 'trigger')
    
    try {
      // Add initial log
      const initialLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: startTime,
        type: 'info',
        message: 'Starting workflow test execution...'
      }
      setExecutionLogs([initialLog])
      
      // Add trigger log
      if (triggerNode) {
        const triggerLog: LogEntry = {
          id: `log-${Date.now()}-trigger`,
          timestamp: new Date(),
          nodeId: triggerNode.id,
          nodeName: triggerNode.data?.label || 'Trigger',
          type: 'trigger',
          message: `Trigger activated: ${triggerNode.data?.integrationType || 'Manual'} trigger`,
          data: { message: 'price BTC' } // Mock trigger data
        }
        setExecutionLogs(prev => [...prev, triggerLog])
      }
      
      // Show initial server execution log
      setExecutionLogs(prev => [...prev, {
        id: `log-${Date.now()}-api-start`,
        timestamp: new Date(),
        type: 'info',
        message: 'Executing workflow on server...'
      }])
      
      // Start server execution (non-blocking visual feedback)
      const serverExecutionPromise = testWorkflow(id, { testData: { content: 'price BTC' } })
      
      // Wait for server execution to complete
      let serverResult: any = null
      try {
        serverResult = await serverExecutionPromise
        console.log('API test result:', serverResult)
      } catch (apiError) {
        console.error('API test error:', apiError)
        const errorLog: LogEntry = {
          id: `log-${Date.now()}-api-error`,
          timestamp: new Date(),
          type: 'error',
          message: `Server execution failed: ${(apiError as any)?.response?.data?.error || (apiError as any)?.message || 'Unknown error'}`,
          data: { error: (apiError as any)?.response?.data || (apiError as any)?.message }
        }
        setExecutionLogs(prev => [...prev, errorLog])
        setIsExecuting(false)
        return
      }
      
      // Use steps directly from serverResult (no polling needed!)
      if (serverResult?.steps && Array.isArray(serverResult.steps) && serverResult.steps.length > 0) {
        try {
          console.log('[Steps Processing] Using steps from API response:', serverResult.steps.length)
          
          // Replace logs with real server execution data
            setExecutionLogs(prev => {
              const keptLogs = prev.filter(log => 
                log.type === 'info' && (log.message.includes('Starting') || log.message.includes('Executing workflow on server'))
              )
              
              // Add trigger log if not already there
              if (triggerNode && !keptLogs.some(l => l.type === 'trigger')) {
                keptLogs.push({
                  id: `log-trigger-${Date.now()}`,
                  timestamp: new Date(),
                  nodeId: triggerNode.id,
                  nodeName: triggerNode.data?.label || 'Trigger',
                  type: 'trigger',
                  message: `Trigger activated: ${triggerNode.data?.integrationType || 'Manual'} trigger`,
                data: serverResult.triggerData || { content: 'price BTC' }
                })
              }
              
              // Add server execution steps in order
              const serverLogs: LogEntry[] = []
            for (const step of serverResult.steps) {
                // Executing log
                serverLogs.push({
                  id: `log-exec-${step.nodeId}-${step.stepNumber}`,
                  timestamp: new Date(step.startedAt),
                  nodeId: step.nodeId,
                  nodeName: step.nodeName,
                  type: 'node',
                  message: `Executing node: ${step.nodeName} (${step.nodeType})`,
                  input: step.input || null
                })
                
                // Completion log
                serverLogs.push({
                  id: `log-${step.nodeId}-${step.stepNumber}-complete`,
                  timestamp: new Date(step.finishedAt || step.startedAt),
                  nodeId: step.nodeId,
                  nodeName: step.nodeName,
                  type: step.status === 'Success' ? 'success' : step.status === 'Failed' ? 'error' : 'node',
                  message: step.status === 'Success' ? 'Node executed successfully' : `Node execution ${step.status.toLowerCase()}`,
                  output: step.output || null,
                  data: step.error || null
                })
              }
              
              return [...keptLogs, ...serverLogs]
            })
          
          // Clean up input - remove testData wrapper if present
          let workflowInput = serverResult?.input || serverResult?.triggerData
          if (workflowInput && workflowInput.testData) {
            workflowInput = workflowInput.testData
          }
          if (!workflowInput) {
            workflowInput = { content: 'price BTC' }
          }
          
          // Extract output - use serverResult.output directly (simplified!)
          let finalOutput: any = serverResult?.output || null
          
          // If no direct output, try extracting from steps
          if (!finalOutput && serverResult.steps && serverResult.steps.length > 0) {
            // Find last step with output
            const stepsWithOutput = serverResult.steps.filter((s: any) => 
              s.output !== null && s.output !== undefined
            )
            
            if (stepsWithOutput.length > 0) {
              // Prefer function node output (formatted message)
              const functionStep = stepsWithOutput.find((s: any) => s.nodeType === 'function')
              if (functionStep && functionStep.output) {
                finalOutput = functionStep.output
              } else {
                // Use last step with output
                  const lastStepWithOutput = stepsWithOutput[stepsWithOutput.length - 1]
                  if (lastStepWithOutput && lastStepWithOutput.output) {
                    finalOutput = lastStepWithOutput.output
                  }
                }
              }
          }
          
          console.log('[Output Extraction] Final output:', { hasOutput: !!finalOutput, type: typeof finalOutput })
          
          // Show final execution summary
          const endLog: LogEntry = {
            id: `log-${Date.now()}-end`,
            timestamp: new Date(),
            type: serverResult.ok ? 'success' : 'error',
            message: serverResult.ok ? 'Workflow execution completed' : 'Workflow execution failed',
            data: { 
              executionId: serverResult?.executionId
            },
            input: workflowInput,
            output: finalOutput || undefined
          }
          
          setExecutionLogs(prev => [...prev, endLog])
        } catch (error) {
          console.error('Failed to process steps:', error)
        }
      } else {
        // No execution ID, show completion with server result
        let workflowInput = serverResult?.input || serverResult?.triggerData
        if (workflowInput && workflowInput.testData) {
          workflowInput = workflowInput.testData
        }
        if (!workflowInput) {
          workflowInput = { content: 'price BTC' }
        }
        
        const endLog: LogEntry = {
          id: `log-${Date.now()}-end`,
          timestamp: new Date(),
          type: 'success',
          message: 'Workflow execution completed',
          data: { executionId: serverResult?.executionId },
          input: workflowInput,
          output: serverResult?.output || null
        }
        setExecutionLogs(prev => [...prev, endLog])
      }
      
    } catch (error: any) {
      const errorLog: LogEntry = {
        id: `log-${Date.now()}-error`,
        timestamp: new Date(),
        type: 'error',
        message: `Workflow test failed: ${error.message || 'Unknown error'}`,
        data: { error: error.message || String(error) }
      }
      setExecutionLogs(prev => [...prev, errorLog])
    } finally {
      setIsExecuting(false)
    }
  }
  
  function getExecutionOrder(nodes: Node[], edges: Edge[], startNodeId?: string): Node[] {
    if (!startNodeId) {
      // Find trigger node
      const trigger = nodes.find(n => n.type === 'input' || n.data?.nodeType === 'trigger')
      if (trigger) startNodeId = trigger.id
      else return nodes // No trigger, return all nodes
    }
    
    const visited = new Set<string>()
    const ordered: Node[] = []
    
    function visit(nodeId: string) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        ordered.push(node)
        
        // Visit connected nodes
        const outgoingEdges = edges.filter(e => e.source === nodeId)
        for (const edge of outgoingEdges) {
          visit(edge.target)
        }
      }
    }
    
    visit(startNodeId)
    return ordered
  }
  
  async function simulateNodeExecution(node: Node, inputData: any): Promise<any> {
    const nodeType = node.data?.nodeType || node.type || 'default'
    const integrationType = node.data?.integrationType
    
    // Slack Trigger node - extract coin from message
    if (nodeType === 'trigger' && integrationType === 'slack') {
      const message = inputData?.content || inputData?.text || ''
      const parts = message.trim().split(' ')
      const coin = (parts[1] || 'bitcoin').toLowerCase()
      return { coin, message }
    }
    
    // HTTP Request node (CoinGecko API)
    if (nodeType === 'http') {
      const url = node.data?.url || ''
      const coin = inputData?.coin || 'bitcoin'
      
      // Simulate CoinGecko API call
      if (url.includes('coingecko')) {
        const mockPrice = Math.random() * 50000 + 30000 // Random price between 30k-80k
        return {
          [coin]: {
            usd: mockPrice.toFixed(2)
          }
        }
      }
      
      // Generic HTTP request
      return { status: 'ok', data: inputData }
    }
    
    // Function node
    if (nodeType === 'function') {
      const code = node.data?.code || ''
      try {
        // Create a safe execution context
        const $json = inputData
        const $input = inputData
        
        // Check if code is a function or a return statement
        let result: any
        if (code.trim().startsWith('return') || !code.trim().includes('return')) {
          // It's a code block - wrap it in a function
          // eslint-disable-next-line no-eval
          const func = eval(`(function($json, $input) { ${code} })`)
          result = func($json, $input)
        } else if (code.trim().startsWith('function') || code.trim().includes('=>')) {
          // It's already a function definition
          // eslint-disable-next-line no-eval
          const func = eval(`(${code})`)
          result = func($json, $input)
        } else {
          // Try to execute as-is
          // eslint-disable-next-line no-eval
          result = eval(`(function() { const $json = ${JSON.stringify($json)}; const $input = ${JSON.stringify($input)}; ${code} })()`)
        }
        
        // If result is undefined, try to format the message
        if (result === undefined || result === null) {
          // Default formatting for price data
          if (inputData?.bitcoin?.usd || inputData?.btc?.usd || inputData?.coin) {
            const coin = inputData.coin || 'BTC'
            const price = inputData.bitcoin?.usd || inputData.btc?.usd || inputData[coin]?.usd || 'N/A'
            result = {
              formattedMessage: `💰 ${coin.toUpperCase()} Price: $${price}`,
              coin,
              price
            }
          } else {
            result = { formattedMessage: JSON.stringify(inputData) }
          }
        }
        
        return result
      } catch (error: any) {
        throw new Error(`Function execution error: ${error.message}`)
      }
    }
    
    // Discord HTTP node
    if (integrationType === 'discord' && nodeType !== 'trigger') {
      const url = node.data?.url || ''
      const bodyParams = node.data?.bodyParameters || ''
      
      // Simulate Discord webhook POST
      const formattedMessage = inputData?.formattedMessage || JSON.stringify(inputData)
      return { 
        status: 'sent', 
        message: formattedMessage,
        url,
        bodyParams
      }
    }
    
    // Default - pass through
    return inputData
  }

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    function: FunctionNode,
    default: DefaultNode,
    input: DefaultNode, // React Flow's input type for triggers
    webhook: DefaultNode,
    http: DefaultNode,
    api: DefaultNode,
    trigger: DefaultNode
  }), [])

  if (!wf) return <div className="p-6">Loading...</div>

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col mt-16">
      <div className="border-b bg-surface px-4 h-14 flex items-center gap-3">
        <Link to="/workflows" className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Back</Link>
        <input value={wf.name} onChange={(e)=>setWf({...wf, name: e.target.value})} onBlur={()=>save({ name: wf.name })} className="font-semibold bg-transparent outline-none" />
        <div className="flex-1" />
        <button onClick={()=>toggleWorkflowStatus(wf.id, !wf.isActive).then(setWf)} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">{wf.isActive?'Deactivate':'Activate'}</button>
        <button disabled={saving} onClick={()=>save({})} className="px-3 py-1 rounded bg-[color:var(--sl-primary)] text-white">{saving?'Saving...':'Save'}</button>
        <button 
          onClick={handleTestWorkflow} 
          disabled={isExecuting}
          className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)] disabled:opacity-50"
        >
          {isExecuting ? 'Testing...' : 'Test'}
        </button>
        <button className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Deploy</button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <aside className="w-64 border-r p-3 overflow-auto shrink-0">
            <div className="font-semibold mb-2">Library</div>
            <NodeLibrary onAddNode={handleAddNode} />
          </aside>
          <main className="flex-1 min-w-0 overflow-hidden" style={{ minHeight: '1100px', height: 'calc(100vh - 270px)' }}>
            <WorkflowCanvas 
              initialNodes={nodes} 
              initialEdges={edges} 
              onChange={handleCanvasChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
            />
          </main>
          <aside className="w-64 border-l p-3 overflow-auto shrink-0">
            <div className="font-semibold mb-2">
              {selectedEdge ? 'Connection Configuration' : 'Node Configuration'}
            </div>
            {selectedEdge ? (
              <EdgeConfigPanel 
                edge={selectedEdge}
                onDelete={handleDeleteEdge}
                sourceNodeName={nodes.find(n => n.id === selectedEdge.source)?.data?.label || selectedEdge.source}
                targetNodeName={nodes.find(n => n.id === selectedEdge.target)?.data?.label || selectedEdge.target}
              />
            ) : (
              <NodeConfigPanel 
                node={selectedNode} 
                onUpdate={handleNodeUpdate}
                onDelete={handleDeleteNode}
                onSetAsTrigger={handleSetAsTrigger}
              />
            )}
          </aside>
        </div>
        <WorkflowLogsPanel logs={executionLogs} isRunning={isExecuting} />
      </div>
    </div>
  )
}

