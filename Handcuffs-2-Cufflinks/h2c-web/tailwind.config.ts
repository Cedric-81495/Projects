import type { Config } from 'tailwindcss';

/**
 * H2C design tokens.
 * Colors are defined as CSS variables in src/index.css and referenced here,
 * so theming stays centralized and can be swapped at runtime if needed.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        onyx: 'rgb(var(--c-onyx) / <alpha-value>)',
        raise: 'rgb(var(--c-raise) / <alpha-value>)',
        bone: 'rgb(var(--c-bone) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)',
          bright: 'rgb(var(--c-gold-bright) / <alpha-value>)',
          deep: 'rgb(var(--c-gold-deep) / <alpha-value>)',
        },
        green: {
          DEFAULT: 'rgb(var(--c-green) / <alpha-value>)',
          bright: 'rgb(var(--c-green-bright) / <alpha-value>)',
          deep: 'rgb(var(--c-green-deep) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.25rem, 9vw, 8.5rem)', { lineHeight: '0.98', letterSpacing: '-0.005em' }],
        'display-lg': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.02', letterSpacing: '0' }],
        'display-md': ['clamp(2rem, 4vw, 3.25rem)', { lineHeight: '1.08', letterSpacing: '0' }],
      },
      letterSpacing: {
        eyebrow: '0.28em',
      },
      maxWidth: {
        edge: '80rem',
        prose: '42rem',
      },
      boxShadow: {
        raise: '0 1px 0 rgb(var(--c-gold) / 0.12) inset, 0 20px 60px -30px rgb(0 0 0 / 0.8)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(100deg, rgb(var(--c-gold-deep)) 0%, rgb(var(--c-gold-bright)) 45%, rgb(var(--c-gold)) 100%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'draw': {
          from: { strokeDashoffset: '1' },
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
