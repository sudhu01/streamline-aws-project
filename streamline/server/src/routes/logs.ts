import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

export const logsRouter = Router()

logsRouter.get('/recent', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 50)
    const status = String(req.query.status || 'all')
    const where = status === 'all' ? {} : { status }
    const recent = await prisma.execution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        workflow: { select: { id: true, name: true } }
      }
    })
    return res.json(recent)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load logs' })
  }
})

// List logs with filters/pagination/sorting
logsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { q, status = 'all', from, to, workflowId, sort = 'startedAt', order = 'desc', page = '1', pageSize = '25' } = req.query as any
    const where: any = {}
    if (status !== 'all') where.status = String(status)
    if (workflowId) where.workflowId = String(workflowId)
    if (from || to) where.startedAt = { gte: from ? new Date(String(from)) : undefined, lte: to ? new Date(String(to)) : undefined }
    if (q) where.workflow = { name: { contains: String(q), mode: 'insensitive' } }
    const skip = (parseInt(page,10)-1) * parseInt(pageSize,10)
    const take = Math.min(parseInt(pageSize,10) || 25, 100)
    const [items, total] = await Promise.all([
      prisma.execution.findMany({ where, skip, take, orderBy: { [String(sort)]: order === 'asc' ? 'asc' : 'desc' }, select: { id:true, status:true, triggerType:true, startedAt:true, finishedAt:true, durationMs:true, workflow:{ select:{ id:true, name:true } } } }),
      prisma.execution.count({ where }),
    ])
    res.json({ items, total })
  } catch (e) { res.status(500).json({ error: 'Failed to list logs' }) }
})

// Get execution details including steps
logsRouter.get('/:id', requireAuth, async (req, res) => {
  const executionId = req.params.id
  console.log(`[logs] ===== GET /api/logs/${executionId} =====`)
  
  try {
    console.log(`[logs] Fetching execution record with steps: ${executionId}`)
    const ex = await prisma.execution.findUnique({ 
      where: { id: executionId }, 
      include: { 
        workflow: { select: { id:true, name:true } },
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      } 
    })
    
    if (!ex) {
      console.error(`[logs] Execution ${executionId} NOT FOUND in database`)
      return res.status(404).json({ error: 'Not found' })
    }
    
    console.log(`[logs] Execution found with steps:`, {
      id: ex.id,
      status: ex.status,
      workflowId: ex.workflowId,
      hasInput: !!ex.input,
      hasOutput: !!ex.output,
      outputType: typeof ex.output,
      stepsCount: ex.steps.length
    })
      
    if (ex.steps.length > 0) {
      console.log(`[logs] Step details:`, ex.steps.map(s => ({
          stepNumber: s.stepNumber,
          nodeName: s.nodeName,
          nodeType: s.nodeType,
          status: s.status,
          hasOutput: !!s.output
        })))
    }
    
    console.log(`[logs] Sending response:`, {
      executionId: ex.id,
      status: ex.status,
      stepsCount: ex.steps.length,
      hasOutput: !!ex.output
    })
    
    res.json(ex)
  } catch (e: any) {
    console.error(`[logs] FATAL ERROR getting execution ${executionId}:`, {
      error: e.message,
      stack: e.stack
    })
    res.status(500).json({ error: 'Failed to get log', details: e.message })
  }
})

// Retry execution: simply trigger workflow again using same input
import { executeWorkflow } from '../services/workflowExecutor'
logsRouter.post('/:id/retry', requireAuth, async (req, res) => {
  try {
    const ex = await prisma.execution.findUnique({ where: { id: req.params.id } })
    if (!ex) return res.status(404).json({ error: 'Not found' })
    const result = await executeWorkflow(ex.workflowId, ex.input || {}, true)
    res.json(result)
  } catch (e) { res.status(400).json({ error: 'Retry failed' }) }
})

// Stats endpoint
logsRouter.get('/stats/summary', requireAuth, async (_req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const [totalToday, avgDuration, successToday] = await Promise.all([
      prisma.execution.count({ where: { startedAt: { gte: today } } }),
      prisma.execution.aggregate({ _avg: { durationMs: true } }),
      prisma.execution.count({ where: { startedAt: { gte: today }, status: 'Success' } }),
    ])
    const successRate = totalToday === 0 ? 0 : Math.round((successToday/totalToday)*100)
    res.json({ totalToday, averageMs: Math.round(avgDuration._avg.durationMs || 0), successRate, failedToday: totalToday - successToday })
  } catch (e) { res.status(500).json({ error: 'Failed to load stats' }) }
})

// Export CSV
logsRouter.get('/export/csv', requireAuth, async (req, res) => {
  try {
    const items = await prisma.execution.findMany({ orderBy: { startedAt: 'desc' }, take: 1000, select: { id:true,status:true,startedAt:true,finishedAt:true,durationMs:true,workflow:{ select:{ name:true } } } })
    const header = 'id,workflow,status,startedAt,finishedAt,durationMs\n'
    const rows = items.map((i: any) => `${i.id},${escapeCsv(i.workflow.name)},${i.status},${i.startedAt.toISOString()},${i.finishedAt?i.finishedAt.toISOString():''},${i.durationMs??''}`)
    res.setHeader('Content-Type','text/csv')
    res.send(header + rows.join('\n'))
  } catch (e) { res.status(500).json({ error: 'Failed to export' }) }
})

// Export JSON
logsRouter.get('/export/json', requireAuth, async (_req, res) => {
  try { const items = await prisma.execution.findMany({ orderBy: { startedAt: 'desc' }, take: 1000 }); res.json(items) } catch (e) { res.status(500).json({ error: 'Failed to export' }) }
})

function escapeCsv(s: string) { if (s.includes(',') || s.includes('"')) return '"' + s.replace(/"/g,'""') + '"'; return s }

