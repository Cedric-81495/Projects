import braintree from 'braintree'
import { readOptionalGroup } from './env'
import { integrationUnavailable } from './errors'

let gateway: braintree.BraintreeGateway | null = null

/**
 * Lazily constructs the gateway.
 *
 * Credentials are read on first use rather than at import time so the API
 * boots and serves the marketing site, auth, and dashboard even on an
 * environment where payments are not configured. Checkout then returns a clear
 * 503 instead of the whole process failing to start.
 */
export function getBraintreeGateway(): braintree.BraintreeGateway {
  if (gateway) return gateway

  const config = readOptionalGroup([
    'BT_MERCHANT_ID',
    'BT_PUBLIC_KEY',
    'BT_PRIVATE_KEY',
  ] as const)

  if (!config) throw integrationUnavailable('Braintree')

  gateway = new braintree.BraintreeGateway({
    environment:
      process.env.BT_ENV === 'production'
        ? braintree.Environment.Production
        : braintree.Environment.Sandbox,
    merchantId: config.BT_MERCHANT_ID,
    publicKey: config.BT_PUBLIC_KEY,
    privateKey: config.BT_PRIVATE_KEY,
  })

  return gateway
}

export function isBraintreeConfigured(): boolean {
  return (
    readOptionalGroup(['BT_MERCHANT_ID', 'BT_PUBLIC_KEY', 'BT_PRIVATE_KEY'] as const) !== null
  )
}

/** Braintree expects a decimal string, while we store integer cents. */
export function centsToAmountString(cents: number): string {
  return (cents / 100).toFixed(2)
}
