<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApplicantDataStore } from '@/stores/applications'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const dataStore = useApplicantDataStore()
const authStore = useAuthStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  dateReceived: new Date().toISOString().slice(0, 10),
  sector: '',
  applicationFee: null,
  fileNumber: '',
  companyName: '',
  registrationNumber: '',
  countryOfIncorporation: 'Tanzania',
  contactEmail: '',
  phoneNumber: '',
  postalAddress: '',
  physicalAddress: '',
  businessDescription: '',
  paymentStatus: 'Pending'
})

const rules = {
  dateReceived: [{ required: true, message: 'Submission date is required', trigger: 'change' }],
  sector: [{ required: true, message: 'Sector is required', trigger: 'blur' }],
  applicationFee: [{ required: true, message: 'Application fee is required', trigger: 'blur' }],
  companyName: [{ required: true, message: 'Company name is required', trigger: 'blur' }],
  registrationNumber: [{ required: true, message: 'Registration number is required', trigger: 'blur' }],
  contactEmail: [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
  phoneNumber: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
  postalAddress: [{ required: true, message: 'Postal address is required', trigger: 'blur' }],
  physicalAddress: [{ required: true, message: 'Physical address is required', trigger: 'blur' }],
  businessDescription: [{ required: true, message: 'Business description is required', trigger: 'blur' }]
}

const processName = computed(() => dataStore.processTemplate?.name || 'SFCC Registration')

onMounted(async () => {
  if (authStore.email && !form.contactEmail) {
    form.contactEmail = authStore.email
  }
  await dataStore.ensureProcessTemplate()
})

async function submit() {
  if (!formRef.value) {
    return
  }

  loading.value = true
  try {
    await formRef.value.validate()

    const created = await dataStore.submitApplication({ ...form })
    ElMessage.success('Application submitted successfully')
    router.push({
      name: 'application-details',
      params: {
        serviceKey: created.serviceKey,
        id: created.applicationId
      }
    })
  } catch (error) {
    ElMessage.error(error?.message || 'Failed to submit application')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section>
    <h2 class="text-2xl font-semibold">New Application</h2>
    <p class="mt-1 text-sm text-slate-600">Submit a new FCC service request for processing.</p>

    <div class="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
      <span class="font-semibold">Service Catalog:</span> {{ processName }}
    </div>

    <el-form ref="formRef" class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" label-position="top" :model="form" :rules="rules">
      <el-form-item label="Date Received" prop="dateReceived">
        <el-date-picker v-model="form.dateReceived" type="date" value-format="YYYY-MM-DD" data-test="application-date" />
      </el-form-item>

      <el-form-item label="Sector" prop="sector">
        <el-input v-model="form.sector" placeholder="e.g. Telecommunications" data-test="application-sector" />
      </el-form-item>

      <el-form-item label="Application Fee (TZS)" prop="applicationFee">
        <el-input-number v-model="form.applicationFee" :min="1" controls-position="right" data-test="application-fee" />
      </el-form-item>

      <el-form-item label="File Number (optional)" prop="fileNumber">
        <el-input v-model="form.fileNumber" data-test="application-file-number" />
      </el-form-item>

      <el-form-item label="Company Name" prop="companyName">
        <el-input v-model="form.companyName" data-test="application-company" />
      </el-form-item>

      <el-form-item label="Registration Number" prop="registrationNumber">
        <el-input v-model="form.registrationNumber" data-test="application-registration-number" />
      </el-form-item>

      <el-form-item label="Country Of Incorporation" prop="countryOfIncorporation">
        <el-input v-model="form.countryOfIncorporation" data-test="application-country" />
      </el-form-item>

      <el-form-item label="Contact Email" prop="contactEmail">
        <el-input v-model="form.contactEmail" data-test="application-email" />
      </el-form-item>

      <el-form-item label="Phone Number" prop="phoneNumber">
        <el-input v-model="form.phoneNumber" data-test="application-phone" />
      </el-form-item>

      <el-form-item label="Payment Status" prop="paymentStatus">
        <el-select v-model="form.paymentStatus">
          <el-option label="Pending" value="Pending" />
          <el-option label="Completed" value="Completed" />
          <el-option label="Not Processed" value="Not Processed" />
        </el-select>
      </el-form-item>

      <el-form-item label="Postal Address" prop="postalAddress" class="md:col-span-2">
        <el-input v-model="form.postalAddress" data-test="application-postal-address" />
      </el-form-item>

      <el-form-item label="Physical Address" prop="physicalAddress" class="md:col-span-2">
        <el-input v-model="form.physicalAddress" data-test="application-physical-address" />
      </el-form-item>

      <el-form-item label="Business Description" prop="businessDescription" class="md:col-span-2">
        <el-input v-model="form.businessDescription" type="textarea" :rows="5" data-test="application-description" />
      </el-form-item>

      <div class="md:col-span-2">
        <el-button type="primary" :loading="loading" data-test="application-submit" @click="submit">Submit Application</el-button>
      </div>
    </el-form>
  </section>
</template>
