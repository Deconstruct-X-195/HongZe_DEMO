/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
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
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      colors: {
        // 主题色：全部走 CSS 变量（src/index.css 定义亮/暗两套），
        // "R G B" 三元组形式以支持 /alpha 修饰符（如 bg-apple-fill/60）。
        apple: {
          bg: 'rgb(var(--hz-bg) / <alpha-value>)',
          card: 'rgb(var(--hz-card) / <alpha-value>)',
          sidebar: 'rgb(var(--hz-sidebar) / <alpha-value>)',
          fill: 'rgb(var(--hz-fill) / <alpha-value>)',
          'fill-strong': 'rgb(var(--hz-fill-strong) / <alpha-value>)',
          hover: 'rgb(var(--hz-hover) / <alpha-value>)',
          text: 'rgb(var(--hz-text) / <alpha-value>)',
          subtext: 'rgb(var(--hz-subtext) / <alpha-value>)',
          // 兼容旧命名 text-apple-text-secondary
          'text-secondary': 'rgb(var(--hz-subtext) / <alpha-value>)',
          tertiary: 'rgb(var(--hz-tertiary) / <alpha-value>)',
          // 边框为预混 rgba，不支持 /alpha 修饰符
          border: 'var(--hz-border)',
          blue: 'rgb(var(--hz-brand) / <alpha-value>)',
          blueHover: 'rgb(var(--hz-brand-hover) / <alpha-value>)',
          bluePress: 'rgb(var(--hz-brand-press) / <alpha-value>)',
          green: '#34c759',
          orange: '#ff9500',
          red: '#ff3b30',
          purple: '#af52de',
        },
        // 状态色
        status: {
          draft: '#8e8e93',
          port: 'rgb(var(--hz-brand) / <alpha-value>)',
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
        card: 'var(--hz-shadow-card)',
        'card-hover': 'var(--hz-shadow-card-hover)',
        focus: '0 0 0 4px rgb(var(--hz-brand) / 0.18)',
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
