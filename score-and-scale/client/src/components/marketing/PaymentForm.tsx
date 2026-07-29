import { useEffect, useRef, useState } from 'react'
import type { Dropin } from 'braintree-web-drop-in'
import { ApiError, apiFetch } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { Button } from '../ui/Button'
import { FormError } from '../ui/Field'
import { Spinner } from '../ui/Spinner'

interface PaymentFormProps {
  programSlug: string
  programName: string
  priceCents: number
  currency: string
  onSuccess: (result: { enrollmentId: string; transactionId: string }) => void
}

/**
 * Braintree Drop-in wrapper.
 *
 * The SDK is imported dynamically so its considerable weight only loads on this
 * route — a visitor reading the funnel page never downloads it.
 */
export function PaymentForm({
  programSlug,
  programName,
  priceCents,
  currency,
  onSuccess,
}: PaymentFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<Dropin | null>(null)
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let created: Dropin | null = null

    async function initialise() {
      try {
        const { clientToken } = await apiFetch<{ clientToken: string }>(
          '/api/checkout/client-token',
        )

        if (cancelled || !containerRef.current) return

        const dropin = await import('braintree-web-drop-in')
        created = await dropin.default.create({
          authorization: clientToken,
          container: containerRef.current,
          card: { cardholderName: { required: true } },
          // Device data feeds Braintree's fraud tooling.
          dataCollector: true,
        })

        /**
         * The component may have unmounted while the SDK was initialising. Tear
         * the instance down rather than leaving an orphaned iframe attached to
         * a detached node.
         */
        if (cancelled) {
          void created.teardown()
          return
        }

        instanceRef.current = created
        setReady(true)
      } catch (caught) {
        if (cancelled) return
        setError(
          caught instanceof ApiError && caught.code === 'INTEGRATION_NOT_CONFIGURED'
            ? 'Card payments are not available right now. Please contact us to complete your enrollment.'
            : 'We could not load the payment form. Please refresh and try again.',
        )
      }
    }

    void initialise()

    return () => {
      cancelled = true
      const instance = instanceRef.current
      instanceRef.current = null
      // Teardown removes Braintree's iframes; skipping it leaks them on
      // navigation and breaks a second mount.
      if (instance) void instance.teardown().catch(() => undefined)
    }
  }, [])

  async function pay() {
    const instance = instanceRef.current
    if (!instance) return

    setPaying(true)
    setError(null)

    try {
      const { nonce, deviceData } = (await instance.requestPaymentMethod()) as {
        nonce: string
        deviceData?: string
      }

      /**
       * Only the program slug and the nonce are sent. The amount is derived from
       * the database server-side, so the price cannot be altered here.
       */
      const result = await apiFetch<{ enrollmentId: string; transactionId: string }>(
        '/api/checkout',
        {
          method: 'POST',
          body: {
            programSlug,
            paymentMethodNonce: nonce,
            ...(deviceData ? { deviceData } : {}),
          },
        },
      )

      onSuccess(result)
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
      } else if (caught instanceof Error && caught.message.includes('No payment method')) {
        setError('Please complete your card details first.')
      } else {
        setError('We could not process that payment. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-5">
          <FormError>{error}</FormError>
        </div>
      )}

      {/*
        The container must stay mounted for Braintree to attach to it, so the
        loading state sits alongside rather than replacing it.
      */}
      {!ready && !error && (
        <div className="flex items-center gap-2.5 py-8 text-sm text-muted">
          <Spinner size={17} />
          Loading secure payment form…
        </div>
      )}

      <div ref={containerRef} />

      <Button
        variant="accent"
        size="lg"
        fullWidth
        className="mt-5"
        onClick={() => void pay()}
        disabled={!ready}
        loading={paying}
      >
        {paying ? 'Processing…' : `Pay ${formatPrice(priceCents, currency)}`}
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-subtle">
        Your card details are sent directly to Braintree and never touch our servers. You are paying
        for {programName}.
      </p>
    </div>
  )
}
