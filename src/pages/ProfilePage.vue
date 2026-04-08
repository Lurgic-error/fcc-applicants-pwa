<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { fetchApplicantProfile } from '@/services/applicantApi'
import { useAuthStore } from '@/stores/auth'
import { FccPageHeader } from '@shared/design-system/components'

const AVATAR_KEY = 'fcc_applicant_avatar'

const authStore = useAuthStore()
const loading = ref(false)
const profile = ref(null)
const avatar = ref('')

const applicant = computed(() => profile.value?.applicant || {})
const applicantType = computed(() => {
  const rawType = String(applicant.value.type || '').toLowerCase()
  return rawType.includes('individual') ? 'Individual' : 'Firm'
})

onMounted(async () => {
  avatar.value = localStorage.getItem(AVATAR_KEY) || ''
  loading.value = true
  try {
    profile.value = await fetchApplicantProfile({
      email: authStore.email,
      userId: authStore.userId
    })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to load profile information')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section>
    <FccPageHeader title="Profile" subtitle="Applicant account and profile information." borderless />

    <el-skeleton v-if="loading" class="mt-5" :rows="10" animated />

    <div v-else class="mt-5 space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="flex flex-wrap items-center gap-4">
          <el-avatar :size="72" :src="avatar">{{ (profile?.fullName || 'A').charAt(0).toUpperCase() }}</el-avatar>
          <div>
            <p class="text-sm text-slate-500">Applicant Account</p>
            <h3 class="text-lg font-semibold">{{ profile?.fullName || 'N/A' }}</h3>
            <p class="text-sm text-slate-600">{{ profile?.email || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant Type</dt>
          <dd class="mt-1 text-sm font-medium">{{ applicantType }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">User ID</dt>
          <dd class="mt-1 text-sm">{{ profile?.userId || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Phone Number</dt>
          <dd class="mt-1 text-sm">{{ profile?.phoneNumber || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Applicant ID</dt>
          <dd class="mt-1 text-sm">{{ profile?.applicantId || 'N/A' }}</dd>
        </div>
      </dl>

      <dl class="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Firm / Full Name</dt>
          <dd class="mt-1 text-sm">{{ applicant.companyName || `${applicant.firstName || ''} ${applicant.surname || ''}`.trim() || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Registration / National ID</dt>
          <dd class="mt-1 text-sm">{{ applicant.registrationNumber || applicant.nationalId || 'N/A' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-slate-500">Country</dt>
          <dd class="mt-1 text-sm">{{ applicant.countryOfIncorporation || applicant.countryOfResidence || 'N/A' }}</dd>
        </div>
        <div v-if="applicant.contactPerson">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Contact Person</dt>
          <dd class="mt-1 text-sm">{{ applicant.contactPerson.name || 'N/A' }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Postal Address</dt>
          <dd class="mt-1 text-sm">{{ applicant.postalAddress || profile?.postalAddress || 'N/A' }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Physical Address</dt>
          <dd class="mt-1 text-sm">{{ applicant.physicalAddress || profile?.physicalAddress || 'N/A' }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase tracking-wide text-slate-500">Business / Context Description</dt>
          <dd class="mt-1 text-sm">{{ applicant.businessDescription || profile?.businessDescription || 'N/A' }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
