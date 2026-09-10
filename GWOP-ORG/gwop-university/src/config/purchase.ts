/* ═══════════════════════════════════════════════════════════════════════════
   PURCHASE ACKNOWLEDGEMENT  —  OWNER: SURPAUL (approves) · COUNSEL (wording)

   The sentence a buyer must tick before payment, and the record we keep of it.

   ⚠ THE WORDING IS HERE, NOT IN THE COMPONENT, AND THAT IS THE POINT.

   Counsel has not yet answered whether any part of the offer falls under the
   Credit Repair Organizations Act. If it does, this is not "non-refundable,
   immediate access" — CROA requires a three-day cancellation right, which is a
   different sentence and possibly a different flow. Hardcoding the copy in the
   checkout component would mean a code change and a deploy to comply with
   legal advice.

   ⚠ WHEN THE WORDING CHANGES, ADD A NEW VERSION. DO NOT EDIT AN OLD ONE.
   Every purchase stores the version it displayed. Editing `v1` in place would
   silently rewrite what past buyers agreed to, which is the one thing this
   whole mechanism exists to prevent.

   ⚠ AND THE POLICY IS NOT THE SAME AS THE ACKNOWLEDGEMENT.
   REFUND_POLICY.text in config/membership.ts is what the marketing page
   states. This is what the buyer actively agrees to at the moment of payment.
   They should say the same thing, but they are different artefacts with
   different evidential weight, which is why they are not one string.
   ═══════════════════════════════════════════════════════════════════════════ */

/** A revision of the acknowledgement wording. Append-only. */
type AckVersion = {
  /** Stored on every purchase. Bump for any change to `text`, however small. */
  version: string
  /** Displayed beside the checkbox and stored verbatim. */
  text: string
  /** Why this revision exists — for whoever reads this in a dispute. */
  note: string
  /** Set false once superseded. Kept so old purchases still resolve. */
  current: boolean
}

const VERSIONS: AckVersion[] = [
  {
    version: 'v1-2026-09',
    text:
      'I understand this purchase is non-refundable and that I receive '
      + 'immediate access to the course material.',
    note:
      'Initial wording. Reflects Surpaul\'s "no refund" direction and the '
      + 'immediate-access model. NOT yet reviewed by counsel — the CROA '
      + 'question is outstanding, and a three-day cancellation right would '
      + 'require a v2 rather than an edit to this.',
    current: true,
  },
]

/** The revision to show at checkout now. */
export function currentAck(): AckVersion {
  const found = VERSIONS.find(v => v.current)
  /* Throwing rather than defaulting: a checkout that proceeds with no
     acknowledgement is worse than a checkout that fails loudly, because the
     failure is visible and the missing record is not. */
  if (!found) throw new Error('No current purchase acknowledgement configured')
  return found
}

/** Look up a stored version — used when assembling dispute evidence. */
export function ackByVersion(version: string): AckVersion | undefined {
  return VERSIONS.find(v => v.version === version)
}

/* ⚠ FALSE UNTIL COUNSEL SIGNS THE WORDING.

   While false, checkout still REQUIRES the tick and still records it — the
   evidence trail is live from the first purchase, which matters because the
   first purchase is the one most likely to be disputed by someone who has
   nothing else to point at.

   What false means: the wording is ours, not counsel's. Any dispute response
   should say so rather than implying the sentence was reviewed. Flip it when
   the CROA answer lands and the wording is confirmed or replaced. */
export const ACK_APPROVED = false
