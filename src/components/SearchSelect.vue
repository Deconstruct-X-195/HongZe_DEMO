<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    options: string[]
    modelValue: string
    placeholder?: string
    allowOther?: boolean // 是否允许"其他"自定义输入（默认 true）
    label?: string // 字段标题（用于生成"XX（自定义）"标题）
    otherPlaceholder?: string // 自定义输入框的提示文字
  }>(),
  { placeholder: '请选择', allowOther: true, label: '', otherPlaceholder: '请输入自定义内容' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

/** 是否选中了"其他"（需显示独立输入框） */
const otherSelected = ref(
  !!props.modelValue && !props.options.includes(props.modelValue),
)

/** 带有"其他"的完整选项列表 */
const allOptions = computed(() => {
  return props.allowOther ? [...props.options, '其他'] : props.options
})

/** 选择框显示文本 */
const displayText = computed(() => {
  if (otherSelected.value) return '其他'
  return props.modelValue || ''
})

const filtered = computed(() => {
  const base = allOptions.value
  if (!query.value) return base
  const q = query.value.toLowerCase()
  return base.filter((o) => o.toLowerCase().includes(q))
})

function updateDropdownPosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
}

function select(opt: string) {
  if (opt === '其他') {
    otherSelected.value = true
    emit('update:modelValue', '')
    query.value = ''
    open.value = false
    return
  }
  otherSelected.value = false
  emit('update:modelValue', opt)
  query.value = ''
  open.value = false
}

function onFocus() {
  open.value = true
  query.value = ''
  nextTick(updateDropdownPosition)
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (rootRef.value?.contains(target)) return
  if (document.getElementById('search-select-dropdown')?.contains(target)) return
  open.value = false
  query.value = ''
}

function onOtherInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

/** 从"其他"模式返回选择模式 */
function clearOther() {
  otherSelected.value = false
  emit('update:modelValue', '')
}

function handleScroll() {
  if (open.value) updateDropdownPosition()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})

watch(open, (v) => {
  if (!v) query.value = ''
  else nextTick(updateDropdownPosition)
})

// 外部 modelValue 变化时同步 otherSelected 状态
watch(
  () => props.modelValue,
  (v) => {
    if (v && !props.options.includes(v)) {
      otherSelected.value = true
    } else if (v && props.options.includes(v)) {
      otherSelected.value = false
    }
  },
)
</script>

<template>
  <div ref="rootRef" class="search-select-root relative space-y-2">
    <!-- 选择框 -->
    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        class="field-input pr-8 cursor-pointer"
        :value="open ? query : displayText"
        :placeholder="placeholder"
        @input="onInput"
        @focus="onFocus"
        @keydown.enter.prevent="open = false"
      />
      <Icon
        name="chevron-right"
        :size="15"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-apple-subtext transition-transform duration-200 pointer-events-none"
        :class="open ? 'rotate-90' : ''"
      />

      <!-- 下拉选项（Teleport 到 body，避免 overflow-hidden 裁剪） -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ul
            v-if="open && filtered.length > 0"
            id="search-select-dropdown"
            class="rounded-apple border border-apple-border/60 bg-white shadow-card-hover py-1 max-h-72 overflow-y-auto"
            :style="dropdownStyle"
          >
            <li
              v-for="opt in filtered"
              :key="opt"
              @mousedown.prevent="select(opt)"
              class="px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between"
              :class="opt === '其他' ? 'border-t border-apple-border/40 mt-0.5 pt-2 text-apple-blue' : ''"
            >
              <span :class="opt === displayText ? 'font-medium text-apple-blue' : 'text-apple-text'">{{ opt }}</span>
              <Icon v-if="opt === '其他'" name="edit" :size="13" class="text-apple-subtext" />
            </li>
          </ul>
        </Transition>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="open && filtered.length === 0"
            id="search-select-dropdown"
            class="rounded-apple border border-apple-border/60 bg-white shadow-card-hover py-2 px-3 text-xs text-apple-subtext"
            :style="dropdownStyle"
          >
            无匹配选项
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- "其他"选中后的独立输入框 -->
    <div v-if="otherSelected">
      <label v-if="label" class="field-label">{{ label }}（自定义）</label>
      <div class="flex items-center gap-1.5">
        <input
          type="text"
          class="field-input flex-1"
          :value="modelValue"
          @input="onOtherInput"
          :placeholder="otherPlaceholder"
        />
        <button
          type="button"
          @click="clearOther"
          class="flex items-center justify-center w-8 h-8 rounded-apple text-apple-subtext hover:bg-gray-100 hover:text-apple-text transition-colors shrink-0"
          title="取消自定义"
        >
          <Icon name="x" :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>
