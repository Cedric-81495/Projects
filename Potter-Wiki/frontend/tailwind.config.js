// frontend/tailwind.config.js
import scrollbar from 'tailwind-scrollbar'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        navbar: '#171718',
        wizard: {
        bg: '#1C1B29',
        card: '#2A273F',
        accent: '#7F5AF0',
        gold: '#FFD700',
        error: '#FF4C4C',
        success: '#32CD32',
        textSecondary: '#C0C0C0',
        },

      },
    },
  },
  plugins: [scrollbar],
}
