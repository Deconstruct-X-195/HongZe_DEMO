<template>
  <div class="animate-fade-in">
<PageHeader title="客户管理" />
    <div class="space-y-5">
      <!-- 操作栏 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            type="text"
            placeholder="搜索客户名称/联系人..."
            class="field-input py-2 w-64"
          />
          <select
            v-model="filterType"
            class="field-input py-2 w-auto"
          >
            <option value="">全部类型</option>
            <option v-for="(meta, key) in CUSTOMER_TYPE_META" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <button
          @click="goToNew"
          class="btn-primary"
        >
          新增客户
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5">
          <div class="text-apple-tertiary text-[11px] mb-1">客户总数</div>
          <div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.customerCount }}</div>
        </div>
        <div class="card px-4 py-3.5">
          <div class="text-apple-tertiary text-[11px] mb-1">正常</div>
          <div class="text-xl font-semibold tabular-nums text-apple-green">{{ activeCount }}</div>
        </div>
        <div class="card px-4 py-3.5">
          <div class="text-apple-tertiary text-[11px] mb-1">贸易商</div>
          <div class="text-xl font-semibold tabular-nums text-apple-blue">{{ traderCount }}</div>
        </div>
        <div class="card px-4 py-3.5">
          <div class="text-apple-tertiary text-[11px] mb-1">承运方</div>
          <div class="text-xl font-semibold tabular-nums text-apple-purple">{{ carrierCount }}</div>
        </div>
      </div>

      <!-- 客户列表 -->
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">客户名称</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">类型</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">联系人</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">联系方式</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-apple-text">{{ customer.name }}</div>
                <div class="text-xs text-apple-text-secondary mt-0.5">{{ customer.address || '-' }}</div>
              </td>
              <td class="px-4 py-3">
                <Badge :label="CUSTOMER_TYPE_META[customer.type]?.label" :color="CUSTOMER_TYPE_META[customer.type]?.color" :bg="CUSTOMER_TYPE_META[customer.type]?.color + '20'" />
              </td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ customer.contactPerson || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ customer.contactInfo || '-' }}</td>
              <td class="px-4 py-3">
                <Badge :label="CUSTOMER_STATUS_META[customer.status]?.label" :color="CUSTOMER_STATUS_META[customer.status]?.color" :bg="CUSTOMER_STATUS_META[customer.status]?.bg" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="goToEdit(customer.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(customer.id)" class="text-apple-red text-sm hover:underline">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-apple-text-secondary">
                暂无客户数据，点击右上角「新增客户」开始添加
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import { useBusinessStore } from '@/stores'
import { CUSTOMER_TYPE_META, CUSTOMER_STATUS_META } from '@/types'

const router = useRouter()
const business = useBusinessStore()

const search = ref('')
const filterType = ref('')

const filteredCustomers = computed(() => {
  return business.customers.filter((c) => {
    const matchSearch = !search.value ||
      c.name.includes(search.value) ||
      c.contactPerson.includes(search.value)
    const matchType = !filterType.value || c.type === filterType.value
    return matchSearch && matchType
  })
})

const activeCount = computed(() => business.customers.filter((c) => c.status === 'active').length)
const traderCount = computed(() => business.customers.filter((c) => c.type === 'trader').length)
const carrierCount = computed(() => business.customers.filter((c) => c.type === 'carrier').length)

const goToNew = () => router.push('/customers/new')
const goToEdit = (id: string) => router.push(`/customers/${id}/edit`)

const handleDelete = (id: string) => {
  if (confirm('确定要删除这个客户吗？')) {
    business.removeCustomer(id)
  }
}

onMounted(() => {
  business.loadCustomers()
})
</script>
