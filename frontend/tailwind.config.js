/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#ffffff',
        surface: '#f8fafc',
        primary: '#3b82f6',
        textMain: '#0f172a',
        textMuted: '#64748b'
      }
    },
  },
  plugins: [],
}
