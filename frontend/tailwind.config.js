/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        archon: {
          void: '#26215C',
          deep: '#3C3489',
          core: '#534AB7',
          bright: '#7F77DD',
          mist: '#AFA9EC',
          light: '#EEEDFE',
        },
        semantic: {
          success: '#5DCAA5',
          warning: '#EF9F27',
          danger: '#F09595',
          info: '#85B7EB',
        },
        background: '#08070f',
        surface: '#0d0b18',
        card: 'rgba(255, 255, 255, 0.025)',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
        'pulse': 'pulse 3.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'glowPulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(1.06)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
