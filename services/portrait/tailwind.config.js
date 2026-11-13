/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e3f2fd',
          100: '#d6eeff',
          200: '#a8d8ff',
          300: '#54b3ff',
          400: '#2097ff',
          500: '#007AFF',
          600: '#0062cc',
          700: '#004fa3',
          800: '#003d80',
          900: '#002e63',
        },
        accent: {
          300: '#ffd60a',
          400: '#ffc300',
          500: '#FF9F0A',
          600: '#e08800',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
