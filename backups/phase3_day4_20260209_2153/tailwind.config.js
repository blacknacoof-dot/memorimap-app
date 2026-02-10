/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,lib,services,types}/**/*.{js,ts,jsx,tsx}",
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
      }
    },
  },
  plugins: [],
}

