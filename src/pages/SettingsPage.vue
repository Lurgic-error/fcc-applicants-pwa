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
  <section class="space-y-6">
    <FccPageHeader title="Settings" subtitle="Manage your profile, security, and personal preferences." borderless />

    <el-tabs model-value="profile" class="settings-tabs">
      <!-- ── Profile Tab ────────────────────────────────────────── -->
      <el-tab-pane label="Profile" name="profile">
        <div class="space-y-5 pt-2">
          <div class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-lg font-semibold">Profile Picture</h3>
            <div class="mt-3 flex flex-wrap items-center gap-4">
              <el-avatar :size="80" :src="avatar">
                {{ (profile.fullName || 'A').charAt(0).toUpperCase() }}
              </el-avatar>
              <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" @change="onAvatarChange">
                <el-button plain>Upload Picture</el-button>
              </el-upload>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 p-4" v-loading="loading">
            <h3 class="text-lg font-semibold">Edit Profile</h3>
            <el-form ref="profileFormRef" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" label-position="top" :model="profile" :rules="profileRules">
              <el-form-item label="Applicant Type" prop="applicantType" class="md:col-span-2">
                <el-segmented
                  v-model="profile.applicantType"
                  :options="[
                    { label: 'Firm', value: 'firm' },
                    { label: 'Individual', value: 'individual' }
                  ]"
                />
              </el-form-item>

              <template v-if="isFirmApplicant">
                <el-form-item label="Company Name" prop="companyName">
                  <el-input v-model="profile.companyName" />
                </el-form-item>
                <el-form-item label="Registration Number" prop="registrationNumber">
                  <el-input v-model="profile.registrationNumber" />
                </el-form-item>
                <el-form-item label="Country Of Incorporation" prop="countryOfIncorporation">
                  <el-input v-model="profile.countryOfIncorporation" />
                </el-form-item>
                <el-form-item label="Contact Person Name" prop="contactPersonName">
                  <el-input v-model="profile.contactPersonName" />
                </el-form-item>
                <el-form-item label="Contact Person Email" prop="contactPersonEmail">
                  <el-input v-model="profile.contactPersonEmail" />
                </el-form-item>
                <el-form-item label="Contact Person Phone" prop="contactPersonPhone">
                  <el-input v-model="profile.contactPersonPhone" />
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
                <el-form-item label="Country Of Residence" prop="countryOfResidence">
                  <el-input v-model="profile.countryOfResidence" />
                </el-form-item>
              </template>

              <el-form-item label="Email" prop="email">
                <el-input v-model="profile.email" />
              </el-form-item>
              <el-form-item label="Phone Number" prop="phoneNumber">
                <el-input v-model="profile.phoneNumber" />
              </el-form-item>
              <el-form-item label="Postal Address" class="md:col-span-2">
                <el-input v-model="profile.postalAddress" />
              </el-form-item>
              <el-form-item label="Physical Address" class="md:col-span-2">
                <el-input v-model="profile.physicalAddress" />
              </el-form-item>
              <el-form-item label="Business / Context Description" class="md:col-span-2">
                <el-input v-model="profile.businessDescription" type="textarea" :rows="4" />
              </el-form-item>

              <div class="md:col-span-2">
                <el-button type="primary" :loading="loading" @click="saveProfile">Save Profile</el-button>
              </div>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <!-- ── Security Tab ───────────────────────────────────────── -->
      <el-tab-pane label="Security" name="security">
        <div class="pt-2">
          <div class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-lg font-semibold">Change Password</h3>
            <el-form ref="passwordFormRef" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" label-position="top" :model="passwordForm" :rules="passwordRules">
              <el-form-item label="Current Password" prop="currentPassword">
                <el-input v-model="passwordForm.currentPassword" type="password" show-password />
              </el-form-item>
              <div />
              <el-form-item label="New Password" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="Confirm New Password" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
              </el-form-item>
              <div class="md:col-span-2">
                <el-button type="primary" :loading="passwordLoading" @click="updatePassword">Update Password</el-button>
              </div>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <!-- ── Preferences Tab ────────────────────────────────────── -->
      <el-tab-pane label="Preferences" name="preferences">
        <div class="pt-2">
          <div class="rounded-2xl border border-slate-200 p-4">
            <h3 class="text-lg font-semibold">Preferences</h3>
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                <span>Email notifications</span>
                <el-switch v-model="preferences.emailNotifications" />
              </label>
              <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <span>Push notifications{{ !pushSupported ? ' (not supported)' : '' }}</span>
                <el-switch v-model="pushEnabled" :disabled="!pushSupported" @change="togglePushNotifications" />
              </label>
              <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                <span>Compact mode</span>
                <el-switch v-model="preferences.compactMode" />
              </label>
              <div class="rounded-xl border border-slate-200 p-3 text-sm">
                <p class="mb-2 font-medium">Preferred language</p>
                <el-select v-model="preferences.preferredLanguage" class="w-full">
                  <el-option label="English" value="en" />
                  <el-option label="Swahili" value="sw" />
                </el-select>
              </div>
            </div>
            <div class="mt-4">
              <el-button type="primary" plain @click="savePreferences">Save Preferences</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>
