<script setup>
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
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
  accountType: '', // 'individual' | 'organization'
  // personal (always)
  firstName: '',
  surname: '',
  // individual-specific
  nationality: 'Tanzanian',
  idType: '',
  idNumber: '',
  profession: '',
  // organization-specific
  position: '',
  orgName: '',
  orgType: '',
  orgRegNumber: '',
  orgAddress: '',
  orgRegion: '',
  orgCity: '',
  // contact (shared)
  email: '',
  phoneNumber: '',
  // "other" specifications
  nationalityOther: '',
  professionOther: '',
  orgTypeOther: '',
  // individual address
  region: '',
  city: '',
  // security
  password: '',
  confirmPassword: '',
})

const isOrg = computed(() => form.accountType === 'organization')

const regions = [
  'Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Tanga', 'Mbeya', 'Morogoro',
  'Zanzibar', 'Kilimanjaro', 'Iringa', 'Kagera', 'Mara', 'Kigoma', 'Tabora',
  'Rukwa', 'Singida', 'Shinyanga', 'Lindi', 'Mtwara', 'Ruvuma', 'Pwani',
  'Njombe', 'Geita', 'Katavi', 'Simiyu', 'Songwe',
]

const totalSteps = 4

const stepMeta = computed(() => [
  { label: 'Account Type', desc: 'How will you use this portal?', icon: 'fa-solid fa-id-badge' },
  { label: isOrg.value ? 'You & Your Organization' : 'Personal Details', desc: isOrg.value ? 'Your role and organization information' : 'Tell us about yourself', icon: isOrg.value ? 'fa-solid fa-building' : 'fa-solid fa-user' },
  { label: 'Contact Details', desc: 'How we can reach you', icon: 'fa-solid fa-address-book' },
  { label: 'Secure Your Account', desc: 'Create a strong password', icon: 'fa-solid fa-shield-halved' },
])

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

// ── Validation per step ──
const step2IndividualRules = computed(() => {
  const r = {
    firstName: [
      { required: true, message: 'First name is required', trigger: 'blur' },
      { min: 2, message: 'At least 2 characters', trigger: 'blur' },
    ],
    surname: [
      { required: true, message: 'Surname is required', trigger: 'blur' },
      { min: 2, message: 'At least 2 characters', trigger: 'blur' },
    ],
    nationality: [{ required: true, message: 'Nationality is required', trigger: 'change' }],
    idType: [{ required: true, message: 'ID type is required', trigger: 'change' }],
    idNumber: [{ required: true, message: 'ID number is required', trigger: 'blur' }],
    profession: [{ required: true, message: 'Profession or business type is required', trigger: 'change' }],
  }
  if (form.nationality === 'Other') r.nationalityOther = [{ required: true, message: 'Please specify your nationality', trigger: 'blur' }]
  if (form.profession === 'other') r.professionOther = [{ required: true, message: 'Please specify your profession', trigger: 'blur' }]
  return r
})

const step2OrgRules = computed(() => {
  const r = {
    firstName: [
      { required: true, message: 'First name is required', trigger: 'blur' },
      { min: 2, message: 'At least 2 characters', trigger: 'blur' },
    ],
    surname: [
      { required: true, message: 'Surname is required', trigger: 'blur' },
      { min: 2, message: 'At least 2 characters', trigger: 'blur' },
    ],
    position: [{ required: true, message: 'Your position/title is required', trigger: 'blur' }],
    orgName: [{ required: true, message: 'Organization name is required', trigger: 'blur' }],
    orgType: [{ required: true, message: 'Organization type is required', trigger: 'change' }],
    orgRegNumber: [{ required: true, message: 'Registration or TIN number is required', trigger: 'blur' }],
  }
  if (form.orgType === 'other') r.orgTypeOther = [{ required: true, message: 'Please specify the organization type', trigger: 'blur' }]
  return r
})

const step3Rules = {
  email: [
    { required: true, message: 'Email address is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  phoneNumber: [
    { required: true, message: 'Phone number is required', trigger: 'blur' },
    { pattern: /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, message: 'Enter a valid phone number', trigger: 'blur' },
  ],
}

const step4Rules = {
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
  if (step.value === 2) return isOrg.value ? step2OrgRules.value : step2IndividualRules.value
  if (step.value === 3) return step3Rules
  if (step.value === 4) return step4Rules
  return {}
})

// ── Navigation ──
function selectAccountType(type) {
  form.accountType = type
  step.value = 2
}

async function nextStep() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    step.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch { /* validation failed */ }
}

function prevStep() {
  if (step.value > 1) {
    step.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// ── Submit ──
function buildPayload() {
  const fullName = `${form.firstName} ${form.surname}`.trim()
  const username = (form.email.split('@')[0] || `${form.surname}_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_')
  const payload = {
    firstName: form.firstName,
    surname: form.surname,
    fullName,
    email: form.email,
    phoneNumber: form.phoneNumber,
    password: form.password,
    username,
    accountType: form.accountType,
    attributes: {
      custom: {
        accountType: form.accountType,
        portal: 'fcc-applicants-pwa',
      },
    },
  }
  if (isOrg.value) {
    payload.companyName = form.orgName
    payload.attributes.custom.position = form.position
    payload.attributes.custom.orgName = form.orgName
    payload.attributes.custom.orgType = form.orgType === 'other' ? form.orgTypeOther : form.orgType
    payload.attributes.custom.orgRegNumber = form.orgRegNumber
    payload.attributes.custom.orgAddress = [form.orgAddress, form.orgCity, form.orgRegion].filter(Boolean).join(', ')
  } else {
    payload.attributes.custom.nationality = form.nationality === 'Other' ? form.nationalityOther : form.nationality
    payload.attributes.custom.idType = form.idType
    payload.attributes.custom.idNumber = form.idNumber
    payload.attributes.custom.profession = form.profession === 'other' ? form.professionOther : form.profession
    payload.attributes.custom.address = [form.city, form.region].filter(Boolean).join(', ')
  }
  return payload
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

// Reset form validation when step changes
watch(step, () => { formRef.value?.clearValidate() })
</script>

<template>
  <div class="reg-shell">
    <!-- ── Top bar ── -->
    <div class="reg-topbar">
      <router-link to="/" class="reg-topbar__brand">
        <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="fcc-seal reg-topbar__logo" />
        <div class="reg-topbar__text">
          <span class="reg-topbar__name">Fair Competition Commission</span>
          <span class="reg-topbar__country">Applicants Portal</span>
        </div>
      </router-link>
      <router-link to="/auth/login" class="reg-topbar__login">
        Already registered? <strong>Sign in</strong>
      </router-link>
    </div>

    <!-- ── Progress bar ── -->
    <div v-if="step > 1" class="reg-progress">
      <div class="reg-progress__fill" :style="{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }" />
    </div>

    <!-- ── Step indicators ── -->
    <div v-if="step > 1" class="reg-steps-row">
      <template v-for="(s, i) in stepMeta" :key="i">
        <div
          v-if="i > 0"
          class="reg-step-node"
          :class="{ 'reg-step-node--active': step === i + 1, 'reg-step-node--done': step > i + 1 }"
        >
          <span class="reg-step-node__dot">
            <i v-if="step > i + 1" class="fa-solid fa-check text-[10px]" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="reg-step-node__label">{{ s.label }}</span>
        </div>
        <div v-if="i > 0 && i < totalSteps - 1" class="reg-step-line" :class="{ 'reg-step-line--done': step > i + 1 }" />
      </template>
    </div>

    <!-- ── Main form area ── -->
    <div class="reg-body">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent class="reg-form">
        <Transition :name="step === 1 ? 'fade' : 'step'" mode="out-in">
          <!-- ══════ Step 1: Account Type ══════ -->
          <div v-if="step === 1" key="step1" class="reg-step-content reg-step-content--type">
            <div class="type-header">
              <img src="@/assets/imgs/logo-2-removebg-preview.png" alt="FCC" class="fcc-seal type-header__seal" />
              <h1 class="type-header__title">Create Your FCC Account</h1>
              <p class="type-header__sub">How will you be using the FCC Applicants Portal?</p>
            </div>

            <div class="type-cards">
              <button class="type-card" :class="{ 'type-card--selected': form.accountType === 'individual' }" @click="selectAccountType('individual')">
                <div class="type-card__icon type-card__icon--individual">
                  <i class="fa-solid fa-user" />
                </div>
                <h3 class="type-card__title">Individual</h3>
                <p class="type-card__desc">
                  I'm a lawyer, agent, or businessperson acting on my own behalf.
                </p>
                <ul class="type-card__list">
                  <li><i class="fa-solid fa-check" /> Personal identification</li>
                  <li><i class="fa-solid fa-check" /> Profession details</li>
                  <li><i class="fa-solid fa-check" /> Contact information</li>
                </ul>
              </button>

              <button class="type-card" :class="{ 'type-card--selected': form.accountType === 'organization' }" @click="selectAccountType('organization')">
                <div class="type-card__icon type-card__icon--org">
                  <i class="fa-solid fa-building" />
                </div>
                <h3 class="type-card__title">Organization</h3>
                <p class="type-card__desc">
                  I'm registering on behalf of a company, law firm, or entity.
                </p>
                <ul class="type-card__list">
                  <li><i class="fa-solid fa-check" /> Contact person details</li>
                  <li><i class="fa-solid fa-check" /> Organization profile</li>
                  <li><i class="fa-solid fa-check" /> Registration number</li>
                </ul>
              </button>
            </div>

            <p class="type-hint">
              <i class="fa-solid fa-circle-info" />
              You can update your profile information after registration.
            </p>
          </div>

          <!-- ══════ Step 2: Personal / Org Details ══════ -->
          <div v-else-if="step === 2" key="step2" class="reg-step-content">
            <div class="step-heading">
              <div class="step-heading__icon"><i :class="stepMeta[1].icon" /></div>
              <div>
                <h2 class="step-heading__title">{{ stepMeta[1].label }}</h2>
                <p class="step-heading__sub">{{ stepMeta[1].desc }}</p>
              </div>
            </div>

            <!-- Shared: name fields -->
            <div class="form-section">
              <p class="form-section__label"><i class="fa-regular fa-user" /> Your Name</p>
              <div class="grid grid-cols-2 gap-4">
                <el-form-item label="First Name" prop="firstName">
                  <el-input v-model="form.firstName" size="large" placeholder="e.g., John" autocomplete="given-name" />
                </el-form-item>
                <el-form-item label="Surname" prop="surname">
                  <el-input v-model="form.surname" size="large" placeholder="e.g., Mwangi" autocomplete="family-name" />
                </el-form-item>
              </div>
            </div>

            <!-- Individual fields -->
            <template v-if="!isOrg">
              <div class="form-section">
                <p class="form-section__label"><i class="fa-solid fa-id-card" /> Identification</p>
                <el-form-item label="Nationality" prop="nationality">
                  <el-select v-model="form.nationality" size="large" placeholder="Select nationality" filterable class="w-full">
                    <el-option label="Tanzanian" value="Tanzanian" />
                    <el-option label="Kenyan" value="Kenyan" />
                    <el-option label="Ugandan" value="Ugandan" />
                    <el-option label="Rwandan" value="Rwandan" />
                    <el-option label="Burundian" value="Burundian" />
                    <el-option label="Other" value="Other" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="form.nationality === 'Other'" label="Please specify your nationality" prop="nationalityOther">
                  <el-input v-model="form.nationalityOther" size="large" placeholder="e.g., South African, Indian, British" />
                </el-form-item>
                <div class="grid grid-cols-2 gap-4">
                  <el-form-item label="ID Type" prop="idType">
                    <el-select v-model="form.idType" size="large" placeholder="Select type" class="w-full">
                      <el-option label="National ID (NIDA)" value="nida" />
                      <el-option label="Passport" value="passport" />
                      <el-option label="TIN Number" value="tin" />
                      <el-option label="Driver's License" value="drivers_license" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="ID Number" prop="idNumber">
                    <el-input v-model="form.idNumber" size="large" placeholder="Enter ID number" />
                  </el-form-item>
                </div>
              </div>
              <div class="form-section">
                <p class="form-section__label"><i class="fa-solid fa-briefcase" /> Profession</p>
                <el-form-item label="Profession / Business Type" prop="profession">
                  <el-select v-model="form.profession" size="large" placeholder="Select your profession" filterable class="w-full">
                    <el-option label="Legal Practitioner / Advocate" value="legal" />
                    <el-option label="Trademark Agent" value="trademark_agent" />
                    <el-option label="Business Owner / Entrepreneur" value="business_owner" />
                    <el-option label="Consultant" value="consultant" />
                    <el-option label="Importer / Exporter" value="importer_exporter" />
                    <el-option label="Manufacturer" value="manufacturer" />
                    <el-option label="Retailer / Wholesaler" value="retailer" />
                    <el-option label="Other" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="form.profession === 'other'" label="Please specify your profession or business type" prop="professionOther">
                  <el-input v-model="form.professionOther" size="large" placeholder="e.g., Accountant, Clearing Agent, Broker" />
                </el-form-item>
              </div>
            </template>

            <!-- Organization fields -->
            <template v-else>
              <div class="form-section">
                <p class="form-section__label"><i class="fa-solid fa-user-tie" /> Your Role</p>
                <el-form-item label="Position / Title at Organization" prop="position">
                  <el-input v-model="form.position" size="large" placeholder="e.g., Legal Counsel, Director, Agent" />
                </el-form-item>
              </div>
              <div class="form-section">
                <p class="form-section__label"><i class="fa-solid fa-building" /> Organization Information</p>
                <el-form-item label="Organization Name" prop="orgName">
                  <el-input v-model="form.orgName" size="large" placeholder="e.g., ABC Law Firm, Vodacom Tanzania PLC" />
                </el-form-item>
                <div class="grid grid-cols-2 gap-4">
                  <el-form-item label="Organization Type" prop="orgType">
                    <el-select v-model="form.orgType" size="large" placeholder="Select type" class="w-full">
                      <el-option label="Law Firm" value="law_firm" />
                      <el-option label="Private Company" value="private_company" />
                      <el-option label="Public Company" value="public_company" />
                      <el-option label="NGO / Non-Profit" value="ngo" />
                      <el-option label="Government Entity" value="government" />
                      <el-option label="Sole Proprietorship" value="sole_proprietorship" />
                      <el-option label="Partnership" value="partnership" />
                      <el-option label="Other" value="other" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Registration / TIN Number" prop="orgRegNumber">
                    <el-input v-model="form.orgRegNumber" size="large" placeholder="e.g., TIN or BRELA Reg #" />
                  </el-form-item>
                </div>
                <el-form-item v-if="form.orgType === 'other'" label="Please specify the type of organization" prop="orgTypeOther">
                  <el-input v-model="form.orgTypeOther" size="large" placeholder="e.g., Cooperative, Trust, Association" />
                </el-form-item>
              </div>
            </template>
          </div>

          <!-- ══════ Step 3: Contact Details ══════ -->
          <div v-else-if="step === 3" key="step3" class="reg-step-content">
            <div class="step-heading">
              <div class="step-heading__icon"><i :class="stepMeta[2].icon" /></div>
              <div>
                <h2 class="step-heading__title">{{ stepMeta[2].label }}</h2>
                <p class="step-heading__sub">{{ stepMeta[2].desc }}</p>
              </div>
            </div>

            <div class="form-section">
              <p class="form-section__label"><i class="fa-solid fa-at" /> Primary Contact</p>
              <el-form-item label="Email Address" prop="email">
                <el-input v-model="form.email" size="large" placeholder="you@company.com" autocomplete="email">
                  <template #prefix><i class="fa-regular fa-envelope text-slate-400" /></template>
                </el-input>
              </el-form-item>
              <el-form-item label="Phone Number" prop="phoneNumber">
                <el-input v-model="form.phoneNumber" size="large" placeholder="+255 712 345 678" autocomplete="tel">
                  <template #prefix><i class="fa-solid fa-phone text-slate-400" /></template>
                </el-input>
              </el-form-item>
            </div>

            <div class="form-section">
              <p class="form-section__label"><i class="fa-solid fa-location-dot" /> {{ isOrg ? 'Organization Address' : 'Physical Address' }}</p>
              <template v-if="isOrg">
                <div class="grid grid-cols-2 gap-4">
                  <el-form-item label="Region">
                    <el-select v-model="form.orgRegion" size="large" placeholder="Select region" filterable class="w-full">
                      <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="City / Town">
                    <el-input v-model="form.orgCity" size="large" placeholder="e.g., Dar es Salaam" />
                  </el-form-item>
                </div>
                <el-form-item label="Street Address / P.O. Box">
                  <el-input v-model="form.orgAddress" size="large" placeholder="e.g., P.O. Box 12345, Samora Avenue" />
                </el-form-item>
              </template>
              <template v-else>
                <div class="grid grid-cols-2 gap-4">
                  <el-form-item label="Region">
                    <el-select v-model="form.region" size="large" placeholder="Select region" filterable class="w-full">
                      <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="City / Town">
                    <el-input v-model="form.city" size="large" placeholder="e.g., Dar es Salaam" />
                  </el-form-item>
                </div>
              </template>
            </div>
          </div>

          <!-- ══════ Step 4: Security ══════ -->
          <div v-else key="step4" class="reg-step-content">
            <div class="step-heading">
              <div class="step-heading__icon"><i :class="stepMeta[3].icon" /></div>
              <div>
                <h2 class="step-heading__title">{{ stepMeta[3].label }}</h2>
                <p class="step-heading__sub">{{ stepMeta[3].desc }}</p>
              </div>
            </div>

            <div class="form-section">
              <el-form-item label="Password" prop="password">
                <el-input v-model="form.password" size="large" :type="showPassword ? 'text' : 'password'" placeholder="Create a strong password" autocomplete="new-password">
                  <template #prefix><i class="fa-solid fa-lock text-slate-400" /></template>
                  <template #suffix>
                    <button type="button" class="toggle-pw" tabindex="-1" @click="showPassword = !showPassword">
                      <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                    </button>
                  </template>
                </el-input>
              </el-form-item>

              <!-- Strength meter -->
              <div v-if="form.password" class="pw-meter">
                <div class="pw-meter__bar">
                  <div v-for="i in 5" :key="i" class="pw-meter__seg" :class="{ 'pw-meter__seg--on': passwordStrength.percent >= i * 20 }" :style="passwordStrength.percent >= i * 20 ? { background: passwordStrength.color } : {}" />
                </div>
                <span class="pw-meter__label" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</span>
              </div>

              <div v-if="form.password" class="pw-reqs">
                <span v-for="(passed, key) in passwordChecks" :key="key" class="pw-req" :class="{ 'pw-req--pass': passed }">
                  <i :class="passed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" class="text-[10px]" />
                  {{ { length: '8+ characters', uppercase: 'Uppercase (A-Z)', lowercase: 'Lowercase (a-z)', number: 'Number (0-9)', special: 'Special (!@#$)' }[key] }}
                </span>
              </div>

              <el-form-item label="Confirm Password" prop="confirmPassword">
                <el-input v-model="form.confirmPassword" size="large" :type="showConfirm ? 'text' : 'password'" placeholder="Re-enter your password" autocomplete="new-password">
                  <template #prefix><i class="fa-solid fa-lock text-slate-400" /></template>
                  <template #suffix>
                    <button type="button" class="toggle-pw" tabindex="-1" @click="showConfirm = !showConfirm">
                      <i :class="showConfirm ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                    </button>
                  </template>
                </el-input>
              </el-form-item>

              <Transition name="fade">
                <div v-if="form.confirmPassword" class="pw-match" :class="passwordsMatch ? 'pw-match--yes' : 'pw-match--no'">
                  <i :class="passwordsMatch ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'" />
                  {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                </div>
              </Transition>
            </div>

            <label class="terms-row">
              <el-checkbox v-model="agreedToTerms" />
              <span>I agree to the <a href="#" class="text-fcc-brand font-semibold hover:underline">Terms of Service</a> and <a href="#" class="text-fcc-brand font-semibold hover:underline">Privacy Policy</a></span>
            </label>
          </div>
        </Transition>

        <!-- ── Bottom navigation ── -->
        <div v-if="step > 1" class="reg-nav">
          <el-button class="!h-12 !px-8 !rounded-xl" plain @click="prevStep">
            <i class="fa-solid fa-arrow-left mr-2" /> Back
          </el-button>
          <el-button
            v-if="step < totalSteps"
            class="!h-12 !px-10 !font-bold !tracking-wide !rounded-xl"
            type="primary"
            @click="nextStep"
          >
            Continue <i class="fa-solid fa-arrow-right ml-2" />
          </el-button>
          <el-button
            v-else
            class="!h-12 !px-10 !font-bold !tracking-wide !rounded-xl"
            type="primary"
            :loading="authStore.loading"
            :disabled="!agreedToTerms || !passwordsMatch"
            @click="submit"
          >
            <i class="fa-solid fa-user-plus mr-2" /> Create Account
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- ── Footer ── -->
    <div class="reg-footer">
      <i class="fa-solid fa-shield-halved" />
      <span>Your information is secured with 256-bit SSL encryption</span>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ── */
.reg-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(15, 76, 129, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(14, 165, 233, 0.06) 0%, transparent 50%),
    #f8fafc;
}
:root[data-theme="dark"] .reg-shell {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(15, 76, 129, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
    #060c1a;
}

/* ── Top bar ── */
.reg-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}
:root[data-theme="dark"] .reg-topbar {
  background: rgba(11,17,32,0.85);
  border-color: #1e293b;
}
.reg-topbar__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.reg-topbar__logo { height: 36px; width: auto; }
.reg-topbar__text { display: flex; flex-direction: column; line-height: 1.2; }
.reg-topbar__name { font-size: 0.8rem; font-weight: 700; color: #0f172a; }
:root[data-theme="dark"] .reg-topbar__name { color: #e2e8f0; }
.reg-topbar__country { font-size: 0.65rem; color: #64748b; font-weight: 500; }
.reg-topbar__login {
  font-size: 0.8rem;
  color: #64748b;
  text-decoration: none;
}
.reg-topbar__login strong { color: #0f4c81; }
:root[data-theme="dark"] .reg-topbar__login strong { color: #38bdf8; }

/* ── Progress bar ── */
.reg-progress {
  height: 3px;
  background: #e2e8f0;
}
:root[data-theme="dark"] .reg-progress { background: #1e293b; }
.reg-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #0f4c81, #38bdf8);
  border-radius: 0 2px 2px 0;
  transition: width 0.4s ease;
}

/* ── Step indicators ── */
.reg-steps-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 1.25rem 1rem 0;
}
.reg-step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.reg-step-node__dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  border: 2px solid #cbd5e1;
  color: #94a3b8;
  background: #fff;
  transition: all 0.3s ease;
}
:root[data-theme="dark"] .reg-step-node__dot { background: #1e293b; border-color: #475569; }
.reg-step-node--active .reg-step-node__dot { border-color: #0f4c81; background: #0f4c81; color: #fff; }
.reg-step-node--done .reg-step-node__dot { border-color: #059669; background: #059669; color: #fff; }
.reg-step-node__label { font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; }
.reg-step-node--active .reg-step-node__label { color: #0f4c81; }
:root[data-theme="dark"] .reg-step-node--active .reg-step-node__label { color: #38bdf8; }
.reg-step-node--done .reg-step-node__label { color: #059669; }

.reg-step-line {
  width: 64px;
  height: 2px;
  background: #e2e8f0;
  margin: 0 0.6rem;
  margin-bottom: 1rem;
  border-radius: 1px;
  transition: background 0.3s ease;
}
:root[data-theme="dark"] .reg-step-line { background: #334155; }
.reg-step-line--done { background: #059669; }

/* ── Body ── */
.reg-body {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem 2rem;
}
.reg-form {
  width: 100%;
  max-width: 600px;
}

/* ── Step content wrapper ── */
.reg-step-content {
  min-height: 360px;
}

/* ══════ Step 1: Account type ══════ */
.reg-step-content--type {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 1rem;
}
.type-header { margin-bottom: 2rem; }
.type-header__seal { height: 80px; width: auto; margin: 0 auto 1rem; }
.type-header__title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
:root[data-theme="dark"] .type-header__title { color: #f1f5f9; }
.type-header__sub {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  color: #64748b;
}

.type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  width: 100%;
  max-width: 560px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1.25rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
:root[data-theme="dark"] .type-card { background: #0f172a; border-color: #334155; }
.type-card:hover {
  border-color: #0f4c81;
  box-shadow: 0 4px 20px rgba(15, 76, 129, 0.12);
  transform: translateY(-2px);
}
:root[data-theme="dark"] .type-card:hover { border-color: #38bdf8; box-shadow: 0 4px 20px rgba(56,189,248,0.1); }
.type-card--selected {
  border-color: #0f4c81;
  background: linear-gradient(180deg, rgba(15, 76, 129, 0.04) 0%, rgba(15, 76, 129, 0.01) 100%);
  box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.12);
}
:root[data-theme="dark"] .type-card--selected {
  border-color: #38bdf8;
  background: linear-gradient(180deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.02) 100%);
  box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
}

.type-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.type-card__icon--individual { background: #eff6ff; color: #2563eb; }
:root[data-theme="dark"] .type-card__icon--individual { background: #1e3a5f; }
.type-card__icon--org { background: #fef3c7; color: #d97706; }
:root[data-theme="dark"] .type-card__icon--org { background: #422006; }

.type-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
}
:root[data-theme="dark"] .type-card__title { color: #f1f5f9; }
.type-card__desc {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0 0 1rem;
}
.type-card__list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
}
.type-card__list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.25rem 0;
}
.type-card__list li i { color: #059669; font-size: 0.65rem; }

.type-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ══════ Steps 2–4 ══════ */
.step-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}
:root[data-theme="dark"] .step-heading { border-color: #1e293b; }
.step-heading__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: linear-gradient(135deg, #0f4c81, #1a6bab);
  color: #fff;
  flex-shrink: 0;
}
.step-heading__title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}
:root[data-theme="dark"] .step-heading__title { color: #f1f5f9; }
.step-heading__sub {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.form-section {
  margin-bottom: 0.75rem;
}
.form-section__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 0.6rem;
}

/* ── Form styling ── */
.reg-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 0.82rem;
  color: #475569;
}
:root[data-theme="dark"] .reg-form :deep(.el-form-item__label) { color: #94a3b8; }

.toggle-pw {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0 2px;
  transition: color 0.15s;
}
.toggle-pw:hover { color: #64748b; }

/* ── Password strength ── */
.pw-meter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.pw-meter__bar { display: flex; flex: 1; gap: 4px; }
.pw-meter__seg {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: #e2e8f0;
  transition: background 0.3s ease;
}
:root[data-theme="dark"] .pw-meter__seg { background: #334155; }
.pw-meter__label {
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.pw-reqs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}
.pw-req {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}
:root[data-theme="dark"] .pw-req { background: #1e293b; border-color: #334155; }
.pw-req--pass { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }
:root[data-theme="dark"] .pw-req--pass { background: #064e3b; border-color: #065f46; }

.pw-match {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}
.pw-match--yes { color: #059669; background: #ecfdf5; }
.pw-match--no { color: #ef4444; background: #fef2f2; }
:root[data-theme="dark"] .pw-match--yes { background: #064e3b; }
:root[data-theme="dark"] .pw-match--no { background: #450a0a; }

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #64748b;
  cursor: pointer;
  margin-top: 0.5rem;
}

/* ── Bottom nav ── */
.reg-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}
:root[data-theme="dark"] .reg-nav { border-color: #1e293b; }

/* ── Footer ── */
.reg-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1rem;
  font-size: 0.7rem;
  color: #94a3b8;
}

/* ── Transitions ── */
.step-enter-active, .step-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.step-enter-from { opacity: 0; transform: translateX(20px); }
.step-leave-to { opacity: 0; transform: translateX(-20px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Desktop ── */
@media (min-width: 768px) {
  .reg-body { padding: 2rem 2rem 3rem; }
  .type-header__seal { height: 96px; }
  .type-header__title { font-size: 2rem; }
  .reg-steps-row { padding-top: 1.5rem; }
}

@media (min-width: 1024px) {
  .reg-topbar { padding: 0.75rem 3rem; }
  .reg-topbar__logo { height: 42px; }
  .reg-step-line { width: 96px; }
}

@media (max-width: 520px) {
  .type-cards { grid-template-columns: 1fr; }
  .grid-cols-2 { grid-template-columns: 1fr; }
}
</style>
