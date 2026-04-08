<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const roleList = computed(() =>
  authStore.roles.length ? authStore.roles.join(', ') : 'No applicant role found'
)

async function useDifferentAccount() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <section class="w-full max-w-2xl">
    <div class="rounded-3xl border border-amber-200 bg-white p-6 shadow-panel md:p-8">
      <p class="text-xs uppercase tracking-[0.22em] text-amber-700">Authorization</p>
      <h2 class="mt-2 text-2xl font-semibold text-slate-900">Applicant Portal Access Required</h2>
      <p class="mt-3 text-sm text-slate-600">
        This workspace is reserved for applicant accounts. The current session does not include applicant-side authorization.
      </p>

      <dl class="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Signed In As</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">{{ authStore.email || 'Guest' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Account Type</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">{{ authStore.accountType || 'Unknown' }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Resolved Roles</dt>
          <dd class="mt-1 text-sm font-medium text-slate-900">{{ roleList }}</dd>
        </div>
      </dl>

      <div class="mt-5 flex flex-wrap gap-2">
        <el-button type="primary" @click="useDifferentAccount">Use Another Account</el-button>
        <el-button plain @click="router.push({ name: 'home' })">Back to Home</el-button>
      </div>
    </div>
  </section>
</template>
