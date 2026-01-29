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
      fontFamily: {
        'sans': ['Montserrat', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        'display': ['Bebas Neue', 'Impact', 'Arial Black', 'sans-serif'],
      },
      fontSize: {
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.1)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
