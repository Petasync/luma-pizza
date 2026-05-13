import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cream / off-white backgrounds
        cream: {
          50: '#FBF8F1',
          100: '#F7F2E8',
          200: '#EFE7D4',
          300: '#E4D6B8',
        },
        // Charcoal / near-black for text, dark sections
        charcoal: {
          900: '#1A1612',
          800: '#241F19',
          700: '#2F2820',
          600: '#4A4036',
          500: '#6B5E4F',
        },
        // Gold accent
        gold: {
          400: '#D4B36A',
          500: '#C4A063',
          600: '#A8864C',
          700: '#8A6C37',
        },
        // Deep burgundy / wine for secondary accents
        wine: {
          600: '#7A2E2A',
          700: '#5C2220',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      letterSpacing: {
        wider: '0.08em',
        widest: '0.18em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
