import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '../../services/api'

export default function AuthTokenSetup() {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(async () => {
      try {
        // Get JWT token for API authentication
        // getToken() by default returns a JWT that can be verified server-side
        const token = await getToken()
        if (token) {
          console.log('[AuthTokenSetup] Got token (length:', token.length, ')')
        } else {
          console.warn('[AuthTokenSetup] getToken() returned null')
        }
        return token
      } catch (error) {
        console.error('[AuthTokenSetup] Error getting token:', error)
        return null
      }
    })
  }, [getToken])

  return null
}

