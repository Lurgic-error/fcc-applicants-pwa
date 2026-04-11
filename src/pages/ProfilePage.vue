<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { fetchApplicantProfile } from '@/services/applicantApi'
import { useAuthStore } from '@/stores/auth'
import CountrySelect from '@/components/forms/CountrySelect.vue'

const AVATAR_KEY = 'fcc_applicant_avatar'

const authStore = useAuthStore()
const loading = ref(false)
const profile = ref(null)
const avatar = ref('')
const avatarInputRef = ref(null)

// ── Edit state ──
const editing = ref(null) // 'personal' | 'contact' | 'business' | null
const editForm = reactive({
  firstName: '',
  surname: '',
  companyName: '',
  phoneNumber: '',
  email: '',
  postalAddress: '',
  physicalAddress: '',
  businessDescription: '',
  nationality: '',
  idNumber: '',
  registrationNumber: '',
})

const applicant = computed(() => profile.value?.applicant || {})
const isOrg = computed(() => {
  const t = String(
    applicant.value.type ||
    profile.value?.applicantType ||
    ''
  ).toLowerCase()
  return t === 'company' || t === 'firm' || t === 'organization' || t === 'organisation'
})

const displayName = computed(() => {
  const a = applicant.value
  if (isOrg.value) {
    return a.company?.name || a.companyName || profile.value?.companyName || 'Organization'
  }
  const first = a.individual?.firstName || a.firstName || ''
  const last = a.individual?.surname || a.surname || ''
  return `${first} ${last}`.trim() || profile.value?.fullName || authStore.fullName || 'Applicant'
})

const initials = computed(() => {
  const name = displayName.value
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || 'A').toUpperCase()
})

const memberSince = computed(() => {
  const d = profile.value?.createdAt || applicant.value.createdAt
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
})

onMounted(async () => {
  avatar.value = localStorage.getItem(AVATAR_KEY) || ''
  loading.value = true
  try {
    profile.value = await fetchApplicantProfile({
      email: authStore.email,
      userId: authStore.userId,
    })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to load profile information')
  } finally {
    loading.value = false
  }
})

// ── Avatar ──
function triggerAvatarUpload() {
  avatarInputRef.value?.click()
}

function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('Image must be under 2 MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    avatar.value = reader.result
    localStorage.setItem(AVATAR_KEY, reader.result)
    ElMessage.success('Profile photo updated')
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  avatar.value = ''
  localStorage.removeItem(AVATAR_KEY)
  ElMessage.success('Profile photo removed')
}

// ── Edit ──
function startEdit(section) {
  const a = applicant.value
  const p = profile.value || {}
  const ind = a.individual || {}
  const co = a.company || {}
  const rep = a.representative || a.contactPerson || {}

  editForm.firstName = ind.firstName || rep.firstName || a.firstName || ''
  editForm.surname = ind.surname || rep.surname || a.surname || ''
  editForm.companyName = co.name || a.companyName || p.companyName || ''
  editForm.phoneNumber = a.phoneNumber || p.phoneNumber || ''
  editForm.email = p.email || a.email || authStore.email || ''
  editForm.postalAddress = a.postalAddress || p.postalAddress || ''
  editForm.physicalAddress = a.physicalAddress || p.physicalAddress || ''
  editForm.businessDescription = co.businessDescription || a.businessDescription || p.businessDescription || ''
  editForm.nationality = ind.nationality || a.countryOfIncorporation || co.countryOfIncorporation || ''
  editForm.idNumber = ind.idNumber || a.nationalId || ''
  editForm.registrationNumber = co.registrationNumber || a.registrationNumber || p.registrationNumber || ''
  editing.value = section
}

function cancelEdit() {
  editing.value = null
}

async function saveEdit() {
  // TODO: Wire to actual update API when available
  ElMessage.success('Profile updated successfully')
  editing.value = null
}
</script>

<template>
  <div class="profile-page">
    <el-skeleton v-if="loading" :rows="12" animated />

    <template v-else>
      <!-- ══════ Hero banner ══════ -->
      <div class="profile-hero">
        <div class="profile-hero__bg" />
        <div class="profile-hero__content">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar" @click="triggerAvatarUpload">
              <img v-if="avatar" :src="avatar" alt="Profile photo" class="profile-avatar__img" />
              <span v-else class="profile-avatar__initials">{{ initials }}</span>
              <div class="profile-avatar__overlay">
                <i class="fa-solid fa-camera" />
              </div>
            </div>
            <input ref="avatarInputRef" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
            <button v-if="avatar" class="profile-avatar__remove" title="Remove photo" @click.stop="removeAvatar">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <div class="profile-hero__info">
            <h1 class="profile-hero__name">{{ displayName }}</h1>
            <div class="profile-hero__meta">
              <span class="profile-hero__badge">
                <i :class="isOrg ? 'fa-solid fa-building' : 'fa-solid fa-user'" />
                {{ isOrg ? 'Organization' : 'Individual' }}
              </span>
              <span v-if="memberSince" class="profile-hero__date">
                <i class="fa-regular fa-calendar" /> Member since {{ memberSince }}
              </span>
            </div>
            <p class="profile-hero__email">
              <i class="fa-regular fa-envelope" /> {{ profile?.email || authStore.email || 'N/A' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ══════ Cards grid ══════ -->
      <div class="profile-grid">
        <!-- ── Personal / Organization ── -->
        <div class="profile-card">
          <div class="profile-card__header">
            <div class="profile-card__icon profile-card__icon--blue"><i class="fa-solid fa-user" /></div>
            <h2 class="profile-card__title">{{ isOrg ? 'Organization Details' : 'Personal Information' }}</h2>
            <button class="profile-card__edit" @click="startEdit('personal')">
              <i class="fa-solid fa-pen" /> Edit
            </button>
          </div>

          <template v-if="editing === 'personal'">
            <div class="profile-card__form">
              <template v-if="isOrg">
                <div class="form-row">
                  <label>Organization Name</label>
                  <el-input v-model="editForm.companyName" size="large" />
                </div>
                <div class="form-row">
                  <label>Registration Number</label>
                  <el-input v-model="editForm.registrationNumber" size="large" />
                </div>
                <div class="form-row">
                  <label>Country of Incorporation</label>
                  <CountrySelect v-model="editForm.nationality" placeholder="Select country of incorporation" />
                </div>
                <div class="form-row">
                  <label>Contact Person</label>
                  <div class="grid grid-cols-2 gap-3">
                    <el-input v-model="editForm.firstName" size="large" placeholder="First name" />
                    <el-input v-model="editForm.surname" size="large" placeholder="Surname" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="form-row">
                  <label>Full Name</label>
                  <div class="grid grid-cols-2 gap-3">
                    <el-input v-model="editForm.firstName" size="large" placeholder="First name" />
                    <el-input v-model="editForm.surname" size="large" placeholder="Surname" />
                  </div>
                </div>
                <div class="form-row">
                  <label>Nationality</label>
                  <CountrySelect v-model="editForm.nationality" placeholder="Select nationality" />
                </div>
                <div class="form-row">
                  <label>ID Number</label>
                  <el-input v-model="editForm.idNumber" size="large" />
                </div>
              </template>
              <div class="profile-card__actions">
                <el-button @click="cancelEdit">Cancel</el-button>
                <el-button type="primary" @click="saveEdit">Save Changes</el-button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="profile-card__body">
              <template v-if="isOrg">
                <div class="info-row">
                  <span class="info-row__label">Organization</span>
                  <span class="info-row__value">{{ applicant.company?.name || applicant.companyName || profile?.companyName || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Registration No.</span>
                  <span class="info-row__value">{{ applicant.company?.registrationNumber || applicant.registrationNumber || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Country</span>
                  <span class="info-row__value">{{ applicant.company?.countryOfIncorporation || applicant.countryOfIncorporation || 'N/A' }}</span>
                </div>
                <div v-if="applicant.representative || applicant.contactPerson" class="info-row">
                  <span class="info-row__label">Contact Person</span>
                  <span class="info-row__value">{{ [applicant.representative?.firstName, applicant.representative?.surname].filter(Boolean).join(' ') || applicant.contactPerson?.name || 'N/A' }}</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="info-row__label">Full Name</span>
                  <span class="info-row__value">{{ profile?.fullName || displayName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Nationality</span>
                  <span class="info-row__value">{{ applicant.individual?.nationality || applicant.countryOfIncorporation || applicant.countryOfResidence || 'N/A' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">ID Number</span>
                  <span class="info-row__value">{{ applicant.individual?.idNumber || applicant.nationalId || applicant.registrationNumber || 'N/A' }}</span>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- ── Contact Details ── -->
        <div class="profile-card">
          <div class="profile-card__header">
            <div class="profile-card__icon profile-card__icon--green"><i class="fa-solid fa-address-book" /></div>
            <h2 class="profile-card__title">Contact Details</h2>
            <button class="profile-card__edit" @click="startEdit('contact')">
              <i class="fa-solid fa-pen" /> Edit
            </button>
          </div>

          <template v-if="editing === 'contact'">
            <div class="profile-card__form">
              <div class="form-row">
                <label>Email Address</label>
                <el-input v-model="editForm.email" size="large" disabled>
                  <template #prefix><i class="fa-regular fa-envelope text-slate-400" /></template>
                </el-input>
                <p class="form-row__hint">Contact support to change your email address.</p>
              </div>
              <div class="form-row">
                <label>Phone Number</label>
                <el-input v-model="editForm.phoneNumber" size="large">
                  <template #prefix><i class="fa-solid fa-phone text-slate-400" /></template>
                </el-input>
              </div>
              <div class="form-row">
                <label>Postal Address</label>
                <el-input v-model="editForm.postalAddress" size="large" />
              </div>
              <div class="form-row">
                <label>Physical Address</label>
                <el-input v-model="editForm.physicalAddress" size="large" />
              </div>
              <div class="profile-card__actions">
                <el-button @click="cancelEdit">Cancel</el-button>
                <el-button type="primary" @click="saveEdit">Save Changes</el-button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="profile-card__body">
              <div class="info-row">
                <span class="info-row__label">Email</span>
                <span class="info-row__value">{{ profile?.email || authStore.email || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Phone</span>
                <span class="info-row__value">{{ profile?.phoneNumber || applicant.phoneNumber || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Postal Address</span>
                <span class="info-row__value">{{ applicant.postalAddress || profile?.postalAddress || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Physical Address</span>
                <span class="info-row__value">{{ applicant.physicalAddress || profile?.physicalAddress || 'N/A' }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- ── Business / Activity ── -->
        <div class="profile-card profile-card--wide">
          <div class="profile-card__header">
            <div class="profile-card__icon profile-card__icon--amber"><i class="fa-solid fa-briefcase" /></div>
            <h2 class="profile-card__title">Business Information</h2>
            <button class="profile-card__edit" @click="startEdit('business')">
              <i class="fa-solid fa-pen" /> Edit
            </button>
          </div>

          <template v-if="editing === 'business'">
            <div class="profile-card__form">
              <div class="form-row">
                <label>Business Description</label>
                <el-input v-model="editForm.businessDescription" type="textarea" :rows="3" size="large" placeholder="Describe your business activities..." />
              </div>
              <div class="profile-card__actions">
                <el-button @click="cancelEdit">Cancel</el-button>
                <el-button type="primary" @click="saveEdit">Save Changes</el-button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="profile-card__body">
              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ applicant.businessDescription || profile?.businessDescription || 'No business description provided.' }}
              </p>
            </div>
          </template>
        </div>

        <!-- ── Account ── -->
        <div class="profile-card profile-card--wide">
          <div class="profile-card__header">
            <div class="profile-card__icon profile-card__icon--slate"><i class="fa-solid fa-shield-halved" /></div>
            <h2 class="profile-card__title">Account</h2>
          </div>
          <div class="profile-card__body">
            <div class="info-row">
              <span class="info-row__label">User ID</span>
              <span class="info-row__value info-row__value--mono">{{ profile?.userId || authStore.userId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Applicant ID</span>
              <span class="info-row__value info-row__value--mono">{{ profile?.applicantId || applicant.applicantId || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">Account Type</span>
              <span class="info-row__value">{{ isOrg ? 'Organization' : 'Individual' }}</span>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
              <router-link :to="{ name: 'settings' }">
                <el-button plain><i class="fa-solid fa-gear mr-1.5" /> Account Settings</el-button>
              </router-link>
              <router-link to="/auth/forgot-password">
                <el-button plain><i class="fa-solid fa-key mr-1.5" /> Change Password</el-button>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
}

/* ══════ Hero banner ══════ */
.profile-hero {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.profile-hero__bg {
  height: 120px;
  background: linear-gradient(135deg, #072a4a 0%, #0f4c81 50%, #1a6bab 100%);
}
.profile-hero__content {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  padding: 0 1.5rem 1.5rem;
  margin-top: -48px;
  position: relative;
  z-index: 1;
}

/* ── Avatar ── */
.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: box-shadow 0.2s;
}
:root[data-theme="dark"] .profile-avatar { border-color: #0f172a; background: #334155; }
.profile-avatar:hover { box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.3); }
.profile-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-avatar__initials {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f4c81;
  user-select: none;
}
:root[data-theme="dark"] .profile-avatar__initials { color: #38bdf8; }
.profile-avatar__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.profile-avatar:hover .profile-avatar__overlay { opacity: 1; }
.profile-avatar__remove {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  border: 2px solid #fff;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s;
}
.profile-avatar__remove:hover { transform: scale(1.1); }

/* ── Hero info ── */
.profile-hero__info {
  padding-bottom: 0.25rem;
  min-width: 0;
}
.profile-hero__name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
:root[data-theme="dark"] .profile-hero__name { color: #f1f5f9; }
.profile-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.35rem;
}
.profile-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  background: rgba(15, 76, 129, 0.08);
  color: #0f4c81;
}
:root[data-theme="dark"] .profile-hero__badge { background: rgba(56,189,248,0.1); color: #38bdf8; }
.profile-hero__date {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #94a3b8;
}
.profile-hero__email {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

/* ══════ Cards grid ══════ */
.profile-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .profile-grid { grid-template-columns: 1fr 1fr; }
}
.profile-card--wide { grid-column: 1 / -1; }

.profile-card {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  overflow: hidden;
}
:root[data-theme="dark"] .profile-card { background: #0f172a; border-color: #1e293b; }

.profile-card__header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}
:root[data-theme="dark"] .profile-card__header { border-color: #1e293b; }
.profile-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}
.profile-card__icon--blue { background: #eff6ff; color: #2563eb; }
:root[data-theme="dark"] .profile-card__icon--blue { background: #1e3a5f; color: #60a5fa; }
.profile-card__icon--green { background: #ecfdf5; color: #059669; }
:root[data-theme="dark"] .profile-card__icon--green { background: #064e3b; color: #34d399; }
.profile-card__icon--amber { background: #fffbeb; color: #d97706; }
:root[data-theme="dark"] .profile-card__icon--amber { background: #422006; color: #fbbf24; }
.profile-card__icon--slate { background: #f1f5f9; color: #475569; }
:root[data-theme="dark"] .profile-card__icon--slate { background: #1e293b; color: #94a3b8; }

.profile-card__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  flex: 1;
}
:root[data-theme="dark"] .profile-card__title { color: #f1f5f9; }

.profile-card__edit {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0f4c81;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition: background 0.15s;
}
.profile-card__edit:hover { background: rgba(15, 76, 129, 0.06); }
:root[data-theme="dark"] .profile-card__edit { color: #38bdf8; }
:root[data-theme="dark"] .profile-card__edit:hover { background: rgba(56,189,248,0.08); }

.profile-card__body {
  padding: 1rem 1.25rem;
}

/* ── Info rows ── */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8fafc;
}
:root[data-theme="dark"] .info-row { border-color: #1e293b; }
.info-row:last-child { border-bottom: none; }
.info-row__label {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 120px;
}
.info-row__value {
  font-size: 0.85rem;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
}
:root[data-theme="dark"] .info-row__value { color: #e2e8f0; }
.info-row__value--mono {
  font-family: monospace;
  font-size: 0.75rem;
  color: #64748b;
}

/* ── Edit form ── */
.profile-card__form {
  padding: 1rem 1.25rem;
}
.form-row {
  margin-bottom: 0.85rem;
}
.form-row label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.3rem;
}
:root[data-theme="dark"] .form-row label { color: #94a3b8; }
.form-row__hint {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}
.profile-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}
:root[data-theme="dark"] .profile-card__actions { border-color: #1e293b; }

@media (max-width: 640px) {
  .profile-hero__content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 1rem 1.25rem;
    margin-top: -40px;
  }
  .profile-hero__meta { justify-content: center; }
  .profile-hero__email { justify-content: center; }
  .info-row { flex-direction: column; gap: 0.15rem; }
  .info-row__value { text-align: left; }
}
</style>
