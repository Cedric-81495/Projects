// frontend/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-spotify-black',
    'bg-spotify-green',
    'bg-spotify-gray',
    'bg-spotify-light',
    'bg-spotify-darkgray',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          black: '#121212',
          green: '#1DB954',
          gray: '#181818',
          light: '#282828',
          darkgray: '#212121',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        spotify: '0 2px 10px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
