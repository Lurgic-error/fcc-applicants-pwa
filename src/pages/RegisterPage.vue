<script setup>
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const step = ref(1)
const agreedToTerms = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

const form = reactive({
  firstName: '',
  surname: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
})

// ── Password strength ──
const passwordChecks = computed(() => {
  const p = form.password
  return {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /\d/.test(p),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
  }
})

const passwordStrength = computed(() => {
  const passed = Object.values(passwordChecks.value).filter(Boolean).length
  if (passed <= 1) return { label: 'Weak', percent: 20, color: '#ef4444' }
  if (passed === 2) return { label: 'Fair', percent: 40, color: '#f59e0b' }
  if (passed === 3) return { label: 'Good', percent: 60, color: '#eab308' }
  if (passed === 4) return { label: 'Strong', percent: 80, color: '#22c55e' }
  return { label: 'Excellent', percent: 100, color: '#059669' }
})

const passwordsMatch = computed(() => form.password && form.confirmPassword && form.password === form.confirmPassword)

// ── Validation ──
const step1Rules = {
  firstName: [
    { required: true, message: 'First name is required', trigger: 'blur' },
    { min: 2, message: 'At least 2 characters', trigger: 'blur' },
  ],
  surname: [
    { required: true, message: 'Surname is required', trigger: 'blur' },
    { min: 2, message: 'At least 2 characters', trigger: 'blur' },
  ],
  companyName: [{ required: true, message: 'Company or organization name is required', trigger: 'blur' }],
}

const step2Rules = {
  email: [
    { required: true, message: 'Email address is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  phoneNumber: [
    { required: true, message: 'Phone number is required', trigger: 'blur' },
    { pattern: /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, message: 'Enter a valid phone number', trigger: 'blur' },
  ],
}

const step3Rules = {
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 8, message: 'At least 8 characters', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== form.password) callback(new Error('Passwords do not match'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

const rules = computed(() => {
  if (step.value === 1) return step1Rules
  if (step.value === 2) return step2Rules
  return step3Rules
})

// ── Navigation ──
async function nextStep() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    step.value++
  } catch { /* validation failed */ }
}

function prevStep() { if (step.value > 1) step.value-- }

// ── Submit ──
function buildPayload() {
  const fullName = `${form.firstName} ${form.surname}`.trim()
  const username = (form.email.split('@')[0] || `${form.surname}_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_')
  return {
    firstName: form.firstName, surname: form.surname, fullName,
    email: form.email, phoneNumber: form.phoneNumber, password: form.password,
    username, companyName: form.companyName,
    attributes: { custom: { companyName: form.companyName, portal: 'fcc-applicants-pwa' } },
  }
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (!agreedToTerms.value) return ElMessage.warning('Please accept the Terms of Service and Privacy Policy.')
    if (!passwordsMatch.value) return ElMessage.warning('Passwords do not match.')
    await authStore.register(buildPayload())
    ElMessage.success('Account created successfully!')
    router.push({ name: 'dashboard' })
  } catch (error) {
    ElMessage.error(error?.message || 'Registration failed. Please try again.')
  }
}
</script>

<template>
  <div class="flex justify-center p-4">
    <div class="reg-card">
      <div class="text-center mb-6">
        <div class="reg-logo">FCC</div>
        <h1 class="reg-title">Create Applicant Account</h1>
        <p class="reg-sub">Submit and track your FCC service applications.</p>
      </div>

      <!-- Step indicator -->
      <div class="reg-steps">
        <div v-for="s in 3" :key="s" class="reg-step" :class="{ 'reg-step--active': step === s, 'reg-step--done': step > s }">
          <span class="reg-step__dot">{{ step > s ? '✓' : s }}</span>
          <span class="reg-step__label">{{ ['Identity', 'Contact', 'Security'][s - 1] }}</span>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>

        <template v-if="step === 1">
          <div class="grid grid-cols-2 gap-3">
            <el-form-item label="First Name" prop="firstName">
              <el-input v-model="form.firstName" placeholder="e.g., John" autocomplete="given-name" data-test="register-first-name" />
            </el-form-item>
            <el-form-item label="Surname" prop="surname">
              <el-input v-model="form.surname" placeholder="e.g., Mwangi" autocomplete="family-name" data-test="register-surname" />
            </el-form-item>
          </div>
          <el-form-item label="Company / Organization" prop="companyName">
            <el-input v-model="form.companyName" placeholder="e.g., ABC Trading Ltd" autocomplete="organization" data-test="register-company" />
          </el-form-item>
        </template>

        <template v-if="step === 2">
          <el-form-item label="Email Address" prop="email">
            <el-input v-model="form.email" placeholder="you@company.com" autocomplete="email" data-test="register-email" />
          </el-form-item>
          <el-form-item label="Phone Number" prop="phoneNumber">
            <el-input v-model="form.phoneNumber" placeholder="+255 712 345 678" autocomplete="tel" data-test="register-phone" />
          </el-form-item>
        </template>

        <template v-if="step === 3">
          <el-form-item label="Password" prop="password">
            <el-input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Create a strong password" autocomplete="new-password" data-test="register-password">
              <template #suffix>
                <span class="cursor-pointer text-xs text-slate-400" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</span>
              </template>
            </el-input>
          </el-form-item>

          <!-- Strength meter -->
          <div v-if="form.password" class="mb-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                <div class="h-full rounded transition-all duration-300" :style="{ width: `${passwordStrength.percent}%`, background: passwordStrength.color }" />
              </div>
              <span class="text-xs font-bold" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(passed, key) in passwordChecks" :key="key" class="reg-check" :class="{ 'reg-check--pass': passed }">
                {{ passed ? '✓' : '○' }} {{ { length: '8+ chars', uppercase: 'A-Z', lowercase: 'a-z', number: '0-9', special: '!@#' }[key] }}
              </span>
            </div>
          </div>

          <el-form-item label="Confirm Password" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Re-enter password" autocomplete="new-password" data-test="register-confirm-password">
              <template #suffix>
                <span class="cursor-pointer text-xs text-slate-400" @click="showConfirm = !showConfirm">{{ showConfirm ? 'Hide' : 'Show' }}</span>
              </template>
            </el-input>
          </el-form-item>

          <p v-if="form.confirmPassword" class="text-xs font-medium mb-3" :class="passwordsMatch ? 'text-green-600' : 'text-red-500'">
            {{ passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match' }}
          </p>

          <label class="flex items-start gap-2 text-sm text-slate-500 cursor-pointer mb-2">
            <el-checkbox v-model="agreedToTerms" />
            <span>I agree to the <a href="#" class="text-fcc-brand font-semibold hover:underline">Terms of Service</a> and <a href="#" class="text-fcc-brand font-semibold hover:underline">Privacy Policy</a></span>
          </label>
        </template>

        <div class="flex justify-between mt-4">
          <el-button v-if="step > 1" plain @click="prevStep">Back</el-button>
          <div v-else />
          <el-button v-if="step < 3" type="primary" @click="nextStep">Continue</el-button>
          <el-button v-else type="primary" :loading="authStore.loading" :disabled="!agreedToTerms || !passwordsMatch" data-test="register-submit" @click="submit">Create Account</el-button>
        </div>
      </el-form>

      <p class="text-center mt-5 text-sm text-slate-500">
        Already have an account? <router-link class="text-fcc-brand font-semibold" to="/auth/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.reg-card {
  width: 100%; max-width: 30rem;
  border-radius: 16px; border: 1px solid #e2e8f0;
  background: #fff; padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
:root[data-theme="dark"] .reg-card { background: #0f172a; border-color: #334155; }

.reg-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.75rem; height: 2.75rem; border-radius: 10px;
  background: #0f4c81; color: #fff; font-weight: 800; font-size: 1rem; margin-bottom: 0.5rem;
}
.reg-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
:root[data-theme="dark"] .reg-title { color: #f1f5f9; }
.reg-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: #64748b; }

.reg-steps { display: flex; justify-content: center; gap: 1.25rem; margin-bottom: 1.25rem; }
.reg-step { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.reg-step__dot {
  width: 1.75rem; height: 1.75rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700; border: 2px solid #cbd5e1; color: #94a3b8;
  transition: all 0.2s;
}
.reg-step--active .reg-step__dot { border-color: #0f4c81; color: #fff; background: #0f4c81; }
.reg-step--done .reg-step__dot { border-color: #059669; color: #fff; background: #059669; }
.reg-step__label { font-size: 0.6rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.reg-step--active .reg-step__label { color: #0f4c81; }
.reg-step--done .reg-step__label { color: #059669; }

.reg-check {
  font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: 3px;
  color: #94a3b8; background: #f1f5f9;
}
.reg-check--pass { color: #059669; background: #ecfdf5; }
:root[data-theme="dark"] .reg-check { background: #1e293b; }
:root[data-theme="dark"] .reg-check--pass { background: #064e3b; }

@media (max-width: 480px) { .grid-cols-2 { grid-template-columns: 1fr; } }
</style>
