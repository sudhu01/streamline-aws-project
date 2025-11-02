# Streamline Integration Connection Logic

This document explains how Streamline allows users to connect with integrations using **webhooks**, **APIs**, and **polling** mechanisms.

---

## Overview

Streamline supports three primary connection mechanisms for integrations, each suited for different use cases:

1. **Webhooks** - Real-time, event-driven communication (outgoing)
2. **API Keys** - Authenticated API requests (bidirectional)
3. **Polling** - Periodic checks for updates (when webhooks unavailable)

---

## 1. Webhook-Based Connections

### Purpose
Webhooks enable **outgoing** one-way communication from Streamline to external services. Users provide webhook URLs from external services (like Discord, Telegram) that Streamline can POST data to.

### How It Works

#### For Users (Configuration Flow):
1. **User obtains webhook URL from external service**
   - Example: Discord → Server Settings → Integrations → Create Webhook
   - Example: Telegram → Bot API → Get webhook URL
   
2. **User configures in Streamline**:
   - Navigates to Integrations page
   - Selects integration type (e.g., Discord)
   - Opens configuration modal
   - Pastes webhook URL
   - Provides integration name
   - Saves configuration

3. **Storage**:
   - Webhook URL stored in encrypted `configEnc` field in `Integration` table
   - Format: `{ webhookUrl: "https://discord.com/api/webhooks/..." }`

#### Technical Implementation:

```typescript
// Frontend: IntegrationConfigModal.tsx
if (authType === 'webhook') {
  config.webhookUrl = webhookUrl.trim()
}

// Backend: integrationService.ts
export async function createIntegration(userId: string, type: string, name: string, config: any) {
  const configEnc = encryptApiKey(JSON.stringify(config || {}))
  return prisma.integration.create({ 
    data: { userId, type, name, configEnc, isActive: true } 
  })
}
```

#### Supported Integrations:
- **Discord** (`authType: 'webhook'`) - Send messages to Discord channels
- **Telegram Bot** (`authType: 'webhook_or_polling'`) - When using webhook mode

#### Usage in Workflows:
When a workflow action needs to send data via webhook:
1. Retrieve integration configuration
2. Decrypt `configEnc` to get webhook URL
3. Send HTTP POST request to webhook URL with payload
4. Handle response/errors

---

## 2. API Key-Based Connections

### Purpose
API keys enable **authenticated bidirectional** communication with external services. Streamline can both send requests to and receive data from external APIs.

### How It Works

#### For Users (Configuration Flow):
1. **User obtains API keys from external service**
   - Example: SendGrid → Account Settings → API Keys → Create API Key
   - Example: Airtable → Account → Developer hub → Personal access tokens
   - Example: News API → Account → API Key

2. **User configures in Streamline**:
   - Selects integration type (e.g., SendGrid Email)
   - Opens configuration modal
   - Enters API key(s) in key-value pairs
   - Multiple keys supported (e.g., `apiKey`, `secretKey`, `accessToken`)
   - Provides integration name
   - Saves configuration

3. **Storage**:
   - API keys stored encrypted in `configEnc` field
   - Format: `{ apiKey: "SG.xxx", secretKey: "xxx" }`
   - Keys are AES-256-GCM encrypted using `ENCRYPTION_KEY`

#### Technical Implementation:

```typescript
// Frontend: IntegrationConfigModal.tsx
if (authType === 'api') {
  const apiKeyConfig: any = {}
  apiKeys.forEach(keyPair => {
    if (keyPair.name && keyPair.value) {
      apiKeyConfig[keyPair.name] = keyPair.value
    }
  })
  config.apiKeys = apiKeyConfig
}

// Backend: encryptionService.ts
export function encryptApiKey(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  return JSON.stringify({ iv: iv.toString('hex'), encrypted, authTag: authTag.toString('hex') })
}
```

#### Supported Integrations:
- **SendGrid Email** (`authType: 'api'`) - Send emails via SendGrid API
- **Airtable** (`authType: 'api'`) - Read/write records in Airtable
- **Slack** (`authType: 'api'`) - Send messages via Slack API
- **News API** (`authType: 'api'`) - Fetch news articles
- **Twilio** (`authType: 'api'`) - Send SMS, make calls

#### Usage in Workflows:
1. Retrieve integration configuration
2. Decrypt `configEnc` to get API keys
3. Use API keys in Authorization headers or request body
4. Make authenticated HTTP requests to external service
5. Handle responses and errors

---

## 3. Polling-Based Connections

### Purpose
Polling enables **periodic checking** for updates when a service doesn't support webhooks or real-time notifications. Streamline periodically checks for new data or events.

### How It Works

#### For Users (Configuration Flow):
1. **User obtains bot token/credentials**
   - Example: Telegram Bot → BotFather → /newbot → Get bot token
   
2. **User configures in Streamline**:
   - Selects integration type (e.g., Telegram Bot)
   - Opens configuration modal
   - Chooses "Polling" connection mode
   - Enters bot token
   - Enables polling
   - Provides integration name
   - Saves configuration

3. **Storage**:
   - Bot token stored encrypted in `configEnc`
   - Format: `{ botToken: "123456:ABC...", connectionMode: "polling", pollingEnabled: true }`

#### Technical Implementation:

```typescript
// Frontend: IntegrationConfigModal.tsx
if (authType === 'webhook_or_polling') {
  if (connectionMode === 'polling') {
    config.botToken = botToken.trim()
    config.connectionMode = 'polling'
    config.pollingEnabled = true
  }
}
```

#### Polling Mechanism (Future Implementation):
```typescript
// Server-side polling service (to be implemented)
async function startPolling(integrationId: string) {
  const integration = await getIntegration(integrationId)
  const config = integration.config
  
  if (config.pollingEnabled && config.connectionMode === 'polling') {
    setInterval(async () => {
      // Poll Telegram API for updates
      const updates = await telegramAPI.getUpdates({
        token: config.botToken,
        offset: lastUpdateId + 1
      })
      
      // Process updates and trigger workflows
      for (const update of updates) {
        await triggerWorkflows(integrationId, update)
      }
    }, 5000) // Poll every 5 seconds
  }
}
```

#### Supported Integrations:
- **Telegram Bot** (`authType: 'webhook_or_polling'`) - When using polling mode

---

## Integration Configuration Schema

### Database Schema

```prisma
model Integration {
  id          String   @id @default(uuid())
  userId      String
  type        String   // 'discord', 'sendgrid', 'telegram', etc.
  name        String   // User-defined name
  configEnc   String   // AES-256-GCM encrypted JSON
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  apiKeys     ApiKey[] // Optional separate API key storage
}
```

### Config Structure Examples

#### Webhook Integration (Discord):
```json
{
  "webhookUrl": "https://discord.com/api/webhooks/1433848841458679839/ts4FDenPhRq-wOF1z32d"
}
```

#### API Integration (SendGrid):
```json
{
  "apiKeys": {
    "apiKey": "SG.xxxxxxxxxxxxx",
    "fromEmail": "noreply@example.com"
  }
}
```

#### Polling Integration (Telegram):
```json
{
  "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "connectionMode": "polling",
  "pollingEnabled": true,
  "pollingInterval": 5000
}
```

---

## Security Measures

### 1. Encryption
- All sensitive data (API keys, webhook URLs, tokens) encrypted using **AES-256-GCM**
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- Each encryption uses a unique IV (Initialization Vector)

### 2. Storage
- Credentials stored in encrypted `configEnc` field
- Never logged or exposed in API responses
- Decrypted only when needed for API calls

### 3. Access Control
- Integrations are user-scoped (filtered by `userId`)
- Authentication required for all integration endpoints
- Users can only access their own integrations

---

## API Endpoints

### Create Integration
```http
POST /api/integrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "discord",
  "name": "My Discord Webhook",
  "config": {
    "webhookUrl": "https://discord.com/api/webhooks/..."
  }
}
```

### Get Connected Integrations
```http
GET /api/integrations/connected
Authorization: Bearer <token>
```

### Test Connection
```http
POST /api/integrations/:id/test
Authorization: Bearer <token>
```

---

## Connection Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Navigate to Integrations
       ▼
┌─────────────────────┐
│ Integrations Page   │
└──────┬──────────────┘
       │
       │ 2. Click "Configure"
       ▼
┌─────────────────────────────┐
│ Integration Config Modal    │
│                             │
│ Auth Type Detection:        │
│ - webhook                   │
│ - api                       │
│ - webhook_or_polling        │
│ - none                      │
└──────┬──────────────────────┘
       │
       │ 3. Fill configuration based on auth type
       ▼
┌─────────────────────────────┐
│ Frontend Validation        │
│ - Required fields check     │
│ - Format validation        │
└──────┬──────────────────────┘
       │
       │ 4. Submit configuration
       ▼
┌─────────────────────────────┐
│ POST /api/integrations     │
│ - Encrypt config           │
│ - Store in database        │
└──────┬──────────────────────┘
       │
       │ 5. Return integration
       ▼
┌─────────────────────────────┐
│ Integration Created        │
│ Ready for workflow use     │
└─────────────────────────────┘
```

---

## Workflow Execution with Integrations

When a workflow action uses an integration:

1. **Workflow Executor** retrieves integration by ID
2. **Decrypt** `configEnc` to get credentials
3. **Based on auth type**:
   - **Webhook**: POST to webhook URL
   - **API**: Use API keys for authenticated requests
   - **Polling**: Check for updates (background service)
4. **Log execution** with results
5. **Update** `lastUsedAt` timestamp

---

## Future Enhancements

### 1. OAuth 2.0 Support
- Currently stubbed in `oauthService.ts`
- Will enable OAuth flows for services like Slack, Google Sheets
- Handle token refresh automatically

### 2. Webhook Receiving (Incoming)
- Generate unique webhook URLs for Streamline
- Users can configure external services to POST to Streamline webhooks
- Trigger workflows based on incoming webhook events

### 3. Advanced Polling
- Configurable polling intervals
- Exponential backoff on errors
- Smart polling (only when workflows are active)

### 4. Connection Health Monitoring
- Periodic connection tests
- Automatic reconnection on failures
- Status indicators in UI

---

## Comparison with n8n

Streamline follows similar patterns to n8n:

| Feature | n8n | Streamline |
|---------|-----|------------|
| Webhooks (Outgoing) | ✅ | ✅ |
| API Keys | ✅ | ✅ |
| Polling | ✅ | ✅ (Implementation pending) |
| OAuth 2.0 | ✅ | 🚧 (Stubbed) |
| Webhooks (Incoming) | ✅ | 🚧 (Planned) |
| Credential Encryption | ✅ | ✅ |
| Per-User Isolation | ✅ | ✅ |

---

## Examples

### Example 1: Connecting Discord Webhook
1. User goes to Discord server settings
2. Creates webhook, copies URL
3. In Streamline: Integrations → Discord → Configure
4. Pastes webhook URL
5. Names it "Production Alerts"
6. Saves
7. Can now use in workflows to send Discord messages

### Example 2: Connecting SendGrid API
1. User logs into SendGrid account
2. Creates API key
3. In Streamline: Integrations → SendGrid → Configure
4. Enters API key
5. Names it "Transactional Emails"
6. Saves
7. Can now use in workflows to send emails

### Example 3: Connecting Telegram Bot (Polling)
1. User creates bot via BotFather on Telegram
2. Gets bot token
3. In Streamline: Integrations → Telegram → Configure
4. Selects "Polling" mode
5. Enters bot token
6. Enables polling
7. Streamline polls Telegram API for new messages
8. Messages trigger workflows automatically

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized when connecting**
   - Check authentication token is valid
   - Verify user is logged in
   - Check server logs for auth errors

2. **Webhook URL not working**
   - Verify webhook URL is correct and active
   - Test webhook URL directly with curl/Postman
   - Check external service webhook settings

3. **API key invalid**
   - Verify API key is correct (no extra spaces)
   - Check API key hasn't expired
   - Verify API key has required permissions

4. **Polling not working**
   - Verify bot token is correct
   - Check polling service is running
   - Verify polling interval is reasonable

---

## References

- [Discord Webhook Setup Guide](./DISCORD_SETUP.md)
- Integration API documentation in `server/src/routes/integrations.ts`
- Encryption service in `server/src/services/encryptionService.ts`
- Configuration modal in `client/src/components/integrations/IntegrationConfigModal.tsx`

