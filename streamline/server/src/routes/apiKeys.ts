import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { encryptApiKey, decryptApiKey } from '../services/encryptionService'

export const apiKeysRouter = Router()

apiKeysRouter.get('/', requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.auth?.userId || req.userId
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID not found' })
    }
    
    // Find user by Clerk userId to get database User.id (UUID)
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const keys = await prisma.apiKey.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    const masked = keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      integrationId: k.integrationId,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      keyMasked: maskKey(k.keyEnc)
    }))
    res.json(masked)
  } catch (error: any) {
    console.error('[APIKeys] Get error:', error)
    res.status(500).json({ error: 'Failed to fetch API keys', details: error?.message })
  }
})

apiKeysRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.auth?.userId || req.userId
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID not found' })
    }
    
    const { name, keyValue, integrationId } = req.body || {}
    if (!name || !keyValue) return res.status(400).json({ error: 'name and keyValue required' })
    
    // Find user by Clerk userId to get database User.id (UUID)
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const keyEnc = encryptApiKey(String(keyValue))
    const saved = await prisma.apiKey.create({ 
      data: { 
        userId: user.id, // Use database User.id (UUID), not Clerk userId
        name, 
        keyEnc, 
        integrationId: integrationId || null 
      } 
    })
    res.status(201).json({ id: saved.id })
  } catch (error: any) {
    console.error('[APIKeys] Create error:', error)
    res.status(500).json({ error: 'Failed to create API key', details: error?.message })
  }
})

apiKeysRouter.put('/:id', requireAuth, async (req: any, res) => {
  const { name } = req.body || {}
  const updated = await prisma.apiKey.update({ where: { id: req.params.id }, data: { name } })
  res.json(updated)
})

apiKeysRouter.delete('/:id', requireAuth, async (req, res) => {
  await prisma.apiKey.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

apiKeysRouter.post('/:id/rotate', requireAuth, async (req, res) => {
  const { keyValue } = req.body || {}
  if (!keyValue) return res.status(400).json({ error: 'keyValue required' })
  const keyEnc = encryptApiKey(String(keyValue))
  const updated = await prisma.apiKey.update({ where: { id: req.params.id }, data: { keyEnc, updatedAt: new Date() } })
  res.json({ id: updated.id })
})

function maskKey(enc: string) {
  try {
    const plain = decryptApiKey(enc)
    if (plain.length <= 6) return '***'
    return plain.slice(0, 2) + '_********_' + plain.slice(-4)
  } catch { return '***' }
}

