// Vercel serverless function: POST /api/submit-consultation
// All form logic lives in server/consultation.js (shared with Cloudflare).
// Environment variables: Vercel → Project → Settings → Environment Variables.
import { handleSubmission } from '../server/consultation.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}') } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
  }

  const result = await handleSubmission(body, process.env.SYSTEME_IO_API_KEY)
  return res.status(result.status).json(result.body)
}
