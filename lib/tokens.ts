// Design tokens ported from v5. Source of truth — do not duplicate values elsewhere.
// SOUL canvas + earth/ocean/gold palette + Georgia/DM Sans/JetBrains Mono.

export const SOUL = {
  canvas: '#141413',
  earth: {
    sand: '#E8E0D4',
    stone: '#C4B8A8',
    clay: '#A89888',
    deep: '#2A2927',
    surface: '#1E1E1C',
    surfaceHover: '#252523',
    surfaceElev: '#26241F',
    border: 'rgba(232, 224, 212, 0.08)',
    borderActive: 'rgba(232, 224, 212, 0.15)',
    borderStrong: 'rgba(232, 224, 212, 0.3)',
  },
  ocean: {
    teal: '#1D9E75',
    tealMuted: 'rgba(29, 158, 117, 0.15)',
    blue: '#4A6B8A',
    mist: '#B8C4CC',
  },
  gold: '#C4A265',
  goldMuted: 'rgba(196, 162, 101, 0.2)',
  text: {
    primary: '#E8E0D4',
    secondary: '#A89888',
    tertiary: '#7A7068',
    inverse: '#141413',
  },
  signal: {
    hot: '#DC6855',
    warm: '#D97706',
    cold: '#4A6B8A',
    booked: '#1D9E75',
    success: '#059669',
  },
} as const

export const TYPOGRAPHY = {
  serif: "'Georgia', 'Times New Roman', serif",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
} as const

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  hero: '64px',
} as const

export const RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const

export const TRANSITION = {
  fast: '150ms ease-out',
  normal: '250ms ease-out',
  slow: '400ms ease-out',
  reveal: '600ms cubic-bezier(0.16, 1, 0.3, 1)',
  revealLong: '900ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const
