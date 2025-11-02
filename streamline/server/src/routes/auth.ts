import { Router } from 'express'
import { handleWebhook, getCurrentUser } from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

export const authRouter = Router()

// Clerk webhooks require raw body for signature verification
authRouter.post('/webhook', (req, res, next) => {
  next()
})

authRouter.post('/webhook', handleWebhook)
authRouter.get('/me', requireAuth, getCurrentUser)

