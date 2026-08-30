<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑客户' : '新增客户'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="field-label">客户名称 <span class="text-apple-red">*</span></label>
              <input
                v-model="form.name"
                type="text"
                required
                class="field-input"
                placeholder="请输入客户单位名称"
              />
            </div>
            <div>
              <label class="field-label">客户类型</label>
              <select
                v-model="form.type"
                class="field-input"
              >
                <option v-for="(meta, key) in CUSTOMER_TYPE_META" :key="key" :value="key">{{ meta.label }}</option>
              </select>
            </div>
            <div>
              <label class="field-label">国别</label>
              <input
                v-model="form.country"
                type="text"
                class="field-input"
                placeholder="如：中国"
              />
            </div>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">联系信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">联系人 <span class="text-apple-red">*</span></label>
              <input
                v-model="form.contactPerson"
                type="text"
                required
                class="field-input"
                placeholder="请输入联系人姓名"
              />
            </div>
            <div>
              <label class="field-label">联系方式 <span class="text-apple-red">*</span></label>
              <input
                v-model="form.contactInfo"
                type="text"
                required
                class="field-input"
                placeholder="电话/邮箱"
              />
            </div>
            <div class="col-span-2">
              <label class="field-label">地址</label>
              <input
                v-model="form.address"
                type="text"
                class="field-input"
                placeholder="请输入详细地址"
              />
            </div>
            <div>
              <label class="field-label">邮编</label>
              <input
                v-model="form.zipCode"
                type="text"
                class="field-input"
                placeholder="邮政编码"
              />
            </div>
          </div>
        </div>

        <!-- 财务信息 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">财务信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">银行账户</label>
              <input
                v-model="form.bankAccount"
                type="text"
                class="field-input"
                placeholder="银行账号"
              />
            </div>
            <div>
              <label class="field-label">税号</label>
              <input
                v-model="form.taxNumber"
                type="text"
                class="field-input"
                placeholder="纳税人识别号"
              />
            </div>
          </div>
        </div>

        <!-- 状态和备注 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">其他</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">状态</label>
              <select
                v-model="form.status"
                class="field-input"
              >
                <option v-for="(meta, key) in CUSTOMER_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="field-label">备注</label>
            <textarea
              v-model="form.remark"
              rows="3"
              class="field-input resize-none"
              placeholder="备注信息"
            ></textarea>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button
            type="button"
            @click="router.back()"
            class="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn-primary"
          >
            {{ isEdit ? '保存修改' : '创建客户' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useBusinessStore } from '@/stores'
import { CUSTOMER_TYPE_META, CUSTOMER_STATUS_META } from '@/types'
import type { Customer, CustomerType, CustomerStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const business = useBusinessStore()

const isEdit = computed(() => !!route.params.id)
const customerId = computed(() => route.params.id as string)

const form = ref<Partial<Customer>>({
  name: '',
  type: 'trader' as CustomerType,
  country: '',
  address: '',
  zipCode: '',
  contactPerson: '',
  contactInfo: '',
  bankAccount: '',
  taxNumber: '',
  status: 'active' as CustomerStatus,
  remark: '',
})

const handleSubmit = () => {
  if (isEdit.value) {
    business.updateCustomer(customerId.value, form.value)
  } else {
    business.addCustomer(form.value)
  }
  router.push('/customers')
}

onMounted(() => {
  business.loadCustomers()
  if (isEdit.value) {
    const customer = business.customers.find((c) => c.id === customerId.value)
    if (customer) {
      form.value = { ...customer }
    }
  }
})
</script>
