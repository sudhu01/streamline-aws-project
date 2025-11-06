import { api } from './api'
import axios from 'axios'

// Create a separate axios instance without auth interceptor for public endpoints
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  responseType: 'json', // Explicitly set response type
})

// Cache for available integrations (they don't change often)
let availableIntegrationsCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getAvailableIntegrations() {
  // Available integrations endpoint is public, no auth required
  // Use cache to avoid hitting rate limits
  const now = Date.now()
  if (availableIntegrationsCache && (now - availableIntegrationsCache.timestamp) < CACHE_TTL) {
    // Verify cached data is an array before returning
    if (Array.isArray(availableIntegrationsCache.data)) {
      console.log('[IntegrationService] Returning cached integrations:', availableIntegrationsCache.data.length)
      return Promise.resolve(availableIntegrationsCache.data)
    } else {
      // Cache has invalid data, clear it
      console.warn('[IntegrationService] Cached data is not an array, clearing cache')
      availableIntegrationsCache = null
    }
  }
  
  console.log('[IntegrationService] Fetching fresh integrations from API')
  return publicApi.get('/api/integrations/available')
    .then(r => {
      console.log('[IntegrationService] API response received:', {
        status: r.status,
        dataType: typeof r.data,
        isArray: Array.isArray(r.data),
        isString: typeof r.data === 'string',
        length: Array.isArray(r.data) ? r.data.length : 'N/A',
        rawData: r.data
      })
      
      let data = r.data
      
      // If response is a string, try to parse it as JSON
      if (typeof data === 'string') {
        console.warn('[IntegrationService] Response is string, attempting to parse as JSON')
        try {
          data = JSON.parse(data)
          console.log('[IntegrationService] Successfully parsed string response:', {
            dataType: typeof data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'N/A'
          })
        } catch (parseError) {
          console.error('[IntegrationService] Failed to parse string response as JSON:', parseError)
          console.error('[IntegrationService] String content:', data.substring(0, 200))
          availableIntegrationsCache = null
          throw new Error('API returned string that could not be parsed as JSON')
        }
      }
      
      // Verify response is an array before caching
      if (!Array.isArray(data)) {
        console.error('[IntegrationService] ERROR: API returned non-array data:', typeof data, data)
        // Clear cache if it exists
        availableIntegrationsCache = null
        throw new Error('API returned invalid data format. Expected array, got ' + typeof data)
      }
      
      availableIntegrationsCache = { data: data, timestamp: now }
      console.log('[IntegrationService] Cached', data.length, 'integrations')
      return data
    })
    .catch(error => {
      console.error('[IntegrationService] Error fetching integrations:', error)
      console.error('[IntegrationService] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      })
      
      // If cache exists and has valid array data, return cache
      if (availableIntegrationsCache && Array.isArray(availableIntegrationsCache.data)) {
        console.warn('[IntegrationService] Using cached data due to error')
        return availableIntegrationsCache.data
      }
      
      // Clear invalid cache
      availableIntegrationsCache = null
      throw error
    })
}
export function getConnectedIntegrations() {
  return api.get('/api/integrations/connected').then(r => r.data)
}
export function connectIntegration(type: string, name: string, config: any) {
  // Extract integrationName, apiKeys, webhookUrl, botToken, etc. from config
  const { integrationName, apiKeys, webhookUrl, botToken, connectionMode, pollingEnabled, ...restConfig } = config
  const finalName = integrationName || name
  
  // Build final config based on what's provided
  let finalConfig: any = { ...restConfig }
  
  if (apiKeys) {
    // For API auth, merge apiKeys into config
    finalConfig = { ...finalConfig, ...apiKeys }
  } else if (webhookUrl) {
    // For webhook auth
    finalConfig.webhookUrl = webhookUrl
    if (connectionMode) {
      finalConfig.connectionMode = connectionMode
    }
  } else if (botToken) {
    // For polling/auth with bot token
    finalConfig.botToken = botToken
    if (connectionMode) {
      finalConfig.connectionMode = connectionMode
    }
    if (pollingEnabled !== undefined) {
      finalConfig.pollingEnabled = pollingEnabled
    }
  }
  
  return api.post('/api/integrations', { type, name: finalName, config: finalConfig }).then(r => r.data)
}
export function updateIntegration(id: string, config: any) {
  return api.put(`/api/integrations/${id}`, { config }).then(r => r.data)
}
export function disconnectIntegration(id: string) {
  return api.delete(`/api/integrations/${id}`).then(r => r.data)
}
export function testConnection(id: string) {
  return api.post(`/api/integrations/${id}/test`).then(r => r.data)
}

