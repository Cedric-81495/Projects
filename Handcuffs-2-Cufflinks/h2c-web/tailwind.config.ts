import type { Config } from 'tailwindcss';

/**
 * Handcuffs 2 Cufflinks design tokens.
 * The palette maps a single arc: cold steel (handcuffs) -> warm brass (cufflinks),
 * grounded in a Boston-night black-green. Black + gold + green, per the brief.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#040608',
        ink: '#06080A',
        concrete: { DEFAULT: '#0A0C0E', 2: '#151619', 3: '#1D1F22' },
        slate: '#262829',
        steel: { DEFAULT: '#979B9E', dim: '#3A3D3F' },
        bone: '#F7F3E9',
        // The green: deep forest, the Boston-night / legacy tone.
        forest: { DEFAULT: '#082A1D', lit: '#0E4A31', deep: '#04160E' },
        brass: { DEFAULT: '#C8A34A', lit: '#E9D08A', deep: '#8A6B22' },
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', '"Archivo Narrow"', 'Impact', 'sans-serif'],
        story: ['Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
        ui: ['Archivo', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      maxWidth: { site: '1440px' },
      letterSpacing: { widest2: '0.22em' },
      transitionTimingFunction: { arc: 'cubic-bezier(.2,.7,.2,1)' },
      keyframes: {
        heroIn: { to: { opacity: '1', transform: 'none' } },
        cue: {
          '0%,100%': { opacity: '.25', transform: 'scaleY(.6)' },
          '50%': { opacity: '1', transform: 'scaleY(1)' },
        },
      },
      animation: {
        heroIn: 'heroIn 1s cubic-bezier(.2,.7,.2,1) forwards',
        cue: 'cue 2.4s cubic-bezier(.2,.7,.2,1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
