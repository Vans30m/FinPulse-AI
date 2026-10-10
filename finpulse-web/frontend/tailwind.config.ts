import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  // CORRECTED: Changed from ['class'] to 'class' (Official Tailwind v3 syntax)
  darkMode: 'class', 
  
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // These custom colors power your Dark Mode (Crypto/Hacker theme)
      // Light Mode automatically uses Tailwind's default Slate & Blue colors!
      colors: {
        night: {
          950: '#080808',
          900: '#0A0A0A',
          800: '#111111',
          700: '#141414',
          600: '#171717',
          500: '#1C1C1C',
          400: '#242424',
          300: '#2A2A2A',
        },
        cyan: {
          400: '#38BDF8',
          300: '#7DD3FC',
        },
        emerald: {
          400: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: 'none',
        glass: '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        // Added: Marquee logic for seamless infinite scroll
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
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
        // Added: 30s linear marquee animation configuration
        marquee: 'marquee 200s linear infinite',
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseLine: 'pulseLine 8s linear infinite',
      },
    },
  },
  // CORRECTED: Replaced require() with the imported variable
  plugins: [tailwindcssAnimate],
}

export default config