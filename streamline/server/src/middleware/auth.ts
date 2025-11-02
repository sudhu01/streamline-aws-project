import type { Request, Response, NextFunction } from 'express'
import { getAuth } from '@clerk/express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string }
  userId?: string // Alias for compatibility
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    console.log('[Auth] === Auth check for:', req.method, req.path)
    
    // Try to get auth from Clerk (now properly supported by clerkMiddleware)
    // clerkMiddleware processes both cookies and bearer tokens automatically
    let auth = getAuth(req)
    console.log('[Auth] getAuth() result:', auth ? `userId: ${auth.userId || 'null'}` : 'null')
    
    // If Clerk's getAuth didn't work, try manual token decoding as fallback
    if (!auth?.userId) {
      const authHeader = req.headers.authorization || req.headers['authorization'] || ''
      console.log('[Auth] Authorization header present:', !!authHeader)
      
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader
        
        if (token) {
          try {
            console.log('[Auth] Attempting to decode token as fallback, length:', token.length)
            
            // Fallback: Decode JWT token to extract userId
            // This is a fallback since clerkMiddleware should handle this
            const decoded = jwt.decode(token) as any
            
            if (decoded && (decoded.sub || decoded.userId || decoded.id)) {
              const userId = decoded.sub || decoded.userId || decoded.id
              auth = { userId } as any
              console.log('[Auth] Token decoded successfully (fallback) for userId:', userId)
            } else {
              console.warn('[Auth] Token decoded but no userId found in claims')
              console.warn('[Auth] Available claims:', decoded ? Object.keys(decoded) : 'null')
            }
          } catch (e: any) {
            console.error('[Auth] Fallback token decode failed:', e?.message || e)
          }
        }
      }
    }
    
    if (!auth || !auth.userId) {
      console.error('[Auth] No valid authentication found - returning 401')
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'Authentication token is missing or invalid. Please log in again.'
      })
    }
    
    // Set both req.auth and req.userId for compatibility
    req.auth = { userId: auth.userId }
    req.userId = auth.userId
    
    console.log('[Auth] Authentication successful, proceeding with userId:', auth.userId)
    next()
  } catch (error: any) {
    console.error('[Auth] Auth error:', error?.message || error)
    console.error('[Auth] Error stack:', error?.stack)
    return res.status(401).json({ 
      error: 'Unauthorized',
      details: error?.message || 'Authentication failed'
    })
  }
}

