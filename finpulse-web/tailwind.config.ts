import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#070A14',
          900: '#0B1020',
          800: '#11162A',
          700: '#181E36',
        },
        cyan: {
          400: '#00D1FF',
          300: '#6BE8FF',
        },
        emerald: {
          400: '#00FFB2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(0, 209, 255, 0.25)',
        glass: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(2, 6, 23, 0.55)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseLine: {
          '0%': { transform: 'translateX(-20%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseLine: 'pulseLine 8s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
