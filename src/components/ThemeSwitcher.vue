<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const selectedTheme = computed({
  get: () => themeStore.preference,
  set: (value) => themeStore.setPreference(value)
})

const options = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
]
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline">Theme</span>
    <el-select v-model="selectedTheme" size="small" style="width: 124px" data-test="theme-switcher">
      <el-option v-for="option in options" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
  </div>
</template>
