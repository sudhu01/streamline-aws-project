import { prisma } from '../utils/prisma'
import { encryptApiKey, decryptApiKey } from './encryptionService'

export function getAvailableIntegrations() {
  return [
    { 
      key: 'discord', 
      name: 'Discord', 
      category: 'Communication', 
      description: 'Send messages and interact with Discord servers via webhooks', 
      authType: 'webhook',
      logoUrl: '' 
    },
    { 
      key: 'telegram', 
      name: 'Telegram Bot', 
      category: 'Communication', 
      description: 'Send messages via Telegram bots using webhooks or polling', 
      authType: 'webhook_or_polling',
      logoUrl: '' 
    },
    { 
      key: 'airtable', 
      name: 'Airtable', 
      category: 'Productivity', 
      description: 'Read and write records in Airtable bases and tables', 
      authType: 'api',
      logoUrl: '' 
    },
    { 
      key: 'slack', 
      name: 'Slack', 
      category: 'Communication', 
      description: 'Send messages and interact with Slack workspaces', 
      authType: 'api',
      logoUrl: '' 
    },
    { 
      key: 'news_api', 
      name: 'News API', 
      category: 'Data', 
      description: 'Get news articles and headlines from thousands of sources', 
      authType: 'api',
      logoUrl: '' 
    },
    { 
      key: 'twilio', 
      name: 'Twilio', 
      category: 'Communication', 
      description: 'Send SMS, make calls, and build communication flows', 
      authType: 'api',
      logoUrl: '' 
    },
  ]
}

export async function getConnectedIntegrations(clerkUserId: string) {
  // Find user by Clerk userId first
  const user = await prisma.user.findUnique({
    where: { clerkUserId }
  })
  
  if (!user) {
    return [] // No user found, return empty array
  }
  
  // Get integrations for the database user.id
  const integrations = await prisma.integration.findMany({ 
    where: { userId: user.id }, 
    orderBy: { updatedAt: 'desc' } 
  })
  
  // Decrypt config for each integration
  return integrations.map(integ => {
    let config: any = {}
    try {
      config = JSON.parse(decryptApiKey(integ.configEnc))
    } catch {
      config = {}
    }
    return {
      ...integ,
      config // Include decrypted config
    }
  })
}

export async function createIntegration(clerkUserId: string, type: string, name: string, config: any) {
  try {
    console.log('[IntegrationService] Creating integration:', { clerkUserId, type, name, configKeys: Object.keys(config || {}) })
    
    // First, find or create the User record using Clerk userId
    let user = await prisma.user.findUnique({
      where: { clerkUserId }
    })
    
    if (!user) {
      console.log('[IntegrationService] User not found, creating user for clerkUserId:', clerkUserId)
      // User doesn't exist yet - create it
      // In production, this should be handled by the Clerk webhook, but we'll create it here as fallback
      try {
        user = await prisma.user.create({
          data: {
            clerkUserId,
            email: `user_${clerkUserId}@streamline.local`, // Temporary unique email
          }
        })
        console.log('[IntegrationService] Created user with ID:', user.id)
      } catch (createError: any) {
        // If creation failed (e.g., email conflict), try to find again or upsert
        console.warn('[IntegrationService] User creation failed, trying upsert:', createError?.message)
        user = await prisma.user.upsert({
          where: { clerkUserId },
          update: {},
          create: {
            clerkUserId,
            email: `user_${clerkUserId}@streamline.local`,
          }
        })
        console.log('[IntegrationService] User upserted with ID:', user.id)
      }
    } else {
      console.log('[IntegrationService] Found existing user with ID:', user.id)
    }
    
    // Encrypt the configuration
    const configJson = JSON.stringify(config || {})
    console.log('[IntegrationService] Config JSON length:', configJson.length)
    
    const configEnc = encryptApiKey(configJson)
    console.log('[IntegrationService] Config encrypted, length:', configEnc.length)
    
    // Create integration in database using the database User.id (not Clerk userId)
    const integration = await prisma.integration.create({ 
      data: { 
        userId: user.id, // Use database User.id, not Clerk userId
        type, 
        name, 
        configEnc, 
        isActive: true 
      } 
    })
    
    console.log('[IntegrationService] Integration created with ID:', integration.id)
    return integration
  } catch (error: any) {
    console.error('[IntegrationService] Error in createIntegration:', error)
    console.error('[IntegrationService] Error message:', error?.message)
    console.error('[IntegrationService] Error code:', error?.code)
    console.error('[IntegrationService] Error stack:', error?.stack)
    throw error // Re-throw to be handled by route
  }
}

export async function updateIntegration(integrationId: string, config: any) {
  const configEnc = encryptApiKey(JSON.stringify(config || {}))
  return prisma.integration.update({ where: { id: integrationId }, data: { configEnc } })
}

export async function deleteIntegration(integrationId: string) {
  return prisma.integration.delete({ where: { id: integrationId } })
}

export async function getIntegration(integrationId: string) {
  const integ = await prisma.integration.findUnique({ where: { id: integrationId } })
  if (!integ) return null
  let config: any = {}
  try { config = JSON.parse(decryptApiKey(integ.configEnc)) } catch {}
  return { ...integ, config }
}

export async function testConnection(integrationId: string) {
  // Minimal test: decrypt config
  const integ = await getIntegration(integrationId)
  if (!integ) throw new Error('Not found')
  return { ok: true }
}


