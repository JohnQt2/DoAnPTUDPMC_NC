/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#f8a0a0',
          400: '#f06060',
          500: '#C41E3A',
          600: '#b01832',
          700: '#93122a',
          800: '#7a1026',
          900: '#681225',
          950: '#3a0510',
        },
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
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'sans-serif'],
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        chinese: ['"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        'hanzi-serif': ['"Noto Serif SC"', '"Noto Sans SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
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
