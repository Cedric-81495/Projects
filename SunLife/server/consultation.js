// ---------------------------------------------------------------
// Shared consultation-form logic
// ---------------------------------------------------------------
// Used by BOTH hosting setups, so validation, tags and the Systeme.io
// calls only ever need to be changed in this one file:
//   - Vercel:      api/submit-consultation.js
//   - Cloudflare:  functions/api/submit-consultation.js
//
// Setup (once the client has a Systeme.io account):
//   1. Systeme.io: CRM → Contacts → open any contact → pencil icon →
//      "+ Add new custom field". Unique keys (must match exactly):
//        reason, who_for, timing, budget, walkthrough, health
//      Name and phone use Systeme.io's built-in fields; don't create them.
//   2. Systeme.io: CRM → Tags → create: urgent (free plan allows 1 tag).
//      On a paid plan also: budget-high, budget-low, health-sensitive,
//      existing-coverage-review, ofw
//   3. Systeme.io: Settings → MCP & API keys → create a key.
//   4. Hosting environment variables (server-only, never VITE_):
//        SYSTEME_IO_API_KEY  = the key from step 3  (mark as secret)
//        ALLOWED_ORIGIN      = https://your-live-domain
//   Without SYSTEME_IO_API_KEY the form runs in test mode: submissions
//   are validated and logged, but nothing is sent to Systeme.io.
// ---------------------------------------------------------------

const SYSTEME_API_BASE = 'https://api.systeme.io/api'

// Built-in Systeme.io contact fields (already exist on every account).
// These slugs follow Systeme.io's standard built-in field keys; confirm
// on the first live test submission (see IMPORTANT NOTE above).
const BUILTIN_SLUGS = {
  first_name: 'first_name',
  last_name: 'surname',
  phone: 'phone_number',
}

// Custom fields created manually in step 2 above.
const FIELD_SLUGS = {
  reason: 'reason',
  who_for: 'who_for',
  timing: 'timing',
  budget: 'budget',
  walkthrough: 'walkthrough',
  health: 'health',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Keep these in sync with the option lists in BookConsultation.jsx.
const VALID_REASONS = [
  "Protect my family's income if something happens to me.",
  'Protect myself against a serious illness or hospitalisation.',
  'Build savings or an investment toward a goal I can name.',
  'I already have coverage and want it reviewed.',
  'Something else. I am asking about employment, loans, or a business partnership.',
]
const VALID_WHO_FOR = [
  'Myself.',
  'Myself and my spouse or children.',
  'My parents or someone else who depends on me.',
  'I am working abroad and planning for my family back home.',
]
const VALID_TIMING = [
  'Right away, within the next week or two.',
  'Within the month.',
  'In the next two to three months.',
  'I am reading up for now, with no particular date in mind.',
]
const VALID_BUDGET = [
  'Under ₱2,000 a month. I would like to start small.',
  '₱2,000 to ₱4,000 a month.',
  '₱4,001 to ₱7,000 a month.',
  '₱7,001 and up a month.',
  'Nothing at all right now.',
]
const VALID_WALKTHROUGH = [
  'Yes. I want it explained plainly, then time to think.',
  'No. I only want brochures or a price list to read on my own.',
]
const VALID_HEALTH = [
  'Generally healthy.',
  'Some manageable conditions, such as hypertension or diabetes.',
  'Severe or chronic conditions.',
  'I would rather talk about this privately.',
]

function computeTags(answers) {
  const tags = []

  if (answers.timing === VALID_TIMING[0]) tags.push('urgent')

  if (answers.budget === VALID_BUDGET[3]) tags.push('budget-high')
  if (answers.budget === VALID_BUDGET[0] || answers.budget === VALID_BUDGET[4]) {
    tags.push('budget-low')
  }

  if (
    answers.health === VALID_HEALTH[2] ||
    answers.health === VALID_HEALTH[3]
  ) {
    tags.push('health-sensitive')
  }

  if (answers.reason === VALID_REASONS[3]) tags.push('existing-coverage-review')
  if (answers.who_for === VALID_WHO_FOR[3]) tags.push('ofw')

  return tags
}

// Split "Juan Dela Cruz" into first name "Juan" and last name
// "Dela Cruz" so it fits Systeme.io's built-in First/Last name fields.
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  const first = parts.shift() || ''
  return { first, last: parts.join(' ') }
}

// Normalise Philippine mobile numbers to international format
// (09171234567 → +639171234567) so they don't get stored under the
// account's default country code. Anything else is passed through.
function normalisePhone(mobile) {
  const digits = mobile.replace(/[^\d+]/g, '')
  if (/^09\d{9}$/.test(digits)) return '+63' + digits.slice(1)
  if (/^639\d{9}$/.test(digits)) return '+' + digits
  return digits
}

/**
 * Validates a submission and, when an API key is set, saves it to
 * Systeme.io. Returns { status, body } for the hosting wrapper to send.
 */
export async function handleSubmission(body, apiKey) {
  const { fullName, email, mobile, answers = {}, website } = body || {}

  // Honeypot: real visitors never fill this hidden field. Pretend
  // success so bots learn nothing, but do nothing.
  if (website) return { status: 200, body: { ok: true } }

  const errors = []
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name is required.')
  }
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email address is required.')
  if (!mobile || typeof mobile !== 'string' || mobile.replace(/\D/g, '').length < 7) {
    errors.push('A valid mobile number is required.')
  }
  if (!VALID_REASONS.includes(answers.reason)) errors.push('Invalid answer for "reason".')
  if (!VALID_WHO_FOR.includes(answers.who_for)) errors.push('Invalid answer for "who_for".')
  if (!VALID_TIMING.includes(answers.timing)) errors.push('Invalid answer for "timing".')
  if (!VALID_BUDGET.includes(answers.budget)) errors.push('Invalid answer for "budget".')
  if (!VALID_WALKTHROUGH.includes(answers.walkthrough)) errors.push('Invalid answer for "walkthrough".')
  if (!VALID_HEALTH.includes(answers.health)) errors.push('Invalid answer for "health".')

  if (errors.length > 0) {
    return { status: 400, body: { error: 'Validation failed', details: errors } }
  }

  const tags = computeTags(answers)

  if (!apiKey) {
    console.log('[submit-consultation] TEST MODE (no SYSTEME_IO_API_KEY set). Lead:', {
      fullName, email, mobile, answers, tags,
    })
    return { status: 200, body: { ok: true, mode: 'test' } }
  }

  // ---- Live mode: create or update the contact, then tag it ----
  const fields = [
    { slug: BUILTIN_SLUGS.first_name, value: splitName(fullName).first },
    { slug: BUILTIN_SLUGS.last_name, value: splitName(fullName).last },
    { slug: BUILTIN_SLUGS.phone, value: normalisePhone(mobile) },
    { slug: FIELD_SLUGS.reason, value: answers.reason },
    { slug: FIELD_SLUGS.who_for, value: answers.who_for },
    { slug: FIELD_SLUGS.timing, value: answers.timing },
    { slug: FIELD_SLUGS.budget, value: answers.budget },
    { slug: FIELD_SLUGS.walkthrough, value: answers.walkthrough },
    { slug: FIELD_SLUGS.health, value: answers.health },
  ]

  try {
    let contactId = null

    // 1. Try to create a new contact.
    const createRes = await systemeFetch(apiKey, '/contacts', {
      method: 'POST',
      body: JSON.stringify({ email, fields }),
    })

    if (createRes.ok) {
      contactId = (await createRes.json()).id
    } else {
      // 2. Creation failed. The usual reason is that this email is
      //    already a contact (someone filling in the form twice), so
      //    look them up and update their answers instead of failing.
      const createError = await createRes.text()
      contactId = await findContactIdByEmail(apiKey, email)

      if (!contactId) {
        console.error('[submit-consultation] Contact creation failed:', createRes.status, createError)
        return { status: 502, body: { error: 'Could not save contact' } }
      }

      const updateRes = await systemeFetch(apiKey, `/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify({ fields }),
      })

      if (!updateRes.ok) {
        console.error('[submit-consultation] Contact update failed:', updateRes.status, await updateRes.text())
        return { status: 502, body: { error: 'Could not update contact' } }
      }
      console.log(`[submit-consultation] Existing contact ${contactId} updated with new answers.`)
    }

    // 3. Assign tags. Systeme.io assigns tags by numeric ID, not by
    //    name, so each tag name is looked up first. Tags that don't
    //    exist in the account (e.g. not created yet on the free plan)
    //    are skipped and logged; the contact is already saved, so a
    //    tag problem never fails the submission.
    for (const tagName of tags) {
      try {
        const tagId = await findTagIdByName(apiKey, tagName)
        if (!tagId) {
          console.warn(`[submit-consultation] Tag "${tagName}" does not exist in Systeme.io yet; skipped.`)
          continue
        }
        const tagRes = await systemeFetch(apiKey, `/contacts/${contactId}/tags`, {
          method: 'POST',
          body: JSON.stringify({ tagId }),
        })
        if (!tagRes.ok) {
          console.error(`[submit-consultation] Assigning tag "${tagName}" failed:`, tagRes.status, await tagRes.text())
        }
      } catch (tagErr) {
        console.error(`[submit-consultation] Error assigning tag "${tagName}":`, tagErr)
      }
    }

    return { status: 200, body: { ok: true, mode: 'live' } }
  } catch (err) {
    console.error('[submit-consultation] Unexpected error:', err)
    return { status: 500, body: { error: 'Unexpected server error' } }
  }
}

// ---------------------------------------------------------------
// Systeme.io API helpers
// ---------------------------------------------------------------

function systemeFetch(apiKey, path, options = {}) {
  return fetch(`${SYSTEME_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
      'X-API-Key': apiKey,
    },
  })
}

// Systeme.io list responses wrap results in an "items" array.
function listItems(data) {
  if (Array.isArray(data)) return data
  return data?.items || []
}

async function findContactIdByEmail(apiKey, email) {
  const res = await systemeFetch(apiKey, `/contacts?email=${encodeURIComponent(email)}`)
  if (!res.ok) {
    console.error('[submit-consultation] Contact lookup failed:', res.status, await res.text())
    return null
  }
  const match = listItems(await res.json()).find(
    (c) => c.email && c.email.toLowerCase() === email.toLowerCase()
  )
  return match ? match.id : null
}

async function findTagIdByName(apiKey, name) {
  const res = await systemeFetch(apiKey, `/tags?query=${encodeURIComponent(name)}`)
  if (!res.ok) {
    console.error(`[submit-consultation] Tag lookup for "${name}" failed:`, res.status, await res.text())
    return null
  }
  const match = listItems(await res.json()).find((t) => t.name === name)
  return match ? match.id : null
}
