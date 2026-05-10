import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Canvas
        soul: '#141413',
        // Earth palette
        earth: {
          sand: '#E8E0D4',
          stone: '#C4B8A8',
          clay: '#A89888',
          deep: '#2A2927',
          surface: '#1E1E1C',
          surfaceHover: '#252523',
        },
        // Ocean palette
        ocean: {
          teal: '#1D9E75',
          blue: '#4A6B8A',
          mist: '#B8C4CC',
        },
        // Gold — rare accent only
        gold: '#C4A265',
        // Foreground text (prefixed 'fg' to avoid Tailwind 'text-text-' stutter)
        fg: {
          primary: '#E8E0D4',
          secondary: '#A89888',
          tertiary: '#7A7068',
          inverse: '#141413',
        },
        // Signal colors
        signal: {
          hot: '#DC6855',
          warm: '#D97706',
          cold: '#4A6B8A',
          booked: '#1D9E75',
          success: '#059669',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        reveal: '600ms',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}

export default config
