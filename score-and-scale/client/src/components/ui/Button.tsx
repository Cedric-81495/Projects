import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform,box-shadow] duration-200 ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/90 shadow-soft',
  accent: 'bg-accent text-accent-ink hover:bg-accent/90 shadow-soft',
  secondary: 'border border-line bg-surface text-ink hover:bg-raised hover:border-ink/20',
  ghost: 'text-muted hover:text-ink hover:bg-raised',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

function classes({ variant = 'primary', size = 'md', fullWidth, className }: CommonProps): string {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={classes({ variant, size, fullWidth, className, children })}
      disabled={disabled || loading}
      /**
       * aria-busy tells a screen reader the control is working. The label text
       * is left intact rather than swapped for "Loading…", so the accessible
       * name stays stable while the request is in flight.
       */
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={size === 'lg' ? 18 : 15} />}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends CommonProps {
  to: string
  /** Renders a plain anchor for off-site or hash targets. */
  external?: boolean
  onClick?: () => void
  'aria-label'?: string
}

/** Same visual language as Button, for navigation rather than an action. */
export function ButtonLink({
  to,
  external = false,
  variant,
  size,
  fullWidth,
  className,
  children,
  onClick,
  ...rest
}: ButtonLinkProps) {
  const classNames = classes({ variant, size, fullWidth, className, children })

  if (external) {
    return (
      <a
        href={to}
        className={classNames}
        onClick={onClick}
        {...(to.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={classNames} onClick={onClick} {...rest}>
      {children}
    </Link>
  )
}
