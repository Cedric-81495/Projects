'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { publicEnv } from '@/lib/env'
import { enforceLimit } from '@/lib/http/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { safeNext } from './redirect'
import { logger } from '@/lib/observability/logger'
import { captureServer } from '@/lib/analytics/posthog-server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

/**
 * Auth as Server Actions rather than API routes, for one specific reason:
 * a Server Action bound to a plain <form action={…}> SUBMITS WITHOUT
 * JAVASCRIPT. On congested venue cellular, or on a phone that failed to load a
 * bundle, a JS-only login is a locked door with no key.
 *
 * Every error message here is deliberately generic. "No account with that
 * email" is a user-enumeration oracle: it lets anyone test which addresses are
 * registered, which is both a privacy leak and the first step of a credential-
 * stuffing run.
 */

export interface ActionState {
  error?: string
  notice?: string
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
})

const signupFields = credentials.extend({
  full_name: z.string().trim().min(1, 'Tell us your name.').max(120),
})

function clientIp(h: Headers) {
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const h = await headers()
  const ip = clientIp(h)

  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Check your email and password and try again.' }

  // Keyed by email AND ip, so one attacker cannot lock out a real user by
  // hammering their address, and a botnet cannot spread attempts across IPs.
  try {
    await enforceLimit('auth', `signin:${parsed.data.email}`)
    await enforceLimit('auth', `signin-ip:${ip}`)
  } catch {
    return { error: 'Too many attempts. Wait a few minutes and try again.' }
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    logger.info('signin_failed', { ip })
    // Same message for wrong password, unknown email and unconfirmed account.
    return { error: 'That email and password combination did not work.' }
  }

  await captureServer(data.user.id, ANALYTICS_EVENTS.login, { platform: 'web' })

  redirect(safeNext(formData.get('next')?.toString()))
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const h = await headers()
  const ip = clientIp(h)

  // Honeypot: bots fill it, humans never see it. Silent success so the bot
  // does not learn it was caught and retry with the field removed.
  if (formData.get('company')) return { notice: 'Check your email to confirm your account.' }

  const parsed = signupFields.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  if (!(await verifyTurnstile(formData.get('cf-turnstile-response')?.toString(), ip))) {
    return { error: 'We could not verify that request. Reload the page and try again.' }
  }

  try {
    await enforceLimit('auth', `signup-ip:${ip}`)
  } catch {
    return { error: 'Too many attempts. Wait a few minutes and try again.' }
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // The profile and the default `student` role are created by the Postgres
      // trigger in 0002, not here — so a user can never exist without them,
      // whichever client signed them up.
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    logger.info('signup_failed', { ip, code: error.code })
    // Note: NOT "that email is already registered". Same message either way.
    return { notice: 'Check your email to confirm your account.' }
  }

  if (data.user) {
    await captureServer(data.user.id, ANALYTICS_EVENTS.signupCompleted, { platform: 'web' })
  }

  /* Supabase tells us which flow ran, so don't guess.
       · session present  → "Confirm email" is OFF in the project settings, the
         account is already usable and the cookies are set. No email will ever
         arrive, so telling someone to check their inbox sends them to wait for
         nothing — which is exactly what happened during testing.
       · session null     → confirmation is ON and the email is on its way.

     Reading the response rather than a config flag means the two stay in step
     automatically when someone toggles the setting in the Supabase dashboard,
     where the app has no visibility. */
  if (data.session) {
    redirect(safeNext(formData.get('next')?.toString()))
  }

  return { notice: 'Check your email to confirm your account.' }
}

// ---------------------------------------------------------------------------
// Password reset — request
// ---------------------------------------------------------------------------
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const h = await headers()
  const ip = clientIp(h)

  const email = z.string().trim().toLowerCase().email().safeParse(formData.get('email'))
  // Same response whether or not the address exists. Anything else turns this
  // form into an account-existence checker.
  const generic = { notice: 'If that email has an account, a reset link is on its way.' }
  if (!email.success) return generic

  if (!(await verifyTurnstile(formData.get('cf-turnstile-response')?.toString(), ip))) {
    return generic
  }

  try {
    await enforceLimit('auth', `reset:${email.data}`)
  } catch {
    return generic
  }

  const supabase = await createServerSupabase()
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  return generic
}

// ---------------------------------------------------------------------------
// Password reset — complete
// ---------------------------------------------------------------------------
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = z.string().min(10).max(200).safeParse(formData.get('password'))
  const confirm = formData.get('confirm')?.toString()

  if (!password.success) return { error: 'Use at least 10 characters.' }
  if (password.data !== confirm) return { error: 'Those passwords do not match.' }

  const supabase = await createServerSupabase()

  // Only works inside the recovery session established by /auth/callback. An
  // expired or absent link means no session, and this correctly fails.
  const { error } = await supabase.auth.updateUser({ password: password.data })
  if (error) return { error: 'That reset link has expired. Request a new one.' }

  redirect('/dashboard?password=updated')
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut({ scope: 'global' }) // every device, not just this one
  redirect('/login')
}
