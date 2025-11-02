# Discord Integration Setup Guide

## Understanding the 401 Error

**Important:** The `401 Unauthorized` error you're seeing is from **Streamline's backend authentication**, not Discord. This means:

- ✅ Your Discord webhook URL is fine
- ✅ Discord doesn't need any special configuration for webhooks
- ❌ Streamline's server needs to properly authenticate your request

## Discord Webhook Setup (For Future Use)

When the authentication issue is resolved, here's what you need from Discord:

### 1. Creating a Discord Webhook

1. **Open your Discord server**
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **Create Webhook** or **New Webhook**
4. Configure:
   - **Name**: Give it a name (e.g., "Streamline Notifications")
   - **Channel**: Select the channel where messages should be posted
   - Click **Copy Webhook URL**
5. **Save** the webhook

### 2. What You Need

- **Webhook URL**: Format is `https://discord.com/api/webhooks/{webhook_id}/{webhook_token}`
- **No authentication required**: Discord webhooks don't need API keys or tokens
- **One-way communication**: Webhooks can only send messages, not receive them

### 3. Using the Webhook in Streamline

Once connected:
- The webhook URL is stored securely in Streamline
- You can use it in workflows to send messages
- Messages are sent as HTTP POST requests with JSON payload

## Current Issue: Streamline Backend Authentication

The 401 error indicates that Streamline's server cannot verify your authentication token. Here's what to check:

### Check Server Logs

1. **Open the terminal/console where the server is running** (port 4000)
2. **Look for `[Auth]` log messages** when you try to connect
3. The logs will show:
   - Whether the token was received
   - Token decoding attempts
   - Any errors during decoding
   - The final authentication result

### What to Look For in Logs

```
[Auth] === Auth check for: POST /api/integrations
[Auth] getAuth() result: userId: null
[Auth] Authorization header: Bearer eyJhbGciOiJ...
[Auth] Attempting to decode token, length: 808
```

If you see error messages like:
- `Token decode failed`
- `Could not extract userId from token`
- `No valid authentication found`

These indicate the token decoding isn't working properly.

## Next Steps

1. **Try connecting again** after the server restart
2. **Check the server terminal** for detailed `[Auth]` logs
3. **Share the server logs** if the error persists - they will show exactly what's failing

The server now has improved error handling and will try multiple ways to decode the token. The logs will tell us exactly what's happening.

