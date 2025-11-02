import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey() {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return crypto.createHash('sha256').update(key).digest()
}

export function encryptApiKey(plaintext: string) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptApiKey(ciphertext: string) {
  const raw = Buffer.from(ciphertext, 'base64')
  const iv = raw.subarray(0, IV_LENGTH)
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16)
  const enc = raw.subarray(IV_LENGTH + 16)
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}

