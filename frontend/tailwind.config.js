/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'redi': {
          'coral': '#E55B64',
          'coral-dark': '#D14A53',
          'navy': '#1B3A5F',
          'navy-light': '#2A4F7F',
          'teal': '#2B9E9E',
          'teal-dark': '#238585',
          'light-teal': '#8DD4D4',
          'lime': '#B8CC26',
          'sky': '#5DADE2',
          'yellow': '#F4D03F',
        }
      },
      boxShadow: {
        'redi-sm': '0 1px 2px rgba(0,0,0,0.1)',
        'redi-md': '0 4px 6px rgba(0,0,0,0.1)',
        'redi-lg': '0 10px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
