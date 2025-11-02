import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

export const workflowsRouter = Router()

workflowsRouter.get('/recent', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '5'), 10) || 5, 20)
    const recent = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          select: { status: true, successRate: true, startedAt: true }
        }
      }
    })

    const mapped = recent.map((w: any) => ({
      id: w.id,
      name: w.name,
      status: (w.executions[0]?.status === 'Success' || w.executions[0]?.status === 'Running') ? 'Active' : 'Inactive',
      lastRun: w.executions[0]?.startedAt ?? null,
      successRate: w.executions[0]?.successRate ?? null,
    }))

    return res.json(mapped)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load workflows' })
  }
})

// Create workflow
workflowsRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.auth.userId
    const user = await prisma.user.findFirst({ where: { clerkUserId } })
    if (!user) return res.status(404).json({ error: 'User not found. Please ensure you are signed in.' })
    
    const wf = await prisma.workflow.create({ data: { ownerId: user.id, name: req.body.name || 'Untitled Workflow', description: req.body.description || null, isActive: false, triggerType: req.body.triggerType || null, triggerConfig: (req.body.triggerConfig || null) as any, rfNodes: (req.body.rfNodes || []) as any, rfEdges: (req.body.rfEdges || []) as any } })
    res.status(201).json(wf)
  } catch (e: any) { 
    console.error('Create workflow error:', e)
    res.status(400).json({ error: e?.message || 'Failed to create workflow' }) 
  }
})

// List workflows with filters/search
workflowsRouter.get('/', requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.auth.userId
    const user = await prisma.user.findFirst({ where: { clerkUserId } })
    if (!user) return res.status(404).json({ error: 'User not found. Please ensure you are signed in.' })
    
    const { q, status, sort = 'updatedAt' } = req.query as any
    const where: any = { ownerId: user.id }
    if (q) where.name = { contains: String(q), mode: 'insensitive' }
    if (status === 'Active') where.isActive = true
    if (status === 'Inactive') where.isActive = false
    const orderBy: any = sort === 'name' ? { name: 'asc' } : sort === 'createdAt' ? { createdAt: 'desc' } : sort === 'lastRun' ? { lastRunAt: 'desc' } : { updatedAt: 'desc' }
    const items = await prisma.workflow.findMany({ where, orderBy, take: 50 })
    res.json(items)
  } catch (e: any) { 
    console.error('List workflows error:', e)
    res.status(500).json({ error: e?.message || 'Failed to list workflows' }) 
  }
})

// Get workflow details
workflowsRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.workflow.findUnique({ where: { id: req.params.id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (e) { res.status(500).json({ error: 'Failed to get workflow' }) }
})

// Update workflow
workflowsRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.workflow.update({ where: { id: req.params.id }, data: req.body })
    res.json(item)
  } catch (e) { res.status(400).json({ error: 'Failed to update workflow' }) }
})

// Delete workflow
workflowsRouter.delete('/:id', requireAuth, async (req, res) => {
  try { await prisma.workflow.delete({ where: { id: req.params.id } }); res.status(204).end() } catch (e) { res.status(400).json({ error: 'Failed to delete workflow' }) }
})

// Duplicate workflow
workflowsRouter.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const wf = await prisma.workflow.findUnique({ where: { id: req.params.id } })
    if (!wf) return res.status(404).json({ error: 'Not found' })
    const copy = await prisma.workflow.create({ data: { ownerId: wf.ownerId, name: `${wf.name} Copy`, description: wf.description, isActive: false, triggerType: wf.triggerType, triggerConfig: wf.triggerConfig as any, rfNodes: wf.rfNodes as any, rfEdges: wf.rfEdges as any } })
    res.status(201).json(copy)
  } catch (e) { res.status(400).json({ error: 'Failed to duplicate workflow' }) }
})

// Toggle status
workflowsRouter.patch('/:id/status', requireAuth, async (req, res) => {
  try { const item = await prisma.workflow.update({ where: { id: req.params.id }, data: { isActive: !!req.body.isActive } }); res.json(item) } catch (e) { res.status(400).json({ error: 'Failed to update status' }) }
})

// Test execution
import { executeWorkflow } from '../services/workflowExecutor'
workflowsRouter.post('/:id/test', requireAuth, async (req, res) => {
  try {
    // Pass testData or default trigger data
    const triggerData = req.body?.testData || req.body || { content: 'price BTC' }
    console.log(`[workflows/test] Starting test execution for workflow ${req.params.id} with triggerData:`, triggerData)
    
    const result = await executeWorkflow(req.params.id, triggerData, true)
    
    console.log(`[workflows/test] Execution completed:`, {
      ok: result.ok,
      executionId: result.executionId,
      hasOutput: !!result.output,
      outputType: typeof result.output,
      outputValue: result.output,
      hasInput: !!result.input,
      stepsCount: result.steps?.length || 0
    })
    
    // Ensure output and steps are ALWAYS included in response, even if null/undefined
    const response = {
      ok: result.ok,
      executionId: result.executionId,
      testMode: result.testMode,
      triggerData: result.triggerData,
      input: result.input || null,
      output: result.output !== undefined ? result.output : null, // Explicitly set to null if undefined
      steps: result.steps || [] // Include steps array directly from executor
    }
    
    console.log(`[workflows/test] Sending response:`, {
      ...response,
      outputType: typeof response.output,
      hasOutput: !!response.output,
      stepsCount: response.steps.length
    })
    
    res.json(response)
  } catch (e: any) {
    console.error(`[workflows/test] Test execution failed:`, e.message, e.stack)
    res.status(400).json({ error: e.message || 'Test failed' })
  }
})

