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
      zIndex: {
        'promo': '20',
        'filter': '30',
        'topbar': '40',
        'toast': '100',
        'bottomnav': '150',
        'sheet': '200',
        'sheet-upper': '250',
        'modal': '300',
        'modal-upper': '320',
        'drawer': '350',
        'critical': '400',
        'overlay-max': '500',
      }
    },
  },
  plugins: [],
}

