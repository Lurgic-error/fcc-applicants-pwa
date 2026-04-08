<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: 'Actions'
  },
  buttonType: {
    type: String,
    default: 'primary'
  },
  buttonSize: {
    type: String,
    default: 'small'
  },
  buttonPlain: {
    type: Boolean,
    default: true
  },
  buttonLink: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  trigger: {
    type: String,
    default: 'click'
  }
})

const emit = defineEmits(['select'])

const normalizedItems = computed(() =>
  (props.items || [])
    .filter((item) => item && item.label)
    .map((item, index) => ({
      ...item,
      key: String(item.key ?? item.command ?? index)
    }))
)

function onCommand(command) {
  const key = String(command ?? '')
  const item = normalizedItems.value.find((entry) => entry.key === key) || null
  emit('select', { command: key, item })
}
</script>

<template>
  <el-dropdown :trigger="trigger" :disabled="disabled || !normalizedItems.length" @command="onCommand">
    <el-button :type="buttonType" :size="buttonSize" :plain="buttonPlain" :link="buttonLink" :disabled="disabled">
      {{ label }}
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in normalizedItems"
          :key="item.key"
          :command="item.key"
          :disabled="Boolean(item.disabled)"
          :divided="Boolean(item.divided)"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
