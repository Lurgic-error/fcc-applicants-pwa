<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const year = new Date().getFullYear()
const isAuthPage = computed(() => route.name === 'login' || route.name === 'register')
</script>

<template>
  <div class="flex min-h-screen flex-col text-slate-900 dark:text-slate-100">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only fixed left-4 top-4 z-[700] rounded-xl bg-fcc-brand px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none"
    >
      Skip to content
    </a>
    <header role="banner" class="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <router-link to="/" class="text-lg font-bold text-fcc-brand">FCC Applicants Portal</router-link>
        <div class="flex items-center gap-2">
          <ThemeSwitcher />
          <el-button link class="dark:!text-slate-200" @click="$router.push('/auth/login')">Login</el-button>
          <el-button type="primary" plain @click="$router.push('/auth/register')">Create Account</el-button>
        </div>
      </div>
    </header>

    <main
      id="main-content"
      class="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10"
      :class="isAuthPage ? 'items-center justify-center' : ''"
    >
      <router-view />
    </main>

    <footer role="contentinfo" class="mt-auto shrink-0 border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-slate-600 dark:text-slate-300 md:px-6">
        <span>Fair Competition Commission</span>
        <span>{{ year }} FCC Applicants Portal</span>
      </div>
    </footer>
  </div>
</template>
