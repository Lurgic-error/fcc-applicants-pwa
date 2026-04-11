<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { FccPageHeader } from '@shared/design-system/components'
import {
  changeApplicantPassword,
  fetchApplicantProfile,
  updateApplicantProfile
} from '@/services/applicantApi'
import { useAuthStore } from '@/stores/auth'
import CountrySelect from '@/components/forms/CountrySelect.vue'
import SmartFormGrid from '@/components/forms/SmartFormGrid.vue'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isPushEnabled } from '@/services/pushNotifications'

const PREFERENCE_KEY = 'fcc_applicant_preferences'
const AVATAR_KEY = 'fcc_applicant_avatar'

const authStore = useAuthStore()
const loading = ref(false)
const passwordLoading = ref(false)
const applicantId = ref(null)
const profileFormRef = ref(null)
const passwordFormRef = ref(null)

const profile = reactive({
  applicantType: 'firm',
  fullName: '',
  email: '',
  phoneNumber: '',
  companyName: '',
  registrationNumber: '',
  countryOfIncorporation: 'Tanzania',
  firstName: '',
  surname: '',
  nationalId: '',
  countryOfResidence: 'Tanzania',
  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  postalAddress: '',
  physicalAddress: '',
  businessDescription: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferences = reactive({
  emailNotifications: true,
  pushNotifications: true,
  compactMode: false,
  preferredLanguage: 'en'
})

const avatar = ref('')
const isFirmApplicant = computed(() => profile.applicantType === 'firm')

const pushSupported = isPushSupported()
const pushEnabled = ref(isPushEnabled())

async function togglePushNotifications(enabled) {
  if (enabled) {
    const sub = await subscribeToPush()
    pushEnabled.value = Boolean(sub)
    if (!sub) ElMessage.warning('Push notifications could not be enabled. Check browser permissions.')
  } else {
    await unsubscribeFromPush()
    pushEnabled.value = false
  }
}

const profileRules = computed(() => {
  const base = {
    email: [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
    phoneNumber: [{ required: true, message: 'Phone number is required', trigger: 'blur' }]
  }

  if (isFirmApplicant.value) {
    base.companyName = [{ required: true, message: 'Company name is required', trigger: 'blur' }]
    base.registrationNumber = [{ required: true, message: 'Registration number is required', trigger: 'blur' }]
    base.contactPersonName = [{ required: true, message: 'Contact person name is required', trigger: 'blur' }]
    base.contactPersonEmail = [{ required: true, type: 'email', message: 'Contact person email is required', trigger: 'blur' }]
    base.contactPersonPhone = [{ required: true, message: 'Contact person phone is required', trigger: 'blur' }]
  } else {
    base.firstName = [{ required: true, message: 'First name is required', trigger: 'blur' }]
    base.surname = [{ required: true, message: 'Surname is required', trigger: 'blur' }]
  }

  return base
})

const passwordRules = {
  currentPassword: [{ required: true, message: 'Current password is required', trigger: 'blur' }],
  newPassword: [{ required: true, min: 8, message: 'Use at least 8 characters', trigger: 'blur' }],
  confirmPassword: [
    {
      validator: (_, value, callback) => {
        if (!value) {
          callback(new Error('Confirm your new password'))
          return
        }
        if (value !== passwordForm.newPassword) {
          callback(new Error('Passwords do not match'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

function applyPreferences() {
  // Language: set the document lang attribute so screen readers and browsers use it
  document.documentElement.lang = preferences.preferredLanguage || 'en'

  // Compact mode: toggle a body class consumed by global CSS
  document.body.classList.toggle('compact-mode', Boolean(preferences.compactMode))

}

function loadPreferences() {
  const raw = localStorage.getItem(PREFERENCE_KEY)
  if (!raw) {
    applyPreferences()
    return
  }
  try {
    const parsed = JSON.parse(raw)
    Object.assign(preferences, parsed)
  } catch {
    // Invalid localStorage payload is ignored.
  }
  applyPreferences()
}

function savePreferences() {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences))
  applyPreferences()
  ElMessage.success('Preferences saved')
}

function loadAvatar() {
  avatar.value = localStorage.getItem(AVATAR_KEY) || ''
}

function onAvatarChange(uploadFile) {
  const file = uploadFile?.raw
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    avatar.value = String(reader.result || '')
    localStorage.setItem(AVATAR_KEY, avatar.value)
    ElMessage.success('Profile picture updated')
  }
  reader.readAsDataURL(file)
}

async function loadProfile() {
  loading.value = true
  try {
    const data = await fetchApplicantProfile({
      email: authStore.email,
      userId: authStore.userId
    })

    applicantId.value = data.applicantId
    const applicantRaw = data.applicant || data.profile?.applicant || {}
    const applicantType = String(applicantRaw.type || '').toLowerCase().includes('individual') ? 'individual' : 'firm'

    Object.assign(profile, {
      applicantType,
      fullName: data.fullName || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      companyName: data.companyName || '',
      registrationNumber: data.registrationNumber || '',
      countryOfIncorporation: data.countryOfIncorporation || 'Tanzania',
      firstName: applicantRaw.firstName || '',
      surname: applicantRaw.surname || '',
      nationalId: applicantRaw.nationalId || '',
      countryOfResidence: applicantRaw.countryOfResidence || 'Tanzania',
      contactPersonName: applicantRaw.contactPerson?.name || data.fullName || '',
      contactPersonEmail: applicantRaw.contactPerson?.email || data.email || '',
      contactPersonPhone: applicantRaw.contactPerson?.phoneNumber || data.phoneNumber || '',
      postalAddress: data.postalAddress || '',
      physicalAddress: data.physicalAddress || '',
      businessDescription: data.businessDescription || ''
    })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to load applicant profile')
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  if (!profileFormRef.value) {
    return
  }

  try {
    await profileFormRef.value.validate()
    if (!applicantId.value) {
      ElMessage.warning('Applicant profile is not linked to this account.')
      return
    }

    loading.value = true
    await updateApplicantProfile({
      applicantId: applicantId.value,
      changes: {
        type: profile.applicantType,
        companyName: isFirmApplicant.value ? profile.companyName : undefined,
        registrationNumber: isFirmApplicant.value ? profile.registrationNumber : undefined,
        countryOfIncorporation: isFirmApplicant.value ? profile.countryOfIncorporation : undefined,
        firstName: isFirmApplicant.value ? undefined : profile.firstName,
        surname: isFirmApplicant.value ? undefined : profile.surname,
        nationalId: isFirmApplicant.value ? undefined : profile.nationalId,
        countryOfResidence: isFirmApplicant.value ? undefined : profile.countryOfResidence,
        phoneNumber: profile.phoneNumber,
        email: profile.email,
        postalAddress: profile.postalAddress,
        physicalAddress: profile.physicalAddress,
        businessDescription: profile.businessDescription,
        contactPerson: isFirmApplicant.value
          ? {
              name: profile.contactPersonName,
              email: profile.contactPersonEmail,
              phoneNumber: profile.contactPersonPhone
            }
          : undefined
      }
    })

    ElMessage.success('Profile settings saved')
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to save profile settings')
  } finally {
    loading.value = false
  }
}

async function updatePassword() {
  if (!passwordFormRef.value) {
    return
  }

  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    await changeApplicantPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    ElMessage.success('Password updated successfully')
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to update password')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(async () => {
  loadPreferences()
  loadAvatar()
  await loadProfile()
})
</script>

<template>
  <section class="set" v-loading="loading">
    <div class="set__head">
      <h1 class="set__title">Settings</h1>
      <p class="set__subtitle">Manage your profile, security, and preferences.</p>
    </div>

    <!-- ── Profile Photo ── -->
    <div class="set__row">
      <div class="set__row-left">
        <h4>Profile Photo</h4>
        <p>This will be displayed on your account.</p>
      </div>
      <div class="set__row-right">
        <el-upload class="set__photo-area" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onAvatarChange">
          <el-avatar :size="96" :src="avatar" class="set__avatar">
            {{ (profile.fullName || profile.companyName || 'A').charAt(0).toUpperCase() }}
          </el-avatar>
          <div>
            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 20px; color: var(--fcc-primary-500); margin-bottom: 0.25rem" />
            <p class="set__photo-cta">Click to upload or drag and drop</p>
            <p class="set__photo-hint">PNG, JPG or SVG (max 2MB)</p>
          </div>
        </el-upload>
      </div>
    </div>

    <!-- ── Company / Individual Details ── -->
    <el-form ref="profileFormRef" label-position="top" :model="profile" :rules="profileRules">
      <div class="set__row">
        <div class="set__row-left">
          <h4>{{ isFirmApplicant ? 'Company Details' : 'Personal Details' }}</h4>
          <p>{{ isFirmApplicant ? 'Legal name and registration as filed with BRELA.' : 'Your personal identification details.' }}</p>
        </div>
        <div class="set__row-right">
          <div class="set__fields set__fields--3">
            <template v-if="isFirmApplicant">
              <el-form-item label="Company Name" prop="companyName">
                <el-input v-model="profile.companyName" placeholder="Legal company name" />
              </el-form-item>
              <el-form-item label="Registration Number" prop="registrationNumber">
                <el-input v-model="profile.registrationNumber" placeholder="BRELA / TIN" />
              </el-form-item>
              <el-form-item label="Country of Incorporation" prop="countryOfIncorporation">
                <CountrySelect v-model="profile.countryOfIncorporation" />
              </el-form-item>
            </template>
            <template v-else>
              <el-form-item label="First Name" prop="firstName">
                <el-input v-model="profile.firstName" />
              </el-form-item>
              <el-form-item label="Surname" prop="surname">
                <el-input v-model="profile.surname" />
              </el-form-item>
              <el-form-item label="National ID / Passport" prop="nationalId">
                <el-input v-model="profile.nationalId" />
              </el-form-item>
            </template>
          </div>
        </div>
      </div>

      <!-- ── Contact ── -->
      <div class="set__row">
        <div class="set__row-left">
          <h4>Contact Information</h4>
          <p>How FCC can reach you about your applications.</p>
        </div>
        <div class="set__row-right">
          <div class="set__fields" :class="isFirmApplicant ? 'set__fields--3' : 'set__fields--2'">
            <el-form-item label="Email" prop="email">
              <el-input v-model="profile.email" />
            </el-form-item>
            <el-form-item label="Phone Number" prop="phoneNumber">
              <el-input v-model="profile.phoneNumber" />
            </el-form-item>
            <template v-if="isFirmApplicant">
              <el-form-item label="Contact Person" prop="contactPersonName">
                <el-input v-model="profile.contactPersonName" />
              </el-form-item>
              <el-form-item label="Contact Email" prop="contactPersonEmail">
                <el-input v-model="profile.contactPersonEmail" />
              </el-form-item>
              <el-form-item label="Contact Phone" prop="contactPersonPhone">
                <el-input v-model="profile.contactPersonPhone" />
              </el-form-item>
            </template>
          </div>
        </div>
      </div>

      <!-- ── Address ── -->
      <div class="set__row">
        <div class="set__row-left">
          <h4>Address</h4>
          <p>Registered address for official correspondence.</p>
        </div>
        <div class="set__row-right">
          <div class="set__fields set__fields--2">
            <el-form-item label="Postal Address">
              <el-input v-model="profile.postalAddress" placeholder="P.O. Box..." />
            </el-form-item>
            <el-form-item label="Physical Address">
              <el-input v-model="profile.physicalAddress" placeholder="Street, City, Region" />
            </el-form-item>
          </div>
          <el-form-item label="Business Description" style="margin-top: 0.5rem">
            <el-input v-model="profile.businessDescription" type="textarea" :rows="3" placeholder="Brief description of your business or context..." />
          </el-form-item>
          <el-button type="primary" :loading="loading" style="margin-top: 0.75rem" @click="saveProfile">Save Profile</el-button>
        </div>
      </div>
    </el-form>

    <!-- ── Notifications ── -->
    <div class="set__row">
      <div class="set__row-left">
        <h4>Notifications</h4>
        <p>Choose how you want to be notified.</p>
      </div>
      <div class="set__row-right">
        <div class="set__toggles">
          <label class="set__toggle">
            <div>
              <span class="set__toggle-name">Email Notifications</span>
              <span class="set__toggle-hint">Status changes, payment confirmations</span>
            </div>
            <el-switch v-model="preferences.emailNotifications" />
          </label>
          <label class="set__toggle">
            <div>
              <span class="set__toggle-name">Push Notifications</span>
              <span class="set__toggle-hint">{{ pushSupported ? 'Real-time browser alerts' : 'Not supported in this browser' }}</span>
            </div>
            <el-switch v-model="pushEnabled" :disabled="!pushSupported" @change="togglePushNotifications" />
          </label>
          <label class="set__toggle" style="border-bottom: none">
            <div>
              <span class="set__toggle-name">Compact Mode</span>
              <span class="set__toggle-hint">Reduce spacing for denser display</span>
            </div>
            <el-switch v-model="preferences.compactMode" />
          </label>
        </div>
        <div class="set__fields set__fields--2" style="margin-top: 0.75rem">
          <el-form-item label="Preferred Language">
            <el-select v-model="preferences.preferredLanguage" style="width: 100%">
              <el-option label="English" value="en" />
              <el-option label="Swahili" value="sw" />
            </el-select>
          </el-form-item>
        </div>
        <el-button type="primary" style="margin-top: 0.5rem" @click="savePreferences">Save Preferences</el-button>
      </div>
    </div>

    <!-- ── Password ── -->
    <el-form ref="passwordFormRef" label-position="top" :model="passwordForm" :rules="passwordRules">
      <div class="set__row" style="border-bottom: none">
        <div class="set__row-left">
          <h4>Password</h4>
          <p>Update your password to keep your account secure.</p>
        </div>
        <div class="set__row-right">
          <el-form-item label="Current Password" prop="currentPassword">
            <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="Enter current password" />
          </el-form-item>
          <div class="set__fields set__fields--2" style="margin-top: 0.5rem">
            <el-form-item label="New Password" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="At least 8 characters" />
            </el-form-item>
            <el-form-item label="Confirm Password" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="Re-enter new password" />
            </el-form-item>
          </div>
          <el-button type="primary" :loading="passwordLoading" style="margin-top: 0.75rem" @click="updatePassword">Update Password</el-button>
        </div>
      </div>
    </el-form>
  </section>
</template>

<style scoped>
.set {
  width: 100%;
}

.set__head {
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--fcc-border-light);
  margin-bottom: 0;
}

.set__title {
  margin: 0;
  font-family: var(--fcc-font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--fcc-text-primary);
}

.set__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: var(--fcc-text-muted);
}

/* ── Two-column row ── */
.set__row {
  display: flex;
  gap: 2.5rem;
  padding: 1.75rem 0;
  border-bottom: 1px solid var(--fcc-border-light);
}

.set__row-left {
  width: 240px;
  flex-shrink: 0;
}

.set__row-left h4 {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--fcc-text-primary);
}

.set__row-left p {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--fcc-text-muted);
  line-height: 1.45;
}

.set__row-right {
  flex: 1;
  min-width: 0;
}

/* ── Fields grid ── */
.set__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.set__fields--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

/* ── Photo upload ── */
.set__photo-area {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  border: 1.5px dashed var(--fcc-border);
  border-radius: var(--fcc-radius-lg);
  background: var(--fcc-bg-surface-muted);
  cursor: pointer;
  transition: border-color 150ms, background 150ms;
  width: 100%;
}

.set__photo-area:hover {
  border-color: var(--fcc-primary-400);
  background: color-mix(in srgb, var(--fcc-primary-500) 3%, var(--fcc-bg-surface-muted));
}

.set__avatar {
  flex-shrink: 0;
  border: 3px solid var(--fcc-border);
}

.set__photo-cta {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.set__photo-hint {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--fcc-text-muted);
}

/* ── Toggle stack ── */
.set__toggles {
  border: 1px solid var(--fcc-border);
  border-radius: var(--fcc-radius-lg);
  overflow: hidden;
}

.set__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--fcc-border-light);
  cursor: default;
}

.set__toggle-name {
  display: block;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--fcc-text-primary);
}

.set__toggle-hint {
  display: block;
  font-size: 0.72rem;
  color: var(--fcc-text-muted);
  margin-top: 1px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .set__row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .set__row-left {
    width: auto;
  }

  .set__fields,
  .set__fields--3 {
    grid-template-columns: 1fr;
  }
}
</style>
