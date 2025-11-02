import { Router } from 'express'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { createIntegration, deleteIntegration, getAvailableIntegrations, getConnectedIntegrations, getIntegration, testConnection, updateIntegration } from '../services/integrationService'
import { initiateOAuthFlow, handleOAuthCallback } from '../services/oauthService'

export const integrationsRouter = Router()

// Available integrations endpoint - public, no auth required (just listing available integrations)
integrationsRouter.get('/available', (_req, res) => {
  try {
    const integrations = getAvailableIntegrations()
    res.json(integrations)
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load available integrations' })
  }
})

// All other routes require authentication
integrationsRouter.get('/connected', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' })
    }
    console.log(`[Integrations] Getting connected integrations for user: ${userId}`)
    const list = await getConnectedIntegrations(userId)
    res.json(list)
  } catch (error: any) {
    console.error('[Integrations] Get connected error:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

integrationsRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' })
    }
    
    const { type, name, config } = req.body || {}
    
    console.log(`[Integrations] Creating integration for user: ${userId}`)
    console.log(`[Integrations] Type: ${type}, Name: ${name}`)
    
    if (!type || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'type and name are required' 
      })
    }
    
    const integ = await createIntegration(userId, type, name, config)
    console.log(`[Integrations] Integration created successfully: ${integ.id}`)
    res.status(201).json(integ)
  } catch (error: any) {
    console.error('[Integrations] Create error:', error)
    console.error('[Integrations] Error stack:', error?.stack)
    console.error('[Integrations] Error type:', error?.constructor?.name)
    console.error('[Integrations] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    res.status(500).json({ 
      error: 'Failed to create integration',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
    })
  }
})

integrationsRouter.get('/:id', requireAuth, async (req, res) => {
  const integ = await getIntegration(req.params.id)
  if (!integ) return res.status(404).json({ error: 'Not found' })
  res.json(integ)
})

integrationsRouter.put('/:id', requireAuth, async (req, res) => {
  const updated = await updateIntegration(req.params.id, req.body?.config || {})
  res.json(updated)
})

integrationsRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteIntegration(req.params.id)
  res.status(204).end()
})

integrationsRouter.post('/:id/test', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' })
    }
    const r = await testConnection(req.params.id)
    res.json(r)
  } catch (e: any) {
    console.error('[Integrations] Test connection error:', e)
    res.status(400).json({ error: e?.message || 'Test failed' })
  }
})

integrationsRouter.post('/oauth/authorize', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' })
    }
    const { integrationType, redirectUri } = req.body || {}
    const r = initiateOAuthFlow(String(integrationType), userId, String(redirectUri))
    res.json(r)
  } catch (error: any) {
    console.error('[Integrations] OAuth authorize error:', error)
    res.status(500).json({ error: 'Failed to initiate OAuth flow' })
  }
})

integrationsRouter.get('/oauth/callback', (req, res) => {
  const { code = '', state = '' } = req.query
  const r = handleOAuthCallback(String(code), String(state))
  res.json({ ok: true, ...r })
})

