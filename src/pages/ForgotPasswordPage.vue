<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { requestPasswordReset } from '@/services/applicantApi'

const formRef = ref(null)
const loading = ref(false)
const submitted = ref(false)

const form = reactive({ email: '' })
const rules = {
  email: [{ required: true, type: 'email', message: 'Enter a valid email address', trigger: 'blur' }]
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await requestPasswordReset(form.email)
    submitted.value = true
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to send reset link. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="w-full max-w-xl">
    <div class="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:p-8">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reset Password</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Enter your email and we'll send you instructions to reset your password.
      </p>

      <div v-if="submitted" class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <p class="text-sm font-medium text-green-800 dark:text-green-200">
          If an account exists with this email, you'll receive password reset instructions shortly.
        </p>
        <p class="mt-2 text-sm text-green-700 dark:text-green-300">Check your inbox and spam folder.</p>
        <router-link to="/auth/login" class="mt-3 inline-block text-sm font-semibold text-fcc-brand">
          Back to Login
        </router-link>
      </div>

      <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top" class="mt-5 space-y-3">
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="you@example.com" />
        </el-form-item>
        <el-button class="w-full !rounded-xl" type="primary" :loading="loading" @click="submit">
          Send Reset Link
        </el-button>
      </el-form>

      <p class="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Remember your password?
        <router-link class="font-semibold text-fcc-brand" to="/auth/login">Sign in</router-link>
      </p>
    </div>
  </section>
</template>
