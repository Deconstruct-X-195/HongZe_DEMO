<template>
  <div class="animate-fade-in">
<PageHeader title="运输跟踪" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <input v-model="search" type="text" placeholder="搜索货物/车辆..." class="field-input py-2 w-64" />
        <button @click="goToNew" class="btn-primary">新增运输记录</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">数量(吨)</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">起→终</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">车辆/车次</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.vehicleNo || '-' }}</td>
              <td class="px-4 py-3"><Badge :label="TRANSPORT_STATUS_META[item.status]?.label" :color="TRANSPORT_STATUS_META[item.status]?.color" :bg="TRANSPORT_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="6" class="px-4 py-12 text-center text-apple-text-secondary">暂无运输记录</td></tr>
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
import { TRANSPORT_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filteredList = computed(() => business.transportRecords.filter((t) => !search.value || t.cargoName.includes(search.value) || (t.vehicleNo || '').includes(search.value)))
const goToNew = () => router.push('/transport/new')
const goToEdit = (id: string) => router.push(`/transport/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeTransportRecord(id) }
onMounted(() => business.loadTransportRecords())
</script>
