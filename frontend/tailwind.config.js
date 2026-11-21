/** @type {import('tailwindcss').Config} */
const IMPERIAL_CRIMSON = {
  50: '#fdf2f4',
  100: '#fbe5e9',
  200: '#f5c7d0',
  300: '#ec9ba9',
  400: '#dc5971',
  500: '#C41E3A',
  600: '#A51730',
  700: '#8A1228',
  800: '#721022',
  900: '#5E0E1D',
  950: '#37050E',
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: IMPERIAL_CRIMSON,
        rose: IMPERIAL_CRIMSON,
        red: IMPERIAL_CRIMSON,
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#f5c518',
          500: '#D4A017',
          600: '#b8860b',
          700: '#926a0e',
          800: '#795413',
          900: '#674516',
          950: '#3c2508',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#00A86B',
          600: '#059652',
          700: '#047844',
          800: '#065f38',
          900: '#064e30',
          950: '#022c1a',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Noto Sans"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', '"Noto Sans"', '"Segoe UI"', 'sans-serif'],
        pinyin: ['"Noto Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
        chinese: ['"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        'hanzi-serif': ['"Noto Serif SC"', '"Noto Sans SC"', 'serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans"', '"Segoe UI"', 'ui-monospace', 'monospace'],
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        flip: 'flip 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.78' },
        },
      },
    },
  },
  plugins: [],
};
