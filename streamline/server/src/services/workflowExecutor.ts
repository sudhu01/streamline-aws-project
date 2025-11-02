import { prisma } from '../utils/prisma'
import axios from 'axios'

export async function executeWorkflow(workflowId: string, triggerData: any, testMode = false) {
  console.log(`[workflowExecutor] ===== STARTING WORKFLOW EXECUTION =====`)
  console.log(`[workflowExecutor] workflowId: ${workflowId}`)
  console.log(`[workflowExecutor] testMode: ${testMode}`)
  console.log(`[workflowExecutor] triggerData:`, triggerData)
  
  const start = Date.now()
  
  // Get workflow with nodes and edges
  console.log(`[workflowExecutor] Fetching workflow from database...`)
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { rfNodes: true, rfEdges: true }
  })
  
  if (!workflow) {
    console.error(`[workflowExecutor] ERROR: Workflow ${workflowId} not found!`)
    throw new Error('Workflow not found')
  }
  
  const nodes = (workflow.rfNodes || []) as any[]
  const edges = (workflow.rfEdges || []) as any[]
  
  console.log(`[workflowExecutor] Workflow found: ${nodes.length} nodes, ${edges.length} edges`)
  
  // Find trigger node
  const triggerNode = nodes.find((n: any) => n.type === 'input' || n.data?.nodeType === 'trigger')
  console.log(`[workflowExecutor] Trigger node:`, triggerNode ? { id: triggerNode.id, type: triggerNode.type, nodeType: triggerNode.data?.nodeType } : 'None')
  
  // Prepare input data
  let workflowInput: any = null
  if (triggerNode && triggerData) {
    workflowInput = triggerData
  } else if (testMode) {
    workflowInput = triggerData?.testData || triggerData || { content: 'price BTC' }
  } else {
    workflowInput = triggerData || null
  }
  
  console.log(`[workflowExecutor] Prepared workflow input:`, workflowInput)
  
  // Create execution record with input
  console.log(`[workflowExecutor] Creating execution record...`)
  const exec = await prisma.execution.create({ 
    data: { 
      workflowId, 
      status: 'Running', 
      startedAt: new Date(),
      input: workflowInput,
      triggerType: triggerNode?.data?.integrationType || 'manual'
    } 
  })
  console.log(`[workflowExecutor] Execution record created: ${exec.id}`)
  
  try {
    // Get execution order starting from trigger
    const executionOrder = getExecutionOrder(nodes, edges, triggerNode?.id)
    
    let currentData: any = workflowInput || { content: 'price BTC' }
      const executionSteps: any[] = [] // In-memory steps array to return directly
    let finalOutput: any = null
    let formattedMessage: any = null // Preserve formatted message from function nodes
    
    console.log(`[workflowExecutor] Starting execution of ${executionOrder.length} nodes for execution ${exec.id}`)
    
    // Execute nodes in order
    for (let i = 0; i < executionOrder.length; i++) {
      const node = executionOrder[i]
      const stepStart = Date.now()
      const nodeType = node.data?.nodeType || node.type || 'default'
      
        console.log(`[workflowExecutor] Executing node ${i + 1}/${executionOrder.length}: ${node.data?.label || node.id} (${nodeType})`, {
          integrationType: node.data?.integrationType,
          nodeDataKeys: Object.keys(node.data || {})
        })
      
      // Create execution step with explicit error handling
      let step
      try {
        const stepData = {
          executionId: exec.id,
          stepNumber: i + 1,
          nodeId: node.id,
          nodeName: node.data?.label || node.id,
          nodeType: nodeType,
          status: 'Running' as const,
          startedAt: new Date(),
          input: currentData as any
        }
        console.log(`[workflowExecutor] Creating step with data:`, {
          executionId: stepData.executionId,
          stepNumber: stepData.stepNumber,
          nodeId: stepData.nodeId,
          nodeName: stepData.nodeName,
          nodeType: stepData.nodeType
        })
        
        step = await prisma.executionStep.create({
          data: stepData
        })
        
        console.log(`[workflowExecutor] Step created successfully: ${step.id} for node ${node.data?.label || node.id}`)
      } catch (stepCreateError: any) {
        console.error(`[workflowExecutor] Failed to create step for node ${node.id}:`, {
          error: stepCreateError.message,
          stack: stepCreateError.stack,
          executionId: exec.id,
          nodeId: node.id
        })
        throw new Error(`Failed to create execution step: ${stepCreateError.message}`)
      }
      
      try {
        // Execute node based on type
        const output = await executeNode(node, currentData, workflowId)
        const stepDuration = Date.now() - stepStart
        
        // Preserve formatted message from function nodes (n8n pattern: keep meaningful data)
        if (nodeType === 'function' && output?.formattedMessage) {
          formattedMessage = output.formattedMessage
          console.log(`[workflowExecutor] Captured formatted message from function node: ${formattedMessage}`)
        }
        
        // Update step with output - CRITICAL for retrieval
        try {
          const updateResult = await prisma.executionStep.update({
            where: { id: step.id },
            data: {
              status: 'Success',
              finishedAt: new Date(),
              durationMs: stepDuration,
              output: output as any
            }
          })
          console.log(`[workflowExecutor] Step updated with output: ${step.id}`, {
            hasOutput: !!updateResult.output,
            outputType: typeof updateResult.output
          })
          
            // Add step to in-memory array for immediate return (no DB query needed)
            executionSteps.push({
              id: updateResult.id,
              executionId: updateResult.executionId,
              stepNumber: updateResult.stepNumber,
              nodeId: updateResult.nodeId,
              nodeName: updateResult.nodeName,
              nodeType: updateResult.nodeType,
              status: updateResult.status,
              startedAt: updateResult.startedAt,
              finishedAt: updateResult.finishedAt,
              durationMs: updateResult.durationMs,
              input: updateResult.input,
              output: updateResult.output,
              error: null
            })
            console.log(`[workflowExecutor] Step added to in-memory array: ${updateResult.id}`)
        } catch (stepUpdateError: any) {
          console.error(`[workflowExecutor] CRITICAL: Failed to update step ${step.id}:`, {
            error: stepUpdateError.message,
            stack: stepUpdateError.stack,
            stepId: step.id,
            executionId: exec.id
          })
          // Don't throw - execution can continue, but this is a serious issue
        }
        
        currentData = output
        
        // For final output: prefer formatted message, otherwise use last meaningful output
        // Following n8n's pattern: the output should be the transformed data, not just the last node's response
        if (nodeType === 'function' && output?.formattedMessage) {
          finalOutput = output // Function output with formatted message
        } else if (nodeType === 'http' && output) {
          // HTTP nodes (like CoinGecko) - preserve price data
          finalOutput = output
        } else if (nodeType !== 'discord' || !output?.formattedMessage) {
          // For Discord nodes, don't overwrite if we already have a formatted message
          // Only update if we don't have a formatted message yet
          if (!formattedMessage) {
            finalOutput = output
          }
        }
      } catch (error: any) {
        const stepDuration = Date.now() - stepStart
        await prisma.executionStep.update({
          where: { id: step.id },
          data: {
            status: 'Failed',
            finishedAt: new Date(),
            durationMs: stepDuration,
            error: { message: error.message || String(error), stack: error.stack }
          }
        })
        throw error
      }
    }
    
    const duration = Date.now() - start
    
    // Final output: prefer formatted message, then last meaningful output
    // Following n8n pattern: output should represent the workflow's result, not just last node response
    if (formattedMessage && typeof formattedMessage === 'string') {
      // If we have a formatted message, use it as the primary output
      finalOutput = {
        message: formattedMessage,
        formattedMessage: formattedMessage,
        rawOutput: finalOutput
      }
    } else if (!finalOutput) {
      // Fallback: use last node's output or input data
      finalOutput = currentData || workflowInput
    }
    
    // Update execution with output
    try {
      await prisma.execution.update({ 
        where: { id: exec.id }, 
        data: { 
          status: 'Success', 
          finishedAt: new Date(), 
          durationMs: duration,
          output: finalOutput,
          successRate: 100 
        } 
      })
      console.log(`[workflowExecutor] Execution record updated with output`)
    } catch (updateError: any) {
      console.error(`[workflowExecutor] Failed to update execution record:`, updateError)
      throw updateError
    }
    
    await prisma.workflow.update({ where: { id: workflowId }, data: { lastRunAt: new Date() } })
    
    // Log output for debugging
    console.log('[workflowExecutor] Execution completed:', {
      executionId: exec.id,
      hasOutput: !!finalOutput,
      outputType: typeof finalOutput,
      outputValue: finalOutput,
      formattedMessage: formattedMessage,
      stepsCount: executionSteps.length,
      workflowId
    })
    
    return { 
      ok: true, 
      executionId: exec.id, 
      testMode, 
      triggerData: workflowInput, 
      output: finalOutput,
      input: workflowInput,
      steps: executionSteps // Return steps array directly from memory
    }
  } catch (e: any) {
    const duration = Date.now() - start
    await prisma.execution.update({ 
      where: { id: exec.id }, 
      data: { 
        status: 'Failed', 
        finishedAt: new Date(),
        durationMs: duration,
        error: { message: e.message || String(e) }
      } 
    })
    return { ok: false, error: e.message || 'Execution failed', executionId: exec.id }
  }
}

function getExecutionOrder(nodes: any[], edges: any[], startNodeId?: string): any[] {
  if (!startNodeId) {
    const trigger = nodes.find((n: any) => n.type === 'input' || n.data?.nodeType === 'trigger')
    if (trigger) startNodeId = trigger.id
    else return nodes // No trigger, return all nodes
  }
  
  const visited = new Set<string>()
  const ordered: any[] = []
  
  function visit(nodeId: string) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    
    const node = nodes.find((n: any) => n.id === nodeId)
    if (node) {
      ordered.push(node)
      
      // Visit connected nodes
      const outgoingEdges = edges.filter((e: any) => e.source === nodeId)
      for (const edge of outgoingEdges) {
        visit(edge.target)
      }
    }
  }
  
  visit(startNodeId!)
  return ordered
}

async function executeNode(node: any, inputData: any, workflowId: string): Promise<any> {
  const nodeType = node.data?.nodeType || node.type || 'default'
  const integrationType = node.data?.integrationType
  
  console.log('[executeNode] Node type detection:', {
    nodeId: node.id,
    nodeName: node.data?.label,
    nodeType,
    integrationType,
    hasUrl: !!node.data?.url,
    hasBodyParams: !!node.data?.bodyParameters
  })
  
  // Slack Trigger - extract coin from message
  if (nodeType === 'trigger' && integrationType === 'slack') {
    const message = inputData?.content || inputData?.text || inputData?.message || ''
    const parts = String(message).trim().split(' ')
    const coin = (parts[1] || 'bitcoin').toLowerCase()
    return { coin, message, originalInput: inputData }
  }
  
  // HTTP Request node (CoinGecko API)
  if (nodeType === 'http') {
    const url = node.data?.url || ''
    const coin = inputData?.coin || 'bitcoin'
    
    if (url.includes('coingecko') || url.includes('api.coingecko.com')) {
      try {
        // Call CoinGecko API
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`, {
          timeout: 10000
        })
        return {
          [coin]: response.data[coin] || { usd: 'N/A' }
        }
      } catch (error: any) {
        throw new Error(`CoinGecko API error: ${error.message}`)
      }
    }
    
    // Generic HTTP request
    try {
      const method = node.data?.method || 'GET'
      const response = await axios.request({
        method,
        url,
        data: inputData,
        timeout: 10000
      })
      return response.data
    } catch (error: any) {
      throw new Error(`HTTP request failed: ${error.message}`)
    }
  }
  
  // Function node
  if (nodeType === 'function') {
    const code = node.data?.code || ''
    try {
      const $json = inputData
      const $input = inputData
      
      // Wrap code in a function and execute
      let result: any
      if (code.trim().startsWith('return') || !code.trim().includes('return')) {
        // eslint-disable-next-line no-eval
        const func = eval(`(function($json, $input) { ${code} })`)
        result = func($json, $input)
      } else if (code.trim().startsWith('function') || code.trim().includes('=>')) {
        // eslint-disable-next-line no-eval
        const func = eval(`(${code})`)
        result = func($json, $input)
      } else {
        // eslint-disable-next-line no-eval
        result = eval(`(function() { const $json = ${JSON.stringify($json)}; const $input = ${JSON.stringify($input)}; ${code} })()`)
      }
      
      // If result is undefined, format price data
      if (result === undefined || result === null) {
        if (inputData?.bitcoin?.usd || inputData?.btc?.usd) {
          const coin = Object.keys(inputData).find(k => k !== 'coin') || 'BTC'
          const price = inputData[coin]?.usd || inputData.bitcoin?.usd || inputData.btc?.usd || 'N/A'
          result = {
            formattedMessage: `💰 ${coin.toUpperCase()} Price: $${price}`,
            coin,
            price
          }
        } else if (inputData?.coin) {
          const coinKey = inputData.coin
          const priceData = inputData[coinKey]
          if (priceData?.usd) {
            result = {
              formattedMessage: `💰 ${coinKey.toUpperCase()} Price: $${priceData.usd}`,
              coin: coinKey,
              price: priceData.usd
            }
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
    console.log('[Discord] Processing Discord node:', {
      nodeId: node.id,
      nodeName: node.data?.label || node.id,
      hasUrl: !!node.data?.url,
      url: node.data?.url?.substring(0, 60) + '...', // Log partial URL for security
      hasBodyParams: !!node.data?.bodyParameters,
      bodyParams: node.data?.bodyParameters,
      inputDataKeys: inputData ? Object.keys(inputData) : [],
      hasFormattedMessage: !!inputData?.formattedMessage,
      isArray: Array.isArray(inputData),
      inputDataType: Array.isArray(inputData) ? 'array' : typeof inputData,
      inputDataStructure: Array.isArray(inputData) && inputData.length > 0 ? Object.keys(inputData[0]) : (inputData ? Object.keys(inputData) : [])
    })
    
    const url = node.data?.url || ''
    const bodyParams = node.data?.bodyParameters || ''
    
    if (!url || !url.includes('discord.com/api/webhooks')) {
      console.error('[Discord] Invalid webhook URL:', { 
        hasUrl: !!url, 
        urlCheck: url.includes('discord.com/api/webhooks') 
      })
      throw new Error('Invalid Discord webhook URL')
    }
    
    try {
      // Normalize input data - handle array format from function nodes
      let normalizedInput = inputData
      if (Array.isArray(inputData) && inputData.length > 0) {
        normalizedInput = inputData[0]
        console.log('[Discord] Normalized array input, extracted first element:', {
          originalLength: inputData.length,
          normalizedKeys: Object.keys(normalizedInput),
          hasContent: !!normalizedInput?.content,
          hasFormattedMessage: !!normalizedInput?.formattedMessage
        })
      }
      
      // Parse body parameters template (e.g., "content: {{$json.content}}")
      let body: any = {}
      
      if (bodyParams && bodyParams.trim()) {
        // Simple template parsing - extract key-value pairs
        const lines = bodyParams.split('\n').filter((l: string) => l.trim())
        for (const line of lines) {
          const match = line.match(/^(\w+):\s*(.+)$/)
          if (match) {
            const key = match[1]
            let value = match[2].trim()
            
            console.log('[Discord] Processing template line:', { key, originalValue: value })
            
            // Replace template variables with actual data
            // Replace {{$json.formattedMessage}} with the formatted message
            if (normalizedInput?.formattedMessage) {
              value = value.replace(/\{\{\$json\.formattedMessage\}\}/g, normalizedInput.formattedMessage)
              console.log('[Discord] Replaced {{$json.formattedMessage}}:', {
                found: true,
                newValue: value
              })
            }
            // Replace {{$json.content}} 
            if (normalizedInput?.content !== undefined) {
              const beforeReplace = value
              value = value.replace(/\{\{\$json\.content\}\}/g, String(normalizedInput.content))
              if (beforeReplace !== value) {
                console.log('[Discord] Replaced {{$json.content}}:', {
                  found: true,
                  oldValue: beforeReplace,
                  newValue: value
                })
              }
            }
            // Replace {{$json.message}}
            if (normalizedInput?.message !== undefined) {
              value = value.replace(/\{\{\$json\.message\}\}/g, String(normalizedInput.message))
            }
            // Replace entire {{$json}} object
            if (value.includes('{{$json}}')) {
              value = value.replace(/\{\{\$json\}\}/g, JSON.stringify(normalizedInput))
            }
            
            console.log('[Discord] Final template value:', { key, value })
            
            // Try to parse as JSON if it looks like JSON
            try {
              // If the value looks like a JSON string or array, parse it
              if (value.trim().startsWith('[') || value.trim().startsWith('{')) {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  body = parsed
                } else {
                  body[key] = parsed
                }
              } else {
                body[key] = value
              }
            } catch {
              // Not valid JSON, use as string
              body[key] = value
            }
          }
        }
      }
      
      // If body is empty or no bodyParams, use default
      if (!bodyParams || Object.keys(body).length === 0) {
        // Default: send formattedMessage as content, or wrap in array if needed
        const contentToSend = normalizedInput?.formattedMessage || normalizedInput?.content || JSON.stringify(inputData)
        
        // Discord expects either { content: "..." } or [{ content: "..." }]
        // Check if contentToSend is already an array string
        try {
          const parsed = JSON.parse(contentToSend)
          if (Array.isArray(parsed)) {
            body = parsed
          } else {
            body = { content: contentToSend }
          }
        } catch {
          // If formattedMessage contains array-like structure, parse it
          if (contentToSend.trim().startsWith('[') && contentToSend.trim().endsWith(']')) {
            try {
              body = JSON.parse(contentToSend)
            } catch {
              body = { content: contentToSend }
            }
          } else {
            body = { content: contentToSend }
          }
        }
      }
      
      // Send to Discord webhook
      console.log('[Discord] Sending webhook request:', {
        url: url.substring(0, 60) + '...',
        body: JSON.stringify(body),
        hasContent: !!body.content
      })
      
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      console.log('[Discord] Webhook sent successfully:', {
        status: response.status,
        statusText: response.statusText
      })
      
      return {
        status: 'sent',
        message: body,
        url,
        discordResponse: response.status,
        bodyParams
      }
    } catch (error: any) {
      console.error('[Discord] Webhook failed:', {
        error: error.message,
        response: error.response?.data || 'No response data',
        status: error.response?.status || 'No status'
      })
      throw new Error(`Discord webhook failed: ${error.message}`)
    }
  }
  
  // Default - pass through
  return inputData
}

