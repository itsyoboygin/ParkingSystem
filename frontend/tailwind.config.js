/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#002b5c',
          dark: '#001a38',
          light: '#003d7a'
        },
        accent: {
          DEFAULT: '#66b2ff',
          light: '#99ccff',
          dark: '#3399ff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}