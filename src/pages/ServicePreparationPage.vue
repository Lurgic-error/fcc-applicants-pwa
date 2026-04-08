<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { FccPageHeader } from '@shared/design-system/components'
import { getServicePreparation } from '@/constants/servicePreparation'
import { buildApplicationCreateRoute } from '@/constants/applicationCatalog'

const props = defineProps({
  serviceKey: {
    type: String,
    required: true
  }
})

const router = useRouter()

const preparation = computed(() => getServicePreparation(props.serviceKey))
const requiredItems = computed(() => (preparation.value?.checklist || []).filter((item) => item.required))
const optionalItems = computed(() => (preparation.value?.checklist || []).filter((item) => !item.required))
const hasForms = computed(() => (preparation.value?.forms || []).length > 0)

function startApplication() {
  router.push(buildApplicationCreateRoute(props.serviceKey))
}
</script>

<template>
  <section v-if="preparation" class="min-w-0 space-y-6 overflow-x-hidden">
    <FccPageHeader
      :title="preparation.title"
      :subtitle="preparation.description"
      borderless
    >
      <template #actions>
        <router-link :to="{ name: 'service-overview', params: { serviceKey } }">
          <el-button plain>Back to Service</el-button>
        </router-link>
      </template>
    </FccPageHeader>

    <!-- Time estimate banner -->
    <div class="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 dark:border-sky-800 dark:bg-sky-950/40">
      <i class="fa-regular fa-clock text-sky-500 text-lg" />
      <div>
        <p class="text-sm font-medium text-sky-900 dark:text-sky-200">Estimated preparation time</p>
        <p class="text-sm text-sky-700 dark:text-sky-300">{{ preparation.estimatedTime }}</p>
      </div>
    </div>

    <!-- Required documents checklist -->
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-4 flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-emerald-500" />
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">Required Documents</h2>
        <span class="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {{ requiredItems.length }} items
        </span>
      </div>
      <ul class="space-y-3">
        <li
          v-for="item in requiredItems"
          :key="item.label"
          class="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
            <i class="fa-solid fa-asterisk text-[8px] text-emerald-600 dark:text-emerald-400" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ item.label }}</p>
            <p v-if="item.tip" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ item.tip }}</p>
          </div>
        </li>
      </ul>
    </article>

    <!-- Optional documents checklist -->
    <article v-if="optionalItems.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-4 flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-slate-400" />
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">Optional / Conditional Documents</h2>
        <span class="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {{ optionalItems.length }} items
        </span>
      </div>
      <ul class="space-y-3">
        <li
          v-for="item in optionalItems"
          :key="item.label"
          class="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30"
        >
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600">
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ item.label }}</p>
            <p v-if="item.tip" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ item.tip }}</p>
          </div>
        </li>
      </ul>
    </article>

    <!-- Fee schedule -->
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-4 flex items-center gap-2">
        <i class="fa-solid fa-receipt text-fcc-brand" />
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">Fee Schedule</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 dark:border-slate-700">
              <th class="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Service Type</th>
              <th class="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="fee in preparation.fees"
              :key="fee.type"
              class="group"
            >
              <td class="py-3 text-slate-700 dark:text-slate-300">{{ fee.type }}</td>
              <td class="py-3 text-right font-medium text-slate-900 dark:text-slate-100">{{ fee.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-slate-400 dark:text-slate-500">Fees are assessed by FCC and payment is initiated via the Government Electronic Payment Gateway (GePG).</p>
    </article>

    <!-- Downloadable forms -->
    <article v-if="hasForms" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-4 flex items-center gap-2">
        <i class="fa-solid fa-file-arrow-down text-fcc-brand" />
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">Downloadable Forms</h2>
      </div>
      <ul class="space-y-2">
        <li
          v-for="form in preparation.forms"
          :key="form.filename"
          class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <div class="flex items-center gap-3">
            <i class="fa-regular fa-file-pdf text-red-500 text-lg" />
            <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ form.label }}</span>
          </div>
          <a
            :href="`/forms/${form.filename}`"
            :download="form.filename"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-fcc-brand hover:text-fcc-brand dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-fcc-brand dark:hover:text-fcc-brand"
          >
            <i class="fa-solid fa-download text-[10px]" />
            Download
          </a>
        </li>
      </ul>
    </article>

    <!-- CTA -->
    <div class="rounded-2xl border border-fcc-brand/20 bg-gradient-to-br from-sky-50 to-indigo-50 p-6 dark:border-fcc-brand/30 dark:from-sky-950/40 dark:to-indigo-950/40">
      <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Ready to apply?</h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ensure you have all required documents above before you begin. The application wizard will guide you step by step.
          </p>
        </div>
        <el-button type="primary" size="large" class="shrink-0" @click="startApplication">
          <i class="fa-solid fa-rocket mr-2" />
          I'm Ready — Start Application
        </el-button>
      </div>
    </div>
  </section>

  <section v-else class="flex min-h-[40vh] items-center justify-center">
    <el-empty description="No preparation checklist found for this service." />
  </section>
</template>
