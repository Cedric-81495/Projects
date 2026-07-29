import { useState } from 'react'
import { cn } from '../../lib/cn'
import { FadeUp } from '../ui/FadeUp'
import { Section, SectionHeading } from '../ui/Section'

const FAQS = [
  {
    question: 'How quickly will I see my score move?',
    answer:
      'Utilisation changes can show up in a single billing cycle. Disputes take 30 to 45 days to resolve. Most members see meaningful movement within 60 to 90 days, which is why every program is built around a 90-day plan.',
  },
  {
    question: 'Do you guarantee a specific score increase?',
    answer:
      'No, and you should be sceptical of anyone who does. Your outcome depends on what is actually on your report. What we guarantee is that the work is done in the right order and that you will know exactly where you stand at every stage.',
  },
  {
    question: 'Is this credit repair or funding?',
    answer:
      'Both, in sequence. Repair without a funding strategy leaves you with a better score and no capital. Funding applications without repair get declined. We do the first to make the second work.',
  },
  {
    question: 'What documents will I need to provide?',
    answer:
      'A photo ID, a recent credit report, and business formation documents if you have an entity. You upload them securely in your dashboard and our team reviews each one, usually within two business days.',
  },
  {
    question: 'What happens after I pay?',
    answer:
      'Your dashboard unlocks immediately with your document checklist and the academy. An advisor is assigned within one business day and your audit begins as soon as your documents are approved.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'You can cancel yourself from your dashboard any time before your audit begins. Once work is underway, contact your advisor and we will handle it directly — no retention scripts.',
  },
]

export function Faq() {
  /**
   * One panel open at a time, tracked by index. An accordion where everything
   * can be open at once loses the scannability that makes the pattern useful.
   */
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Section id="faq" tone="canvas">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <SectionHeading
          eyebrow="FAQ"
          title="The questions we get asked most"
          description="If yours is not here, ask us directly — we answer every message ourselves."
        />

        <FadeUp delay={80}>
          <ul className="divide-y divide-line border-y border-line">
            {FAQS.map((faq, index) => {
              const open = openIndex === index
              const panelId = `faq-panel-${index}`
              const buttonId = `faq-button-${index}`

              return (
                <li key={faq.question}>
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      // aria-expanded/controls give assistive tech the open state
                      // and the relationship to the panel it toggles.
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(open ? null : index)}
                      className="flex w-full items-start justify-between gap-6 py-5 text-left"
                    >
                      <span className="text-[0.9375rem] font-medium text-ink">{faq.question}</span>
                      <span
                        className={cn(
                          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform duration-300 ease-entrance',
                          open && 'rotate-45 border-accent/40 text-accent',
                        )}
                        aria-hidden="true"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  {/*
                    A grid-template-rows transition animates height without the
                    fixed max-height guess that clips longer answers.
                  */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-entrance',
                      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-10 text-sm leading-relaxed text-muted">{faq.answer}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </FadeUp>
      </div>
    </Section>
  )
}
