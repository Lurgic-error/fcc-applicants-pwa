<script setup>
import { computed } from 'vue'
import { assessApplicationCompleteness } from '@/services/applicationCompleteness'

const props = defineProps({
  visible: { type: Boolean, default: false },
  serviceKey: { type: String, required: true },
  formData: { type: Object, default: () => ({}) },
  currentStepIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'jump-to-step', 'open-full-preview'])

const completeness = computed(() =>
  assessApplicationCompleteness(props.serviceKey, props.formData)
)

function statusIcon(status) {
  if (status === 'complete') return 'fa-solid fa-circle-check'
  if (status === 'partial') return 'fa-solid fa-circle-half-stroke'
  return 'fa-regular fa-circle'
}

function statusClasses(status) {
  if (status === 'complete') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  if (status === 'partial') return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
  return 'text-slate-400 dark:text-slate-500'
}

function iconColor(status) {
  if (status === 'complete') return 'text-green-500'
  if (status === 'partial') return 'text-amber-500'
  return 'text-red-400'
}

function missingLabel(section) {
  if (section.status === 'complete') return ''
  if (section.requiredFields === 0) return ''
  const count = section.missingFields.length
  return count === 0 ? '' : `${count} missing`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="fixed inset-0 z-[500] flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
        <aside class="relative z-10 flex h-full w-full max-w-[420px] flex-col bg-white shadow-xl dark:bg-slate-900">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Application Preview</h2>
            <el-button circle plain class="!h-8 !w-8 !p-0" @click="emit('close')">
              <i class="fa-solid fa-xmark text-sm" />
            </el-button>
          </div>

          <div class="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600 dark:text-slate-300">
                {{ completeness.totalProvided }} of {{ completeness.totalRequired }} required fields
              </span>
              <span class="font-semibold" :class="completeness.complete ? 'text-green-600' : 'text-amber-600'">
                {{ completeness.percentage }}%
              </span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="completeness.complete ? 'bg-green-500' : 'bg-fcc-accent'"
                :style="{ width: `${completeness.percentage}%` }"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-5 py-3">
            <ul class="space-y-1">
              <li
                v-for="section in completeness.sections"
                :key="section.key"
                class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="[
                  statusClasses(section.status),
                  section.stepIndex === currentStepIndex ? 'ring-2 ring-fcc-brand/30' : ''
                ]"
                @click="emit('jump-to-step', section.stepIndex)"
              >
                <span class="flex h-5 w-5 shrink-0 items-center justify-center text-sm" :class="iconColor(section.status)">
                  <i :class="statusIcon(section.status)" />
                </span>
                <span class="flex-1 font-medium text-slate-900 dark:text-slate-100">
                  {{ section.stepIndex + 1 }}. {{ section.label }}
                </span>
                <span v-if="missingLabel(section)" class="text-xs text-red-500 dark:text-red-400">
                  {{ missingLabel(section) }}
                </span>
              </li>
            </ul>
          </div>

          <div class="border-t border-slate-200 px-5 py-4 dark:border-slate-700">
            <el-button
              type="primary"
              class="w-full !rounded-xl"
              @click="emit('open-full-preview')"
            >
              Open Full Preview
            </el-button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
