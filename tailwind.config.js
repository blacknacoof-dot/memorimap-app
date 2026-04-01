/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,lib,services,types,hooks,stores,utils,pages,src}/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5D737E',
        secondary: '#F0F4F8',
        accent: '#C0A080',
        dark: '#2C3E50',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [],
}

