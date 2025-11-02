import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { Webhook, WebhookRequiredHeaders } from 'svix'

function verifyClerkWebhook(req: Request): any {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing CLERK_WEBHOOK_SECRET')
  const wh = new Webhook(secret)
  const headers = req.headers as unknown as WebhookRequiredHeaders
  const body: any = (req as any).body
  const payload = Buffer.isBuffer(body) ? body.toString('utf8') : JSON.stringify(body)
  return wh.verify(payload, headers)
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    const evt = verifyClerkWebhook(req)
    const type = evt.type as string
    const data = evt.data as any

    if (type === 'user.created') {
      await prisma.user.upsert({
        where: { clerkUserId: data.id },
        update: {},
        create: {
          clerkUserId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? '',
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          imageUrl: data.image_url ?? null,
        },
      })
    } else if (type === 'user.updated') {
      await prisma.user.update({
        where: { clerkUserId: data.id },
        data: {
          email: data.email_addresses?.[0]?.email_address ?? undefined,
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
          imageUrl: data.image_url ?? undefined,
        },
      })
    } else if (type === 'user.deleted') {
      await prisma.user.deleteMany({ where: { clerkUserId: data.id } })
    }

    return res.json({ ok: true })
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Invalid webhook' })
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId as string | undefined
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const user = await prisma.user.findFirst({ where: { clerkUserId: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(user)
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load user' })
  }
}

