/** @type {import('tailwindcss').Config} */
export default {
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ],
  theme: {
    extend: {
      colors: {
        "gray-scale" : "#1f2227",
      },
    },
  },
  plugins: [],
};
