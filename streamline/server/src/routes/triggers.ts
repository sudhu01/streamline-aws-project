import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

export const triggersRouter = Router()

triggersRouter.get('/types', requireAuth, (_req, res) => {
  res.json([
    { key: 'schedule', name: 'Schedule (Cron)' },
    { key: 'webhook', name: 'Webhook' },
    { key: 'manual', name: 'Manual' },
  ])
})

// Stub webhook management
triggersRouter.post('/webhooks', requireAuth, (_req, res) => {
  // In real implementation, persist and generate a unique URL
  res.status(201).json({ id: 'wh_' + Math.random().toString(36).slice(2), url: 'https://example.com/webhook/xyz' })
})

triggersRouter.get('/webhooks/:id', requireAuth, (req, res) => {
  res.json({ id: req.params.id, url: 'https://example.com/webhook/' + req.params.id })
})

