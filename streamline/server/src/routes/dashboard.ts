import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const cache = { ts: 0, data: null as any }

export const dashboardRouter = Router()

dashboardRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const now = Date.now()
    if (cache.data && now - cache.ts < 5 * 60 * 1000) {
      return res.json(cache.data)
    }

    const [totalWorkflows, activeWorkflows, totalExecutions, successes] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { // basic: active == has executions in last 7d
        executions: { some: { startedAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } } }
      }}),
      prisma.execution.count(),
      prisma.execution.count({ where: { status: 'Success' } })
    ])

    const successRate = totalExecutions === 0 ? 0 : Math.round((successes / totalExecutions) * 100)
    const payload = { totalWorkflows, activeWorkflows, totalExecutions, successRate }
    cache.data = payload
    cache.ts = now
    return res.json(payload)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load stats' })
  }
})

