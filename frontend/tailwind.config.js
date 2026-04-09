/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Light theme (homepage / public)
        bg:          '#F4F2FF',
        bg2:         '#EDE9FF',
        violet:      '#5B00E8',
        'violet-lt': '#EDE5FF',
        'violet-deep': '#0A0025',
        green:       '#00A854',
        amber:       '#D97706',
        dark:        '#0D0D0D',
        // Dark theme (dashboard / authenticated)
        archon: {
          void:   '#1A0050',
          deep:   '#2D0070',
          core:   '#5B00E8',
          bright: '#8B3DFF',
          mist:   '#C4A0FF',
          light:  '#EDE5FF',
        },
        semantic: {
          success: '#00A854',
          warning: '#D97706',
          danger:  '#EF4444',
          info:    '#3B82F6',
        },
        background: '#07040F',
        surface:    '#0D0820',
        card:       'rgba(255,255,255,0.028)',
      },
      animation: {
        'marquee':         'marquee 35s linear infinite',
        'marquee-reverse': 'marquee-reverse 35s linear infinite',
        'pulse':           'pulse 3.5s ease-in-out infinite',
        'float':           'float 4s ease-in-out infinite',
        'glowPulse':       'glowPulse 3s ease-in-out infinite',
        'shimmer':         'shimmer 3s ease-in-out infinite',
        'blink':           'blink 1.2s step-end infinite',
        'typewriter':      'typewriter 0.05s steps(1) infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%':      { opacity: '0.45', transform: 'scale(1.06)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.9' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%':      { opacity: '0.8' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
