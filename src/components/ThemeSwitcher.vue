<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const themes = [
  { value: 'light', label: 'Light', icon: 'fa-sun' },
  { value: 'dark', label: 'Dark', icon: 'fa-moon' },
  { value: 'system', label: 'System', icon: 'fa-circle-half-stroke' },
]

const current = computed(() => themes.find(t => t.value === themeStore.preference) || themes[0])

function cycle() {
  const idx = themes.findIndex(t => t.value === themeStore.preference)
  const next = themes[(idx + 1) % themes.length]
  themeStore.setPreference(next.value)
}
</script>

<template>
  <el-dropdown trigger="click" data-test="theme-switcher" @command="themeStore.setPreference">
    <button class="theme-btn" type="button" :title="current.label">
      <i :class="['fa-solid', current.icon]" />
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="t in themes"
          :key="t.value"
          :command="t.value"
          :class="{ 'is-active': t.value === themeStore.preference }"
        >
          <i :class="['fa-solid', t.icon]" style="width: 16px; text-align: center; margin-right: 8px; opacity: 0.6" />
          {{ t.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.theme-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--fcc-bg-surface-muted);
  color: var(--fcc-text-secondary);
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.theme-btn:hover {
  background: var(--fcc-border);
  color: var(--fcc-text-primary);
}
</style>
