<script setup lang="ts">
import { computed } from 'vue'

export type IconName =
  | 'plus'
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'check-circle'
  | 'chevron-right'
  | 'truck'
  | 'ship'
  | 'anchor'
  | 'train'
  | 'file-text'
  | 'edit'
  | 'download'
  | 'save'
  | 'home'
  | 'trash'
  | 'x'
  | 'search'
  | 'building'
  | 'package'
  | 'map-pin'
  | 'clock'
  | 'route'
  | 'layers'
  | 'info'
  | 'alert'
  | 'clipboard-list'
  | 'dollar'
  | 'send'
  | 'history'
  | 'user'
  | 'paperclip'
  | 'sun'
  | 'moon'

const props = withDefaults(
  defineProps<{ name: IconName; size?: number }>(),
  { size: 18 },
)

const PATHS: Record<IconName, string> = {
  plus: '<path d="M12 5v14M5 12h14" />',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7" />',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7" />',
  check: '<path d="M20 6L9 17l-5-5" />',
  'check-circle':
    '<path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />',
  'chevron-right': '<path d="M9 18l6-6-6-6" />',
  truck:
    '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />',
  ship:
    '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" /><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M12 10v4M12 2v3" />',
  anchor:
    '<circle cx="12" cy="5" r="3" /><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3" />',
  train:
    '<rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M12 3v8M8 19l-2 3M16 19l2 3" /><circle cx="8.5" cy="15" r="0.5" fill="currentColor" /><circle cx="15.5" cy="15" r="0.5" fill="currentColor" />',
  'file-text':
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />',
  edit:
    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" />',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />',
  trash:
    '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />',
  x: '<path d="M18 6L6 18M6 6l12 12" />',
  search: '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />',
  building:
    '<rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />',
  package:
    '<path d="M16.5 9.4L7.5 4.21M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />',
  clock: '<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />',
  route: '<circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h6a3 3 0 0 0 3-3V8M15 5H9a3 3 0 0 0-3 3v8" />',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />',
  info: '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />',
  alert:
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" />',
  'clipboard-list':
    '<rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h.01M9 16h.01M13 12h2M13 16h2" />',
  dollar:
    '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />',
  send:
    '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />',
  history:
    '<path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />',
  user:
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
  paperclip:
    '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />',
  sun:
    '<circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />',
  moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />',
}

const inner = computed(() => PATHS[props.name] ?? '')
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="inner"
  />
</template>
