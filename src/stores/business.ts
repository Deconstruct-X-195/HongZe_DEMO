import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Customer,
  Inquiry,
  Quote,
  Contract,
  Payment,
  CostSheet,
  Receipt,
  Dispatch,
  TransportRecord,
  Inbound,
  InventoryBatch,
  Outbound,
  Settlement,
  CargoBatch,
} from '@/types'
import {
  listCustomers,
  getCustomer,
  upsertCustomer,
  deleteCustomer,
  genCustomerId,
  listInquiries,
  getInquiry,
  upsertInquiry,
  deleteInquiry,
  genInquiryId,
  listQuotes,
  getQuote,
  upsertQuote,
  deleteQuote,
  genQuoteId,
  listContracts,
  getContract,
  upsertContract,
  deleteContract,
  genContractId,
  listPayments,
  getPayment,
  upsertPayment,
  deletePayment,
  genPaymentId,
  listCostSheets,
  getCostSheet,
  upsertCostSheet,
  deleteCostSheet,
  genCostSheetId,
  listReceipts,
  getReceipt,
  upsertReceipt,
  deleteReceipt,
  genReceiptId,
  listDispatches,
  getDispatch,
  upsertDispatch,
  deleteDispatch,
  genDispatchId,
  listTransportRecords,
  getTransportRecord,
  upsertTransportRecord,
  deleteTransportRecord,
  genTransportRecordId,
  listInbounds,
  getInbound,
  upsertInbound,
  deleteInbound,
  genInboundId,
  listInventoryBatches,
  getInventoryBatch,
  upsertInventoryBatch,
  deleteInventoryBatch,
  genInventoryBatchId,
  listOutbounds,
  getOutbound,
  upsertOutbound,
  deleteOutbound,
  genOutboundId,
  listSettlements,
  getSettlement,
  upsertSettlement,
  deleteSettlement,
  genSettlementId,
  listCargoBatches,
  getCargoBatch,
  upsertCargoBatch,
  deleteCargoBatch,
  genCargoBatchId,
  nextBatchSeq,
} from '@/lib/storage'

const now = () => new Date().toISOString()

/**
 * 统一业务 Store：包含 V2 业务梳理表扩展的所有新实体的 CRUD 操作
 * 团队成员可基于此 store 开发各业务页面
 */
export const useBusinessStore = defineStore('business', () => {
  // ============ 客户 ============
  const customers = ref<Customer[]>([])
  const loadCustomers = () => { customers.value = listCustomers() }
  const addCustomer = (data: Partial<Customer>): Customer => {
    const c: Customer = {
      id: genCustomerId(),
      name: data.name || '',
      type: data.type || 'trader',
      contactPerson: data.contactPerson || '',
      contactInfo: data.contactInfo || '',
      status: data.status || 'active',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertCustomer(c)
    loadCustomers()
    return c
  }
  const updateCustomer = (id: string, data: Partial<Customer>) => {
    const c = getCustomer(id)
    if (c) {
      Object.assign(c, data, { updatedAt: now() })
      upsertCustomer(c)
      loadCustomers()
    }
  }
  const removeCustomer = (id: string) => { deleteCustomer(id); loadCustomers() }

  // ============ 询价 ============
  const inquiries = ref<Inquiry[]>([])
  const loadInquiries = () => { inquiries.value = listInquiries() }
  const addInquiry = (data: Partial<Inquiry>): Inquiry => {
    const i: Inquiry = {
      id: genInquiryId(),
      inquiryNo: data.inquiryNo || `XJ${Date.now().toString().slice(-8)}`,
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      cargoName: data.cargoName || '',
      cargoQuality: data.cargoQuality || '',
      cargoQty: data.cargoQty || 0,
      transportMode: data.transportMode || 'rail',
      origin: data.origin || '',
      destination: data.destination || '',
      status: data.status || 'draft',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertInquiry(i)
    loadInquiries()
    return i
  }
  const updateInquiry = (id: string, data: Partial<Inquiry>) => {
    const i = getInquiry(id)
    if (i) { Object.assign(i, data, { updatedAt: now() }); upsertInquiry(i); loadInquiries() }
  }
  const removeInquiry = (id: string) => { deleteInquiry(id); loadInquiries() }

  // ============ 报价/撮合 ============
  const quotes = ref<Quote[]>([])
  const loadQuotes = () => { quotes.value = listQuotes() }
  const addQuote = (data: Partial<Quote>): Quote => {
    const q: Quote = {
      id: genQuoteId(),
      quoteNo: data.quoteNo || `BJ${Date.now().toString().slice(-8)}`,
      inquiryId: data.inquiryId || '',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      items: data.items || [],
      status: data.status || 'draft',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertQuote(q)
    loadQuotes()
    return q
  }
  const updateQuote = (id: string, data: Partial<Quote>) => {
    const q = getQuote(id)
    if (q) { Object.assign(q, data, { updatedAt: now() }); upsertQuote(q); loadQuotes() }
  }
  const removeQuote = (id: string) => { deleteQuote(id); loadQuotes() }

  // ============ 合同 ============
  const contracts = ref<Contract[]>([])
  const loadContracts = () => { contracts.value = listContracts() }
  const addContract = (data: Partial<Contract>): Contract => {
    const c: Contract = {
      id: genContractId(),
      contractNo: data.contractNo || `HT${Date.now().toString().slice(-8)}`,
      type: data.type || 'transport',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      partyB: data.partyB || '泓泽宜通',
      title: data.title || '',
      amount: data.amount || 0,
      status: data.status || 'draft',
      attachments: data.attachments || [],
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertContract(c)
    loadContracts()
    return c
  }
  const updateContract = (id: string, data: Partial<Contract>) => {
    const c = getContract(id)
    if (c) { Object.assign(c, data, { updatedAt: now() }); upsertContract(c); loadContracts() }
  }
  const removeContract = (id: string) => { deleteContract(id); loadContracts() }

  // ============ 付款 ============
  const payments = ref<Payment[]>([])
  const loadPayments = () => { payments.value = listPayments() }
  const addPayment = (data: Partial<Payment>): Payment => {
    const p: Payment = {
      id: genPaymentId(),
      paymentNo: data.paymentNo || `FK${Date.now().toString().slice(-8)}`,
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      type: data.type || 'prepay',
      method: data.method || 'bank_transfer',
      amount: data.amount || 0,
      status: data.status || 'pending',
      vouchers: data.vouchers || [],
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertPayment(p)
    loadPayments()
    return p
  }
  const updatePayment = (id: string, data: Partial<Payment>) => {
    const p = getPayment(id)
    if (p) { Object.assign(p, data, { updatedAt: now() }); upsertPayment(p); loadPayments() }
  }
  const removePayment = (id: string) => { deletePayment(id); loadPayments() }

  // ============ 成本明细 ============
  const costSheets = ref<CostSheet[]>([])
  const loadCostSheets = () => { costSheets.value = listCostSheets() }
  const addCostSheet = (data: Partial<CostSheet>): CostSheet => {
    const c: CostSheet = {
      id: genCostSheetId(),
      costNo: data.costNo || `CB${Date.now().toString().slice(-8)}`,
      items: data.items || [],
      totalCost: data.totalCost || 0,
      status: data.status || 'draft',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertCostSheet(c)
    loadCostSheets()
    return c
  }
  const updateCostSheet = (id: string, data: Partial<CostSheet>) => {
    const c = getCostSheet(id)
    if (c) { Object.assign(c, data, { updatedAt: now() }); upsertCostSheet(c); loadCostSheets() }
  }
  const removeCostSheet = (id: string) => { deleteCostSheet(id); loadCostSheets() }

  // ============ 接货 ============
  const receipts = ref<Receipt[]>([])
  const loadReceipts = () => { receipts.value = listReceipts() }
  const addReceipt = (data: Partial<Receipt>): Receipt => {
    const r: Receipt = {
      id: genReceiptId(),
      receiptNo: data.receiptNo || `JH${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      cargoName: data.cargoName || '',
      plannedQty: data.plannedQty || 0,
      location: data.location || '',
      consignor: data.consignor || '',
      receiver: data.receiver || '',
      status: data.status || 'pending',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertReceipt(r)
    loadReceipts()
    return r
  }
  const updateReceipt = (id: string, data: Partial<Receipt>) => {
    const r = getReceipt(id)
    if (r) { Object.assign(r, data, { updatedAt: now() }); upsertReceipt(r); loadReceipts() }
  }
  const removeReceipt = (id: string) => { deleteReceipt(id); loadReceipts() }

  // ============ 派单/请车 ============
  const dispatches = ref<Dispatch[]>([])
  const loadDispatches = () => { dispatches.value = listDispatches() }
  const addDispatch = (data: Partial<Dispatch>): Dispatch => {
    const d: Dispatch = {
      id: genDispatchId(),
      dispatchNo: data.dispatchNo || `PD${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      type: data.type || 'rail',
      cargoName: data.cargoName || '',
      cargoQty: data.cargoQty || 0,
      origin: data.origin || '',
      destination: data.destination || '',
      status: data.status || 'draft',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertDispatch(d)
    loadDispatches()
    return d
  }
  const updateDispatch = (id: string, data: Partial<Dispatch>) => {
    const d = getDispatch(id)
    if (d) { Object.assign(d, data, { updatedAt: now() }); upsertDispatch(d); loadDispatches() }
  }
  const removeDispatch = (id: string) => { deleteDispatch(id); loadDispatches() }

  // ============ 运输执行 ============
  const transportRecords = ref<TransportRecord[]>([])
  const loadTransportRecords = () => { transportRecords.value = listTransportRecords() }
  const addTransportRecord = (data: Partial<TransportRecord>): TransportRecord => {
    const t: TransportRecord = {
      id: genTransportRecordId(),
      dispatchId: data.dispatchId || '',
      orderId: data.orderId || '',
      cargoName: data.cargoName || '',
      cargoQty: data.cargoQty || 0,
      origin: data.origin || '',
      destination: data.destination || '',
      nodes: data.nodes || [],
      status: data.status || 'pending',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertTransportRecord(t)
    loadTransportRecords()
    return t
  }
  const updateTransportRecord = (id: string, data: Partial<TransportRecord>) => {
    const t = getTransportRecord(id)
    if (t) { Object.assign(t, data, { updatedAt: now() }); upsertTransportRecord(t); loadTransportRecords() }
  }
  const removeTransportRecord = (id: string) => { deleteTransportRecord(id); loadTransportRecords() }

  // ============ 入库 ============
  const inbounds = ref<Inbound[]>([])
  const loadInbounds = () => { inbounds.value = listInbounds() }
  const addInbound = (data: Partial<Inbound>): Inbound => {
    const i: Inbound = {
      id: genInboundId(),
      inboundNo: data.inboundNo || `RK${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      cargoName: data.cargoName || '',
      plannedQty: data.plannedQty || 0,
      warehouse: data.warehouse || '',
      status: data.status || 'pending',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertInbound(i)
    loadInbounds()
    return i
  }
  const updateInbound = (id: string, data: Partial<Inbound>) => {
    const i = getInbound(id)
    if (i) { Object.assign(i, data, { updatedAt: now() }); upsertInbound(i); loadInbounds() }
  }
  const removeInbound = (id: string) => { deleteInbound(id); loadInbounds() }

  // ============ 库存/堆存 ============
  const inventoryBatches = ref<InventoryBatch[]>([])
  const loadInventoryBatches = () => { inventoryBatches.value = listInventoryBatches() }
  const addInventoryBatch = (data: Partial<InventoryBatch>): InventoryBatch => {
    const b: InventoryBatch = {
      id: genInventoryBatchId(),
      batchNo: data.batchNo || `PC${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      inboundId: data.inboundId || '',
      cargoName: data.cargoName || '',
      inboundQty: data.inboundQty || 0,
      currentQty: data.currentQty || data.inboundQty || 0,
      outboundQty: data.outboundQty || 0,
      warehouse: data.warehouse || '',
      location: data.location || '',
      inboundDate: data.inboundDate || now(),
      status: data.status || 'in_stock',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertInventoryBatch(b)
    loadInventoryBatches()
    return b
  }
  const updateInventoryBatch = (id: string, data: Partial<InventoryBatch>) => {
    const b = getInventoryBatch(id)
    if (b) { Object.assign(b, data, { updatedAt: now() }); upsertInventoryBatch(b); loadInventoryBatches() }
  }
  const removeInventoryBatch = (id: string) => { deleteInventoryBatch(id); loadInventoryBatches() }

  // ============ 出库 ============
  const outbounds = ref<Outbound[]>([])
  const loadOutbounds = () => { outbounds.value = listOutbounds() }
  const addOutbound = (data: Partial<Outbound>): Outbound => {
    const o: Outbound = {
      id: genOutboundId(),
      outboundNo: data.outboundNo || `CK${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      picker: data.picker || '',
      cargoName: data.cargoName || '',
      plannedQty: data.plannedQty || 0,
      warehouse: data.warehouse || '',
      status: data.status || 'pending',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertOutbound(o)
    loadOutbounds()
    return o
  }
  const updateOutbound = (id: string, data: Partial<Outbound>) => {
    const o = getOutbound(id)
    if (o) { Object.assign(o, data, { updatedAt: now() }); upsertOutbound(o); loadOutbounds() }
  }
  const removeOutbound = (id: string) => { deleteOutbound(id); loadOutbounds() }

  // ============ 结算 ============
  const settlements = ref<Settlement[]>([])
  const loadSettlements = () => { settlements.value = listSettlements() }
  const addSettlement = (data: Partial<Settlement>): Settlement => {
    const s: Settlement = {
      id: genSettlementId(),
      settlementNo: data.settlementNo || `JS${Date.now().toString().slice(-8)}`,
      orderId: data.orderId || '',
      payer: data.payer || '',
      payee: data.payee || '',
      items: data.items || [],
      totalAmount: data.totalAmount || 0,
      status: data.status || 'pending',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertSettlement(s)
    loadSettlements()
    return s
  }
  const updateSettlement = (id: string, data: Partial<Settlement>) => {
    const s = getSettlement(id)
    if (s) { Object.assign(s, data, { updatedAt: now() }); upsertSettlement(s); loadSettlements() }
  }
  const removeSettlement = (id: string) => { deleteSettlement(id); loadSettlements() }

  // ============ 货物批次（V3 批次模型） ============
  const cargoBatches = ref<CargoBatch[]>([])
  const loadCargoBatches = () => { cargoBatches.value = listCargoBatches() }
  const addCargoBatch = (data: Partial<CargoBatch>): CargoBatch => {
    const orderId = data.orderId || ''
    const seq = nextBatchSeq(orderId)
    const b: CargoBatch = {
      id: genCargoBatchId(),
      batchNo: data.batchNo || `ORD-${orderId}-${String(seq).padStart(3, '0')}`,
      orderId,
      cargoName: data.cargoName || '',
      cargoType: data.cargoType || '',
      cargoQuality: data.cargoQuality || '',
      mine: data.mine || '',
      plannedQty: data.plannedQty || 0,
      loadedQty: data.loadedQty || 0,
      inboundQty: data.inboundQty || 0,
      outboundQty: data.outboundQty || 0,
      settledQty: data.settledQty || 0,
      status: data.status || 'created',
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    upsertCargoBatch(b)
    loadCargoBatches()
    return b
  }
  const updateCargoBatch = (id: string, data: Partial<CargoBatch>) => {
    const b = getCargoBatch(id)
    if (b) { Object.assign(b, data, { updatedAt: now() }); upsertCargoBatch(b); loadCargoBatches() }
  }
  const removeCargoBatch = (id: string) => { deleteCargoBatch(id); loadCargoBatches() }

  // ---- 数量联动（五级口径） ----
  /** 派单回填装车量：状态推进至 dispatched/in_transit */
  const registerBatchLoaded = (batchId: string, qty: number): boolean => {
    const b = getCargoBatch(batchId)
    if (!b || qty <= 0) return false
    if (qty > b.plannedQty) return false // 装车量不得超计划量
    b.loadedQty += qty
    if (b.status === 'created') b.status = 'dispatched'
    upsertCargoBatch(b)
    loadCargoBatches()
    return true
  }
  /** 入库登记：累加入库量（地磅口径），状态推进至在库 */
  const registerBatchInbound = (batchId: string, qty: number): boolean => {
    const b = getCargoBatch(batchId)
    if (!b || qty <= 0) return false
    if (b.inboundQty + qty > b.plannedQty) return false // 入库量不得超计划量
    b.inboundQty += qty
    if (['created', 'dispatched', 'in_transit'].includes(b.status)) b.status = 'in_stock'
    upsertCargoBatch(b)
    loadCargoBatches()
    return true
  }
  /** 出库登记：累加出库量，校验出库量 ≤ 库存量（累计入库-累计出库） */
  const registerBatchOutbound = (batchId: string, qty: number): boolean => {
    const b = getCargoBatch(batchId)
    if (!b || qty <= 0) return false
    const stock = b.inboundQty - b.outboundQty
    if (qty > stock) return false // 出库量不得超过库存量
    b.outboundQty += qty
    const target = Math.min(b.plannedQty, b.inboundQty)
    b.status = b.outboundQty >= target && target > 0 ? 'all_out' : 'partial_out'
    upsertCargoBatch(b)
    loadCargoBatches()
    return true
  }
  /** 结算登记：记录结算量，状态推进至已结算 */
  const registerBatchSettled = (batchId: string, qty: number): boolean => {
    const b = getCargoBatch(batchId)
    if (!b || qty < 0) return false
    b.settledQty = qty
    if (b.status === 'all_out') b.status = 'settled'
    upsertCargoBatch(b)
    loadCargoBatches()
    return true
  }

  // ============ 统计计算 ============
  const customerCount = computed(() => customers.value.length)
  const inquiryCount = computed(() => inquiries.value.length)
  const contractCount = computed(() => contracts.value.length)
  const pendingPaymentCount = computed(() => payments.value.filter((p) => p.status === 'pending').length)
  const inTransitCount = computed(() => transportRecords.value.filter((t) => t.status === 'in_transit').length)
  const inventoryTotal = computed(() => inventoryBatches.value.reduce((s, b) => s + b.currentQty, 0))

  // 加载全部
  const loadAll = () => {
    loadCustomers()
    loadInquiries()
    loadQuotes()
    loadContracts()
    loadPayments()
    loadCostSheets()
    loadReceipts()
    loadDispatches()
    loadTransportRecords()
    loadInbounds()
    loadInventoryBatches()
    loadOutbounds()
    loadSettlements()
    loadCargoBatches()
  }

  return {
    // 客户
    customers, loadCustomers, addCustomer, updateCustomer, removeCustomer,
    // 询价
    inquiries, loadInquiries, addInquiry, updateInquiry, removeInquiry,
    // 报价
    quotes, loadQuotes, addQuote, updateQuote, removeQuote,
    // 合同
    contracts, loadContracts, addContract, updateContract, removeContract,
    // 付款
    payments, loadPayments, addPayment, updatePayment, removePayment,
    // 成本
    costSheets, loadCostSheets, addCostSheet, updateCostSheet, removeCostSheet,
    // 接货
    receipts, loadReceipts, addReceipt, updateReceipt, removeReceipt,
    // 派单
    dispatches, loadDispatches, addDispatch, updateDispatch, removeDispatch,
    // 运输
    transportRecords, loadTransportRecords, addTransportRecord, updateTransportRecord, removeTransportRecord,
    // 入库
    inbounds, loadInbounds, addInbound, updateInbound, removeInbound,
    // 库存
    inventoryBatches, loadInventoryBatches, addInventoryBatch, updateInventoryBatch, removeInventoryBatch,
    // 出库
    outbounds, loadOutbounds, addOutbound, updateOutbound, removeOutbound,
    // 结算
    settlements, loadSettlements, addSettlement, updateSettlement, removeSettlement,
    // 货物批次（V3 批次模型）
    cargoBatches, loadCargoBatches, addCargoBatch, updateCargoBatch, removeCargoBatch,
    registerBatchLoaded, registerBatchInbound, registerBatchOutbound, registerBatchSettled,
    // 统计
    customerCount, inquiryCount, contractCount, pendingPaymentCount, inTransitCount, inventoryTotal,
    // 全部加载
    loadAll,
  }
})
