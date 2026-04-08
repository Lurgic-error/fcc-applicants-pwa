import { defineStore } from 'pinia'

const APPLICANT_THEME_KEY = 'fcc_applicant_theme'
const VALID_THEMES = new Set(['light', 'dark', 'system'])
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

let systemThemeListenerRegistered = false

function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('applicant-theme', {
  state: () => ({
    preference: 'system',
    resolvedTheme: 'light'
  }),
  getters: {
    isDarkTheme: (state) => state.resolvedTheme === 'dark'
  },
  actions: {
    init() {
      if (typeof window !== 'undefined') {
        const persistedPreference = localStorage.getItem(APPLICANT_THEME_KEY)
        if (persistedPreference && VALID_THEMES.has(persistedPreference)) {
          this.preference = persistedPreference
        }
      }

      this.applyTheme()

      if (systemThemeListenerRegistered || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return
      }

      const mediaQuery = window.matchMedia(SYSTEM_QUERY)
      mediaQuery.addEventListener('change', () => {
        if (this.preference === 'system') {
          this.applyTheme()
        }
      })
      systemThemeListenerRegistered = true
    },
    setPreference(nextTheme) {
      if (!VALID_THEMES.has(nextTheme)) {
        return
      }

      this.preference = nextTheme
      if (typeof window !== 'undefined') {
        localStorage.setItem(APPLICANT_THEME_KEY, nextTheme)
      }
      this.applyTheme()
    },
    applyTheme() {
      const activeTheme = this.preference === 'system' ? getSystemTheme() : this.preference
      this.resolvedTheme = activeTheme

      if (typeof document === 'undefined') {
        return
      }

      const html = document.documentElement
      html.classList.toggle('dark', activeTheme === 'dark')
      html.setAttribute('data-theme', activeTheme)
      html.style.colorScheme = activeTheme

      const themeMeta = document.querySelector('meta[name="theme-color"]')
      if (themeMeta) {
        themeMeta.setAttribute('content', activeTheme === 'dark' ? '#020617' : '#0f4c81')
      }
    }
  }
})
