# 订单详情页模块

## 目录结构

```
order-detail/
├── OrderDetailPage.vue    # 主页面（Tab 切换 + 数据加载 + 布局）
├── tabs/                   # 各 Tab 组件（后续逐步抽离）
│   ├── BasicInfoTab.vue    # 基本信息 Tab
│   ├── FinancialTab.vue    # 财务状态 Tab
│   ├── ShippingTab.vue     # 发运状态 Tab
│   ├── WarehouseTab.vue    # 仓储堆存 Tab
│   ├── CargoTab.vue        # 货物动态 Tab
│   └── LogTab.vue          # 操作日志 Tab
└── components/             # 详情页专用组件
```

## 当前状态

`OrderDetailPage.vue` 目前包含全部 6 个 Tab 的逻辑和 UI（约 1900 行），是单文件。

## 后续拆分计划

为了支持多人并行开发，建议按以下顺序逐步将各 Tab 抽离为独立组件：

1. **LogTab.vue**（操作日志）- 最简单，只读展示，优先抽离
2. **CargoTab.vue**（货物动态）- 独立的时间轴展示
3. **FinancialTab.vue**（财务状态）- 表单 + 凭证上传
4. **ShippingTab.vue**（发运状态）- 多通道发运管理
5. **WarehouseTab.vue**（仓储堆存）- 仓储数据展示
6. **BasicInfoTab.vue**（基本信息）- 最复杂，与主页面耦合最深，最后抽离

## 拆分原则

- 每个 Tab 组件通过 `props` 接收订单 ID 和共享数据
- 数据操作通过 `useOrderStore` 进行，不直接操作 localStorage
- 抽离后主页面只负责 Tab 切换、数据加载和整体布局
- 每个 Tab 组件可独立分配给不同团队成员开发，避免冲突
