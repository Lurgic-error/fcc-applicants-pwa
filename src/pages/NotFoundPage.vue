<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  router.push(authStore.isAuthenticated ? { name: 'dashboard' } : { name: 'home' })
}
</script>

<template>
  <section class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <h1 class="text-6xl font-bold text-slate-300 dark:text-slate-600">404</h1>
    <h2 class="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Page Not Found</h2>
    <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <el-button type="primary" class="mt-6" @click="goHome">
      {{ authStore.isAuthenticated ? 'Go to Dashboard' : 'Go to Home' }}
    </el-button>
  </section>
</template>
