import type { Config } from 'tailwindcss';

// Tokens alineados con services/analytics (iOS blue + grises del sistema).
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
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
        // Alias semánticos: los componentes actuales los usan; se
        // reasignan a la paleta nueva para migrar sin tocar cada uno.
        ink: {
          primary: '#111827',
          muted: '#6B7280',
          deep: '#374151',
          accent: '#007AFF',
          tab: '#111827',
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
} satisfies Config;
