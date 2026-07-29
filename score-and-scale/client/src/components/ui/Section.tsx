import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { FadeUp } from './FadeUp'

interface SectionProps {
  id?: string
  children: ReactNode
  className?: string
  /** Tints the band so adjacent sections separate without a hard rule. */
  tone?: 'canvas' | 'raised' | 'ink'
}

export function Section({ id, children, className, tone = 'canvas' }: SectionProps) {
  const tones = {
    canvas: 'bg-canvas',
    raised: 'bg-raised',
    ink: 'bg-ink text-canvas',
  } as const

  return (
    <section id={id} className={cn('py-section', tones[tone], className)}>
      <div className="container-page">{children}</div>
    </section>
  )
}

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  /** Left-aligned reads as editorial; centred suits a full-width band. */
  align?: 'left' | 'center'
  inverted?: boolean
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  inverted = false,
}: SectionHeadingProps) {
  return (
    <FadeUp>
      <div
        className={cn(
          'max-w-prose',
          align === 'center' && 'mx-auto text-center',
        )}
      >
        {eyebrow && (
          <p className={cn('eyebrow', inverted && 'text-accent/90')}>{eyebrow}</p>
        )}
        <h2
          className={cn(
            'text-display-md font-semibold',
            eyebrow && 'mt-3',
            inverted ? 'text-canvas' : 'text-ink',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-4 text-base leading-relaxed sm:text-lg',
              inverted ? 'text-canvas/70' : 'text-muted',
            )}
          >
            {description}
          </p>
        )}
      </div>
    </FadeUp>
  )
}
