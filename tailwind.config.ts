import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0e0e0c',
          2: '#3a3a35',
          3: '#72726b',
        },
        paper: {
          DEFAULT: '#f5f3ed',
          2: '#ede9df',
          3: '#e3ddd1',
        },
        accent: {
          DEFAULT: '#c84b2f',
          2: '#e8703a',
        },
        sea: {
          green: '#1a5c3a',
          'green-light': '#d4ead9',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
        'slide-in-right': 'slideInRight 0.3s ease both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'xp-float': 'xpFloat 1.2s ease-out both',
        'streak-burn': 'streakBurn 0.6s ease both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        xpFloat: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '60%': { opacity: '1', transform: 'translateY(-40px) scale(1.1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(0.9)' },
        },
        streakBurn: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(14,14,12,0.06), 0 1px 2px rgba(14,14,12,0.04)',
        'card-hover': '0 4px 12px rgba(14,14,12,0.08), 0 2px 4px rgba(14,14,12,0.04)',
        'inner-sm': 'inset 0 1px 2px rgba(14,14,12,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
