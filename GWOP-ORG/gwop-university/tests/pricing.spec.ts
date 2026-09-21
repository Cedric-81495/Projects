import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  BLUEPRINT_BUNDLE,
  upgradeToBundlePrice,
  bundleIsBestDeal,
  remainingSeparateTotal,
} from '../src/config/membership'

/* ═══════════════════════════════════════════════════════════════════════════
   THE UPGRADE CREDIT — pinned to the Pricing, Payment & Package Master

   No database, no Stripe: this is the commercial rule on its own. If one of
   these fails, either a price moved or somebody changed what the credit means,
   and both want a conversation rather than a fixed test.

   The doc, verbatim: "Someone buys one level and later wants the bundle.
   Credit the earlier purchase in full. You collect $997 either way rather
   than more. That is deliberate."
   ═══════════════════════════════════════════════════════════════════════════ */

const price = (order: number) => LEVELS.find(l => l.order === order)!.oneTime!
const BUNDLE = BLUEPRINT_BUNDLE.oneTime!

describe('upgrade credit', () => {
  /* ── The doc's own table, reproduced exactly ─────────────────────────────
     THEY BOUGHT          BUNDLE UPGRADE PRICE
     Level 1 ($197)       $800
     Level 2 ($297)       $700
     Level 3 ($397)       $600
     Level 4 ($497)       $500 */
  it.each([
    [1, 800],
    [2, 700],
    [3, 600],
    [4, 500],
  ])('owning Level %i upgrades the bundle to $%i', (level, expected) => {
    expect(upgradeToBundlePrice([level])).toBe(expected)
  })

  it('charges the list price to a buyer who owns nothing', () => {
    expect(upgradeToBundlePrice([])).toBe(BUNDLE)
  })

  /* ── The promise, stated as arithmetic ──────────────────────────────────
     "You collect $997 either way rather than more." Whatever order somebody
     buys in, the total is the bundle price — for every state where the bundle
     is still offered. This is the single assertion that matters most: it is
     the sentence on the sales page, expressed as a number. */
  it('every offered route totals exactly the bundle price', () => {
    const states: number[][] = []
    for (const a of [[], [1], [2], [3], [4]]) states.push(a)
    for (const pair of [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]) states.push(pair)
    for (const trio of [[1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4]]) states.push(trio)

    for (const owned of states) {
      if (!bundleIsBestDeal(owned)) continue
      const paid = owned.reduce((sum, l) => sum + price(l), 0)
      expect(paid + upgradeToBundlePrice(owned)!, `owning ${owned}`).toBe(BUNDLE)
    }
  })

  /* ── Where the doc stops, and what we do there ──────────────────────────
     The table only ever contemplates ONE prior purchase. Someone holding
     {2,3,4} has paid $1,191 against a $997 product — crediting it in full
     would mean giving away the last level and a zero-amount Stripe session,
     which Stripe rejects anyway.

     Nothing invents a policy here: the bundle is simply not offered, and they
     buy the one level they are missing at its own price, which is cheaper for
     them than any bundle could be. */
  it.each([
    [[1, 3, 4]],
    [[2, 3, 4]],
  ])('does not offer the bundle to a buyer who has already paid more than it costs (%j)', owned => {
    expect(upgradeToBundlePrice(owned)).toBe(0)
    expect(bundleIsBestDeal(owned)).toBe(false)
    /* And the alternative is genuinely cheaper for them than the bundle. */
    expect(remainingSeparateTotal(owned)!).toBeLessThan(BUNDLE)
  })

  it('offers nothing to a buyer who owns all four', () => {
    expect(bundleIsBestDeal([1, 2, 3, 4])).toBe(false)
  })

  /* ⚠ THE CREDITED PRICE MUST ALWAYS BEAT FINISHING SEPARATELY wherever the
     card is shown. If this ever fails, the site is presenting the bundle as
     the best deal when it is not — the exact thing Surpaul's memo forbids. */
  it('never shows the bundle when finishing separately would cost less', () => {
    for (const owned of [[], [1], [2], [3], [4], [1, 2], [2, 3], [3, 4], [1, 2, 3]]) {
      if (!bundleIsBestDeal(owned)) continue
      expect(upgradeToBundlePrice(owned)!, `owning ${owned}`)
        .toBeLessThan(remainingSeparateTotal(owned)!)
    }
  })

  /* Stripe rejects charges under $0.50. The smallest credited price these
     prices can produce is $6 — {1,2,4}. Checkout guards it anyway; this is
     the early warning if a price change ever brings it close. */
  it('never produces a charge Stripe would reject', () => {
    for (const owned of [[1, 2, 4], [1, 2, 3], [3, 4]]) {
      const p = upgradeToBundlePrice(owned)!
      if (p > 0) expect(p, `owning ${owned}`).toBeGreaterThanOrEqual(1)
    }
  })
})
