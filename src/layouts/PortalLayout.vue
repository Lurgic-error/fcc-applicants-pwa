<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import OfflineBanner from '@/components/OfflineBanner.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import ScreenReaderAnnouncer from '@/components/ScreenReaderAnnouncer.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import ApplicantBreadcrumbs from '@/components/ApplicantBreadcrumbs.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotificationStore } from '@/stores/notifications'
import { useApplicantDataStore } from '@/stores/applications'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useRealtimeUpdates } from '@/composables/useRealtimeUpdates'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const notifStore = useNotificationStore()
const dataStore = useApplicantDataStore()

const navigationLinks = [
  { label: 'Dashboard', name: 'dashboard', icon: 'fa-solid fa-gauge' },
  { label: 'Services', name: 'services', icon: 'fa-solid fa-grid-2' },
  { label: 'Applications', name: 'applications', icon: 'fa-solid fa-file-lines' },
  { label: 'Certificates', name: 'certificates', icon: 'fa-solid fa-certificate' },
  { label: 'Payments', name: 'payments', icon: 'fa-solid fa-credit-card' },
  { label: 'Settings', name: 'settings', icon: 'fa-solid fa-gear' },
  { label: 'Support', name: 'support', icon: 'fa-solid fa-life-ring' },
  { label: 'Messages', name: 'messages', icon: 'fa-solid fa-comments' }
]

const { connected: sseConnected, on: onSseEvent, connect: connectSse } = useRealtimeUpdates()

watch(() => authStore.isAuthenticated, (auth) => {
  if (auth && authStore.token) connectSse(authStore.token)
}, { immediate: true })

onSseEvent('application_status_changed', (data) => {
  notifStore.addNotification({
    type: 'info',
    title: 'Application Updated',
    message: `${data.applicationId || 'Application'} status changed to ${data.status || 'updated'}`,
    link: data.applicationId ? { name: 'application-details', params: { serviceKey: data.serviceKey || 'trademark-recordation', id: data.applicationId } } : null
  })
})

onSseEvent('payment_confirmed', (data) => {
  notifStore.addNotification({
    type: 'success',
    title: 'Payment Confirmed',
    message: `Payment for ${data.applicationId || 'application'} confirmed.`,
    link: { name: 'payments' }
  })
})

const announcerRef = ref(null)
const mobileNavOpen = ref(false)
const commandPaletteVisible = ref(false)

useKeyboardShortcuts([
  {
    key: 'k',
    ctrl: true,
    handler: () => { commandPaletteVisible.value = !commandPaletteVisible.value }
  }
])
const isServicesRoute = computed(
  () => route.path.startsWith('/portal/services') || route.path.startsWith('/portal/trademarks')
)
const isApplicationsRoute = computed(
  () =>
    route.name === 'applications' ||
    route.name === 'application-create' ||
    route.name === 'application-update' ||
    route.name === 'application-details'
)

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false
  }
)

watch(() => dataStore.applications, (apps) => {
  if (apps.length) {
    notifStore.generateSampleNotifications(apps, dataStore.payments, dataStore.certificates)
  }
}, { once: true })

const firstName = computed(() => {
  if (!authStore.fullName) {
    return 'Applicant'
  }
  return authStore.fullName.split(' ')[0]
})

const themeLabel = computed(() => {
  if (themeStore.preference === 'light') {
    return 'Light'
  }
  if (themeStore.preference === 'dark') {
    return 'Dark'
  }
  return 'System'
})

function isLinkActive(link) {
  if (link.name === 'services') {
    return isServicesRoute.value
  }

  if (link.name === 'applications') {
    return isApplicationsRoute.value
  }

  if (link.name === 'certificates' && route.path.startsWith('/portal/certificates')) {
    return true
  }

  if (link.name === 'payments' && route.path.startsWith('/portal/payments')) {
    return true
  }

  return route.name === link.name
}

function goToProfile() {
  router.push({ name: 'profile' })
}

function goToSettings() {
  router.push({ name: 'settings' })
}

function toggleMobileNav() {
  mobileNavOpen.value = !mobileNavOpen.value
}

async function handleUserAction(command) {
  if (command === 'profile') {
    goToProfile()
    return
  }

  if (command === 'settings') {
    goToSettings()
    return
  }

  if (command === 'logout') {
    await logout()
    return
  }

  if (command === 'theme-light') {
    themeStore.setPreference('light')
    ElMessage.success('Theme set to Light')
    return
  }

  if (command === 'theme-dark') {
    themeStore.setPreference('dark')
    ElMessage.success('Theme set to Dark')
    return
  }

  if (command === 'theme-system') {
    themeStore.setPreference('system')
    ElMessage.success('Theme set to System')
  }
}

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="portal-shell h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only fixed left-4 top-4 z-[700] rounded-xl bg-fcc-brand px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none"
    >
      Skip to content
    </a>
    <OfflineBanner />
    <header role="banner" class="fixed left-[var(--portal-gap)] right-[var(--portal-gap)] top-[var(--portal-gap)] z-40 rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900 lg:left-[calc(var(--portal-sidebar-width)+var(--portal-gap)+var(--portal-gap))]">
      <div class="flex h-[var(--portal-header-height)] w-full items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        <div class="flex min-w-0 items-center gap-2">
          <el-button class="!h-10 !rounded-xl !px-3 !font-semibold lg:!hidden" plain @click="toggleMobileNav">
            <i class="fa-solid fa-bars mr-2 text-sm" aria-hidden="true"></i>
            <span>Menu</span>
          </el-button>

          <div class="hidden min-w-0 md:block">
            <p class="text-sm text-slate-500 dark:text-slate-400">FCC Applicant Workspace</p>
            <h1 class="truncate text-lg font-semibold leading-tight text-fcc-ink dark:text-slate-100">Welcome, {{ firstName }}</h1>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <ThemeSwitcher class="hidden lg:flex" />

          <el-popover trigger="click" :width="320" placement="bottom-end">
            <template #reference>
              <el-badge :value="notifStore.unreadCount" :hidden="notifStore.unreadCount === 0" :max="99">
                <el-button circle plain class="!h-10 !w-10 !p-0" :aria-label="`${notifStore.unreadCount} unread notifications`">
                  <i class="fa-regular fa-bell text-base text-slate-600 dark:text-slate-200" aria-hidden="true"></i>
                </el-button>
              </el-badge>
            </template>
            <NotificationPanel />
          </el-popover>

          <el-dropdown trigger="click" @command="handleUserAction">
            <el-button circle plain class="!h-10 !w-10 !p-0">
              <i class="fa-regular fa-circle-user text-xl text-slate-600 dark:text-slate-200" aria-hidden="true"></i>
              <span class="sr-only">User menu</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">Profile</el-dropdown-item>
                <el-dropdown-item command="settings">Settings</el-dropdown-item>
                <el-dropdown-item command="theme-system" divided>
                  Theme: System
                  <span v-if="themeStore.preference === 'system'" class="ml-2 text-fcc-brand">✓</span>
                </el-dropdown-item>
                <el-dropdown-item command="theme-light">
                  Theme: Light
                  <span v-if="themeStore.preference === 'light'" class="ml-2 text-fcc-brand">✓</span>
                </el-dropdown-item>
                <el-dropdown-item command="theme-dark">
                  Theme: Dark
                  <span v-if="themeStore.preference === 'dark'" class="ml-2 text-fcc-brand">✓</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>Logout</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <Transition name="fade">
      <div
        v-if="mobileNavOpen"
        class="fixed inset-0 z-20 bg-black/40 lg:hidden"
        @click="mobileNavOpen = false"
      />
    </Transition>

    <aside
      class="fixed z-30 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900 lg:bottom-[var(--portal-gap)] lg:left-[var(--portal-gap)] lg:top-[var(--portal-gap)] lg:block lg:w-[var(--portal-sidebar-width)]"
      :class="
        mobileNavOpen
          ? 'bottom-[var(--portal-gap)] left-[var(--portal-gap)] right-[var(--portal-gap)] top-[calc(var(--portal-gap)+var(--portal-header-height)+var(--portal-gap))] block shadow-xl'
          : 'hidden lg:block'
      "
    >
      <div class="h-full overflow-y-auto p-3 md:p-4">
        <nav aria-label="Main navigation" class="space-y-2">
          <router-link
            v-for="link in navigationLinks"
            :key="link.name"
            :to="{ name: link.name }"
            class="block rounded-xl px-3 py-2 text-sm font-medium transition"
            :class="
              isLinkActive(link)
                ? 'bg-fcc-brand text-white'
                : 'text-slate-700 hover:bg-sky-50 hover:text-fcc-brand dark:text-slate-200 dark:hover:bg-slate-800'
            "
            @click="mobileNavOpen = false"
          >
              <i :class="link.icon" class="mr-3 w-5 text-center text-sm" aria-hidden="true" />
              {{ link.label }}
          </router-link>
        </nav>
      </div>
    </aside>

    <main id="main-content" class="fixed bottom-[var(--portal-gap)] left-[var(--portal-gap)] right-[var(--portal-gap)] top-[calc(var(--portal-gap)+var(--portal-header-height)+var(--portal-gap))] z-10 overflow-y-auto lg:left-[calc(var(--portal-sidebar-width)+var(--portal-gap)+var(--portal-gap))] lg:bottom-[calc(var(--portal-gap)+var(--portal-footer-height)+var(--portal-gap))]">
      <div class="min-h-full min-w-0 overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <ErrorBoundary>
          <ApplicantBreadcrumbs />
          <router-view />
        </ErrorBoundary>
      </div>
    </main>

    <footer role="contentinfo" class="fixed bottom-[var(--portal-gap)] left-[var(--portal-gap)] right-[var(--portal-gap)] z-40 hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900 lg:block lg:left-[calc(var(--portal-sidebar-width)+var(--portal-gap)+var(--portal-gap))]">
      <div class="flex h-[var(--portal-footer-height)] items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400 md:px-6 md:text-sm">
        <span>FCC Applicant Workspace</span>
        <div class="flex items-center gap-3">
          <span class="hidden items-center gap-1 lg:flex">
            <kbd class="rounded border border-slate-300 px-1 py-0.5 text-[10px] font-mono dark:border-slate-600">⌘K</kbd>
            <span>Command palette</span>
          </span>
          <span class="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Theme: {{ themeLabel }}</span>
          <span class="flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full" :class="sseConnected ? 'bg-green-500' : 'bg-slate-400'" />
            <span class="text-[10px]">{{ sseConnected ? 'Live' : 'Offline' }}</span>
          </span>
          <router-link :to="{ name: 'support' }" class="font-medium text-fcc-brand hover:underline">Support</router-link>
        </div>
      </div>
    </footer>
    <CommandPalette :visible="commandPaletteVisible" @close="commandPaletteVisible = false" />
    <ScreenReaderAnnouncer ref="announcerRef" />
  </div>
</template>

<style scoped>
.portal-shell {
  --portal-gap: 1rem;
  --portal-header-height: 64px;
  --portal-footer-height: 56px;
  --portal-sidebar-width: 280px;
}

@media (min-width: 768px) {
  .portal-shell {
    --portal-header-height: 78px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
