/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        black: '#000000',
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e1',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        red: {
          sale: '#c20000',
        },
      },
      fontFamily: {
        sans: ['Glacial Indifference', 'sans-serif'],
        display: ['Glacial Indifference', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        '7xl': '80rem',
        '8xl': '1216px',
      },
      screens: {
        'max-md': { max: '767px' },
        'max-lg': { max: '1023px' },
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}