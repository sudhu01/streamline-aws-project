import { api } from './api'
import axios from 'axios'

// Create a separate axios instance without auth interceptor for public endpoints
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
})

// Cache for available integrations (they don't change often)
let availableIntegrationsCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getAvailableIntegrations() {
  // Available integrations endpoint is public, no auth required
  // Use cache to avoid hitting rate limits
  const now = Date.now()
  if (availableIntegrationsCache && (now - availableIntegrationsCache.timestamp) < CACHE_TTL) {
    return Promise.resolve(availableIntegrationsCache.data)
  }
  
  return publicApi.get('/api/integrations/available')
    .then(r => {
      availableIntegrationsCache = { data: r.data, timestamp: now }
      return r.data
    })
    .catch(error => {
      // If cache exists and request fails, return cache
      if (availableIntegrationsCache) {
        console.warn('Failed to fetch fresh integrations, using cache:', error)
        return availableIntegrationsCache.data
      }
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

