import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  /** Adds a hover lift. Only for cards that are themselves interactive. */
  interactive?: boolean
  as?: 'div' | 'article' | 'section' | 'li'
}

export function Card({ children, className, interactive = false, as = 'div' }: CardProps) {
  const Tag = as

  return (
    <Tag
      className={cn(
        'rounded-card border border-line bg-surface shadow-soft',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-300 ease-entrance ' +
            'hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-lifted',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('px-5 py-5 sm:px-6', className)}>{children}</div>
}
