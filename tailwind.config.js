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
        },
        surface: 'var(--fcc-bg-surface)',
        'surface-muted': 'var(--fcc-bg-surface-muted)',
        'surface-elevated': 'var(--fcc-bg-elevated)',
      },
      borderColor: {
        token: 'var(--fcc-border)',
        'token-light': 'var(--fcc-border-light)',
        'token-strong': 'var(--fcc-border-strong)',
      },
      textColor: {
        'token-primary': 'var(--fcc-text-primary)',
        'token-secondary': 'var(--fcc-text-secondary)',
        'token-muted': 'var(--fcc-text-muted)',
      },
      borderRadius: {
        'fcc-xs': 'var(--fcc-radius-xs)',
        'fcc-sm': 'var(--fcc-radius-sm)',
        'fcc-base': 'var(--fcc-radius-base)',
        'fcc-md': 'var(--fcc-radius-md)',
        'fcc-lg': 'var(--fcc-radius-lg)',
        'fcc-xl': 'var(--fcc-radius-xl)',
        'fcc-panel': 'var(--fcc-radius-panel)',
        'fcc-card': 'var(--fcc-radius-card)',
        'fcc-pill': 'var(--fcc-radius-pill)',
      },
      boxShadow: {
        panel: '0 12px 28px -12px rgba(15, 23, 42, 0.35)',
        'fcc-sm': 'var(--fcc-shadow-sm)',
        'fcc-md': 'var(--fcc-shadow-md)',
        'fcc-card': 'var(--fcc-shadow-card)',
      }
    }
  },
  plugins: []
}
