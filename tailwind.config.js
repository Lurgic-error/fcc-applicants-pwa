/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fcc: {
          ink: '#0f172a',
          mist: '#f1f5f9',
          brand: '#0f4c81',
          accent: '#0ea5e9'
        }
      },
      boxShadow: {
        panel: '0 12px 28px -12px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
}
