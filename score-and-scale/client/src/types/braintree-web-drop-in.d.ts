/**
 * Local declarations for braintree-web-drop-in, which ships no types of its own.
 *
 * Scoped to the surface this app actually uses rather than mirroring the whole
 * SDK — a narrower declaration is easier to keep honest.
 */
declare module 'braintree-web-drop-in' {
  export interface PaymentMethodPayload {
    nonce: string
    type: string
    details?: {
      cardType?: string
      lastFour?: string
      lastTwo?: string
    }
  }

  export interface Dropin {
    requestPaymentMethod(): Promise<PaymentMethodPayload>
    teardown(): Promise<void>
    on(event: 'paymentMethodRequestable' | 'noPaymentMethodRequestable', handler: () => void): void
    isPaymentMethodRequestable(): boolean
  }

  export interface DropinCreateOptions {
    authorization: string
    container: HTMLElement | string
    locale?: string
    card?: {
      cardholderName?: { required?: boolean } | boolean
      overrides?: Record<string, unknown>
    }
    dataCollector?: boolean | { paypal?: boolean }
    paypal?: Record<string, unknown>
  }

  export function create(options: DropinCreateOptions): Promise<Dropin>

  const dropin: { create: typeof create }
  export default dropin
}
