/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        lw: {
          bg:      '#0d0e12',
          bg2:     '#13151c',
          bg3:     '#1a1d27',
          border:  '#242736',
          border2: '#2e3245',
          blue:    '#4f80ff',
          blue2:   '#7aa0ff',
        }
      }
    }
  },
  plugins: []
}
