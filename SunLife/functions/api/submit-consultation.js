// Cloudflare Pages Function: POST /api/submit-consultation
// All form logic lives in server/consultation.js (shared with Vercel).
// Environment variables: Cloudflare → Workers & Pages → this project →
// Settings → Variables and Secrets.
import { handleSubmission } from '../../server/consultation.js'

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function onRequestOptions({ env }) {
  return new Response(null, { status: 204, headers: corsHeaders(env) })
}

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(env) })
  }

  const result = await handleSubmission(body, env.SYSTEME_IO_API_KEY)
  return Response.json(result.body, { status: result.status, headers: corsHeaders(env) })
}
