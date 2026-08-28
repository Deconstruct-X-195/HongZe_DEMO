<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="运输跟踪" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <input v-model="search" type="text" placeholder="搜索货物/车辆..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增运输记录</button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">数量(吨)</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">起→终</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">车辆/车次</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.vehicleNo || '-' }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: TRANSPORT_STATUS_META[item.status]?.color, backgroundColor: TRANSPORT_STATUS_META[item.status]?.bg }">{{ TRANSPORT_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
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
import TopBar from '@/components/TopBar.vue'
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
