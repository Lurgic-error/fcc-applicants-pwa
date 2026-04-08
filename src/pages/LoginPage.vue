<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [{ required: true, type: 'email', message: 'Enter a valid email address', trigger: 'blur' }],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }]
}

async function submit() {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
    await authStore.login(form)
    const redirect = route.query.redirect ? String(route.query.redirect) : '/portal/dashboard'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error?.message || 'Invalid credentials. Please try again.')
  }
}
</script>

<template>
  <section class="w-full max-w-xl">
    <div class="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:p-8">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Applicant Login</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Access your FCC applications and payments.</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="mt-5 space-y-3">
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="you@example.com" data-test="login-email" />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="Enter password" data-test="login-password" />
        </el-form-item>

        <div class="flex justify-end">
          <router-link class="text-sm text-fcc-brand hover:underline" to="/auth/forgot-password">
            Forgot Password?
          </router-link>
        </div>

        <el-button class="w-full !rounded-xl" type="primary" :loading="authStore.loading" data-test="login-submit" @click="submit">
          Sign In
        </el-button>
      </el-form>

      <p class="mt-4 text-sm text-slate-600 dark:text-slate-300">
        New applicant?
        <router-link class="font-semibold text-fcc-brand" to="/auth/register">Create account</router-link>
      </p>
    </div>
  </section>
</template>
