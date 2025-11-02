import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

export const actionsRouter = Router()

actionsRouter.get('/types', requireAuth, (_req, res) => {
  res.json([
    { key: 'http', name: 'HTTP Request' },
    { key: 'delay', name: 'Delay' },
    { key: 'email', name: 'Send Email' },
    { key: 'transform', name: 'Transform Data' },
    { key: 'condition', name: 'Condition' },
  ])
})

actionsRouter.post('/test', requireAuth, (req, res) => {
  // Stub test: echoes payload
  res.json({ ok: true, input: req.body, output: { message: 'Test succeeded' } })
})

