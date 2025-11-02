import axios, { type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token getter function - will be set by the auth hook
let tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
  console.log('[API] Token getter registered')
}

// Add auth token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      if (tokenGetter) {
        const token = await tokenGetter()
        if (token) {
          // Ensure Bearer prefix
          config.headers.Authorization = `Bearer ${token}`
          console.log(`[API] Added auth token to request: ${config.url}`)
          console.log(`[API] Token preview: ${token.substring(0, 30)}... (length: ${token.length})`)
        } else {
          console.warn(`[API] No token available for request: ${config.url}`)
        }
      } else {
        console.warn(`[API] Token getter not set for request: ${config.url}`)
      }
    } catch (error) {
      console.error('[API] Error getting token:', error)
      // Token not available, continue without it
    }
    return config
  },
  (error) => {
    console.error('[API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status
    
    if (status === 401) {
      console.error('[API] 401 Unauthorized - Token may be invalid or expired')
      console.error('[API] Request URL:', error.config?.url)
      console.error('[API] Request method:', error.config?.method)
      console.error('[API] Request headers:', error.config?.headers)
      console.error('[API] Response data:', error.response?.data)
      error.userMessage = 'Your session has expired. Please sign in again.'
    } else if (status === 429) {
      error.userMessage = 'Too many requests. Please slow down and try again.'
    } else if (!status) {
      error.userMessage = 'Network error. Please check your connection.'
    } else {
      error.userMessage = 'Something went wrong. Please try again.'
    }
    
    return Promise.reject(error)
  }
)

export async function getHealth() {
  const res = await api.get('/api/health')
  return res.data as { status: string; service: string; timestamp: string }
}

