<template>
  <div class="animate-fade-in">
<PageHeader title="仓储入库" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <input v-model="search" type="text" placeholder="搜索入库单号/货物/仓库..." class="field-input py-2 w-64" />
        <button @click="goToNew" class="btn-primary">新增入库</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">入库单号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">计划/实际(吨)</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">仓库</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">车辆</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.inboundNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.plannedQty }} / {{ item.actualQty || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.vehicleNo || '-' }}</td>
              <td class="px-4 py-3"><Badge :label="INBOUND_STATUS_META[item.status]?.label" :color="INBOUND_STATUS_META[item.status]?.color" :bg="INBOUND_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无入库数据</td></tr>
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
import { INBOUND_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filteredList = computed(() => business.inbounds.filter((i) => !search.value || i.inboundNo.includes(search.value) || i.cargoName.includes(search.value) || i.warehouse.includes(search.value)))
const goToNew = () => router.push('/inbound/new')
const goToEdit = (id: string) => router.push(`/inbound/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeInbound(id) }
onMounted(() => business.loadInbounds())
</script>
