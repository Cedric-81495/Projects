import type { Config } from 'tailwindcss'

/**
 * Colours resolve to CSS custom properties defined in index.css rather than
 * literal hex values. That gives one source of truth for the palette and lets
 * the dark theme swap tokens without any `dark:` variant on every element.
 *
 * The channel-triplet form (`R G B`) is what allows Tailwind's opacity
 * modifiers — `bg-accent/10`, `text-ink/60` — to keep working.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('--color-canvas'),
        surface: token('--color-surface'),
        raised: token('--color-raised'),
        ink: token('--color-ink'),
        muted: token('--color-muted'),
        subtle: token('--color-subtle'),
        line: token('--color-line'),
        accent: token('--color-accent'),
        'accent-soft': token('--color-accent-soft'),
        'accent-ink': token('--color-accent-ink'),
        positive: token('--color-positive'),
        warning: token('--color-warning'),
        critical: token('--color-critical'),
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Display sizes pair a tight leading with negative tracking, which is
        // what stops large headings reading like a default browser h1.
        'display-xl': ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.25rem, 4.4vw, 3.25rem)', { lineHeight: '1.06', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.25rem)', { lineHeight: '1.14', letterSpacing: '-0.022em' }],
        'display-sm': ['clamp(1.375rem, 2vw, 1.625rem)', { lineHeight: '1.22', letterSpacing: '-0.015em' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.16em' }],
      },
      spacing: {
        section: 'clamp(4.5rem, 9vw, 8rem)',
      },
      maxWidth: {
        container: '75rem',
        prose: '42rem',
      },
      borderRadius: {
        card: '1rem',
        pill: '999px',
      },
      boxShadow: {
        // Layered, low-opacity shadows read as depth; a single dark blur reads
        // as a drop shadow from 2010.
        soft: '0 1px 2px rgb(var(--shadow-rgb) / 0.04), 0 4px 12px -2px rgb(var(--shadow-rgb) / 0.06)',
        lifted:
          '0 1px 2px rgb(var(--shadow-rgb) / 0.05), 0 8px 24px -4px rgb(var(--shadow-rgb) / 0.10)',
        focus: '0 0 0 3px rgb(var(--color-accent) / 0.28)',
      },
      transitionTimingFunction: {
        entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0, 14px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'indeterminate-bar': {
          '0%': { transform: 'translateX(-100%) scaleX(0.4)' },
          '50%': { transform: 'translateX(0%) scaleX(0.7)' },
          '100%': { transform: 'translateX(100%) scaleX(0.4)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'indeterminate-bar': 'indeterminate-bar 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
