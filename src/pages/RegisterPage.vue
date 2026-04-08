<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)

const form = reactive({
  firstName: '',
  surname: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  password: ''
})

const rules = {
  firstName: [{ required: true, message: 'First name is required', trigger: 'blur' }],
  surname: [{ required: true, message: 'Surname is required', trigger: 'blur' }],
  companyName: [{ required: true, message: 'Company name is required', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Provide a valid email', trigger: 'blur' }],
  phoneNumber: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  password: [{ required: true, min: 8, message: 'Use at least 8 characters', trigger: 'blur' }]
}

function buildRegisterPayload() {
  const fullName = `${form.firstName} ${form.surname}`.trim()
  const usernameBase = (form.email.split('@')[0] || `${form.surname}_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_')

  return {
    firstName: form.firstName,
    surname: form.surname,
    fullName,
    email: form.email,
    phoneNumber: form.phoneNumber,
    password: form.password,
    username: usernameBase,
    companyName: form.companyName,
    attributes: {
      custom: {
        companyName: form.companyName,
        portal: 'fcc-applicants-pwa'
      }
    }
  }
}

async function submit() {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
    await authStore.register(buildRegisterPayload())
    router.push({ name: 'dashboard' })
  } catch (error) {
    ElMessage.error(error?.message || 'Registration failed. Please check your details and try again.')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6 shadow-panel md:p-8">
    <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create Applicant Account</h2>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Use this account to submit and track your FCC service applications.</p>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="mt-5 grid gap-4 md:grid-cols-2">
      <el-form-item label="First Name" prop="firstName" data-test="register-first-name">
        <el-input v-model="form.firstName" data-test="register-first-name" />
      </el-form-item>

      <el-form-item label="Surname" prop="surname" data-test="register-surname">
        <el-input v-model="form.surname" data-test="register-surname" />
      </el-form-item>

      <el-form-item label="Company Name" prop="companyName" class="md:col-span-2" data-test="register-company">
        <el-input v-model="form.companyName" data-test="register-company" />
      </el-form-item>

      <el-form-item label="Email" prop="email" data-test="register-email">
        <el-input v-model="form.email" data-test="register-email" />
      </el-form-item>

      <el-form-item label="Phone Number" prop="phoneNumber" data-test="register-phone">
        <el-input v-model="form.phoneNumber" data-test="register-phone" />
      </el-form-item>

      <el-form-item label="Password" prop="password" class="md:col-span-2" data-test="register-password">
        <el-input v-model="form.password" type="password" show-password data-test="register-password" />
      </el-form-item>

      <div class="md:col-span-2">
        <el-button type="primary" :loading="authStore.loading" data-test="register-submit" @click="submit">
          Create Account
        </el-button>
      </div>
    </el-form>
  </div>
</template>
