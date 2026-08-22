import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

/**
 * RLS conformance suite.
 *
 * These tests talk to the DATABASE with an anon key, not to the API. That is
 * the point: they prove the guarantee holds even if every line of application
 * code is wrong. If one of these fails, the client's paid content is public —
 * treat it as sev-1, never as a flaky test to skip.
 *
 * Run against a LOCAL or STAGING Supabase project. Never production.
 */

const url = process.env.SUPABASE_URL!
const anonKey = process.env.SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const anon = createClient(url, anonKey)
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

/** A user enrolled at exactly `level`. */
async function userAtLevel(level: number) {
  const email = `test-l${level}-${Date.now()}@example.test`
  const { data } = await admin.auth.admin.createUser({
    email, password: 'test-password-1234', email_confirm: true,
  })
  const userId = data.user!.id
  if (level > 0) {
    await admin.from('enrollments').insert(
      Array.from({ length: level }, (_, i) => ({
        user_id: userId, level: i + 1, source: 'manual_grant', status: 'active',
      })),
    )
  }
  const client = createClient(url, anonKey)
  await client.auth.signInWithPassword({ email, password: 'test-password-1234' })
  return { userId, client }
}

describe('anonymous access', () => {
  it('cannot read profiles', async () => {
    const { data } = await anon.from('profiles').select('*')
    expect(data ?? []).toHaveLength(0)
  })

  /* Both tables hold the personal details of several hundred attendees, and
     the page that writes to them is behind a code printed on a card and handed
     out in a public room. Anon must not read them, and — the one people forget
     — must not WRITE them either. An anon insert policy is the obvious
     shortcut when the endpoint feels awkward, and it would let anyone in the
     room fill the table. */
  it('cannot read or write leads', async () => {
    const read = await anon.from('leads').select('id').limit(1)
    expect(read.data ?? []).toHaveLength(0)

    const write = await anon.from('leads').insert({
      first_name: 'Anon', email: 'anon@example.test', phone: '+15550000000',
      consent_given: false, consent_text: 'x',
    })
    expect(write.error).toBeTruthy()
  })

  it('cannot read or write assessments', async () => {
    const read = await anon.from('assessments').select('id').limit(1)
    expect(read.data ?? []).toHaveLength(0)

    const write = await anon.from('assessments').insert({
      lead_id: '00000000-0000-0000-0000-000000000000',
      financial_stage: 'building',
    })
    expect(write.error).toBeTruthy()
  })

  it('cannot read enrollments, payments or audit records', async () => {
    for (const table of ['enrollments', 'payment_references', 'audit_records', 'stripe_events']) {
      const { data } = await anon.from(table).select('*')
      expect(data ?? [], `${table} leaked to anon`).toHaveLength(0)
    }
  })

  it('sees preview lessons only', async () => {
    const { data } = await anon.from('lessons').select('id, is_preview, level')
    expect(data!.every((l) => l.is_preview)).toBe(true)
  })

  it('can read the pathway — the marketing site needs it', async () => {
    const { data } = await anon.from('university_levels').select('*')
    expect(data).toHaveLength(4)
  })

  it('cannot read unpublished plans', async () => {
    const { data } = await anon.from('membership_plans').select('*')
    expect(data ?? []).toHaveLength(0) // all seeded plans are unpublished
  })
})

describe('level enforcement', () => {
  it('a level-1 user cannot read a level-2 lesson, even by exact ID', async () => {
    const { data: target } = await admin
      .from('lessons').select('id').eq('level', 2).limit(1).single()

    const { client } = await userAtLevel(1)
    const { data } = await client.from('lessons').select('*').eq('id', target!.id)
    expect(data ?? []).toHaveLength(0)
  })

  it('a level-3 user reads levels 1-3 and not 4 — access is cumulative', async () => {
    const { client } = await userAtLevel(3)
    const { data } = await client.from('lessons').select('level').eq('published', true)
    const levels = new Set(data!.map((l) => l.level))
    expect(levels.has(4)).toBe(false)
    expect([...levels].every((l) => l <= 3)).toBe(true)
  })

  it('an expired enrollment stops granting access', async () => {
    const { userId, client } = await userAtLevel(1)
    await admin.from('enrollments')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('user_id', userId)

    const { data } = await client.from('lessons')
      .select('*').eq('level', 1).eq('is_preview', false)
    expect(data ?? []).toHaveLength(0)
  })
})

describe('privilege escalation', () => {
  it('a student cannot grant themselves an enrollment', async () => {
    const { userId, client } = await userAtLevel(0)
    const { error } = await client.from('enrollments')
      .insert({ user_id: userId, level: 4, source: 'manual_grant', status: 'active' })
    expect(error).toBeTruthy()
  })

  it('a student cannot grant themselves a role', async () => {
    const { userId, client } = await userAtLevel(0)
    const { error } = await client.from('user_roles').insert({ user_id: userId, role: 'admin' })
    expect(error).toBeTruthy()
  })

  it('a profile UPDATE cannot rewrite the row owner', async () => {
    const { client } = await userAtLevel(0)
    const other = await userAtLevel(0)
    const { data } = await client.from('profiles')
      .update({ id: other.userId }).eq('id', other.userId).select()
    expect(data ?? []).toHaveLength(0)
  })

  it('a user cannot seed progress for a lesson above their level', async () => {
    const { data: target } = await admin
      .from('lessons').select('id').eq('level', 2).limit(1).single()
    const { userId, client } = await userAtLevel(1)
    const { error } = await client.from('lesson_progress')
      .insert({ user_id: userId, lesson_id: target!.id, status: 'in_progress' })
    expect(error).toBeTruthy()
  })
})

describe('schema invariants', () => {
  it('every public table has RLS enabled and forced', async () => {
    const { data } = await admin.rpc('exec_sql' as never, {
      sql: `select relname, relrowsecurity, relforcerowsecurity
            from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`,
    } as never)
    for (const t of (data ?? []) as Array<Record<string, unknown>>) {
      expect(t.relrowsecurity, `${t.relname} has RLS off`).toBe(true)
      expect(t.relforcerowsecurity, `${t.relname} does not force RLS`).toBe(true)
    }
  })
})
