<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '@/services/applicantApi'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ newPassword: '', confirmPassword: '' })
const rules = {
  newPassword: [{ required: true, min: 8, message: 'Use at least 8 characters', trigger: 'blur' }],
  confirmPassword: [
    {
      validator: (_, value, callback) => {
        if (!value) { callback(new Error('Confirm your new password')); return }
        if (value !== form.newPassword) { callback(new Error('Passwords do not match')); return }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    const token = String(route.query.token || '')
    if (!token) { ElMessage.error('Invalid or missing reset token.'); return }
    await resetPassword({ token, newPassword: form.newPassword })
    ElMessage.success('Password reset successfully. Please sign in.')
    router.push({ name: 'login' })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to reset password. The link may have expired.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="w-full max-w-xl">
    <div class="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:p-8">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Set New Password</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Choose a new password for your applicant account.</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="mt-5 space-y-3">
        <el-form-item label="New Password" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password placeholder="At least 8 characters" />
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="Re-enter password" />
        </el-form-item>
        <el-button class="w-full !rounded-xl" type="primary" :loading="loading" @click="submit">
          Reset Password
        </el-button>
      </el-form>

      <p class="mt-4 text-sm text-slate-600 dark:text-slate-300">
        <router-link class="font-semibold text-fcc-brand" to="/auth/login">Back to Login</router-link>
      </p>
    </div>
  </section>
</template>
