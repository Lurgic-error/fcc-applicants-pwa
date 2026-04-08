<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const crumbs = computed(() => {
  const matched = route.matched
    .filter((record) => record.meta?.breadcrumb)
    .map((record) => {
      const label =
        typeof record.meta.breadcrumb === 'function'
          ? record.meta.breadcrumb(route)
          : record.meta.breadcrumb
      return {
        label,
        to: record.path === route.path ? null : { path: record.path }
      }
    })

  if (route.meta?.breadcrumbItems) {
    const items =
      typeof route.meta.breadcrumbItems === 'function'
        ? route.meta.breadcrumbItems(route)
        : route.meta.breadcrumbItems
    matched.push(...items)
  }

  return matched
})

const showBreadcrumbs = computed(() => crumbs.value.length > 0)
</script>

<template>
  <nav v-if="showBreadcrumbs" aria-label="Breadcrumb" class="mb-4">
    <ol class="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      <li>
        <router-link :to="{ name: 'dashboard' }" class="hover:text-fcc-brand">Dashboard</router-link>
      </li>
      <template v-for="(crumb, index) in crumbs" :key="index">
        <li aria-hidden="true" class="text-slate-400 dark:text-slate-500">/</li>
        <li>
          <router-link
            v-if="crumb.to"
            :to="crumb.to"
            class="hover:text-fcc-brand"
          >
            {{ crumb.label }}
          </router-link>
          <span v-else class="font-medium text-slate-900 dark:text-slate-100" aria-current="page">
            {{ crumb.label }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>
