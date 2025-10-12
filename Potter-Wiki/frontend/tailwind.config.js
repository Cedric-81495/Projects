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
      },
    },
  },
  plugins: [scrollbar],
}
