import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1A2B',
        ink2: '#152740',
        paper: '#F1EAD9',
        paper2: '#E8DFC9',
        brass: '#C6A15B',
        brassBright: '#E4C583',
        teal: '#1F6F5C',
        brandRed: '#B33F3F',
        offwhite: '#FBF8F2',
        line: 'rgba(198,161,91,0.35)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
