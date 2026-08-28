/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"PingFang SC"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          '"SF Pro Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          'sans-serif',
        ],
      },
      colors: {
        // 苹果系统色
        apple: {
          blue: '#0071e3',
          blueHover: '#0077ed',
          bluePress: '#006edb',
          gray: '#86868b',
          bg: '#fbfbfd',
          card: '#ffffff',
          border: '#d2d2d7',
          text: '#1d1d1f',
          subtext: '#6e6e73',
          green: '#34c759',
          orange: '#ff9500',
          red: '#ff3b30',
          purple: '#af52de',
        },
        // 状态色
        status: {
          draft: '#8e8e93',
          port: '#0071e3',
          capacity: '#ff9500',
          plan: '#af52de',
          done: '#34c759',
        },
      },
      borderRadius: {
        apple: '12px',
        'apple-lg': '18px',
        'apple-xl': '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
        focus: '0 0 0 4px rgba(0,113,227,0.18)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4,0,0.2,1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
