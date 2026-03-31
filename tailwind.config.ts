import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#faf9f5', dark: '#f0eee6', content: '#f5f3ec' },
        ink: { DEFAULT: '#141413', secondary: '#878680', muted: '#b0aea5' },
        accent: { DEFAULT: '#c6613f', sage: '#5c7a6e', brown: '#8b7355', plum: '#6b5b73' },
        border: { light: 'rgba(20,20,19,0.06)', DEFAULT: 'rgba(20,20,19,0.08)', dark: 'rgba(20,20,19,0.12)' },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: { card: '16px' },
    },
  },
  plugins: [],
} satisfies Config;
