/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0a0d0c',
        bgSecondary: '#10140f',
        bgCard: '#151a16',
        bgCardHover: '#1a2019',
        borderC: '#242b23',
        borderWarm: '#332a1c',
        textPrimary: '#f4f1e8',
        textSecondary: '#93998c',
        textMuted: '#565f52',
        vanilla: '#d8a13a',
        vanillaLight: '#f0cf7f',
        emerald: '#238a5e',
        emeraldLight: '#3fbf8a',
        terracotta: '#b85d38',
        terracottaLight: '#d97e56',
        dangerRed: '#c4534a',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        sm2: '9px',
      }
    },
  },
  plugins: [],
}
