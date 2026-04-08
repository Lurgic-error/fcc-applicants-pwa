<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const showPassword = ref(false)

const form = reactive({ email: '', password: '' })

const rules = {
  email: [
    { required: true, message: 'Email address is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }],
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await authStore.login(form)
    const redirect = route.query.redirect ? String(route.query.redirect) : '/portal/dashboard'
    router.push(redirect)
  } catch (error) {
    ElMessage.error(error?.message || 'Invalid credentials. Please check your email and password.')
  }
}
</script>

<template>
  <div class="flex justify-center p-4">
    <div class="login-card">
      <div class="text-center mb-6">
        <div class="login-logo">FCC</div>
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-sub">Sign in to your applicant account to manage your FCC applications.</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item label="Email Address" prop="email">
          <el-input
            v-model="form.email"
            placeholder="you@company.com"
            autocomplete="email"
            data-test="login-email"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            autocomplete="current-password"
            data-test="login-password"
            @keydown.enter="submit"
          >
            <template #suffix>
              <span class="cursor-pointer text-xs text-slate-400" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</span>
            </template>
          </el-input>
        </el-form-item>

        <div class="flex justify-end mb-3">
          <router-link class="text-sm text-fcc-brand font-medium hover:underline" to="/auth/forgot-password">
            Forgot password?
          </router-link>
        </div>

        <el-button class="w-full" type="primary" size="large" :loading="authStore.loading" data-test="login-submit" @click="submit">
          Sign In
        </el-button>
      </el-form>

      <div class="login-divider">
        <span>or</span>
      </div>

      <p class="text-center text-sm text-slate-500">
        New to FCC? <router-link class="text-fcc-brand font-semibold hover:underline" to="/auth/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-card {
  width: 100%; max-width: 26rem;
  border-radius: 16px; border: 1px solid #e2e8f0;
  background: #fff; padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
:root[data-theme="dark"] .login-card { background: #0f172a; border-color: #334155; }

.login-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.75rem; height: 2.75rem; border-radius: 10px;
  background: #0f4c81; color: #fff; font-weight: 800; font-size: 1rem; margin-bottom: 0.5rem;
}
.login-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
:root[data-theme="dark"] .login-title { color: #f1f5f9; }
.login-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: #64748b; }

.login-divider {
  display: flex; align-items: center; gap: 0.75rem; margin: 1.25rem 0;
  color: #94a3b8; font-size: 0.75rem;
}
.login-divider::before, .login-divider::after {
  content: ''; flex: 1; height: 1px; background: #e2e8f0;
}
:root[data-theme="dark"] .login-divider::before,
:root[data-theme="dark"] .login-divider::after { background: #334155; }
</style>
