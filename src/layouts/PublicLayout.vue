<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const year = new Date().getFullYear()
const isFullPage = computed(() => ['login', 'register', 'forgot-password', 'home'].includes(route.name))
</script>

<template>
  <div class="flex min-h-screen flex-col text-slate-900 dark:text-slate-100">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only fixed left-4 top-4 z-[700] rounded-xl bg-fcc-brand px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none"
    >
      Skip to content
    </a>

    <!-- Hide chrome on auth pages — let them own the full viewport -->
    <template v-if="!isFullPage">
      <header role="banner" class="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <router-link to="/" class="flex items-center gap-2.5">
            <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="Fair Competition Commission" class="fcc-seal h-10 w-auto" />
            <span class="text-lg font-bold text-fcc-brand hidden sm:inline">Applicants Portal</span>
          </router-link>
          <div class="flex items-center gap-2">
            <ThemeSwitcher />
            <el-button link class="dark:!text-slate-200" @click="$router.push('/auth/login')">Login</el-button>
            <el-button type="primary" plain @click="$router.push('/auth/register')">Create Account</el-button>
          </div>
        </div>
      </header>
    </template>

    <main
      id="main-content"
      class="flex w-full flex-1"
      :class="isFullPage ? '' : 'mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10'"
    >
      <router-view />
    </main>

    <template v-if="!isFullPage">
      <footer role="contentinfo" class="mt-auto shrink-0 border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-slate-600 dark:text-slate-300 md:px-6">
          <span>Fair Competition Commission</span>
          <span>&copy; {{ year }} FCC Applicants Portal</span>
        </div>
      </footer>
    </template>
  </div>
</template>
